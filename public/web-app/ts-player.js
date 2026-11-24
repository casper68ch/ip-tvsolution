// TsLivePlayer - decoder MPEG-TS con WebCodecs (solo video, audio ignorato)
// Utile per stream i cui pacchetti audio corrotti bloccano gli player MSE standard.
(function (global) {
  'use strict';

  const TS_PACKET = 188;

  function getPayload(pkt) {
    const afc = (pkt[3] >> 4) & 3;
    let p = 4;
    if (afc === 2 || afc === 3) p += pkt[4] + 1;
    return p < TS_PACKET ? pkt.subarray(p) : null;
  }

  function parsePmtPid(pkt) {
    const pl = getPayload(pkt);
    if (!pl || pl[0] !== 0x00) return null;
    const q = 1 + pl[0]; // salta il pointer_field
    if (pl[q] !== 0x00) return null; // table_id PAT
    return ((pl[q + 10] & 0x1f) << 8) | pl[q + 11];
  }

  function parseVideoPid(pkt) {
    const pl = getPayload(pkt);
    if (!pl || pl[0] !== 0x00) return null;
    const q = 1 + pl[0]; // salta il pointer_field
    if (pl[q] !== 0x02) return null; // table_id PMT
    const secLen = ((pl[q + 1] & 0x0f) << 8) | pl[q + 2];
    const progInfoLen = ((pl[q + 10] & 0x0f) << 8) | pl[q + 11];
    let p = q + 12 + progInfoLen;
    const end = q + 3 + secLen;
    while (p + 5 <= end) {
      if (pl[p] === 0x1b) return ((pl[p + 1] & 0x1f) << 8) | pl[p + 2]; // H.264
      const esLen = ((pl[p + 3] & 0x0f) << 8) | pl[p + 4];
      p += 5 + esLen;
    }
    return null;
  }

  function parsePts(pes) {
    if (pes.length < 14 || pes[0] !== 0 || pes[1] !== 0 || pes[2] !== 1) return null;
    const flags = pes[7];
    if (!(flags & 0x80)) return null;
    const b = pes;
    return ((((b[9] >> 1) & 0x07) << 30) | (b[10] << 22) | (((b[11] >> 1) & 0x7f) << 15) |
      (b[12] << 7) | ((b[13] >> 1) & 0x7f)) / 90 * 1000; // microsecondi
  }

  function pesPayload(pes) {
    if (pes.length < 9) return null;
    const hLen = pes[8];
    return pes.subarray(9 + hLen);
  }

  class TsLivePlayer {
    constructor(canvas, m3u8Url) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.m3u8Url = m3u8Url;
      this.running = false;
      this.decoder = null;
      this.videoPid = null;
      this.buf = null;
      this.bufPts = 0;
      this.basePts = null;
      this.baseTime = 0;
      this.lastFrame = 0;
      this.onError = null;
      this.onStatus = null;
    }

    status(s) { if (this.onStatus) this.onStatus(s); }

    async start() {
      this.running = true;
      if (typeof VideoDecoder === 'undefined') throw new Error('WebCodecs non supportato da questo browser');
      this.decoder = new VideoDecoder({
        output: (frame) => {
          const pts = frame.timestamp;
          if (this.basePts === null) { this.basePts = pts; this.baseTime = performance.now(); }
          const atteso = this.baseTime + (pts - this.basePts) / 1000;
          const attendi = Math.max(0, atteso - performance.now());
          const mostra = () => {
            if (!this.running) { frame.close(); return; }
            try {
              this.canvas.width = frame.displayWidth || 1280;
              this.canvas.height = frame.displayHeight || 720;
              this.ctx.drawImage(frame, 0, 0, this.canvas.width, this.canvas.height);
            } catch (e) {}
            frame.close();
          };
          if (attendi > 5) setTimeout(mostra, attendi); else mostra();
        },
        error: (e) => { this.status('errore decoder: ' + e.message); if (this.onError) this.onError(e); }
      });
      this.decoder.configure({ codec: 'avc1.42E01E', hardwareAcceleration: 'no-preference' });

      // URL della playlist e dei segmenti
      this.status('caricamento playlist...');
      const resp = await fetch(this.m3u8Url, { cache: 'no-store' });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const text = await resp.text();
      const righe = text.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
      const seg = righe.find(l => l.endsWith('.ts'));
      if (!seg) throw new Error('nessun segmento TS nella playlist');
      const segUrl = new URL(seg, this.m3u8Url).href;

      let pmtPid = null;
      let refresh = 0;
      let currentUrl = segUrl;

      while (this.running) {
        this.status('download segmento...');
        const r = await fetch(currentUrl, { cache: 'no-store' });
        if (!r.ok) throw new Error('HTTP segmento ' + r.status);
        const buf = new Uint8Array(await r.arrayBuffer());

        // Trova PAT/PMT nei primi pacchetti
        if (this.videoPid === null) {
          for (let i = 0; i + TS_PACKET <= buf.length; i += TS_PACKET) {
            const pkt = buf.subarray(i, i + TS_PACKET);
            if (pkt[0] !== 0x47) continue;
            const pid = ((pkt[1] & 0x1f) << 8) | pkt[2];
            if (pid === 0) {
              const p = parsePmtPid(pkt);
              if (p !== null) pmtPid = p;
            }
            if (pmtPid !== null && pid === pmtPid) {
              const v = parseVideoPid(pkt);
              if (v !== null) { this.videoPid = v; break; }
            }
          }
          this.status('video PID ' + this.videoPid);
        }

        if (this.videoPid !== null) {
          for (let i = 0; i + TS_PACKET <= buf.length; i += TS_PACKET) {
            const pkt = buf.subarray(i, i + TS_PACKET);
            if (pkt[0] !== 0x47) continue;
            const pid = ((pkt[1] & 0x1f) << 8) | pkt[2];
            if (pid !== this.videoPid) continue;
            const pl = getPayload(pkt);
            if (!pl || pl.length < 4) continue;
            const pusi = (pkt[1] & 0x40) !== 0;
            if (pusi) {
              if (this.buf && this.buf.length > 4) {
                const pesData = pesPayload(this.buf);
                if (pesData && pesData.length > 2 && this.decoder.decodeQueueSize < 12) {
                  let isKey = false;
                  const lim = Math.min(pesData.length - 4, 400);
                  for (let k = 0; k < lim; k++) {
                    if (pesData[k] === 0 && pesData[k + 1] === 0 && pesData[k + 2] === 1 && (pesData[k + 3] & 0x1f) === 5) { isKey = true; break; }
                  }
                  try { this.decoder.decode(new EncodedVideoChunk({
                    type: isKey ? 'key' : 'delta',
                    timestamp: this.bufPts || 0,
                    data: pesData
                  })); } catch (e) {}
                }
              }
              this.buf = pl;
              this.bufPts = parsePts(pl) || 0;
            } else if (this.buf) {
              const nuovo = new Uint8Array(this.buf.length + pl.length);
              nuovo.set(this.buf); nuovo.set(pl, this.buf.length);
              this.buf = nuovo;
            }
          }
        }

        refresh++;
        if (refresh % 8 === 0) {
          try {
            const rr = await fetch(this.m3u8Url, { cache: 'no-store' });
            if (rr.ok) {
              const t2 = await rr.text();
              const s2 = t2.split(/\r?\n/).map(s => s.trim()).find(l => l.endsWith('.ts'));
              if (s2) currentUrl = new URL(s2, this.m3u8Url).href;
            }
          } catch (e) {}
        }
        await new Promise(r => setTimeout(r, 250));
      }
    }

    stop() {
      this.running = false;
      try { if (this.decoder) this.decoder.close(); } catch (e) {}
      this.decoder = null;
    }
  }

  global.TsLivePlayer = TsLivePlayer;
})(window);
