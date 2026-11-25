// IP-TVSOLUTION Web Player
// Main application logic

const STORAGE_KEY = 'iptv_solution_data';
const SAVE_KEY = 'iptv_solution_save_config';
const DEFAULT_PLAYLIST_URL = ''; // Impostata dall'utente a prima configurazione
const DEFAULT_EPG_URL = ''; // Opzionale: URL guida TV della propria linea
const WEB_VERSION = '1.9-web-20261124';

// State
let state = {
  sources: [],
  channels: [],
  currentChannel: null,
  favorites: new Set(),
  filter: 'all',
  searchQuery: '',
  settings: { autoplay: true, volume: 80 },
  hls: null,
  recording: null,
  recordings: [],
  streamLog: [],
  saveDestination: 'internal', // 'internal' | 'usb' | 'cloud'
  saveConfig: { cloudUrl: '', cloudUser: '', cloudPass: '' },
  scheduledRecordings: [],
  watchHistory: [],
  bouquets: [],
  // Navigation state for hierarchical browsing
  navLevel: 'all',
    tvBrowserMode: true,
    tvBrowse: 'all',
    tvSelectedId: null, // 'home', 'type', 'category'
  tvView: 'channels', // 'channels' | 'categories'
  tvType: null,       // 'live' | 'vod' | 'series'
  tvCategory: null,   // gruppo/bouquet scorso
  tvBack: null,       // contesto per il tasto Back del player
  navType: 'live',   // 'live', 'vod', 'series'
  navCategory: null, // group name
  activePlaylist: 'all', // id della playlist attiva (una alla volta)
  viewMode: 'list', // 'grid' | 'list'
  epgLogos: {}, // logo canale da XMLTV
};

// DOM refs
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);


// ============================================================
// IP-TVSOLUTION - Pagina configurazione playlist dopo il login
// ============================================================
(function () {
  'use strict';
  var PENDING = 'iptv_setup_pending';
  function q(id) { return document.getElementById(id); }
  function count() { return (typeof state !== 'undefined' && state.sources) ? state.sources.length : 0; }
  function clearPending() { try { sessionStorage.removeItem(PENDING); } catch (e) {} }
  function status(text, kind) {
    var el = q('psStatus');
    if (!el) return;
    el.textContent = text || '';
    el.className = 'ps-status' + (kind ? ' ' + kind : '');
  }
  function setTab(kind) {
    ['m3u', 'xtream', 'file'].forEach(function (k) {
      var b = q('psTab_' + k), x = q('psBox_' + k);
      if (b) b.className = 'ps-tab' + (k === kind ? ' active' : '');
      if (x) x.style.display = (k === kind ? 'block' : 'none');
    });
    status('', '');
  }
  function refreshSkip() {
    var b = q('psSkip'), s = q('psSavedInfo');
    var n = count();
    if (b) b.style.display = n > 0 ? 'inline-flex' : 'none';
    if (s) s.textContent = n > 0 ? ('Hai già ' + n + ' playlist salvate.') : '';
  }
  function finish(msg) {
    clearPending();
    var ov = q('playlistSetupOverlay');
    if (ov) ov.style.display = 'none';
    try {
      saveState();
      renderChannelList();
      renderSavedSources();
      updatePlaylistButton();
      updateViewModeButton();
    } catch (e) {}
    if (typeof showToast === 'function') showToast(msg || 'Playlist pronta. Benvenuto in IP-TVSOLUTION!', 'success');
  }
  function show() {
    var ov = q('playlistSetupOverlay');
    if (!ov) return;
    clearPending();
    refreshSkip();
    setTab('m3u');
    var act = q('activationOverlay');
    if (act) act.style.display = 'none';
    ov.style.display = 'flex';
    setTimeout(function () { var el = q('psName'); if (el) el.focus(); }, 120);
  }
  function hide() {
    var ov = q('playlistSetupOverlay');
    if (ov) ov.style.display = 'none';
  }
  function fill(id, value) { var el = q(id); if (el) el.value = value || ''; }
  function fakeEvent() { return { preventDefault: function () {}, target: { reset: function () {} } }; }

  async function addM3u() {
    var name = ((q('psName') || {}).value || '').trim();
    var url = ((q('psUrl') || {}).value || '').trim();
    if (!name || !url) { status('Inserisci nome e URL della playlist M3U.', 'err'); return; }
    status('Caricamento playlist...', '');
    var before = count();
    fill('m3uName', name);
    fill('m3uUrl', url);
    try { await handleM3uSubmit(fakeEvent()); } catch (e) {}
    if (count() > before) {
      var src = state.sources[state.sources.length - 1];
      var n = src.channels ? src.channels.length : 0;
      status('Playlist caricata: ' + n + ' canali. Apertura app...', 'ok');
      setTimeout(function () { finish('Playlist caricata: ' + n + ' canali'); }, 650);
    } else {
      status('Non riesco a caricare la playlist. Controlla URL e formato M3U.', 'err');
    }
  }

  async function addXtream() {
    var name = ((q('psXName') || {}).value || '').trim();
    var url = ((q('psXUrl') || {}).value || '').trim().replace(/\/$/, '');
    var user = ((q('psXUser') || {}).value || '').trim();
    var pass = ((q('psXPass') || {}).value || '').trim();
    if (!name || !url || !user || !pass) { status('Compila nome, server, utente e password.', 'err'); return; }
    status('Connessione al server Xtream...', '');
    var before = count();
    fill('xtreamName', name);
    fill('xtreamUrl', url);
    fill('xtreamUser', user);
    fill('xtreamPass', pass);
    try { state.xtreamFormat = 'ts'; await handleXtreamSubmit(fakeEvent()); } catch (e) {}
    if (count() > before) {
      var src = state.sources[state.sources.length - 1];
      var n = src.channels ? src.channels.length : 0;
      status('Playlist caricata: ' + n + ' canali. Apertura app...', 'ok');
      setTimeout(function () { finish('Playlist caricata: ' + n + ' canali'); }, 650);
    } else {
      status('Connessione non riuscita. Controlla server, utente e password.', 'err');
    }
  }

  async function addFile() {
    var input = q('psFile');
    var file = input && input.files ? input.files[0] : null;
    if (!file) { status('Seleziona un file M3U.', 'err'); return; }
    status('Lettura file...', '');
    var before = count();
    try {
      var text = await file.text();
      var channels = parseM3u(text);
      if (!channels.length) throw new Error('Nessun canale nel file');
      var name = ((q('psFName') || {}).value || '').trim() || file.name;
      addSource({ id: 'src_' + Date.now(), name: name, type: 'file', channels: channels, rawText: text.length < 400000 ? text : '' });
    } catch (e) {}
    if (count() > before) {
      var src = state.sources[state.sources.length - 1];
      var n = src.channels ? src.channels.length : 0;
      status('Playlist caricata: ' + n + ' canali. Apertura app...', 'ok');
      setTimeout(function () { finish('Playlist caricata: ' + n + ' canali'); }, 650);
    } else {
      status('File non valido o nessun canale trovato.', 'err');
    }
  }

  window.IPtvSetup = {
    show: show,
    hide: hide,
    setTab: setTab,
    addM3u: addM3u,
    addXtream: addXtream,
    addFile: addFile,
    skip: function () { finish('App pronta con la playlist salvata.'); }
  };
})();

/* ===== Google Cast Web Sender: invia lo stream corrente alla TV ===== */
window.IPTVCast = (function () {
  var available = false, context = null, session = null, initialized = false;
  function ui() {
    var b = document.getElementById('btnCast'), s = document.getElementById('btnCastStop');
    var connected = !!(session && session.getSessionId && session.getSessionId());
    if (b) {
      b.classList.toggle('disabled', !available);
      b.classList.toggle('active', connected);
    }
    if (s) s.style.display = connected ? '' : 'none';
  }
  function contentType(url) {
    return /\.m3u8(\?|#|$)/i.test(url || '') ? 'application/x-mpegURL' : 'video/mp2t';
  }
  function mediaUrl() {
    var u = state._lastHlsUrl;
    if (!u && state.currentChannel && state.currentChannel.url) u = state.currentChannel.url;
    return u || null;
  }
  function loadCurrent(notify) {
    if (!session) { showToast('Connetti prima un dispositivo Cast.', 'warning'); return; }
    var url = mediaUrl();
    if (!url) { showToast('Apri un canale prima di trasmettere.', 'warning'); return; }
    var title = state.currentChannel ? state.currentChannel.name : 'IP-TVSOLUTION';
    try {
      var mediaInfo = new chrome.cast.media.MediaInfo(url, contentType(url));
      mediaInfo.metadata = new chrome.cast.media.GenericMediaMetadata();
      mediaInfo.metadata.title = title;
      mediaInfo.streamType = chrome.cast.media.StreamType.LIVE;
      var req = new chrome.cast.media.LoadRequest(mediaInfo);
      req.autoplay = true;
      req.currentTime = 0;
      var remote = session.getMediaSession && session.getMediaSession();
      var ok = function () { if (notify) showToast('Trasmesso su TV: ' + title, 'success'); };
      var err = function (e) { showToast('Errore Cast: ' + ((e && e.message) || e || 'sconosciuto'), 'error'); };
      if (remote && typeof remote.load === 'function') {
        Promise.resolve(remote.load(req)).then(ok).catch(err);
      } else if (typeof session.loadMedia === 'function') {
        session.loadMedia(req, ok, err);
      } else {
        showToast('Receiver Cast non pronto. Riprova tra un attimo.', 'warning');
      }
    } catch (e) { showToast('Errore Cast: ' + (e.message || e), 'error'); }
  }
  function onSessionStarted(s) {
    session = s;
    available = true;
    ui();
    var name = (s && s.getCastDevice && s.getCastDevice().friendlyName) || 'TV';
    showToast('Cast connesso: ' + name, 'success');
    loadCurrent(false);
  }
  function onSessionEnded() {
    session = null;
    ui();
    showToast('Cast disconnesso', 'info');
  }
  function init() {
    if (initialized) return;
    if (typeof window.cast === 'undefined' || typeof window.chrome === 'undefined') { ui(); return; }
    initialized = true;
    try {
      context = cast.framework.CastContext.getInstance();
      context.setOptions({
        receiverApplicationId: chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
        autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED
      });
      context.addEventListener(cast.framework.CastContext.EventType.SESSION_STARTED, onSessionStarted);
      context.addEventListener(cast.framework.CastContext.EventType.SESSION_ENDED, onSessionEnded);
      session = (context.getCurrentSession && context.getCurrentSession()) || null;
    } catch (e) { console.warn('Cast init non riuscita:', e); }
    ui();
  }
  return {
    init: init,
    open: function () {
      if (!available || !initialized) { showToast('Cast non disponibile: usa Chrome/Edge su HTTPS con dispositivi sulla stessa rete.', 'warning'); return; }
      if (session && session.getSessionId && session.getSessionId()) { loadCurrent(true); return; }
      try {
        context.requestSession().then(onSessionStarted).catch(function (e) {
          if (!e || e.code !== 'CANCEL') showToast('Selezione Cast annullata o non riuscita', 'warning');
        });
      } catch (e) { showToast('Errore Cast: ' + (e.message || e), 'error'); }
    },
    disconnect: function () {
      if (!context) return;
      try { context.endCurrentSession(true); } catch (e) { showToast('Errore disconnessione Cast', 'error'); }
    },
    status: function () { return { available: available, connected: !!(session && session.getSessionId && session.getSessionId()) }; }
  };
})();
window.__onGCastApiAvailable = function (isAvailable) {
  window.__castAvailable = !!isAvailable;
  if (isAvailable) window.IPTVCast.init();
  var b = document.getElementById('btnCast');
  if (b) b.classList.toggle('disabled', !isAvailable);
};
if (window.__castAvailable) window.IPTVCast.init();

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  autoRestoreSources();
  loadSaveConfig();
  loadStreamLog();
  setupEventListeners();
  updateSaveDestinationUI();
  ensureEpgLoaded();
  checkVersion();
  setTimeout(function () { cloudLoad(); }, 600);
  renderChannelList();
  renderSavedSources();
  updatePlaylistButton();
  updateViewModeButton();
  setTimeout(function () { refreshLogosFromSources(true); }, 1200);
  setTimeout(function () { autoFillMissingPosters(true, 24); }, 2600);
  setInterval(function () { autoFillMissingPosters(true, 16); }, 30000);
  initPlayer();
  setInterval(checkScheduledRecordings, 15000);
  setTimeout(function () {
    try {
      if (sessionStorage.getItem('iptv_setup_pending') === '1' &&
          typeof window.IPtvActivation === 'object' && window.IPtvActivation.isActive() &&
          typeof window.IPtvSetup === 'object') {
        sessionStorage.removeItem('iptv_setup_pending');
        window.IPtvSetup.show();
      }
    } catch (e) {}
  }, 800);
  logApp('APP', 'INFO', 'Avvio applicazione', {
    canali: state.channels.length,
    sorgenti: state.sources.length,
    server: location.protocol === 'http:'
  });
});

// State persistence
function loadState() {
  try {
    state.tvBrowserMode = true; state.navLevel = 'all';
    state.tvView = 'channels'; state.tvBrowse = 'all';
    state.tvType = null; state.tvCategory = null; state.tvBack = null;
    state.tvSelectedId = null; state.activePlaylist = 'all';
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      state.sources = data.sources || [];
      state.favorites = new Set(data.favorites || []);
      state.settings = data.settings || state.settings;
      state.epgData = data.epgData || {};
      state.watchHistory = data.watchHistory || [];
      state.bouquets = data.bouquets || [];
      state.viewMode = 'list'; // apertura sempre con lista canali
  state.tvBrowserMode = true; state.navLevel = 'all';
      state.tvView = 'channels'; state.tvType = null; state.tvCategory = null; state.tvBack = null;
      // Una playlist alla volta: attiva quella salvata, altrimenti l'ultima aggiunta
      if (data.activePlaylist && state.sources.some(function (s) { return s.id === data.activePlaylist; })) {
        state.activePlaylist = data.activePlaylist;
      } else if (state.sources.length > 0) {
        state.activePlaylist = state.sources[state.sources.length - 1].id;
      }
      // Ricalcola sempre il tipo con la logica aggiornata: gli episodi serie con URL .ts
      // (es. una serie di una sola stagione) devono andare in Serie TV, non nei VOD.
      state.sources.forEach(src => {
        if (src.channels) {
          src.channels.forEach(ch => {
            ch.type = detectChannelType(ch.name, ch.group, ch.url, {});
            // Chrome non supporta .ts: converte i canali Live in HLS .m3u8
            if (/\/live\//i.test(ch.url || '') && /\.ts(\?|$)/i.test(ch.url)) {
              ch.url = ch.url.replace(/\.ts(\?|$)/i, '.m3u8$1');
            }
          });
        }
      });
      state.sources.forEach(src => {
        if (src.channels) {
          state.channels.push(...src.channels.map(ch => ({ ...ch, sourceId: src.id })));
        }
      });
      logApp('PLAYLIST', 'INFO', 'Stato locale ripristinato', {
        sorgenti: state.sources.length, canali: state.channels.length
      });
    }
  } catch (e) { logApp('PLAYLIST', 'ERROR', 'Errore caricamento stato', { errore: e.message }); console.error('Load state error:', e); }
}


// Auto-ripristino playlist: se i canali mancano, li ricarica dalle credenziali salvate
async function autoRestoreSources() {
  var restored = 0;
  for (const src of state.sources) {
    if (src.type === 'xtream' && src.url && src.user && src.pass && (!src.channels || src.channels.length === 0)) {
      try { await reloadXtreamSource(src); restored++; }
      catch (e) { console.warn('Ripristino sorgente non riuscito:', src.name, e); }
    }
  }
  if (restored > 0) {
    state.channels = [];
    state.sources.forEach(s => { if (s.channels) state.channels.push(...s.channels.map(ch => ({ ...ch, sourceId: s.id }))); });
    saveState();
    state._seriesCache = null;
    state._seriesCacheChannelCount = 0;
    renderChannelList();
    renderSavedSources();
    updatePlaylistButton();
    setTimeout(function () { renderChannelList(); renderSavedSources(); }, 600);
    if (typeof showToast === 'function') showToast('Playlist ripristinata: ' + state.channels.length + ' canali', 'success');
  }
}

async function reloadXtreamSource(src) {
  const base = String(src.url).replace(/\/$/, '');
  const enc = encodeURIComponent;
  const chans = [];
  try {
    const cResp = await fetch(base + '/player_api.php?username=' + enc(src.user) + '&password=' + enc(src.pass) + '&action=get_live_categories');
    const cData = await cResp.json();
    const cat = {}; (cData || []).forEach(c => cat[c.category_id] = c.category_name);
    const lResp = await fetch(base + '/player_api.php?username=' + enc(src.user) + '&password=' + enc(src.pass) + '&action=get_live_streams');
    const lData = await lResp.json();
    (lData || []).forEach(ch => chans.push({
      id: 'xtream_' + ch.stream_id, name: ch.name || ('Canale ' + ch.stream_id),
      logo: ch.stream_icon || '', group: cat[ch.category_id] || 'Live',
      epgId: ch.epg_channel_id || '', url: base + '/live/' + src.user + '/' + src.pass + '/' + ch.stream_id + '.m3u8', type: 'live'
    }));
  } catch (e) { console.warn('Ripristino Live non riuscito:', e); }
  try {
    const vResp = await fetch(base + '/player_api.php?username=' + enc(src.user) + '&password=' + enc(src.pass) + '&action=get_vod_streams');
    const vData = await vResp.json();
    (vData || []).forEach(ch => chans.push({
      id: 'xtream_vod_' + ch.stream_id, name: ch.name || '', logo: ch.cover || '',
      group: 'Film / VOD', url: base + '/movie/' + src.user + '/' + src.pass + '/' + ch.stream_id + '.' + (ch.container_extension || 'mp4'), type: 'movie'
    }));
  } catch (e) { console.warn('Ripristino VOD non riuscito:', e); }
  if (chans.length === 0) throw new Error('Nessun canale ricaricato');
  src.channels = chans;
  delete src.rawText;
}

// === IP-TVSOLUTION cloud sync (playlist legate all'account) ===
var CLOUD_SYNC_URL = 'https://iptvsolution-sync.montebellog.workers.dev/api/playlists';
var cloudReady = false;
var cloudTimer = null;

async function syncSha256(text) {
  try {
    var data = new TextEncoder().encode(text);
    var digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
  } catch (e) { return String(text); }
}

async function cloudIdentity() {
  try {
    var raw = localStorage.getItem('iptv_solution_activation');
    if (!raw) return null;
    var a = JSON.parse(raw);
    if (!a || !a.active || !a.user) return null;
    var token = await syncSha256(a.user + ':' + (a.passHash || a.pass || ''));
    return { user: a.user, token: token };
  } catch (e) { return null; }
}

function cloudHeaders(id) {
  return {
    'Content-Type': 'application/json',
    'X-IPTV-User': encodeURIComponent(id.user),
    'X-IPTV-Token': id.token
  };
}

function cloudSaveQueued() {
  if (!cloudReady) return;
  clearTimeout(cloudTimer);
  cloudTimer = setTimeout(function () { cloudSave(); }, 1200);
}

async function cloudSave() {
  var id = await cloudIdentity();
  if (!id) return;
  try {
    var payload = {
      sources: state.sources,
      favorites: state.favorites,
      settings: state.settings,
      bouquets: state.bouquets || [],
      watchHistory: state.watchHistory || [],
      activePlaylist: state.activePlaylist
    };
    var res = await fetch(CLOUD_SYNC_URL, { method: 'PUT', headers: cloudHeaders(id), body: JSON.stringify(payload) });
    if (res.ok) logApp('SYNC', 'INFO', 'Playlist sincronizzate sul cloud', { utente: id.user });
  } catch (e) { console.warn('Cloud sync save failed', e); }
}

async function cloudLoad() {
  if (sessionStorage.getItem('iptv_cloud_loaded') === '1') { cloudReady = true; return; }
  var id = await cloudIdentity();
  if (!id) return;
  try {
    var res = await fetch(CLOUD_SYNC_URL, { method: 'GET', headers: cloudHeaders(id), cache: 'no-store' });
    if (res.ok) {
      var data = await res.json();
      if (data && Array.isArray(data.sources) && data.sources.length > 0) {
        var local = {
          sources: data.sources,
          favorites: data.favorites || [],
          settings: data.settings || {},
          epgData: {},
          watchHistory: data.watchHistory || [],
          bouquets: data.bouquets || [],
          activePlaylist: data.activePlaylist || (data.sources[data.sources.length - 1] || {}).id
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(local));
        sessionStorage.setItem('iptv_cloud_loaded', '1');
        if (typeof showToast === 'function') showToast('Playlist ripristinate dal tuo account.', 'success');
        logApp('SYNC', 'INFO', 'Playlist caricate dal cloud', { utente: id.user, sorgenti: data.sources.length });
        cloudReady = true;
        setTimeout(function () { location.reload(); }, 500);
        return;
      }
    }
  } catch (e) { console.warn('Cloud sync load failed', e); }
  sessionStorage.setItem('iptv_cloud_loaded', '1');
  cloudReady = true;
}

window.IPtvAppCloudLoad = cloudLoad;
window.IPtvAppCloudSave = cloudSave;

function saveState() {
  const payload = () => ({
    sources: state.sources,
    favorites: [...state.favorites],
    settings: state.settings,
    epgData: {}, // EPG ricaricato all'avvio: troppo grande per localStorage
    watchHistory: state.watchHistory || [],
    bouquets: state.bouquets || [],
    activePlaylist: state.activePlaylist,
    viewMode: state.viewMode
  });
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload()));
    cloudSaveQueued();
    return true;
  } catch (e) { console.warn('Memoria quasi piena, riprovo senza testo grezzo M3U'); }

  // 1) Rimuovi il testo grezzo delle playlist (non serve, si può riscaricare)
  const rawBackup = state.sources.map(s => s.rawText);
  state.sources.forEach(s => { if (s.rawText) delete s.rawText; });
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload()));
    cloudSaveQueued();
    return true;
  } catch (e) {
    state.sources.forEach((s, i) => { if (rawBackup[i]) s.rawText = rawBackup[i]; });
  }

  // 2) Rimuovi i dati secondari (cronologia, EPG, bouquet)
  const hist = state.watchHistory, epg = state.epgData, bouq = state.bouquets;
  state.watchHistory = []; state.epgData = {}; state.bouquets = [];
  state.sources.forEach(s => { if (s.rawText) delete s.rawText; });
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload()));
    showToast('Memoria browser quasi piena: dati secondari non salvati.', 'warning');
    cloudSaveQueued();
    return true;
  } catch (e) {
    state.watchHistory = hist; state.epgData = epg; state.bouquets = bouq;
    showToast('Memoria browser piena: elimina una sorgente per liberare spazio.', 'error');
    return false;
  }
}

// ===== EPG XMLTV: caricamento automatico e filtrato =====
function parseXmltvDate(s) {
  const m = String(s || '').match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})/);
  if (!m) return null;
  return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
}

async function ensureEpgLoaded() {
  if (state._epgLoading) return;
  state._epgLoading = true;
  try {
    const url = state.settings.epgUrl || DEFAULT_EPG_URL;
    let text = null;
    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      text = await resp.text();
    } catch (e) {
      const proxy = await fetch('https://api.allorigins.win/raw?url=' + encodeURIComponent(url));
      if (!proxy.ok) throw new Error('HTTP ' + proxy.status + ' (proxy)');
      text = await proxy.text();
    }
    const doc = new DOMParser().parseFromString(text, 'text/xml');
    if (doc.querySelector('parsererror')) throw new Error('XML non valido');
    // Mappa nome canale -> id EPG (serve per i canali senza tvg-id nella playlist)
    const epgNames = {};
    doc.querySelectorAll('channel').forEach(ch => {
      const id = ch.getAttribute('id');
      const dn = ch.querySelector('display-name');
      if (id && dn && dn.textContent.trim()) epgNames[dn.textContent.trim().toLowerCase()] = id;
    });
    state._epgNames = epgNames;
    // Icone canale dall'EPG XMLTV: piu' fonti per i loghi mancanti
    var epgLogos = {};
    doc.querySelectorAll('channel').forEach(function(ch) {
      var id = ch.getAttribute('id');
      var icon = ch.querySelector('icon');
      var src = icon ? (icon.getAttribute('src') || '') : '';
      if (!src) return;
      if (id) epgLogos[id.toLowerCase()] = src;
      ch.querySelectorAll('display-name').forEach(function(dn) {
        var n = normalizeEpgName(dn.textContent);
        if (n) epgLogos[n] = src;
      });
    });
    state.epgLogos = epgLogos;
    refreshChannelLogos();
    const programmes = doc.querySelectorAll('programme');
    const now = Date.now();
    const from = now - 2 * 3600 * 1000;
    const to = now + 72 * 3600 * 1000;
    const epgData = {};
    programmes.forEach(prog => {
      const start = parseXmltvDate(prog.getAttribute('start'));
      const stop = parseXmltvDate(prog.getAttribute('stop'));
      if (!start || !stop || stop.getTime() < from || start.getTime() > to) return;
      const id = prog.getAttribute('channel');
      if (!id) return;
      if (!epgData[id]) epgData[id] = [];
      if (epgData[id].length >= 300) return;
      epgData[id].push({
        start: prog.getAttribute('start'),
        stop: prog.getAttribute('stop'),
        title: prog.querySelector('title') ? prog.querySelector('title').textContent : '',
        desc: prog.querySelector('desc') ? prog.querySelector('desc').textContent : ''
      });
    });
    state.epgData = epgData;
    const total = Object.values(epgData).reduce((s, a) => s + a.length, 0);
    logApp('EPG', 'INFO', 'Guida TV caricata', { canali: Object.keys(epgData).length, programmi: total });
    const status = $('#epgStatus');
    if (status) status.textContent = 'EPG caricato: ' + Object.keys(epgData).length + ' canali, ' + total + ' programmi';
    if (state.currentChannel) loadEpg(state.currentChannel);
  } catch (e) {
    logApp('EPG', 'ERROR', 'Caricamento guida non riuscito', { errore: e.message, url: safeLogUrl(state.settings.epgUrl) });
    console.warn('EPG auto-load non riuscito', e);
    const status = $('#epgStatus');
    if (status) status.textContent = 'EPG non disponibile: ' + e.message;
  } finally { state._epgLoading = false; }
}

// Event listeners
function setupEventListeners() {
  var _btnAddSource = $('#btnAddSource'); if (_btnAddSource) _btnAddSource.addEventListener('click', () => showModal('addSourceModal'));
  $('#btnCloseAddSource').addEventListener('click', () => hideModal('addSourceModal'));
  var _btnSettings = $('#btnSettings');
  if (_btnSettings) _btnSettings.addEventListener('click', () => { showModal('settingsModal'); renderSavedSources(); });
  $('#btnCloseSettings').addEventListener('click', () => hideModal('settingsModal'));
  $('#btnClosePin').addEventListener('click', hidePinModal);
  $('#pinInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') submitPin(); });
  $('#btnCloseEpg').addEventListener('click', () => $('#epgPanel').style.display = 'none');
  $('#btnRecord').addEventListener('click', toggleRecording);
  $('#btnSaveRecording').addEventListener('click', saveCurrentRecording);
  if ($('#btnPickUsbFolder')) $('#btnPickUsbFolder').addEventListener('click', pickUsbFolder);
  if ($('#btnSaveCloudConfig')) $('#btnSaveCloudConfig').addEventListener('click', () => {
    state.saveConfig.cloudUrl = $('#cloudUrl').value.trim();
    state.saveConfig.cloudUser = $('#cloudUser').value.trim();
    state.saveConfig.cloudPass = $('#cloudPass').value;
    saveSaveConfig();
    showToast('Configurazione cloud salvata.', 'success');
  });
  $('#btnScheduleSave').addEventListener('click', saveScheduleFromForm);

  $$('.source-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.source-type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      $$('.source-form').forEach(f => f.classList.remove('active'));
      const formId = 'form' + btn.dataset.type.charAt(0).toUpperCase() + btn.dataset.type.slice(1);
      const form = document.getElementById(formId);
      if (form) form.classList.add('active');
    });
  });

  $('#formM3u').addEventListener('submit', handleM3uSubmit);
  $('#formXtream').addEventListener('submit', handleXtreamSubmit);
  $('#formStalker').addEventListener('submit', handleStalkerSubmit);
  $('#formFile').addEventListener('submit', handleFileSubmit);

  var _searchChannels = $('#searchChannels');
  if (_searchChannels) _searchChannels.addEventListener('input', (e) => {
    state.searchQuery = e.target.value.toLowerCase();
    if (state.searchQuery && state.navLevel !== 'home') {
      // When searching, go to home level to show all matching channels
      state.navLevel = 'home';
      state.navType = null;
      state.navCategory = null;
      const bc = $('#navBreadcrumb');
      if (bc) bc.style.display = 'none';
      // Filter tabs moved to top nav bar
    }
    renderChannelList();
  });

  $$('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const f = tab.dataset.filter;
      if (f === 'all') {
        navigateTo('home');
      } else if (f === 'fav') {
        navigateTo('type', 'fav');
      } else {
        navigateTo('type', f);
      }
    });
  });

  $('#btnFullscreen').addEventListener('click', toggleFullscreen);
  $('#btnPip').addEventListener('click', togglePip);

  $('#settingAutoplay').addEventListener('change', (e) => { state.settings.autoplay = e.target.checked; saveState(); });
  $('#settingVolume').addEventListener('input', (e) => { state.settings.volume = parseInt(e.target.value); $('#videoPlayer').volume = state.settings.volume / 100; saveState(); });
  $('#btnExportData').addEventListener('click', exportData);
  $('#btnClearData').addEventListener('click', clearData);

  // Parental control PIN
  const pinEnabledEl = $('#settingPinEnabled');
  if (pinEnabledEl) pinEnabledEl.checked = getPinState().enabled;
  $('#settingPinEnabled').addEventListener('change', (e) => {
    const group = document.getElementById('pinSetupGroup');
    if (group) group.style.display = e.target.checked ? 'block' : 'none';
    if (!e.target.checked) disableParentalPin();
  });
  $('#btnSavePin').addEventListener('click', savePinFromSettings);
  $('#btnDisablePin').addEventListener('click', disableParentalPin);
  const btnReloadAll = $('#btnReloadAll');
  if (btnReloadAll) btnReloadAll.addEventListener('click', reloadAllSources);
  const btnExportPlaylists = $('#btnExportPlaylists');
  if (btnExportPlaylists) btnExportPlaylists.addEventListener('click', exportPlaylists);
  $('#btnLoadEpg').addEventListener('click', loadEpgFromUrl);
  $('#btnCloseSeries').addEventListener('click', () => hideModal('seriesModal'));
  const epgInput = $('#settingEpgUrl');
  if (!state.settings.epgUrl) state.settings.epgUrl = DEFAULT_EPG_URL;
  if (epgInput) {
    epgInput.value = state.settings.epgUrl;
    epgInput.addEventListener('change', (e) => { state.settings.epgUrl = e.target.value.trim(); saveState(); });
  }
  const epgStatus = $('#epgStatus');
  if (epgStatus) epgStatus.textContent = 'Caricamento guida TV in corso...';

  $$('.modal').forEach(m => {
    m.addEventListener('click', (e) => { if (e.target === m) hideModal(m.id); });
  });
}

// Quick menu (PLAYLISTS / GRUPPI / MODE / CERCA / MENU)
function qmSortChannels() {
  state.channels.sort(function (a, b) { return (a.name || '').localeCompare(b.name || ''); });
  state.sources.forEach(function (src) { if (src.channels) src.channels.sort(function (a, b) { return (a.name || '').localeCompare(b.name || ''); }); });
  saveState();
  renderChannelList();
  showToast('Ordinamento per nome applicato', 'success');
}

function qmChannels() {
  if (state.activePlaylist && state.activePlaylist !== 'all') {
    return state.channels.filter(function (c) { return c.sourceId === state.activePlaylist; });
  }
  return state.channels.slice();
}
function qmTypeLabel(t) { return t === 'vod' ? 'FILM' : t === 'series' ? 'SERIES' : 'LIVE'; }
function qmGroupMap() {
  var map = {};
  qmChannels().forEach(function (ch) {
    var t = ch.type || 'live';
    var g = ch.group || 'Generale';
    if (!map[g]) map[g] = { type: t, count: 0 };
    map[g].count++;
  });
  return map;
}
function qmShowEpg(i) {
  var d = (window.qmEpgCache || [])[i];
  if (!d) return;
  document.querySelectorAll('.qm-epg-row').forEach(function (el) { el.classList.remove('sel'); });
  var row = document.getElementById('qmEpgRow' + i);
  if (row) row.classList.add('sel');
  var box = document.getElementById('qmEpgDetail');
  if (!box) return;
  box.innerHTML = '<div class="qm-detail-head"><b>' + escapeHtml(d.name) + '</b><span>' + escapeHtml(d.start) + ' - ' + escapeHtml(d.stop) + '</span></div>' +
    '<h3>' + escapeHtml(d.title) + '</h3>' +
    '<div class="qm-detail-bar"><i style="width:' + d.pct + '%"></i></div>' +
    '<p>' + escapeHtml(d.desc || 'Nessuna descrizione disponibile per questo programma.') + '</p>' +
    '<div class="qm-detail-actions"><button class="btn btn-primary" onclick="hideModal(\'quickMenuModal\');playChannelById(\'' + escapeAttr(d.id) + '\')">GUARDA</button></div>';
}

function qmRender(tab) {
  var box = document.getElementById('quickMenuContent');
  if (!box) return;
  var chans = qmChannels();
  var groups = qmGroupMap();
  var html = '';
  if (tab === 'PLAYLISTS') {
    html += '<div class="qm-grid">';
    html += '<button class="qm-chip' + (state.activePlaylist === 'all' ? ' sel' : '') + '" onclick="qmPlaylist(\'all\')">TUTTE</button>';
    state.sources.forEach(function (src) {
      var on = state.activePlaylist === src.id ? ' sel' : '';
      html += '<button class="qm-chip' + on + '" onclick="qmPlaylist(\'' + escapeAttr(src.id) + '\')">' + escapeHtml((src.name || 'PLAYLIST').toUpperCase()) + '<span class="qm-sub">' + (src.channels ? src.channels.length : 0) + '</span></button>';
    });
    html += '</div>';
    if (state.sources.length === 0) html += '<p class="hint">Nessuna playlist salvata. Usa + Aggiungi sorgente.</p>';
  } else if (tab === 'GRUPPI') {
    ['live', 'vod', 'series'].forEach(function (t) {
      var keys = Object.keys(groups).filter(function (g) { return groups[g].type === t; }).sort();
      if (keys.length === 0) return;
      html += '<div class="qm-section-title">' + qmTypeLabel(t) + '</div><div class="qm-grid">';
      keys.forEach(function (g) {
        var on = state.navCategory === g && state.navType === t ? ' sel' : '';
        html += '<button class="qm-chip' + on + '" onclick="qmGroup(\'' + t + '\',\'' + escapeAttr(g) + '\')">' + escapeHtml(g.toUpperCase()) + '<span class="qm-sub">' + groups[g].count + '</span></button>';
      });
      html += '</div>';
    });
    if (chans.length === 0) html += '<p class="hint">Carica una playlist per vedere i gruppi (bouquet LIVE / FILM / SERIE).</p>';
    else if (keys.length === 0) html += '<p class="hint">Nessun gruppo disponibile.</p>';
  } else if (tab === 'MODE') {
    var fixed = [['fav', 'PREFERITI'], ['all', 'TUTTO'], ['generale', 'GENERALISTI'], ['informazione', 'INFORMATIVI'], ['sport', 'SPORT'], ['bambini', 'BAMBINI'], ['webcam', 'WEBCAM']];
    html += '<div class="qm-grid qm-cats">';
    fixed.forEach(function (p) {
      var on = (p[0] === 'all' && state.navLevel === 'home') || (p[0] === 'fav' && state.navType === 'fav') ? ' sel' : '';
      html += '<button class="qm-chip' + on + '" onclick="qmType(\'' + (p[0] === 'fav' ? 'fav' : p[0] === 'all' ? 'all' : 'live') + '\')">' + p[1] + '</button>';
    });
    Object.keys(groups).sort().slice(0, 12).forEach(function (g) {
      html += '<button class="qm-chip" onclick="qmGroup(\'' + groups[g].type + '\',\'' + escapeAttr(g) + '\')">' + escapeHtml(g.toUpperCase()) + '</button>';
    });
    html += '</div>';
    html += '<div class="qm-section-title">GUIDA TV</div><div class="qm-epg-split">';
    window.qmEpgCache = [];
    var listHtml = '';
    var nowMs = Date.now();
    chans.slice(0, 80).forEach(function (ch, i) {
      var key = ch.epgId || ch.tvgId || ch.id || ch.name;
      var progs = (state.epgData || {})[key] || [];
      var cur = null;
      for (var pi = 0; pi < progs.length; pi++) {
        var s = parseXmltvDate(progs[pi].start), e = parseXmltvDate(progs[pi].stop);
        if (s && e && s.getTime() <= nowMs && e.getTime() >= nowMs) { cur = progs[pi]; break; }
      }
      var title = cur && cur.title ? cur.title : (ch.name || '');
      var start = cur && cur.start ? String(cur.start).slice(11, 16) : '20:00';
      var stop = cur && cur.stop ? String(cur.stop).slice(11, 16) : '21:00';
      var pct = 45;
      if (cur && cur.start && cur.stop) {
        var a = parseXmltvDate(cur.start), b = parseXmltvDate(cur.stop);
        if (a && b && b > a) pct = Math.max(2, Math.min(100, Math.round((nowMs - a) / (b - a) * 100)));
      }
      window.qmEpgCache.push({ id: ch.id, name: ch.name || '', title: title, start: start, stop: stop, pct: pct, desc: cur && cur.desc ? cur.desc : '' });
      var logoHtml = ch.logo ? '<img src="' + escapeAttr(ch.logo) + '" onerror="this.style.display=\'none\'">' : '';
      listHtml += '<div class="qm-epg-row' + (i === 0 ? ' sel' : '') + '" id="qmEpgRow' + i + '" onclick="qmShowEpg(' + i + ')">' +
        '<span class="qm-num">' + i + '</span>' +
        '<span class="qm-epg-logo">' + logoHtml + '</span>' +
        '<span class="qm-epg-name">' + escapeHtml(ch.name || '') + '</span>' +
        '<span class="qm-epg-prog">' + escapeHtml(title) + '</span>' +
        '<span class="qm-epg-foot"><em>' + escapeHtml(start) + '</em><div class="qm-bar"><i style="width:' + pct + '%"></i></div><em>' + escapeHtml(stop) + '</em></span></div>';
    });
    html += '<div class="qm-epg-list">' + listHtml + '</div>';
    html += '<div class="qm-epg-detail" id="qmEpgDetail"></div></div>';
    if (chans.length) setTimeout(function () { qmShowEpg(0); }, 0);
    if (chans.length === 0) html += '<p class="hint">Carica una playlist per vedere la guida TV.</p>';
  } else if (tab === 'CERCA') {
    html += '<input id="qmSearch" class="qm-search" type="text" placeholder="Cerca canale, film, serie..." oninput="qmSearchResults(this.value)" onkeydown="if(event.key===\'Enter\')qmSearchApply()" autofocus>';
    html += '<button class="btn btn-primary" style="margin-top:8px;" onclick="qmSearchApply()">CERCA</button>';
    html += '<div id="qmSearchResults" class="qm-grid" style="margin-top:12px;"></div>';
  } else {
    html += '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">';
    html += '<button class="btn btn-primary" onclick="hideModal(\'quickMenuModal\');openAdvancedPlaylistModal()">AGGIUNGI PLAYLIST</button>';
    html += '<button class="btn btn-secondary" onclick="checkVersion(true)">AGGIORNA INFORMAZIONI</button>';
    html += '<button class="btn btn-secondary" onclick="qmSortChannels()">ORDINAMENTO</button>';
    html += '</div>';
    html += '<div class="qm-info-card"><b>CANALI TV</b>' +
      '<div><span>Stato:</span><em class="ok">Attivo</em></div>' +
      '<div><span>Scadenza:</span><em>Nessuna</em></div>' +
      '<div><span>Aggiunta:</span><em>' + escapeHtml(new Date().toLocaleDateString('it-IT')) + '</em></div>' +
      '<div><span>Connessioni:</span><em>1</em></div>' +
      '<div><span>Canali:</span><em>' + chans.length + '</em></div></div>';
    html += '<div class="qm-portals">';
    html += '<button class="qm-portal" onclick="hideModal(\'quickMenuModal\');showModal(\'addSourceModal\')">IPTV EXTREME PORTAL</button>';
    html += '<button class="qm-portal" onclick="hideModal(\'quickMenuModal\');showModal(\'addSourceModal\')">FILE O LINK PLAYLIST</button>';
    html += '<button class="qm-portal" onclick="hideModal(\'quickMenuModal\');showModal(\'addSourceModal\')">MAG PORTAL</button>';
    html += '<button class="qm-portal" onclick="hideModal(\'quickMenuModal\');showModal(\'addSourceModal\')">XTREAM CODES PORTAL</button>';
    html += '</div>';
    html += '<div class="qm-grid" style="margin-top:12px;">';
    html += '<button class="qm-chip" onclick="hideModal(\'quickMenuModal\');showModal(\'settingsModal\')">IMPOSTAZIONI</button>';
    html += '<button class="qm-chip" onclick="hideModal(\'quickMenuModal\');refreshLogosFromSources(false)">AGGIORNA LOGHI</button>';
    html += '<button class="qm-chip" onclick="hideModal(\'quickMenuModal\');autoFillMissingPosters(false,40)">RECUPERA LOCANDINE</button>';
    html += '<button class="qm-chip" onclick="hideModal(\'quickMenuModal\');clearPosterCache()">CANCELLA CACHE</button>';
    html += '<button class="qm-chip" onclick="hideModal(\'quickMenuModal\');toggleViewMode()">VISTA ' + (state.viewMode === 'grid' ? 'LISTA' : 'GRIGLIA') + '</button>';
    html += '</div>';
  }
  box.innerHTML = html;
}
function setQuickMenuTab(tab) {
  document.querySelectorAll('.qm-tab').forEach(function (b) {
    b.classList.toggle('active', b.getAttribute('data-tab') === tab);
  });
  qmRender(tab);
}


/* ===== Stile TV: drawer, tab, EPG card, player overlay, context menu ===== */
/* ===== Guida TV completa in stile EPG, filtrata sulla categoria selezionata ===== */
var fgState = { start: 0, end: 0, ppm: 4 / 60000, selected: null, channels: [] };
function fgChannels() {
  var list = (state.channels || []).slice();
  if (state.activePlaylist && state.activePlaylist !== "all") {
    list = list.filter(function (c) { return c.sourceId === state.activePlaylist; });
  }
  var m = state.tvBrowse || "all";
  if (m === "fav") list = list.filter(function (c) { return state.favorites.has(c.id); });
  else if (m === "live") list = list.filter(function (c) { return !c.type || c.type === "live"; });
  else if (m === "vod") list = list.filter(function (c) { return c.type === "vod"; });
  else if (m === "series") list = list.filter(function (c) { return c.type === "series"; });
  else if (m !== "all") list = list.filter(function (c) { return (c.group || "") === m; });
  return list;
}
function fgPad(n) { return String(n).padStart(2, "0"); }
function fgTime(ms) { var d = new Date(ms); return fgPad(d.getHours()) + ":" + fgPad(d.getMinutes()); }
function fgDate(ms) {
  var d = new Date(ms);
  var g = ["DOM", "LUN", "MAR", "MER", "GIO", "VEN", "SAB"][d.getDay()];
  return g + " " + fgPad(d.getDate()) + "/" + fgPad(d.getMonth() + 1);
}
function fgLabel() {
  var m = state.tvBrowse || "all";
  if (state.tvCategory && m === state.tvCategory) return String(m).toUpperCase();
  if (m === "all" || m === "fav" || m === "live" || m === "vod" || m === "series") return tvCatLabel(m);
  return String(m).toUpperCase();
}
function fgKey(ch) { return ch.epgId || ch.tvgId || ch.id || ch.name; }
function fgPrograms(ch) {
  var raw = (state.epgData || {})[fgKey(ch)] || [];
  var out = [];
  for (var i = 0; i < raw.length; i++) {
    var p = raw[i], s = parseXmltvDate(p.start), e = parseXmltvDate(p.stop);
    if (s && e) out.push({ s: s.getTime(), e: e.getTime(), title: p.title || "", desc: p.desc || "" });
  }
  out.sort(function (a, b) { return a.s - b.s; });
  return out;
}
function openFullGuide() {
  var ov = document.getElementById("fullGuideOverlay");
  if (!ov) return;
  ov.classList.add("show");
  var now = Date.now();
  fgState.channels = fgChannels();
  fgState.start = Math.floor(now / 1800000) * 1800000 - 90 * 60000;
  fgState.end = fgState.start + 8 * 3600000;
  fgState.selected = null;
  for (var i = 0; i < fgState.channels.length && !fgState.selected; i++) {
    var ps = fgPrograms(fgState.channels[i]);
    for (var j = 0; j < ps.length; j++) {
      if (ps[j].s <= now && ps[j].e >= now) {
        fgState.selected = { ch: fgState.channels[i], p: ps[j] };
        break;
      }
    }
  }
  fgRender();
}
function closeFullGuide() {
  var ov = document.getElementById("fullGuideOverlay");
  if (ov) ov.classList.remove("show");
}
function fgSelect(ci, pi) {
  var ch = fgState.channels[ci];
  if (!ch) return;
  var p = fgPrograms(ch)[pi];
  if (!p) return;
  fgState.selected = { ch: ch, p: p };
  fgRenderDetail();
  fgRenderRows();
}
function fgRenderDetail() {
  var t = document.getElementById("fgTitle"), w = document.getElementById("fgWhen");
  var d = document.getElementById("fgDesc"), c = document.getElementById("fgClock");
  var sel = fgState.selected;
  if (c) c.textContent = fgTime(Date.now());
  if (!sel) {
    if (t) t.textContent = "Guida TV completa";
    if (w) w.textContent = fgLabel() + " · " + fgDate(fgState.start);
    if (d) d.textContent = "Seleziona un programma nella griglia per vedere i dettagli.";
    return;
  }
  if (t) t.textContent = sel.p.title || sel.ch.name;
  if (w) w.textContent = fgDate(sel.p.s) + "  " + fgTime(sel.p.s) + " - " + fgTime(sel.p.e) + "  ·  " + sel.ch.name;
  if (d) d.textContent = sel.p.desc || "Nessuna descrizione disponibile.";
}
function fgRender() {
  fgRenderDetail();
  var head = document.getElementById("fgHead"), line = document.getElementById("fgNowLine");
  var total = (fgState.end - fgState.start) * fgState.ppm;
  if (head) {
    var h = '<div class="fg-label">' + escapeHtml(fgLabel()) + "</div>";
    for (var t = fgState.start; t < fgState.end; t += 1800000) h += '<div class="fg-slot">' + fgTime(t) + "</div>";
    head.style.width = (180 + total) + "px";
    head.innerHTML = h;
  }
  if (line) line.style.left = (180 + (Date.now() - fgState.start) * fgState.ppm) + "px";
  fgRenderRows();
}
function fgRenderRows() {
  var rows = document.getElementById("fgRows");
  if (!rows) return;
  var total = (fgState.end - fgState.start) * fgState.ppm;
  var now = Date.now();
  var html = "";
  fgState.channels.forEach(function (ch, ci) {
    html += '<div class="fg-row"><div class="fg-ch"><span class="fg-num">' + (ci + 1) + "</span>" + escapeHtml(ch.name || "") + '</div><div class="fg-track" style="width:' + total + 'px">';
    var ps = fgPrograms(ch), any = false;
    ps.forEach(function (p, pi) {
      if (p.e <= fgState.start || p.s >= fgState.end) return;
      any = true;
      var left = Math.max(0, (p.s - fgState.start) * fgState.ppm);
      var right = Math.min(p.e, fgState.end);
      var width = Math.max(60, (right - Math.max(p.s, fgState.start)) * fgState.ppm);
      var isNow = p.s <= now && p.e >= now;
      var sel = fgState.selected && fgState.selected.ch.id === ch.id && fgState.selected.p.s === p.s;
      html += '<button class="fg-block' + (isNow ? " now" : "") + (sel ? " sel" : "") + '" style="left:' + left + "px;width:" + width + 'px" onclick="fgSelect(' + ci + "," + pi + ')" title="' + escapeAttr(p.title || ch.name || "") + '">' + escapeHtml(p.title || ch.name || "") + "</button>";
    });
    if (!any) html += '<div class="fg-block none" style="left:0;width:' + (120 * fgState.ppm) + 'px">Guida non disponibile</div>';
    html += "</div></div>";
  });
  rows.innerHTML = html || '<div class="fg-empty">Nessun canale nella categoria selezionata. Carica una playlist o scegli un altro bouquet.</div>';
}

function tvEpgInfo(ch) {
  var key = ch.epgId || ch.tvgId || ch.id || ch.name;
  var progs = (state.epgData || {})[key] || [];
  var now = Date.now(), cur = null, next = null;
  for (var i = 0; i < progs.length; i++) {
    var s = parseXmltvDate(progs[i].start), e = parseXmltvDate(progs[i].stop);
    if (!s || !e) continue;
    if (s.getTime() <= now && e.getTime() >= now) { cur = progs[i]; next = progs[i + 1] || null; break; }
    if (s.getTime() > now && !next) next = progs[i];
  }
  var title = cur && cur.title ? cur.title : (ch.name || '');
  var start = cur && cur.start ? String(cur.start).slice(11, 16) : '';
  var stop = cur && cur.stop ? String(cur.stop).slice(11, 16) : '';
  var pct = 0, left = '';
  if (cur && cur.start && cur.stop) {
    var a = parseXmltvDate(cur.start), b = parseXmltvDate(cur.stop);
    if (a && b && b > a) {
      pct = Math.max(2, Math.min(100, Math.round((now - a) / (b - a) * 100)));
      var mm = Math.max(0, Math.round((b - now) / 60000));
      left = String(Math.floor(mm / 60)).padStart(2, '0') + ':' + String(mm % 60).padStart(2, '0');
    }
  }
  return { title: title, start: start, stop: stop, pct: pct, left: left,
           next: next && next.title ? next.title : '', desc: cur && cur.desc ? cur.desc : '' };
}

function tvChannelItemHtml(ch, tvIdx) {
  var i = typeof tvIdx === 'number' ? tvIdx : Math.max(0, state.channels.indexOf(ch));
  var e = tvEpgInfo(ch);
  var active = state.tvSelectedId === ch.id;
  var fav = state.favorites.has(ch.id);
  var logo = ch.logo
    ? '<img src="' + escapeAttr(ch.logo) + '" onerror="this.style.display=\'none\';this.parentElement.textContent=this.parentElement.getAttribute(\'data-initials\')||\'IPTV\';">'
    : escapeHtml(initialsShort(ch.name));
  var id = escapeAttr(ch.id);
  var ctx = ' oncontextmenu="event.preventDefault();openTvContextMenu(\'' + id + '\',event)"';
  var star = '<span class="tv-star' + (fav ? ' on' : '') + '" onclick="event.stopPropagation();toggleFav(\'' + id + '\')" title="Preferito">' + (fav ? '★' : '☆') + '</span>';
  var more = '<span class="tv-more" onclick="event.stopPropagation();openTvContextMenu(\'' + id + '\',event)" title="Opzioni">⋮</span>';

  if (state.viewMode === 'grid') {
    return '<div class="tv-card' + (active ? ' active' : '') + '" data-id="' + escapeHtml(ch.id) + '"' + ctx + ' onclick="tvSelectChannel(\'' + id + '\')" ondblclick="tvPlayChannel(\'' + id + '\')">' +
      '<div class="tv-card-top"><span class="tv-num">' + i + '</span>' + star + more + '</div>' +
      '<div class="tv-logo" data-initials="' + escapeAttr(initialsShort(ch.name)) + '">' + logo + '</div>' +
      '<b class="tv-name">' + escapeHtml(ch.name) + '</b>' +
      '<span class="tv-prog">' + escapeHtml(e.title) + '</span>' +
      '<span class="tv-foot"><em>' + escapeHtml(e.start) + '</em><span class="tv-bar"><i style="width:' + e.pct + '%"></i></span><em>' + escapeHtml(e.stop) + '</em></span>' +
      '<span class="tv-next">A Seguire: ' + escapeHtml(e.next || '-') + '</span></div>';
  }
  return '<div class="tv-row' + (active ? ' active' : '') + '" data-id="' + escapeHtml(ch.id) + '"' + ctx + ' onclick="tvSelectChannel(\'' + id + '\')" ondblclick="tvPlayChannel(\'' + id + '\')">' +
    '<span class="tv-num">' + i + '</span>' +
    '<span class="tv-logo" data-initials="' + escapeAttr(initialsShort(ch.name)) + '">' + logo + '</span>' +
    '<span class="tv-main"><b class="tv-name">' + escapeHtml(ch.name) + '</b>' +
    '<span class="tv-prog">' + escapeHtml(e.title) + '</span>' +
    '<span class="tv-foot"><em>' + escapeHtml(e.start) + '</em><span class="tv-bar"><i style="width:' + e.pct + '%"></i></span><em>' + escapeHtml(e.stop) + '</em>' +
    '<em class="tv-next-foot">A Seguire: ' + escapeHtml(e.next || '-') + '</em></span></span>' +
    '<span class="tv-left">' + escapeHtml(e.left) + '</span>' + star + more + '</div>';
}

function renderTvGroupTabs() {
  var box = document.getElementById('tvGroupTabs');
  if (!box) return;
  var b = state.tvBrowse || 'all';
  function tab(v, label) {
    var sel = (state.tvView === 'categories' && b === v) || (state.tvView !== 'categories' && b === v && !state.tvCategory);
    return '<button class="tv-tab' + (sel ? ' sel' : '') + '" onclick="tvTab(\'' + v + '\')">' + label + '</button>';
  }
  var html = tab('all', 'TUTTI') + tab('fav', 'PREFERITI') + tab('live', 'LIVE') + tab('vod', 'FILM') + tab('series', 'SERIE');
  html += '<span class="tv-tabs-spacer"></span>';
  box.innerHTML = html;
}
function tvCatLabel(type) {
  if (type === 'live') return 'LIVE';
  if (type === 'vod') return 'FILM';
  if (type === 'series') return 'SERIE TV';
  if (type === 'fav') return 'PREFERITI';
  return 'TUTTI';
}
function tvClearSearch() {
  state.searchQuery = '';
  var s = document.getElementById('searchChannels');
  if (s) s.value = '';
}
function tvShowCategories(type) {
  state.tvBrowse = type;
  state.tvType = type;
  state.tvView = 'categories';
  state.tvCategory = null;
  state.tvBack = { type: type, view: 'categories' };
  state.navLevel = 'all';
  tvClearSearch();
  renderChannelList();
  saveState();
}
function tvShowVod() {
  state.tvBrowse = 'vod';
  state.tvType = 'vod';
  state.tvView = 'channels';
  state.tvCategory = null;
  state.tvBack = { type: 'vod', view: 'channels' };
  state.navLevel = 'all';
  tvClearSearch();
  renderChannelList();
  saveState();
}
function tvTab(kind) {
  if (kind === 'vod') { tvShowVod(); return; }
  if (kind === 'live' || kind === 'series') { tvShowCategories(kind); return; }
  state.tvBrowse = kind;
  state.tvType = null;
  state.tvView = 'channels';
  state.tvCategory = null;
  state.tvBack = null;
  state.navLevel = 'all';
  tvClearSearch();
  renderChannelList();
  saveState();
}
function tvEnterCategory(group) {
  state.tvBrowse = group;
  state.tvCategory = group;
  state.tvView = 'channels';
  var gch = state.channels.find(function (c) { return (c.group || '') === group; });
  state.tvType = gch ? (gch.type || 'live') : (state.tvType || 'live');
  state.tvBack = { type: state.tvType, view: 'channels', group: group };
  state.navLevel = 'all';
  tvClearSearch();
  renderChannelList();
  saveState();
}
function tvGroupTab(group) { tvEnterCategory(group); }
function tvBackFromCategory() {
  var t = state.tvBack && state.tvBack.type ? state.tvBack.type : (state.tvType || 'live');
  tvShowCategories(t);
}
var catOvKind = 'all';
function openCategoriesOverlay() {
  var el = document.getElementById('categoriesOverlay');
  if (!el) return;
  catOvKind = 'all';
  el.classList.add('show');
  catOvRender();
}
function closeCategoriesOverlay() {
  var el = document.getElementById('categoriesOverlay');
  if (el) el.classList.remove('show');
}
function catOvSetTab(kind) {
  catOvKind = kind;
  catOvRender();
}
function catOvRender() {
  var list = document.getElementById('catOvList');
  if (!list) return;
  ['all', 'live', 'vod', 'series'].forEach(function (k) {
    var b = document.getElementById('catOvTab_' + k);
    if (b) b.className = 'cat-ov-tab' + (k === catOvKind ? ' active' : '');
  });
  var base = (state.channels || []).slice();
  if (state.activePlaylist && state.activePlaylist !== 'all') {
    base = base.filter(function (c) { return c.sourceId === state.activePlaylist; });
  }
  if (catOvKind === 'vod') {
    var films = base.filter(function (c) { return (c.type || 'live') === 'vod'; });
    if (!films.length) {
      list.innerHTML = '<div class="cat-ov-empty">Carica una playlist per vedere i film.</div>';
      return;
    }
    list.innerHTML = films.map(function (c) {
      return '<button class="cat-ov-item" data-id="' + escapeHtml(c.id) + '" onclick="catOvOpenFilm(this.getAttribute(\'data-id\'))">' + escapeHtml(String(c.name || '').toUpperCase()) + '</button>';
    }).join('');
    return;
  }
  var groups = {}, keys = [];
  base.forEach(function (c) {
    var g = (c.group || '').trim();
    var t = c.type || 'live';
    if (!g) return;
    if (catOvKind !== 'all' && t !== catOvKind) return;
    if (!groups[g]) keys.push(g);
    groups[g] = (groups[g] || 0) + 1;
  });
  if (!keys.length) {
    list.innerHTML = '<div class="cat-ov-empty">Carica una playlist per vedere le categorie.</div>';
    return;
  }
  list.innerHTML = keys.map(function (g) {
    return '<button class="cat-ov-item" data-g="' + escapeHtml(g) + '" onclick="catOvEnter(this.getAttribute(\'data-g\'))">' + escapeHtml(g.toUpperCase()) + '</button>';
  }).join('');
}
function catOvEnter(group) {
  closeCategoriesOverlay();
  tvEnterCategory(group);
  showToast('Categoria: ' + group, 'success');
}
function catOvOpenFilm(id) {
  closeCategoriesOverlay();
  state.tvBrowse = 'vod';
  state.tvType = 'vod';
  state.tvView = 'channels';
  state.tvCategory = null;
  state.tvBack = { type: 'vod', view: 'channels' };
  state.navLevel = 'all';
  renderChannelList();
  tvSelectChannel(id);
  var f = (state.channels || []).find(function (c) { return c.id === id; });
  showToast('Film: ' + (f ? f.name : ''), 'success');
}

function tvUpdatePlayBar() {
  var bar = document.getElementById('tvPlayBar');
  var ch = state.channels.find(function (c) { return c.id === state.tvSelectedId; });
  var name = document.getElementById('tvSelectedName');
  var info = document.getElementById('tvSelectedInfo');
  if (name) name.textContent = ch ? ch.name : 'Nessun canale selezionato';
  if (info) info.textContent = ch ? ((ch.group || '') + (ch.type ? ' · ' + ch.type.toUpperCase() : '')) : 'Seleziona un canale dalla lista';
  if (bar) bar.classList.toggle('show', !!ch);
}
function tvSelectChannel(id) {
  state.tvSelectedId = id;
  document.body.classList.remove('tv-playing');
  playChannelById(id);
  renderChannelList();
  tvUpdatePlayBar();
  showToast('Anteprima avviata · clicca ⤢ sul player per ingrandire', 'success');
}
function tvPlaySelected() {
  if (!state.tvSelectedId) { showToast('Seleziona prima un canale.', 'warning'); return; }
  tvPlayChannel(state.tvSelectedId);
}
function tvExpandPlayer() {
  if (!state.tvSelectedId) { showToast('Seleziona prima un canale.', 'warning'); return; }
  document.body.classList.add('tv-playing');
  var u = document.getElementById('tvPlayerUi');
  if (u) u.classList.remove('locked');
}
function tvPlayChannel(id) {
  state.tvSelectedId = id;
  playChannelById(id);
  document.body.classList.add('tv-playing');
}

function openTvDrawer() {
  var d = document.getElementById('tvDrawer');
  if (d) d.classList.add('open');
  var b = document.getElementById('tvDrawerBackdrop');
  if (b) b.classList.add('show');
}
function closeTvDrawer() {
  var d = document.getElementById('tvDrawer');
  if (d) d.classList.remove('open');
  var b = document.getElementById('tvDrawerBackdrop');
  if (b) b.classList.remove('show');
}
function tvDrawerAction(a) {
  closeTvDrawer();
  if (a === 'playlists') showPlaylistSelector();
  else if (a === 'groups') openQuickMenu('GRUPPI');
  else if (a === 'search') setTimeout(function () { var s = document.getElementById('searchChannels'); if (s) s.focus(); }, 50);
  else if (a === 'categorie') showCategoryOverview();
  else if (a === 'registrazioni') { updateSaveDestinationUI(); showModal('recordingsModal'); }
  else if (a === 'film') navigateTo('type','vod');
  else if (a === 'serie') navigateTo('type','series');
  else if (a === 'settings') showModal('settingsModal');
  else if (a === 'recent') showTvList('RECENT');
  else if (a === 'new') showTvList('NEW');
  else if (a === 'programs') openQuickMenu('MODE');
  else if (a === 'update') { var b = document.getElementById('btnReloadAll'); if (b) b.click(); else checkVersion(true); }
  else if (a === 'sort') qmSortChannels();
  else if (a === 'replay') openQuickMenu('MODE');
  else if (a === 'guide') openFullGuide();
  else if (a === 'groupmanage') openQuickMenu('GRUPPI');
  else if (a === 'parental') showModal('settingsModal');
  else if (a === 'about') showToast('IP-TVSOLUTION v1.9 · Web Player · ' + (document.getElementById('serverInfo') || {}).textContent, 'success');
  else if (a === 'exit') {
    if (window.IPtvActivation && IPtvActivation.logout) IPtvActivation.logout();
    else showToast('Nessuna sessione attiva da chiudere.', 'warning');
  }
}

function showTvList(kind) {
  var box = document.getElementById('tvListBody');
  var title = document.getElementById('tvListTitle');
  if (!box) return;
  if (title) title.textContent = kind === 'RECENT' ? 'Canali recenti' : 'Ultimi aggiunti';
  var list;
  if (kind === 'RECENT') {
    list = (state.watchHistory || []).map(function (h) { return state.channels.find(function (c) { return c.id === h.id; }); }).filter(Boolean);
  } else {
    list = state.channels.slice().reverse();
  }
  if (!list.length) { box.innerHTML = '<p class="hint">Nessun elemento disponibile.</p>'; showModal('tvListModal'); return; }
  var html = '';
  list.slice(0, 80).forEach(function (ch) {
    html += '<button class="tv-list-item" onclick="hideModal(\'tvListModal\');playChannelById(\'' + escapeAttr(ch.id) + '\')">' +
      (ch.logo ? '<img src="' + escapeAttr(ch.logo) + '" onerror="this.style.display=\'none\'">' : '📺') +
      '<span>' + escapeHtml(ch.name) + '</span><small>' + escapeHtml(ch.group || '') + '</small></button>';
  });
  box.innerHTML = html;
  showModal('tvListModal');
}

function openTvContextMenu(id, ev) {
  var ch = state.channels.find(function (c) { return c.id === id; });
  var m = document.getElementById('tvContextMenu');
  if (!ch || !m) return;
  state._tvCtxId = id;
  var items = [
    ['Riproduci', 'tvCtxPlay()'],
    ['Riproduci con...', 'tvCtxPlayWith()'],
    ['Replay', 'tvCtxReplay()'],
    ['Informazioni Evento', 'tvCtxInfo()'],
    ['Guida TV', 'tvCtxGuide()'],
    ['Download / Registra', 'tvCtxRecord()'],
    ['Condividi', 'tvCtxShare()'],
    ['Cambia Icona', 'tvCtxIcon()'],
    ['Imposta Alias', 'tvCtxAlias()']
  ];
  var html = '';
  items.forEach(function (it) { html += '<button onclick="closeTvContextMenu();' + it[1] + '">' + it[0] + '</button>'; });
  m.innerHTML = html;
  var x = Math.min(ev.clientX || 100, window.innerWidth - 230);
  var y = Math.min(ev.clientY || 100, window.innerHeight - 370);
  m.style.left = Math.max(4, x) + 'px';
  m.style.top = Math.max(4, y) + 'px';
  m.classList.add('show');
}
function closeTvContextMenu() {
  var m = document.getElementById('tvContextMenu');
  if (m) m.classList.remove('show');
}
function tvCtxChannel() { return state.channels.find(function (c) { return c.id === state._tvCtxId; }); }
function tvCtxPlay() { if (tvCtxChannel()) playChannelById(state._tvCtxId); }
function tvCtxPlayWith() { openAdvancedPlayerModal(); }
function tvCtxReplay() {
  var ch = tvCtxChannel(); if (!ch) return;
  var e = tvEpgInfo(ch);
  showToast('Replay: ' + (e.title || ch.name) + ' · ' + (e.start || 'programma precedente'), 'success');
  playChannelById(ch.id);
}
function tvCtxInfo() {
  var ch = tvCtxChannel(); if (!ch) return;
  var e = tvEpgInfo(ch);
  showToast((e.title || ch.name) + ' — ' + (e.desc || 'Nessuna descrizione EPG disponibile.'), 'success');
}
function tvCtxGuide() { var ch = tvCtxChannel(); if (ch) { state.currentChannel = ch; } openQuickMenu('MODE'); }
function tvCtxRecord() {
  var ch = tvCtxChannel(); if (!ch) return;
  playChannelById(ch.id);
  setTimeout(function () { var b = document.getElementById('btnRecord'); if (b) b.click(); }, 1200);
}
function tvCtxShare() {
  var ch = tvCtxChannel(); if (!ch) return;
  if (navigator.clipboard) navigator.clipboard.writeText(ch.url || ch.name).then(function () { showToast('Link copiato negli appunti.', 'success'); }, function () { showToast('Copia non riuscita.', 'error'); });
  else showToast('Condividi: ' + (ch.url || ch.name), 'success');
}
function tvCtxIcon() {
  var ch = tvCtxChannel(); if (!ch) return;
  var url = prompt('Nuovo URL icona per ' + ch.name + ':', ch.logo || '');
  if (url !== null) { ch.logo = url.trim(); saveState(); renderChannelList(); showToast('Icona aggiornata.', 'success'); }
}
function tvCtxAlias() {
  var ch = tvCtxChannel(); if (!ch) return;
  var name = prompt('Nuovo nome per il canale:', ch.name);
  if (name !== null && name.trim()) { ch.name = name.trim(); saveState(); renderChannelList(); showToast('Alias aggiornato.', 'success'); }
}


/* Torna alla lista canali dal player */
function tvBackToList() {
  var v = document.getElementById('videoPlayer');
  if (v) { try { v.pause(); } catch (e) {} }
  var p = document.getElementById('epgPanel');
  if (p) { p.classList.remove('open'); p.style.display = 'none'; }
  document.body.classList.remove('tv-playing');
  var b = state.tvBack;
  if (b && b.view === 'channels' && b.group) {
    state.tvBrowse = b.group;
    state.tvCategory = b.group;
    state.tvType = b.type || 'live';
    state.tvView = 'channels';
  } else if (b && b.view === 'categories' && b.type) {
    state.tvBrowse = b.type;
    state.tvType = b.type;
    state.tvCategory = null;
    state.tvView = 'categories';
  } else {
    state.tvBrowse = state.tvBrowse || 'all';
    state.tvType = null;
    state.tvCategory = null;
    state.tvView = 'channels';
  }
  state.navLevel = 'all';
  state.navType = 'live';
  state.navCategory = state.tvCategory;
  tvClearSearch();
  renderChannelList();
  tvUpdatePlayBar();
  saveState();
  showToast('Torna alla lista canali', 'success');
}

function openAdvancedPlayerModal() {
  var ch = state.currentChannel || tvCtxChannel();
  var n = document.getElementById('advPlayerName');
  if (n && ch) n.value = ch.name || '';
  var p = state.playerProfile || {};
  var setv = function (id, v) { var el = document.getElementById(id); if (el && v !== undefined) el.value = v; };
  setv('advPlayerFormat', p.format || 'default');
  setv('advPlayerSource', p.source || 'Player Predefinito');
  setv('advPlayerSegment', p.segment || '');
  var c1 = document.getElementById('advPlayerProfile'); if (c1) c1.checked = !!p.useProfile;
  var c2 = document.getElementById('advPlayerRecord'); if (c2) c2.checked = !!p.recordPos;
  showModal('advancedPlayerModal');
}
function confirmAdvancedPlayerSettings() {
  var val = function (id) { var el = document.getElementById(id); return el ? el.value : ''; };
  var chk = function (id) { var el = document.getElementById(id); return !!(el && el.checked); };
  state.playerProfile = {
    name: val('advPlayerName'), format: val('advPlayerFormat'), source: val('advPlayerSource'),
    segment: val('advPlayerSegment'), useProfile: chk('advPlayerProfile'), recordPos: chk('advPlayerRecord')
  };
  try { localStorage.setItem('iptvsolution_player_profile', JSON.stringify(state.playerProfile)); } catch (e) {}
  hideModal('advancedPlayerModal');
  showToast('Impostazioni player salvate: ' + (state.playerProfile.source || 'Player Predefinito'), 'success');
}

function updateTvPlayerOverlay(ch) {
  if (!ch) return;
  var e = tvEpgInfo(ch);
  var txt = function (id, v) { var el = document.getElementById(id); if (el) el.textContent = v; };
  txt('tvProgTitle', e.title || ch.name || '');
  txt('tvProgTime', (e.start || '--:--') + ' - ' + (e.stop || '--:--'));
  txt('tvNext', 'A Seguire: ' + (e.next || '-'));
  txt('tvTech', 'Video 1280 x 720 · Codec H264 MPEG-4 AVC (part 10)');
  txt('tvChNum', 'CH ' + (Math.max(0, state.channels.indexOf(ch)) + 1));
  var bar = document.getElementById('tvProgBar');
  if (bar) bar.style.width = e.pct + '%';
  startTvClock();
}
function startTvClock() {
  if (state._tvClockStarted) return;
  state._tvClockStarted = true;
  function tick() {
    var el = document.getElementById('tvClock');
    if (el) el.textContent = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  }
  tick();
  setInterval(tick, 30000);
}
function tvSeek(sec) {
  var v = document.getElementById('videoPlayer');
  if (v && isFinite(v.currentTime)) {
    v.currentTime = Math.max(0, Math.min(v.duration || v.currentTime + sec, v.currentTime + sec));
    showToast((sec > 0 ? '+' : '') + sec + 's', 'success');
  }
}
function tvPlayPause() {
  var v = document.getElementById('videoPlayer');
  if (!v) return;
  if (v.paused) v.play().catch(function () {}); else v.pause();
  var b = document.querySelector('.tv-transport button:nth-child(3)');
  if (b) b.textContent = v.paused ? '▶' : '⏸';
}
function tvStop() {
  var v = document.getElementById('videoPlayer');
  if (v) { v.pause(); try { v.currentTime = 0; } catch (e) {} }
}
function tvSkip(dir) {
  var list = state.channels.filter(function (c) { return !c.type || c.type === 'live'; });
  var idx = list.findIndex(function (c) { return state.currentChannel && c.id === state.currentChannel.id; });
  var next = list[(idx + dir + list.length) % list.length];
  if (next) playChannelById(next.id);
}
function tvPlayerTool(tool) {
  if (tool === 'pip') { var b = document.getElementById('btnPip'); if (b) b.click(); return; }
  if (tool === 'settings') { openAdvancedPlayerModal(); return; }
  if (tool === 'epg') { openFullGuide(); return; }
  if (tool === 'history') { showTvList('RECENT'); return; }
  if (tool === 'search') { var s = document.getElementById('searchChannels'); if (s) s.focus(); return; }
  if (tool === 'info') { state._tvCtxId = state.currentChannel && state.currentChannel.id; tvCtxInfo(); return; }
  if (tool === 'lock') {
    var ui = document.getElementById('tvPlayerUi');
    if (ui) { ui.classList.toggle('locked'); showToast(ui.classList.contains('locked') ? 'Player bloccato' : 'Player sbloccato', 'success'); }
    return;
  }
  showToast('Strumento ' + tool + ' non disponibile in questo browser.', 'warning');
}

function openAdvancedPlaylistModal() {
  showModal('advancedPlaylistModal');
}
function confirmAdvancedPlaylist() {
  var name = (document.getElementById('advName') || {}).value.trim();
  var server = (document.getElementById('advServer') || {}).value.trim().replace(/\/$/, '');
  var user = (document.getElementById('advUser') || {}).value.trim();
  var pass = (document.getElementById('advPass') || {}).value.trim();
  if (!name || !server || !user || !pass) {
    showToast('Compila tutti i campi.', 'error');
    return;
  }
  var fmt = (document.getElementById('advFormat') || {}).value || 'ts';
  var setv = function (id, value) { var el = document.getElementById(id); if (el) el.value = value; };
  setv('xtreamName', name);
  setv('xtreamUrl', server);
  setv('xtreamUser', user);
  setv('xtreamPass', pass);
  state.xtreamFormat = fmt;
  state.xtreamForceLink = !!(document.getElementById('advForceLink') || {}).checked;
  state.xtreamUA = (document.getElementById('advUseUA') || {}).checked ? ((document.getElementById('advUA') || {}).value || 'A') : '';
  hideModal('advancedPlaylistModal');
  handleXtreamSubmit({ preventDefault: function () {}, target: { reset: function () {} } });
}

function openQuickMenu(tab) {
  showModal('quickMenuModal');
  var clock = document.getElementById('qmClock');
  if (clock) clock.textContent = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  setQuickMenuTab(tab || 'MODE');
}
function qmType(t) {
  hideModal('quickMenuModal');
  if (t === 'all') navigateTo('home', null, null); else navigateTo('type', t);
}
function qmGroup(t, g) {
  hideModal('quickMenuModal');
  navigateToCategory(t, g);
}
function qmPlaylist(id) {
  hideModal('quickMenuModal');
  filterByPlaylist(id);
}
function qmSearchResults(value) {
  var box = document.getElementById('qmSearchResults');
  if (!box) return;
  var term = (value || '').trim().toLowerCase();
  if (term.length < 2) { box.innerHTML = ''; return; }
  var found = qmChannels().filter(function (ch) {
    return ((ch.name || '') + ' ' + (ch.group || '')).toLowerCase().indexOf(term) !== -1;
  }).slice(0, 30);
  box.innerHTML = found.map(function (ch) {
    return '<button class="qm-chip" onclick="hideModal(\'quickMenuModal\');playChannelById(\'' + escapeAttr(ch.id) + '\')">' + escapeHtml(ch.name) + '</button>';
  }).join('') || '<p class="hint">Nessun risultato</p>';
}
function qmSearchApply() {
  var input = document.getElementById('qmSearch');
  var value = input ? input.value : '';
  state.searchQuery = value;
  var main = document.getElementById('searchChannels');
  if (main) main.value = value;
  hideModal('quickMenuModal');
  navigateTo('home', null, null);
}

// Modal helpers
function showModal(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.add('active');
    el.style.display = 'flex';
  } else {
    console.error('Modal not found:', id);
  }
}
function hideModal(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.remove('active');
    el.style.display = 'none';
  }
}

// Loading
function showLoading(text = 'Caricamento...') {
  $('#loadingText').textContent = text;
  $('#loadingOverlay').classList.add('active');
}
function hideLoading() { $('#loadingOverlay').classList.remove('active'); }

// Log diagnostico completo (ultimi 300 eventi): stream, errori, azioni utente
const STREAM_LOG_KEY = 'iptv_solution_stream_log';
function safeLogUrl(u) {
  return String(u || '')
    .replace(/:\/\/[^/@\s]+@/i, '://***@')
    .replace(/([?&](?:password|pass|user|username)=)[^&\s]+/gi, '$1***');
}
function logApp(categoria, livello, messaggio, data) {
  const entry = {
    ora: new Date().toISOString().substring(11, 23),
    categoria: categoria,
    livello: livello,
    evento: messaggio,
    canale: (state.currentChannel && state.currentChannel.name) || '-',
    playlist: getPlaylistLabel(),
    dettaglio: data || {}
  };
  state.streamLog.push(entry);
  if (state.streamLog.length > 300) state.streamLog.shift();
  try { localStorage.setItem(STREAM_LOG_KEY, JSON.stringify(state.streamLog.slice(-200))); } catch (e) {}
}
function logStream(event, data) { logApp('STREAM', 'INFO', event, data); }

// ===== Versione e aggiornamento (manifest centrale IP-TVSOLUTION) =====
const UPDATE_MANIFEST_URL = 'https://download.ip-tvsolution.online/IP-TVSOLUTION-Manifest.json';

function setVersionBadge(testo) {
  const el = document.getElementById('versionBadge');
  if (el) el.textContent = testo;
}
function updatePlatformKey() {
  var p = (typeof detectPlatform === 'function') ? detectPlatform() : 'Web';
  if (/android/i.test(p)) return 'android';
  if (/iphone|ipad|ipod/i.test(p)) return 'iphone';
  if (/smart tv|tizen|webos/i.test(p)) return 'smart-tv';
  if (/windows|win32/i.test(p)) return 'windows';
  if (/chrome/i.test(p)) return 'chrome';
  return 'web';
}
function versionNumber(s) {
  var n = String(s || '').match(/\d+/g);
  return n ? parseInt(n.join(''), 10) : 0;
}
function isNewerVersion(a, b) {
  return versionNumber(a) > versionNumber(b);
}
function platformLabel(k) {
  return ({ web: 'Web / App', chrome: 'Chrome ZIP', windows: 'Windows',
    android: 'Android', 'smart-tv': 'Smart TV (LG/Samsung)', iphone: 'iPhone PWA' })[k] || k;
}
function renderUpdateInfo(m, key) {
  var p = (m.platforms || {})[key] || (m.platforms || {}).web || {};
  var latest = p.version || m.version || WEB_VERSION;
  var rows = Object.keys(m.platforms || {}).map(function (k) {
    var q = m.platforms[k];
    return '<div style="display:flex;gap:8px;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid var(--line);">' +
      '<span>' + escapeHtml(platformLabel(k)) + (k === key ? ' <b style="color:var(--accent);">(questa)</b>' : '') + '</span>' +
      '<b>' + escapeHtml(q.version || '') + '</b></div>';
  }).join('');
  return '<p class="hint">Versione installata: <b>' + escapeHtml(WEB_VERSION) + '</b><br>' +
    'Ultima pubblicata: <b>' + escapeHtml(latest) + '</b><br>' +
    'Verifica: ' + escapeHtml(new Date().toLocaleString('it-IT')) + '</p>' + rows;
}
async function checkVersion(showPanel) {
  setVersionBadge('v' + WEB_VERSION);
  var key = updatePlatformKey();
  var info = document.getElementById('serverInfo');
  var panel = document.getElementById('updateInfo');
  if (info) info.textContent = 'IP-TVSOLUTION ' + WEB_VERSION + ' | ' + key;
  if (panel && showPanel) panel.innerHTML = '<p class="hint">Verifica aggiornamenti in corso...</p>';
  try {
    var r = await fetch(UPDATE_MANIFEST_URL, { cache: 'no-store' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    var m = await r.json();
    var p = (m.platforms || {})[key] || (m.platforms || {}).web || {};
    var latest = p.version || m.version || WEB_VERSION;
    state.updateInfo = { current: WEB_VERSION, latest: latest, platform: key, manifest: m, checked: Date.now() };
    if (info) info.textContent = 'IP-TVSOLUTION ' + WEB_VERSION + ' | ' + key + ' | disponibile ' + latest;
    if (panel) panel.innerHTML = renderUpdateInfo(m, key);
    setVersionBadge('v' + WEB_VERSION + (isNewerVersion(latest, WEB_VERSION) ? ' *' : ''));
    if (isNewerVersion(latest, WEB_VERSION)) {
      var banner = document.getElementById('updateBanner');
      var txt = document.getElementById('updateBannerText');
      if (banner && txt) {
        txt.textContent = 'Aggiornamento disponibile: ' + platformLabel(key) + ' ' + latest + ' (installata ' + WEB_VERSION + ')';
        banner.style.display = 'flex';
      }
    }
    logApp('APP', 'INFO', 'Info aggiornamento', { piattaforma: key, installata: WEB_VERSION, disponibile: latest });
    return m;
  } catch (e) {
    if (panel) panel.innerHTML = '<p class="hint">Offline: versione installata ' + escapeHtml(WEB_VERSION) + '. Usa "Controlla aggiornamenti" per riprovare.</p>';
    return null;
  }
}
async function applyUpdate() {
  var m = (state.updateInfo && state.updateInfo.manifest) || await checkVersion(true);
  if (!m) { showToast('Manifest aggiornamenti non raggiungibile.', 'error'); return; }
  var key = updatePlatformKey();
  var p = (m.platforms || {})[key] || (m.platforms || {}).web || {};
  if (key === 'web' || key === 'chrome' || key === 'iphone') {
    var url = p.url || (location.pathname + '?v=' + (p.build || Date.now()));
    showToast('Aggiornamento app: ricaricamento in corso...', 'warning');
    logApp('UPDATE', 'INFO', 'Aggiornamento app web', { versione: p.version || m.version });
    location.href = url;
    return;
  }
  var target = '';
  if (key === 'android') target = p.apk || m.apkUrl || '';
  else if (key === 'smart-tv') target = p.lg || p.samsung || p.download || '';
  else target = p.download || p.portable || '';
  if (target) {
    showToast('Download aggiornamento avviato. Installa il pacchetto quando richiesto.', 'warning');
    logApp('UPDATE', 'INFO', 'Download aggiornamento app', { piattaforma: key, versione: p.version || m.version });
    window.open(target, '_blank', 'noopener');
  } else showToast('Nessun link di aggiornamento per questa piattaforma.', 'warning');
}
function dismissUpdateBanner() {
  var b = document.getElementById('updateBanner'); if (b) b.style.display = 'none';
}

function loadStreamLog() {
  try { state.streamLog = JSON.parse(localStorage.getItem(STREAM_LOG_KEY) || '[]'); } catch (e) { state.streamLog = []; }
}

// Etichetta della playlist attiva (per capire sempre quale sorgente sta dando errori)
function getPlaylistLabel() {
  if (!state.activePlaylist || state.activePlaylist === 'all') return 'Tutte le playlist';
  const src = state.sources.find(s => s.id === state.activePlaylist);
  return src ? src.name : 'Sorgente sconosciuta';
}
function getSourceLabel() {
  const ch = state.currentChannel || {};
  const src = state.sources.find(s => s.id === ch.sourceId);
  return src ? src.name : getPlaylistLabel();
}
function contextLabel() {
  const name = (state.currentChannel && state.currentChannel.name) || 'Canale sconosciuto';
  const src = getSourceLabel();
  return name + ' · 📋 ' + src;
}

// Toast
function showToast(msg, type = '') {
  const toast = $('#toast');
  let text = msg;
  if (type === 'error') logApp('ERRORE', 'ERROR', msg);
  // Aggiunge sempre il contesto agli errori di riproduzione
  if (type === 'error' && state.currentChannel && !msg.includes('📋')) {
    text = msg + ' · ' + contextLabel();
  }
  toast.textContent = text;
  toast.className = `toast show ${type}`;
  setTimeout(() => toast.classList.remove('show'), 4000);
}

// ===== Parental Control PIN =====
const PIN_STORAGE_KEY = 'iptv_solution_pin';

function hashPin(pin) {
  let h = 5381;
  const s = String(pin || '');
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  }
  return 'h' + (h >>> 0).toString(36) + '.' + s.length;
}

function getPinState() {
  try {
    const saved = JSON.parse(localStorage.getItem(PIN_STORAGE_KEY) || '{}');
    return {
      enabled: !!saved.enabled,
      pinHash: saved.pinHash || '',
      failedAttempts: saved.failedAttempts || 0,
      lockUntil: saved.lockUntil || 0
    };
  } catch (e) {
    return { enabled: false, pinHash: '', failedAttempts: 0, lockUntil: 0 };
  }
}

function savePinState(d) {
  const state = d || getPinState();
  try {
    localStorage.setItem(PIN_STORAGE_KEY, JSON.stringify({
      enabled: state.enabled,
      pinHash: state.pinHash,
      failedAttempts: state.failedAttempts,
      lockUntil: state.lockUntil
    }));
  } catch (e) { console.error('Save pin error:', e); }
}

function pinLockEnabled() { return !!getPinState().enabled; }

function isPinLockedNow() { const d = getPinState(); return Date.now() < d.lockUntil; }

function lockPinNow() {
  const d = getPinState();
  d.failedAttempts = (d.failedAttempts || 0) + 1;
  if (d.failedAttempts >= 3) {
    d.lockUntil = Date.now() + 30000;
    d.failedAttempts = 0;
  }
  savePinState(d);
  return Date.now() < d.lockUntil;
}

function showPinModal(onSuccess) {
  const modal = $('#pinModal');
  const errEl = $('#pinModalError');
  const lockEl = $('#pinModalLock');
  const input = $('#pinInput');
  if (input) input.value = '';
  if (errEl) { errEl.style.display = 'none'; errEl.textContent = ''; }
  if (lockEl) { lockEl.style.display = 'none'; lockEl.textContent = ''; }
  if (modal) modal.classList.add('active');
  setTimeout(() => { if (input) input.focus(); }, 50);
  window._pinOnSuccess = onSuccess;
}

function hidePinModal() {
  const modal = $('#pinModal');
  if (modal) modal.classList.remove('active');
  window._pinOnSuccess = null;
}

function submitPin() {
  const modal = $('#pinModal');
  const errEl = $('#pinModalError');
  const lockEl = $('#pinModalLock');
  const d = getPinState();
  if (Date.now() < d.lockUntil) {
    const waitSec = Math.ceil((d.lockUntil - Date.now()) / 1000);
    if (lockEl) { lockEl.style.display = 'block'; lockEl.textContent = 'Blocco attivo. Riprova tra ' + waitSec + ' secondi.'; }
    return;
  }
  const input = $('#pinInput');
  const pin = (input ? input.value : '').trim();
  if (hashPin(pin) === d.pinHash) {
    d.failedAttempts = 0;
    d.lockUntil = 0;
    savePinState(d);
    const cb = window._pinOnSuccess;
    window._pinOnSuccess = null;
    hidePinModal();
    if (typeof cb === 'function') cb();
    return;
  }
  const locked = lockPinNow();
  logApp('PIN', 'WARN', 'PIN errato', { bloccato: locked, tentativi: d.failedAttempts || 0 });
  if (errEl) { errEl.style.display = 'block'; errEl.textContent = locked ? 'PIN errato. Blocco per 30 secondi.' : 'PIN errato.'; }
  if (input) { input.value = ''; input.focus(); }
  if (locked) showToast('Troppi tentativi di PIN. Riprova tra 30 secondi.', 'error');
}

function setParentalPin(pin) {
  const d = getPinState();
  d.enabled = true;
  d.pinHash = hashPin(pin);
  d.failedAttempts = 0;
  d.lockUntil = 0;
  savePinState(d);
  const cb = window._pinOnSuccess;
  window._pinOnSuccess = null;
  if (typeof cb === 'function') cb();
}

function disableParentalPin() {
  const d = getPinState();
  d.enabled = false;
  d.pinHash = '';
  d.failedAttempts = 0;
  d.lockUntil = 0;
  savePinState(d);
  const hint = document.getElementById('pinStatusHint');
  if (hint) hint.textContent = 'Nessun PIN configurato: la riproduzione di tutti i canali richiederà il PIN.';
}

function savePinFromSettings() {
  const pin = ($('#settingPinInput').value || '').trim();
  const confirm = ($('#settingPinConfirm').value || '').trim();
  if (pin.length < 4) { showToast('Il PIN deve avere almeno 4 cifre.', 'error'); return; }
  if (pin !== confirm) { showToast('Le due password non coincidono.', 'error'); return; }
  setParentalPin(pin);
  const group = document.getElementById('pinSetupGroup');
  if (group) group.style.display = 'block';
  const hint = document.getElementById('pinStatusHint');
  if (hint) hint.textContent = 'PIN attivo: la riproduzione di tutti i canali richiederà il PIN.';
  showToast('PIN controllo parentale salvato.', 'success');
  $('#settingPinInput').value = '';
  $('#settingPinConfirm').value = '';
}

// ===== Recording (web) =====
function formatBytesSafe(b) {
  if (!b || b < 0) return '0 B';
  if (b < 1024) return b + ' B';
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
  if (b < 1024 * 1024 * 1024) return (b / (1024 * 1024)).toFixed(1) + ' MB';
  return (b / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

function startRecording() {
  const video = $('#videoPlayer');
  if (!video.src && !video.currentSrc) { showToast('Avvia la riproduzione prima di registrare.', 'error'); return; }
  if (state.recording && state.recording.active) { stopRecording(); return; }
  let stream = null;
  try { stream = video.captureStream ? video.captureStream(30) : null; } catch (e) { stream = null; }
  if (!stream) { showToast('Registrazione non supportata da questo browser.', 'error'); return; }
  const mime = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find(m => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)) || '';
  let rec;
  try { rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined); } catch (e) { showToast('Impossibile avviare la registrazione.', 'error'); return; }
  const chunks = [];
  state.recording = { active: true, startTs: Date.now(), chunks: chunks, rec: rec };
  rec.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunks.push(e.data); };
  rec.onstop = () => { finalizeRecording({ kind: 'manual', title: (state.currentChannel && state.currentChannel.name) || 'Registrazione' }); };
  try { rec.start(1000); } catch (e) { showToast('Errore avvio registrazione: ' + e.message, 'error'); state.recording = null; return; }
  const btn = $('#btnRecord');
  if (btn) { btn.classList.add('recording'); btn.textContent = '■'; btn.title = 'Stop registrazione'; }
  showToast('Registrazione avviata.', 'success');
}

function stopRecording() {
  if (!state.recording || !state.recording.active) return;
  state.recording.active = false;
  const rec = state.recording.rec;
  const btn = $('#btnRecord');
  if (btn) { btn.classList.remove('recording'); btn.textContent = '⏺'; btn.title = 'Registra'; }
  if (rec && typeof rec.stop === 'function') { try { rec.stop(); } catch (e) {} }
}

function toggleRecording() {
  if (state.recording && state.recording.active) { stopRecording(); }
  else { startRecording(); }
}

async function saveCurrentRecording() {
  if (!state.recordings || state.recordings.length === 0) { showToast('Nessuna registrazione disponibile da salvare.', 'error'); return; }
  const r = state.recordings[0];
  await downloadRecording(r.id);
}

function addRecording(r) {
  state.recordings.unshift(r);
  saveRecordingState();
  renderRecordings();
  showToast('Registrazione salvata (' + formatBytesSafe(r.size) + ').', 'success');
}

function deleteRecording(id) {
  state.recordings = state.recordings.filter(r => r.id !== id);
  saveRecordingState();
  renderRecordings();
}

function renderRecordings() {
  const list = $('#recordingsList');
  if (!list) return;
  if (state.recordings.length === 0) { list.innerHTML = '<p class="hint">Nessuna registrazione. Premi ⏺ nel player per avviare.</p>'; return; }
  list.innerHTML = state.recordings.map(r => `
    <div class="saved-source" style="flex-direction:row;align-items:center;gap:10px;">
      <div style="flex:1;min-width:0;">
        <div class="saved-source-name">${escapeHtml(r.title)}</div>
        <div class="saved-source-type">${new Date(r.startTs).toLocaleString()} · ${formatBytesSafe(r.size)}</div>
      </div>
      <button class="btn btn-secondary" style="font-size:12px;padding:4px 8px;" onclick="playRecording('${r.id}')">▶ Play</button>
      <button class="btn btn-secondary" style="font-size:12px;padding:4px 8px;" onclick="downloadRecording('${r.id}')">💾</button>
      <button class="btn btn-danger" style="font-size:12px;padding:4px 8px;" onclick="deleteRecording('${r.id}')">✕</button>
    </div>
  `).join('');
}

// ===== Visualizzazione / download del log stream =====
function renderStreamLog() {
  const el = document.getElementById('streamLogContent');
  if (!el) return;
  const lines = (state.streamLog || []).map(e => {
    const d = Object.keys(e.dettaglio || {}).map(k => k + '=' + e.dettaglio[k]).join(' ');
    return e.ora + ' | ' + String(e.categoria || 'LOG').padEnd(9) + ' | ' + String(e.livello || 'INFO').padEnd(5)
      + ' | ' + String(e.evento).padEnd(20) + ' | ' + e.canale + ' | ' + e.playlist + (d ? ' | ' + d : '');
  });
  el.textContent = lines.length ? lines.join('\n') : 'Nessun evento registrato. Riproduci un canale per generare il log.';
}
function openStreamLog() { renderStreamLog(); showModal('streamLogModal'); }
async function showServerLog() {
  const el = document.getElementById('streamLogContent');
  if (!el) return;
  if (location.protocol !== 'http:') {
    showToast('Log server disponibile solo con il server Windows avviato.', 'warning');
    return;
  }
  try {
    const r = await fetch('/api/log', { cache: 'no-store' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    el.textContent = await r.text();
    logApp('LOG', 'INFO', 'Log server caricato');
  } catch (e) { showToast('Log server non disponibile: ' + e.message, 'error'); }
}
function downloadStreamLog() {
  const testo = (state.streamLog || []).map(e => JSON.stringify(e)).join('\n');
  const blob = new Blob([testo], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'iptv-stream-log-' + new Date().toISOString().replace(/[:.]/g, '-') + '.txt';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
function clearStreamLog() {
  state.streamLog = [];
  try { localStorage.removeItem(STREAM_LOG_KEY); } catch (e) {}
  renderStreamLog();
  showToast('Log cancellato.', 'success');
}

// ===== Destinazione salvataggio registrazioni (interno / USB / cloud-NAS) =====
function loadSaveConfig() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}');
    state.saveDestination = saved.destination || 'internal';
    state.saveConfig = Object.assign({ cloudUrl: '', cloudUser: '', cloudPass: '', usbFolderName: '' }, saved.config || {});
    window._usbDirName = state.saveConfig.usbFolderName || '';
  } catch (e) {}
}
function saveSaveConfig() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify({ destination: state.saveDestination, config: state.saveConfig })); } catch (e) {}
}
function setSaveDestination(dest) {
  state.saveDestination = dest;
  logApp('REC', 'INFO', 'Destinazione registrazione', { destinazione: dest });
  saveSaveConfig();
  updateSaveDestinationUI();
  const labels = { internal: 'Disco interno', usb: 'Chiavetta USB', cloud: 'Cloud / NAS' };
  showToast('Destinazione: ' + (labels[dest] || dest), 'success');
}
function updateSaveDestinationUI() {
  $$('.save-dest').forEach(b => {
    const active = b.dataset.dest === state.saveDestination;
    b.style.background = active ? 'var(--accent)' : 'var(--bg3)';
    b.style.color = active ? 'white' : 'var(--text)';
    b.style.borderColor = active ? 'var(--accent)' : 'var(--border)';
  });
  const usb = document.getElementById('destUsbInfo');
  if (usb) usb.style.display = state.saveDestination === 'usb' ? 'block' : 'none';
  const cloud = document.getElementById('destCloudConfig');
  if (cloud) cloud.style.display = state.saveDestination === 'cloud' ? 'block' : 'none';
  const cu = document.getElementById('cloudUrl'); if (cu) cu.value = state.saveConfig.cloudUrl || '';
  const cUser = document.getElementById('cloudUser'); if (cUser) cUser.value = state.saveConfig.cloudUser || '';
  const cp = document.getElementById('cloudPass'); if (cp) cp.value = state.saveConfig.cloudPass || '';
  const fn = document.getElementById('usbFolderName');
  if (fn) fn.textContent = state.saveConfig.usbFolderName ? ('Cartella: ' + state.saveConfig.usbFolderName) : '';
}
function getUsbDirHandle() {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open('iptv_solution_files', 1);
      req.onupgradeneeded = () => { req.result.createObjectStore('handles'); };
      req.onsuccess = () => {
        try {
          const g = req.result.transaction('handles', 'readonly').objectStore('handles').get('usbDir');
          g.onsuccess = () => resolve(g.result || null);
          g.onerror = () => resolve(null);
        } catch (e) { resolve(null); }
      };
      req.onerror = () => resolve(null);
    } catch (e) { resolve(null); }
  });
}
function setUsbDirHandle(handle) {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open('iptv_solution_files', 1);
      req.onupgradeneeded = () => { req.result.createObjectStore('handles'); };
      req.onsuccess = () => {
        const tx = req.result.transaction('handles', 'readwrite');
        tx.objectStore('handles').put(handle, 'usbDir');
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      };
      req.onerror = () => resolve(false);
    } catch (e) { resolve(false); }
  });
}
async function pickUsbFolder() {
  if (!window.showDirectoryPicker) { showToast('Questo browser non supporta la scelta della cartella. Usa Chrome o Edge.', 'error'); return; }
  try {
    const handle = await window.showDirectoryPicker();
    await setUsbDirHandle(handle);
    state.saveConfig.usbFolderName = handle.name;
    saveSaveConfig();
    updateSaveDestinationUI();
    showToast('Cartella USB selezionata: ' + handle.name, 'success');
  } catch (e) { /* annullato dall'utente */ }
}
async function ensureUsbPermission(handle) {
  try {
    let p = await handle.queryPermission({ mode: 'readwrite' });
    if (p === 'granted') return true;
    if (handle.requestPermission) {
      p = await handle.requestPermission({ mode: 'readwrite' });
      return p === 'granted';
    }
  } catch (e) {}
  return false;
}
function downloadBlob(blob, fileName) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
async function uploadToCloud(blob, fileName) {
  const cfg = state.saveConfig;
  if (!cfg.cloudUrl) return false;
  const url = cfg.cloudUrl.replace(/\/$/, '') + '/' + encodeURIComponent(fileName);
  const headers = { 'Content-Type': blob.type || 'video/webm' };
  if (cfg.cloudUser || cfg.cloudPass) {
    headers['Authorization'] = 'Basic ' + btoa((cfg.cloudUser || '') + ':' + (cfg.cloudPass || ''));
  }
  showToast('Caricamento su cloud/NAS...', 'warning');
  try {
    const resp = await fetch(url, { method: 'PUT', headers: headers, body: blob });
    if (resp.ok) { showToast('Registrazione caricata su cloud/NAS.', 'success'); return true; }
    showToast('Caricamento cloud fallito (HTTP ' + resp.status + ').', 'error');
  } catch (e) {
    showToast('Cloud non raggiungibile: ' + e.message + '. Controlla URL e CORS.', 'error');
  }
  return false;
}
async function downloadRecording(id) {
  const r = state.recordings.find(x => x.id === id);
  if (!r) return;
  logApp('REC', 'INFO', 'Salvataggio registrazione', {
    titolo: r.title, destinazione: state.saveDestination, byte: r.size || 0
  });
  const blob = new Blob(r.chunks || [], { type: r.mimeType || 'video/webm' });
  const safeTitle = (r.title || 'registrazione').replace(/[^a-zA-Z0-9À-ÿ \-]/g, '_');
  const fileName = safeTitle + '-' + new Date(r.startTs).toISOString().replace(/[:.]/g, '-') + '.webm';

  if (state.saveDestination === 'usb') {
    const handle = await getUsbDirHandle();
    if (handle && await ensureUsbPermission(handle)) {
      try {
        const fh = await handle.getFileHandle(fileName, { create: true });
        const w = await fh.createWritable();
        await w.write(blob);
        await w.close();
        showToast('Salvato su USB (' + handle.name + '): ' + fileName, 'success');
        return;
      } catch (e) { showToast('Errore salvataggio USB: ' + e.message, 'error'); }
    }
    if (window.showSaveFilePicker) {
      try {
        const fh = await window.showSaveFilePicker({ suggestedName: fileName, types: [{ description: 'Video WebM', accept: { 'video/webm': ['.webm'] } }] });
        const w = await fh.createWritable();
        await w.write(blob);
        await w.close();
        showToast('Salvato su: ' + fh.name, 'success');
        return;
      } catch (e) { /* annullato */ }
    }
    showToast('Nessuna cartella USB selezionata: salvataggio locale.', 'warning');
  }

  if (state.saveDestination === 'cloud') {
    if (await uploadToCloud(blob, fileName)) return;
    showToast('Cloud non disponibile: salvataggio locale.', 'warning');
  }

  downloadBlob(blob, fileName);
}

function playRecording(id) {
  const r = state.recordings.find(x => x.id === id);
  if (!r) return;
  hideModal('recordingsModal');
  const video = $('#videoPlayer');
  video.src = r.url;
  video.load();
  video.play().catch(err => { showToast('Impossibile riprodurre la registrazione: ' + err.message, 'error'); });
}

function saveRecordingState() {
  try {
    const meta = state.recordings.map(r => ({ id: r.id, title: r.title, startTs: r.startTs, durationMs: r.durationMs, size: r.size }));
    localStorage.setItem('iptv_solution_recordings', JSON.stringify(meta));
  } catch (e) {}
}

function finalizeRecording(sourceInfo) {
  state.recording.active = false;
  const rec = state.recording ? state.recording.rec : null;
  const btn = $('#btnRecord');
  if (btn) { btn.classList.remove('recording'); btn.textContent = '⏺'; btn.title = 'Registra'; }
  const startTs = state.recording ? state.recording.startTs : Date.now();
  const chunks = (state.recording && state.recording.chunks) || [];
  const blob = new Blob(chunks, { type: 'video/webm' });
  const url = URL.createObjectURL(blob);
  addRecording({
    id: 'rec_' + Date.now(),
    title: sourceInfo.title || 'Registrazione',
    startTs: startTs,
    durationMs: Date.now() - startTs,
    size: blob.size,
    url: url,
    mimeType: blob.type || 'video/webm',
    chunks: chunks
  });
  if (sourceInfo && sourceInfo.kind === 'scheduled' && sourceInfo.scheduledId) {
    state.scheduledRecordings.forEach(s => { if (s.id === sourceInfo.scheduledId) s.status = 'done'; });
    saveScheduledState();
    renderScheduled();
  }
}

// ===== Scheduled recordings (web) =====
const SCHED_KEY = 'iptv_solution_scheduled';
function saveScheduledState() {
  try {
    localStorage.setItem(SCHED_KEY, JSON.stringify(state.scheduledRecordings.map(s => ({ id: s.id, title: s.title, streamUrl: s.streamUrl, startTs: s.startTs, durationMs: s.durationMs, status: s.status }))));
  } catch (e) {}
}
function scheduleRecording(title, streamUrl, startTs, durationMs) {
  state.scheduledRecordings.unshift({ id: 'sched_' + Date.now(), title: title || 'Registrazione', streamUrl: streamUrl, startTs: startTs, durationMs: durationMs, status: 'scheduled' });
  saveScheduledState();
  renderScheduled();
  showToast('Registrazione programmata.', 'success');
}
function cancelScheduled(id) {
  state.scheduledRecordings = state.scheduledRecordings.filter(s => s.id !== id);
  saveScheduledState();
  renderScheduled();
}
function renderScheduled() {
  const list = $('#scheduledList');
  if (!list) return;
  if (state.scheduledRecordings.length === 0) { list.innerHTML = '<p class="hint">Nessuna registrazione programmata.</p>'; return; }
  list.innerHTML = state.scheduledRecordings.map(s => `
    <div class="saved-source" style="flex-direction:row;align-items:center;gap:10px;">
      <div style="flex:1;min-width:0;">
        <div class="saved-source-name">${escapeHtml(s.title)}</div>
        <div class="saved-source-type">${new Date(s.startTs).toLocaleString()} · tra ${Math.round(s.durationMs / 60000)} min · ${s.status}</div>
      </div>
      <button class="btn btn-danger" style="font-size:12px;padding:4px 8px;" onclick="cancelScheduled('${s.id}')">✕</button>
    </div>
  `).join('');
}
function startScheduledRecording(s) {
  if (state.recording && state.recording.active) return;
  const video = $('#videoPlayer');
  state.recording = { active: true, startTs: Date.now(), chunks: [], rec: null, sourceInfo: { kind: 'scheduled', scheduledId: s.id, title: s.title } };
  const btn = $('#btnRecord');
  if (btn) { btn.classList.add('recording'); btn.textContent = '■'; btn.title = 'Stop registrazione'; }
  const resetRecBtn = () => { const b = $('#btnRecord'); if (b) { b.classList.remove('recording'); b.textContent = '⏺'; b.title = 'Registra'; } };
  video.src = s.streamUrl;
  video.load();
  const start = () => {
    let stream = null;
    try { stream = video.captureStream ? video.captureStream(30) : null; } catch (e) { stream = null; }
    if (!stream) { resetRecBtn(); state.recording.active = false; return; }
    const mime = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find(m => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)) || '';
    let rec;
    try { rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined); } catch (e) { resetRecBtn(); state.recording.active = false; return; }
    const chunks = [];
    state.recording.rec = rec;
    rec.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunks.push(e.data); };
    rec.onstop = () => { finalizeRecording({ kind: 'scheduled', scheduledId: s.id, title: s.title }); };
    try { rec.start(1000); } catch (e) { resetRecBtn(); state.recording.active = false; return; }
  };
  const onCanPlay = () => { video.removeEventListener('canplay', onCanPlay); video.removeEventListener('error', onErr); start(); };
  const onErr = () => { video.removeEventListener('canplay', onCanPlay); video.removeEventListener('error', onErr); resetRecBtn(); state.recording.active = false; showToast('Impossibile avviare la registrazione: riproduzione non disponibile.', 'error'); };
  video.addEventListener('canplay', onCanPlay);
  video.addEventListener('error', onErr);
  video.play().catch(err => { video.removeEventListener('canplay', onCanPlay); video.removeEventListener('error', onErr); resetRecBtn(); state.recording.active = false; showToast('Impossibile avviare la registrazione: ' + err.message, 'error'); });
}
function checkScheduledRecordings() {
  const now = Date.now();
  state.scheduledRecordings.forEach(s => {
    if (s.status === 'scheduled' && now >= s.startTs) {
      if (!(state.recording && state.recording.active && state.recording.sourceInfo && state.recording.sourceInfo.kind === 'scheduled' && state.recording.sourceInfo.scheduledId === s.id)) {
        startScheduledRecording(s);
      }
    }
  });
}
function saveScheduleFromForm() {
  const title = ($('#schedTitle').value || '').trim() || 'Registrazione';
  const streamUrl = ($('#schedUrl').value || '').trim();
  const startEl = document.getElementById('schedStart');
  const dur = parseInt(($('#schedDuration').value || '60'), 10) || 60;
  if (!streamUrl) { showToast('Inserisci l\'URL dello stream.', 'error'); return; }
  if (!startEl || !startEl.value) { showToast('Scegli data e ora.', 'error'); return; }
  const startTs = new Date(startEl.value).getTime();
  if (isNaN(startTs)) { showToast('Data non valida.', 'error'); return; }
  scheduleRecording(title, streamUrl, startTs, dur * 60 * 1000);
  const schedTitle = document.getElementById('schedTitle');
  const schedUrl = document.getElementById('schedUrl');
  const schedDur = document.getElementById('schedDuration');
  if (schedTitle) schedTitle.value = '';
  if (schedUrl) schedUrl.value = '';
  if (schedDur) schedDur.value = '60';
  const schedStart = document.getElementById('schedStart');
  if (schedStart) schedStart.value = '';
}

// Detect channel type from name, group, url
// Cache for extractSeriesName
const _seriesNameCache = {};

// Extract series name from channel name
function extractSeriesName(name) {
  if (!name) return 'Serie sconosciuta';
  if (_seriesNameCache[name]) return _seriesNameCache[name];
  const original = name;
  let seriesName = name
    .replace(/\s*S\d+\s*E\d+.*$/i, '')
    .replace(/\s*Stagione\s*\d+.*$/i, '')
    .replace(/\s*Season\s*\d+.*$/i, '')
    .replace(/\s*Episodio\s*\d+.*$/i, '')
    .replace(/\s*Episode\s*\d+.*$/i, '')
    .replace(/\s*E\d+.*$/i, '')
    .replace(/\s*-\s*\d+x\d+.*$/i, '')
    .replace(/\.S\d+\.E\d+.*$/i, '')
    .trim();
  let result = original;
  if (seriesName !== original && seriesName.length > 0) result = seriesName;
  else {
    const seMatch = original.match(/^(.*?)[\s._-]+(?:S\d+|Stagione|Season|Episodio|Episode|\d+x\d+)/i);
    if (seMatch && seMatch[1] && seMatch[1].trim().length > 1) {
      result = seMatch[1].trim();
    }
  }
  _seriesNameCache[name] = result;
  return result;
}

// Group series by common prefix (for M3U where series name is followed by episode title)
function groupSeriesByPrefix(channels) {
  if (channels.length < 2) return null;
  
  const lowerNames = channels.map(c => (c.name || '').toLowerCase());
  const groups = {};
  
  for (let i = 0; i < channels.length; i++) {
    const name = channels[i].name || '';
    const words = name.split(/\s+/);
    let bestPrefix = '';
    
    for (let w = words.length - 1; w >= 1; w--) {
      const prefix = words.slice(0, w).join(' ');
      if (prefix.length < 2) break;
      const prefixLower = prefix.toLowerCase();
      
      let count = 0;
      for (let j = 0; j < lowerNames.length; j++) {
        if (lowerNames[j].startsWith(prefixLower + ' ') || lowerNames[j] === prefixLower) {
          count++;
          if (count >= 2) break;
        }
      }
      if (count >= 2) {
        bestPrefix = prefix;
        break;
      }
    }
    
    if (bestPrefix) {
      bestPrefix = bestPrefix.replace(/\s+(Episodio|Episode|S\d+|E\d+|Stagione|Season)\s*$/i, '').trim();
    }
    
    const key = bestPrefix || name || 'Serie sconosciuta';
    if (!groups[key]) groups[key] = [];
    groups[key].push(channels[i]);
  }
  
  const result = {};
  Object.keys(groups).forEach(k => {
    if (groups[k].length > 0) result[k] = groups[k];
  });
  return result;
}
function detectChannelType(name, group, url, attrs) {
  const text = ((name || '') + ' ' + (group || '') + ' ' + (url || '')).toLowerCase();
  const g = (group || '').toLowerCase();
  const u = (url || '').toLowerCase();
  const a = attrs || {};

  // PRIORITY 1: type attribute (IPTV Extreme / OTT Navigator standard)
  if (a.type === 'movie') return 'vod';
  if (a.type === 'series') return 'series';
  if (a.type === 'radio') return 'live';

  // PRIORITY 2: tvg-season/tvg-episode (series episode)
  if (a['tvg-season'] || a['tvg-episode']) return 'series';

  // PRIORITY 3: tvg-serie (groups episodes into a series)
  if (a['tvg-serie']) return 'series';

  // PRIORITY 4: URL path (Xtream Codes M3U Plus - most reliable)
  if (/\/movie\//i.test(u)) return 'vod';
  if (/\/series\//i.test(u)) return 'series';
  if (/\/live\//i.test(u)) return 'live';

  // PRIORITY 5: Series name patterns (prima dell'estensione: le serie Xtream usano spesso .ts/.m3u8)
  if (/\bS\d+\s*E\d+\b/i.test(name || '') || /\bStagione\s*\d+/i.test(name || '') || /\bSeason\s*\d+/i.test(name || '') || /\b\d+x\d+\b/i.test(name || '')) return 'series';

  // PRIORITY 6: Country prefix (es. "IT | Cinema") = canale LIVE
  if (/^[a-z]{2}\s*\|/i.test(group || '')) return 'live';

  // PRIORITY 7: Group title analysis (prima dell'estensione: i VOD M3U Plus usano spesso .ts)
  const movieGenres = /\b(azione|thriller|commedia|dramma|fantascienza|horror|romance|romantico|storico|documentario|avventura|supereroi|superhero|fantasy|musical|western|guerra|war|animazione|animation|crime|crimine|mystery|mistero|noir|biografico|biography|sportivo|sport|natale|christmas|xmas|drammatico|storico|biography)\b/i;
  const vodKeywords = /\b(vod|movie|film|cinema|movies|on.?demand|on.?request|saga|netflix|adult|xxx|18\+)\b/i;
  if (movieGenres.test(g) || vodKeywords.test(g)) return 'vod';

  // Series keywords (senza prefisso paese e senza parole "live")
  if (/\b(serie|series|stagione|season|tv.?show|tv.?series)\b/.test(g) && !/\b(live|canal|channel)\b/.test(g)) return 'series';

  // PRIORITY 8: File extension (video files = VOD, stream files = Live)
  if (/\.(mp4|mkv|avi|mov|wmv|flv|webm)(\?|$)/i.test(u)) return 'vod';
  if (/\.(ts|m3u8)(\?|$)/i.test(u)) return 'live';

  // PRIORITY 9: Full text - only very explicit keywords
  if (/\b(vod|on.?demand|on.?request)\b/.test(text)) return 'vod';

  // Default: live (most IPTV channels are live TV, not VOD)
  return 'live';
}

// M3U Parser
function parseM3u(text) {
  const lines = text.split(/\r?\n/);
  const channels = [];
  let current = null;
  let attrs = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#EXTINF:')) {
      const info = trimmed.substring(8);
      attrs = {};
      const attrRegex = /(\w+(?:-\w+)*)="([^"]*)"/g;
      let m;
      while ((m = attrRegex.exec(info)) !== null) attrs[m[1]] = m[2];
      const commaIdx = info.lastIndexOf(',');
      const name = commaIdx >= 0 ? info.substring(commaIdx + 1).trim() : 'Canale';
      const group = attrs['group-title'] || 'Generale';
      current = {
        id: attrs['tvg-id'] || 'ch_' + channels.length,
        name: name || attrs['tvg-name'] || 'Canale',
        logo: attrs['tvg-logo'] || '',
        group: group,
        epgId: attrs['tvg-id'] || attrs['tvg-name'] || '',
        url: '',
        type: 'live',
        language: attrs['tvg-language'] || '',
        country: attrs['tvg-country'] || '',
        shift: attrs['tvg-shift'] || '0',
        chNumber: attrs['ch-number'] || attrs['tvg-chno'] || '',
        radio: attrs['type'] === 'radio' || attrs['radio'] === 'true',
        adult: attrs['adult'] === '1' || (attrs['parent-code'] && attrs['parent-code'] !== '0000')
      };
    } else if (trimmed && !trimmed.startsWith('#') && current) {
      current.url = trimmed;
      current.type = detectChannelType(current.name, current.group, current.url, attrs);
      channels.push(current);
      current = null;
    }
  }
  if (current && current.url) {
    current.type = detectChannelType(current.name, current.group, current.url);
    channels.push(current);
  }
  return channels;
}

// Source handlers
async function handleM3uSubmit(e) {
  e.preventDefault();
  const name = $('#m3uName').value.trim();
  const url = $('#m3uUrl').value.trim();
  if (!name || !url) return;
  showLoading('Caricamento playlist M3U...');
  try {
    let text;
    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      text = await resp.text();
    } catch (fetchErr) {
      console.warn('Direct fetch failed, trying proxy...', fetchErr);
      const proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(url);
      const resp = await fetch(proxyUrl);
      if (!resp.ok) throw new Error('HTTP ' + resp.status + ' (proxy)');
      text = await resp.text();
    }
    const channels = parseM3u(text);
    if (channels.length === 0) throw new Error('Nessun canale trovato nella playlist');
    addSource({ id: 'src_' + Date.now(), name: name, type: 'm3u', url: url, channels: channels, rawText: text.length < 400000 ? text : '' });
    showToast(channels.length + ' canali caricati', 'success');
    hideModal('addSourceModal');
    e.target.reset();
  } catch (err) {
    showToast('Errore: ' + err.message, 'error');
    console.error(err);
  } finally { hideLoading(); }
}

async function handleXtreamSubmit(e) {
  e.preventDefault();
  const name = $('#xtreamName').value.trim();
  const url = $('#xtreamUrl').value.trim().replace(/\/$/, '');
  const user = $('#xtreamUser').value.trim();
  const pass = $('#xtreamPass').value.trim();
  const streamExt = ((document.getElementById('advFormat') || {}).value || state.xtreamFormat || 'ts') === 'm3u8' ? 'm3u8' : 'ts';
  if (!name || !url || !user || !pass) return;
  showLoading('Connessione a Xtream Codes...');
  try {
    const infoUrl = url + '/player_api.php?username=' + encodeURIComponent(user) + '&password=' + encodeURIComponent(pass);
    const resp = await fetch(infoUrl);
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const info = await resp.json();
    if (info.user_info && info.user_info.auth === 0) throw new Error('Credenziali non valide');

    const channels = [];

    // Live streams
    try {
      const liveUrl = url + '/player_api.php?username=' + encodeURIComponent(user) + '&password=' + encodeURIComponent(pass) + '&action=get_live_streams';
      const liveResp = await fetch(liveUrl);
      const liveData = await liveResp.json();
      const catUrl = url + '/player_api.php?username=' + encodeURIComponent(user) + '&password=' + encodeURIComponent(pass) + '&action=get_live_categories';
      const catResp = await fetch(catUrl);
      const catData = await catResp.json();
      const catMap = {};
      (catData || []).forEach(c => catMap[c.category_id] = c.category_name);
      (liveData || []).forEach(ch => {
        channels.push({
          id: 'xtream_' + ch.stream_id,
          name: ch.name || 'Canale ' + ch.stream_id,
          logo: ch.stream_icon || '',
          group: catMap[ch.category_id] || 'Live',
          epgId: ch.epg_channel_id || '',
          url: url + '/live/' + user + '/' + pass + '/' + ch.stream_id + '.' + streamExt,
          type: 'live'
        });
      });
    } catch (e) { console.warn('Live fetch failed:', e); }

    // VOD
    try {
      const vodUrl = url + '/player_api.php?username=' + encodeURIComponent(user) + '&password=' + encodeURIComponent(pass) + '&action=get_vod_streams';
      const vodResp = await fetch(vodUrl);
      const vodData = await vodResp.json();
      const vodCatUrl = url + '/player_api.php?username=' + encodeURIComponent(user) + '&password=' + encodeURIComponent(pass) + '&action=get_vod_categories';
      const vodCatResp = await fetch(vodCatUrl);
      const vodCatData = await vodCatResp.json();
      const vodCatMap = {};
      (vodCatData || []).forEach(c => vodCatMap[c.category_id] = c.category_name);
      (vodData || []).forEach(v => {
        channels.push({
          id: 'xtream_vod_' + v.stream_id,
          name: v.name || 'VOD ' + v.stream_id,
          logo: v.stream_icon || '',
          cover: v.stream_icon || '',
          group: vodCatMap[v.category_id] || 'VOD',
          url: url + '/movie/' + user + '/' + pass + '/' + v.stream_id + '.' + (v.container_extension || 'mp4'),
          type: 'vod'
        });
      });
    } catch (e) { console.warn('VOD fetch failed:', e); }

    // Series
    try {
      const serUrl = url + '/player_api.php?username=' + encodeURIComponent(user) + '&password=' + encodeURIComponent(pass) + '&action=get_series';
      const serResp = await fetch(serUrl);
      const serData = await serResp.json();
      const serCatUrl = url + '/player_api.php?username=' + encodeURIComponent(user) + '&password=' + encodeURIComponent(pass) + '&action=get_series_categories';
      const serCatResp = await fetch(serCatUrl);
      const serCatData = await serCatResp.json();
      const serCatMap = {};
      (serCatData || []).forEach(c => serCatMap[c.category_id] = c.category_name);
      (serData || []).forEach(s => {
        channels.push({
          id: 'xtream_series_' + s.series_id,
          name: s.name || 'Serie ' + s.series_id,
          logo: s.cover || '',
          cover: s.cover || '',
          group: serCatMap[s.category_id] || 'Serie TV',
          url: '', // Series need episode selection
          type: 'series'
        });
      });
    } catch (e) { console.warn('Series fetch failed:', e); }

    // Also fetch raw M3U for analysis
    let rawText = '';
    try {
      const m3uUrl = url + '/get.php?username=' + encodeURIComponent(user) + '&password=' + encodeURIComponent(pass) + '&type=m3u_plus&output=' + streamExt;
      const m3uResp = await fetch(m3uUrl);
      if (m3uResp.ok) rawText = await m3uResp.text();
    } catch (e) { console.warn('M3U fetch for analysis failed:', e); }
    addSource({ id: 'src_' + Date.now(), name: name, type: 'xtream', url: url, user: user, pass: pass, channels: channels, rawText: rawText.length < 400000 ? rawText : '', forceLink: !!state.xtreamForceLink, userAgent: state.xtreamUA || '' });
    showToast(channels.length + ' elementi caricati', 'success');
    hideModal('addSourceModal');
    e.target.reset();
  } catch (err) {
    showToast('Errore Xtream: ' + err.message, 'error');
    console.error(err);
  } finally { hideLoading(); }
}

async function handleStalkerSubmit(e) {
  e.preventDefault();
  const name = $('#stalkerName').value.trim();
  const url = $('#stalkerUrl').value.trim().replace(/\/$/, '');
  const mac = $('#stalkerMac').value.trim();
  if (!name || !url || !mac) return;
  showLoading('Connessione a Stalker...');
  try {
    const handshakeUrl = url + '/server/load.php?type=stb&action=handshake&token=&JsHttpRequest=1-xml';
    let resp;
    try {
      resp = await fetch(handshakeUrl, {
        headers: { 'Cookie': 'mac=' + mac + '; stb_lang=en; timezone=Europe/Rome' }
      });
    } catch (e) {
      const proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(handshakeUrl);
      resp = await fetch(proxyUrl);
    }
    let token = '';
    try {
      const data = await resp.json();
      token = (data.js && data.js.token) || data.token || '';
    } catch (e) {
      const text = await resp.text();
      const match = text.match(/"token"\s*:\s*"([^"]+)"/);
      token = match ? match[1] : '';
    }

    const channelsUrl = url + '/server/load.php?type=itv&action=get_ordered_list&JsHttpRequest=1-xml';
    const chResp = await fetch(channelsUrl, {
      headers: { 'Cookie': 'mac=' + mac + '; stb_lang=en; timezone=Europe/Rome; token=' + token }
    });
    const chData = await chResp.json();
    const items = (chData.js && chData.js.data) || chData.data || [];

    const channels = items.map((ch, i) => ({
      id: 'stalker_' + (ch.id || i),
      name: ch.name || 'Canale ' + (i + 1),
      logo: ch.logo || '',
      group: ch.tv_genre_name || 'Generale',
      url: ch.cmd ? ch.cmd.replace('ffmpeg ', '') : '',
      type: detectChannelType(ch.name || '', ch.tv_genre_name || '', ch.cmd || '')
    }));

    addSource({ id: 'src_' + Date.now(), name: name, type: 'stalker', url: url, mac: mac, token: token, channels: channels });
    showToast(channels.length + ' canali caricati', 'success');
    hideModal('addSourceModal');
    e.target.reset();
  } catch (err) {
    showToast('Errore Stalker: ' + err.message, 'error');
    console.error(err);
  } finally { hideLoading(); }
}

async function handleFileSubmit(e) {
  e.preventDefault();
  const file = $('#m3uFile').files[0];
  if (!file) return;
  showLoading('Lettura file...');
  try {
    const text = await file.text();
    const channels = parseM3u(text);
    if (channels.length === 0) throw new Error('Nessun canale trovato nel file');
    addSource({ id: 'src_' + Date.now(), name: file.name, type: 'file', channels: channels, rawText: text.length < 400000 ? text : '' });
    showToast(channels.length + ' canali caricati', 'success');
    hideModal('addSourceModal');
    e.target.reset();
  } catch (err) {
    showToast('Errore: ' + err.message, 'error');
  } finally { hideLoading(); }
}

function addSource(source) {
  logApp('SORGENTI', 'INFO', 'Sorgente aggiunta', {
    nome: source.name, tipo: source.type, canali: source.channels ? source.channels.length : 0,
    url: safeLogUrl(source.url)
  });
  state.sources.push(source);
  if (source.channels) {
    state.channels.push(...source.channels.map(ch => ({ ...ch, sourceId: source.id })));
  }
  state.activePlaylist = source.id;
  // Invalidate series cache
  state._seriesCache = null;
  state._seriesCacheChannelCount = 0;
  refreshChannelLogos();
  saveState();
  renderChannelList();
  renderSavedSources();
  updatePlaylistButton();
  autoFillMissingPosters(true, 4);
}

// Player
function initPlayer() {
  const video = $('#videoPlayer');
  video.volume = state.settings.volume / 100;
  if (state.settings.autoplay) video.autoplay = true;
  // Error handling
  video.addEventListener('error', () => {
    const err = video.error;
    let msg = 'Errore riproduzione';
    if (err) {
      switch (err.code) {
        case 1: msg = 'Caricamento interrotto'; break;
        case 2: msg = 'Errore di rete (server non raggiungibile o CORS)'; break;
        case 3: case 4: msg = 'Formato non supportato da Chrome'; break;
      }
    }
    const src = video.currentSrc || video.src || '';
    logStream('VIDEO_ERROR', {
      codice: err ? err.code : null, messaggio: err ? err.message : null,
      readyState: video.readyState, tempo: Number(video.currentTime.toFixed(1)),
      buffer: video.buffered.length ? video.buffered.end(video.buffered.length - 1) : 0,
      paused: video.paused, src: src.substring(0, 120)
    });
    // Errori di decodifica: prima prova senza audio, poi watchdog con riavvio
    if (err && (err.code === 3 || err.code === 4) && state.hls && state._lastHlsUrl) {
      const url = state._lastHlsUrl;
      if (!state._noAudioRetry) {
        state._noAudioRetry = true;
        logStream('VIDEO_SENZA_AUDIO', {});
        showToast('Audio non compatibile: riprovo senza audio...', 'warning');
        attachHls(url, true);
        return;
      }
      if (startTsFallback(url)) return;
      if ((state._watchdogRestarts || 0) < 20) {
        state._watchdogRestarts = (state._watchdogRestarts || 0) + 1;
        logStream('WATCHDOG_RIAVVIO', { numero: state._watchdogRestarts });
        showToast('Ripristino stream ' + state._watchdogRestarts + '/20 · ' + contextLabel(), 'warning');
        setTimeout(() => { if (state._lastHlsUrl === url) attachHls(url, true); }, 800);
        return;
      }
    }
    // Tenta automaticamente un formato compatibile (.mkv -> .mp4, .ts -> .m3u8)
    let alt = null;
    if (/\.mkv(\?|$)/i.test(src)) alt = src.replace(/\.mkv(\?|$)/i, '.mp4$1');
    else if (/\.ts(\?|$)/i.test(src) && !/\.m3u8/i.test(src)) alt = src.replace(/\.ts(\?|$)/i, '.m3u8$1');
    if (alt && state._decodeRetrySrc !== alt) {
      state._decodeRetrySrc = alt;
      showToast('Formato non compatibile: tentativo con formato alternativo...', 'warning');
      if (state.hls) { state.hls.destroy(); state.hls = null; }
      if (/\.m3u8/i.test(alt) && typeof Hls !== 'undefined' && Hls.isSupported()) {
        state.hls = new Hls({ enableWorker: true });
        state.hls.loadSource(alt);
        state.hls.attachMedia(video);
        state.hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
      } else {
        video.src = alt; video.load(); video.play().catch(() => {});
      }
      return;
    }
    state._decodeRetrySrc = null;
    const hint = (err && (err.code === 3 || err.code === 4))
      ? ' Formato non compatibile: usa una playlist con output=m3u8.'
      : '';
    const ctx = contextLabel();
    showToast(msg + ' · ' + ctx + hint, 'error');
    console.error('Video error:', err, 'src:', src, 'contesto:', ctx);
    $('#currentChannelInfo').textContent = '❌ ' + msg + ' · ' + ctx;
  });
  ['stalled', 'waiting', 'playing'].forEach(function (ev) {
    video.addEventListener(ev, function () {
      logStream('VIDEO_' + ev.toUpperCase(), {
        tempo: Number(video.currentTime.toFixed(1)),
        readyState: video.readyState,
        paused: video.paused
      });
    });
  });
}

// Switch season in series detail view
function switchSeriesSeason(season) {
  state._seriesCurrentSeason = season;
  renderChannelList();
}

// Play an episode from a series
function playSeriesEpisode(episodeId, ext, seriesName, title) {
  // First, try to find the channel in state.channels (for M3U series)
  const ch = state.channels.find(c => c.id === episodeId || c.id === 'xtream_series_' + episodeId);
  if (ch && ch.url) {
    // M3U series: use the channel's URL directly
    const video = $('#videoPlayer');
    $('#currentChannelName').textContent = seriesName + ' - ' + title;
    $('#currentChannelInfo').textContent = 'Serie TV';

    if (state.hls) { state.hls.destroy(); state.hls = null; }

    let playUrl = ch.url;
    if (playUrl.toLowerCase().includes('.ts') && !playUrl.toLowerCase().includes('.m3u8')) {
      playUrl = playUrl.replace(/\.ts(\?|$)/i, '.m3u8$1');
    }
    const isHls = playUrl.toLowerCase().includes('.m3u8');

    if (isHls) {
      if (typeof Hls === 'undefined') {
        video.src = playUrl;
        video.play().catch(err => console.error('Native play failed:', err));
      } else if (Hls.isSupported()) {
        state.hls = new Hls({ enableWorker: true, lowLatencyMode: true, backBufferLength: 90 });
        state.hls.loadSource(playUrl);
        state.hls.attachMedia(video);
        state.hls.on(Hls.Events.MANIFEST_PARSED, () => { video.play().catch(err => console.warn('Play failed:', err)); });
        state.hls.on(Hls.Events.ERROR, (e, data) => {
          if (data.fatal) {
            showToast('Errore HLS. Prova con output=m3u8.', 'error');
            state.hls.destroy();
            state.hls = null;
          }
        });
      } else {
        video.src = playUrl;
        video.play().catch(() => {});
      }
    } else {
      video.src = playUrl;
      video.load();
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.error('Play error:', err, 'URL:', playUrl);
          if (err.name === 'NotSupportedError') {
            showToast('Formato non supportato. Prova a cambiare output=m3u8.', 'error');
          } else {
            showToast('Impossibile riprodurre: ' + err.message, 'error');
          }
        });
      }
    }
    return;
  }

  // Xtream series: construct URL from source
  const source = window._currentSeries ? state.sources.find(s => s.id === (state.channels.find(c => c.id === 'xtream_series_' + episodeId) || {}).sourceId) : null;
  let src = null;
  const ch2 = state.channels.find(c => c.id === 'xtream_series_' + episodeId || c.id === episodeId);
  if (ch2) src = state.sources.find(s => s.id === ch2.sourceId);
  if (!src) {
    src = state.sources.find(s => s.type === 'xtream');
  }
  if (!src || !src.user || !src.pass) {
    showToast('Sorgente Xtream non trovata. Verifica le credenziali.', 'error');
    return;
  }
  const safeExt = ext || 'mp4';
  const url = src.url + '/series/' + src.user + '/' + src.pass + '/' + episodeId + '.' + safeExt;
  const video = $('#videoPlayer');
  $('#currentChannelName').textContent = seriesName + ' - ' + title;
  $('#currentChannelInfo').textContent = 'Serie TV';

  if (state.hls) { state.hls.destroy(); state.hls = null; }

  let playUrl = url;
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('.ts') && !lowerUrl.includes('.m3u8')) {
    playUrl = url.replace(/\.ts(\?|$)/i, '.m3u8$1');
  }
  const isHls = playUrl.toLowerCase().includes('.m3u8');

  if (isHls) {
    if (typeof Hls === 'undefined') {
      video.src = playUrl;
      video.play().catch(err => console.error('Native play failed:', err));
      return;
    }
    if (Hls.isSupported()) {
      state.hls = new Hls({ enableWorker: true, lowLatencyMode: true, backBufferLength: 90 });
      state.hls.loadSource(playUrl);
      state.hls.attachMedia(video);
      state.hls.on(Hls.Events.MANIFEST_PARSED, () => { video.play().catch(err => console.warn('Play failed:', err)); });
      state.hls.on(Hls.Events.ERROR, (e, data) => {
        if (data.fatal) {
          showToast('Errore riproduzione HLS', 'error');
          state.hls.destroy();
          state.hls = null;
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = playUrl;
      video.play().catch(err => console.warn('Play failed:', err));
    }
  } else {
    video.src = playUrl;
    video.load();
    video.play().catch(err => {
      console.error('Play error:', err);
      showToast('Impossibile riprodurre: ' + err.message, 'error');
    });
  }
}

function playChannel(channel, directPlay) {
  // Virtual series group from search: navigate to series detail
  if (channel._isSeriesGroup) {
    navigateToSeries(channel._seriesName);
    return;
  }
  // Series: show episode selector instead of playing (unless directPlay)
  if (channel.type === 'series' && !directPlay) {
    let seriesName = (channel.name || '')
      .replace(/\s*S\d+\s*E\d+.*$/i, '')
      .replace(/\s*Stagione\s*\d+.*$/i, '')
      .replace(/\s*Season\s*\d+.*$/i, '')
      .replace(/\s*Episodio\s*\d+.*$/i, '')
      .replace(/\s*Episode\s*\d+.*$/i, '')
      .replace(/\s*E\d+.*$/i, '')
      .replace(/\s*-\s*\d+x\d+.*$/i, '')
      .replace(/\.S\d+\.E\d+.*$/i, '')
      .trim();
    if (!seriesName) {
      const seMatch = (channel.name || '').match(/^(.*?)[\s._-]+(?:S\d+|Stagione|Season|Episodio|Episode|\d+x\d+)/i);
      if (seMatch && seMatch[1]) seriesName = seMatch[1].trim();
    }
    if (!seriesName) seriesName = channel.name || '';
    // Check if it's an Xtream series (empty URL)
    if (!channel.url || channel.id.startsWith('xtream_series_')) {
      openSeriesDetail(channel);
    } else {
      openSeriesByName(seriesName);
    }
    return;
  }
  // ===== Parental Control PIN gate =====
  if (pinLockEnabled()) {
    const pinState = getPinState();
    if (Date.now() < pinState.lockUntil) {
      const waitSec = Math.ceil((pinState.lockUntil - Date.now()) / 1000);
      showToast('Troppi tentativi di PIN. Riprova tra ' + waitSec + ' secondi.', 'error');
      return;
    }
    showPinModal(() => startPlayback(channel));
    return;
  }
  if (!channel || !channel.url) {
    showToast('URL non disponibile per questo elemento', 'error');
    console.error('No URL for channel:', channel);
    return;
  }
  startPlayback(channel);
}

// Player alternativo: decodifica MPEG-TS con WebCodecs, ignorando completamente l'audio
function stopTsFallback() {
  if (state.tsPlayer) { try { state.tsPlayer.stop(); } catch (e) {} state.tsPlayer = null; }
  const canvas = $('#tsCanvas'); if (canvas) canvas.style.display = 'none';
  const video = $('#videoPlayer'); if (video) video.style.visibility = 'visible';
}
function startTsFallback(url) {
  if (state._tsFallback || typeof TsLivePlayer === 'undefined') return false;
  state._tsFallback = true;
  stopTsFallback();
  if (state.hls) { try { state.hls.destroy(); } catch (e) {} state.hls = null; }
  const canvas = $('#tsCanvas');
  if (!canvas) return false;
  canvas.style.display = 'block';
  const video = $('#videoPlayer'); if (video) video.style.visibility = 'hidden';
  logStream('TS_FALLBACK_START', { url: url });
  const p = new TsLivePlayer(canvas, url);
  p.onStatus = s => { if (String(s).indexOf('video PID') === 0) logStream('TS_FALLBACK_PID', { stato: s }); };
  p.onError = e => { logStream('TS_FALLBACK_ERROR', { errore: e.message || String(e) }); };
  p.start().catch(e => {
    logStream('TS_FALLBACK_ERROR', { errore: e.message || String(e) });
    showToast('Player alternativo non disponibile · ' + contextLabel(), 'error');
    stopTsFallback();
  });
  state.tsPlayer = p;
  const ci = $('#currentChannelInfo');
  if (ci && !ci.textContent.includes('player alternativo')) ci.textContent += ' · 🎞 player alternativo (senza audio)';
  showToast('Player alternativo attivo: video senza audio · ' + contextLabel(), 'warning');
  return true;
}

// Riproduzione HLS con recupero automatico dell'audio non compatibile
function attachHls(url, noAudio) {
  const video = $('#videoPlayer');
  if (state.hls) { try { state.hls.destroy(); } catch (e) {} state.hls = null; }
  if (typeof Hls === 'undefined') {
    showToast('HLS.js non caricato. Verifica la connessione.', 'error');
    video.src = url; video.play().catch(() => {}); return;
  }
  if (!Hls.isSupported()) {
    if (video.canPlayType('application/vnd.apple.mpegurl')) { video.src = url; video.play().catch(() => {}); }
    else showToast('HLS non supportato dal browser', 'error');
    return;
  }
  state._lastHlsUrl = url;
  state._decodeRetrySrc = null;
  let restarts = 0;

  function start() {
    if (state.hls) { try { state.hls.destroy(); } catch (e) {} state.hls = null; }
    state._mediaRecovered = false;
    const h = new Hls({ enableWorker: true, lowLatencyMode: false, backBufferLength: 90 });
    state.hls = h;
    logStream('HLS_START', { url: url, senzaAudio: noAudio, riavvio: restarts });
    h.loadSource(url);
    h.attachMedia(video);
    h.on(Hls.Events.MANIFEST_PARSED, () => {
      logStream('HLS_MANIFEST', { livelli: h.levels.length, tracceAudio: h.audioTracks.length, livello: h.currentLevel });
      const ci = $('#currentChannelInfo');
      if (ci && ci.textContent.startsWith('❌')) {
        const ch = state.currentChannel || {};
        ci.textContent = (ch.group || '') + (ch.type ? ' · ' + ch.type.toUpperCase() : '') + ' · 📋 ' + getSourceLabel();
      }
      if (noAudio) {
        try { h.audioTrack = -1; } catch (e) {}
        if (ci && !ci.textContent.includes('senza audio')) ci.textContent += ' · 🔇 senza audio';
      }
      video.play().catch(err => console.warn('Play failed:', err));
    });
    h.on(Hls.Events.ERROR, (e, data) => {
      logStream('HLS_ERROR', {
        tipo: data.type, dettaglio: data.details, fatale: data.fatal,
        codice: data.code, errore: data.err ? data.err.message : null,
        frammento: data.frag ? data.frag.url : null,
        buffer: video.buffered.length ? video.buffered.end(video.buffered.length - 1) : 0,
        tempo: Number(video.currentTime.toFixed(1))
      });
      if (!data.fatal) return;
      if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
        logStream('HLS_RETE_RETRY', {});
        showToast('Errore di rete HLS · ' + contextLabel(), 'error');
        h.startLoad();
        return;
      }
      if (data.type === Hls.ErrorTypes.MEDIA_ERROR && !state._mediaRecovered) {
        state._mediaRecovered = true;
        logStream('HLS_MEDIA_RECOVER', {});
        h.recoverMediaError();
        return;
      }
      if (!noAudio && !state._noAudioRetry) {
        state._noAudioRetry = true;
        logStream('HLS_SENZA_AUDIO', {});
        showToast('Audio non compatibile: riprovo senza audio...', 'warning');
        attachHls(url, true);
        return;
      }
      // Dopo alcuni tentativi HLS, passa al decoder TS alternativo
      if (restarts >= 1 && startTsFallback(url)) return;
      // Stream live instabile: riavvia automaticamente fino a 10 volte
      if (restarts < 10) {
        restarts++;
        logStream('HLS_RIAVVIO', { numero: restarts });
        showToast('Stream interrotto, riavvio ' + restarts + '/10 · ' + contextLabel(), 'warning');
        setTimeout(() => { if (state._lastHlsUrl === url) start(); }, 800);
        return;
      }
      logStream('HLS_ABORT', { motivo: 'tentativi esauriti' });
      showToast('Stream non disponibile · ' + contextLabel(), 'error');
      try { h.destroy(); } catch (e) {}
      state.hls = null;
    });
  }
  start();
}

function startPlayback(channel) {
  // Validate URL
  try {
    new URL(channel.url);
  } catch (e) {
    showToast('URL non valido: ' + channel.url, 'error');
    console.error('Invalid URL:', channel.url);
    return;
  }
  state.currentChannel = channel;
  logApp('PLAY', 'INFO', 'Riproduzione', {
    canale: channel.name, tipo: channel.type || 'live',
    url: safeLogUrl(channel.url), sorgente: channel.sourceId || '-'
  });
  state._tsFallback = false;
  stopTsFallback();
  state._noAudioRetry = false;
  state._mediaRecovered = false;
  state._watchdogRestarts = 0;
  state._lastHlsUrl = null;
  // Track watch history
  const histEntry = { id: channel.id, name: channel.name, type: channel.type, group: channel.group, time: Date.now() };
  state.watchHistory = state.watchHistory.filter(h => h.id !== channel.id);
  state.watchHistory.unshift(histEntry);
  if (state.watchHistory.length > 50) state.watchHistory = state.watchHistory.slice(0, 50);
  saveState();
  const video = $('#videoPlayer');
  $('#currentChannelName').textContent = channel.name;
  $('#currentChannelInfo').textContent = (channel.group || '') + (channel.type ? ' · ' + channel.type.toUpperCase() : '') + ' · 📋 ' + getSourceLabel();
  updateTvPlayerOverlay(channel);

  $$('.channel-item').forEach(el => el.classList.remove('active'));
  try {
    const activeEl = document.querySelector(`.channel-item[data-id="${CSS.escape(channel.id)}"]`);
    if (activeEl) activeEl.classList.add('active');
  } catch (e) { console.warn('Selector error:', e); }

  if (state.hls) { state.hls.destroy(); state.hls = null; }

  let url = channel.url;
  console.log('Playing:', url);
  const lowerUrl = url.toLowerCase();

  // Auto-convert .ts to .m3u8 for Xtream Codes streams (Chrome doesn't support .ts)
  if (lowerUrl.includes('.ts') && !lowerUrl.includes('.m3u8')) {
    const m3u8Url = url.replace(/\.ts(\?|$)/i, '.m3u8$1');
    console.log('Converted .ts to .m3u8:', m3u8Url);
    url = m3u8Url;
  }

  const isHls = url.toLowerCase().includes('.m3u8');

  if (isHls) {
    attachHls(url, false);
  } else {
    // Direct playback (mp4, webm, etc.) - only if not converted to HLS
    video.src = url;
    video.load();
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(err => {
        console.error('Play error:', err, 'URL:', url);
        if (err.name === 'NotSupportedError') {
          showToast('Formato non supportato da Chrome. Prova a cambiare output=m3u8 nell\'URL.', 'error');
        } else if (err.name === 'NotAllowedError') {
          showToast('Riproduzione bloccata dal browser. Clicca sul video per avviare.', 'error');
        } else {
          showToast('Impossibile riprodurre: ' + err.message, 'error');
        }
      });
    }
  }

  loadEpg(channel);
}

// EPG
function loadEpg(channel) {
  const panel = $('#epgPanel');
  panel.style.display = 'flex';
  const content = $('#epgContent');
  content.innerHTML = '<p class="hint">Caricamento guida...</p>';
  setTimeout(() => {
    content.innerHTML = `
      <div class="epg-item">
        <div class="epg-time">Ora</div>
        <div class="epg-title">${escapeHtml(channel.name)}</div>
        <div class="epg-desc">Riproduzione in corso · ${channel.type ? channel.type.toUpperCase() : ''}</div>
      </div>
      <div class="epg-item">
        <div class="epg-time">+30 min</div>
        <div class="epg-title">Prossimo programma</div>
        <div class="epg-desc">EPG non configurato per questa sorgente</div>
      </div>
    `;
  }, 300);
}

// History rendering
function renderHistory() {
  const bar = $('#historyBar');
  const list = $('#historyList');
  if (!state.watchHistory || state.watchHistory.length === 0) {
    bar.style.display = 'none';
    return;
  }
  bar.style.display = 'block';
  const recent = state.watchHistory.slice(0, 10);
  list.innerHTML = recent.map(h => {
    const ch = state.channels.find(c => c.id === h.id);
    if (!ch) return '';
    const typeIcon = h.type === 'vod' ? '🎬' : h.type === 'series' ? '📺' : '📡';
    return `<div style="min-width:80px;max-width:100px;cursor:pointer;text-align:center;" onclick="playChannelById('${escapeAttr(h.id)}')" title="${escapeHtml(h.name)}">
      <div style="width:70px;height:40px;background:var(--bg3);border-radius:4px;display:flex;align-items:center;justify-content:center;margin:0 auto;font-size:18px;">${typeIcon}</div>
      <div style="font-size:10px;color:var(--text2);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(h.name)}</div>
    </div>`;
  }).join('');
}

// Channel list rendering
function navigateTo(level, type, category) {
  state.navLevel = level;
  state.navType = type || null;
  state.navCategory = category || null;
  logApp('NAV', 'INFO', 'Navigazione', { livello: level, tipo: type || '-', categoria: category || '-' });
  // Update breadcrumb
  const bc = $('#navBreadcrumb');
  const bt = $('#breadcrumbType');
  const bcat = $('#breadcrumbCategory');
  if (level === 'home') {
    bc.style.display = 'none';
  } else {
    bc.style.display = 'block';
    const typeLabels = { live: '📡 Live', vod: '🎬 Film', series: '📺 Serie' };
    bt.innerHTML = ' › <span style="cursor:pointer;color:var(--accent);" onclick="navigateTo(\'type\',\'' + (type || state.navType) + '\')">' + (typeLabels[type || state.navType] || '') + '</span>';
    if (category) {
      bcat.innerHTML = ' › <span style="color:var(--text);">' + escapeHtml(category) + '</span>';
    } else {
      bcat.innerHTML = '';
    }
  }
  // Show/hide quick nav
  const qn = $('#quickNav');
  if (level === 'home') {
    if (qn) qn.style.display = 'none';
  } else {
    if (qn) qn.style.display = 'flex';
  }
  // Handle series_detail breadcrumb
  if (level === 'series_detail') {
    const bc = $('#navBreadcrumb');
    const bt = $('#breadcrumbType');
    const bcat = $('#breadcrumbCategory');
    if (bc) bc.style.display = 'block';
    if (bt) bt.innerHTML = ' › <span style="cursor:pointer;color:var(--accent);" onclick="navigateTo(\'type\',\'series\')">📺 Serie</span>';
    if (bcat) bcat.innerHTML = ' › <span style="color:var(--text);">' + escapeHtml(state.navCategory || '') + '</span>';
  }
  renderChannelList();
}

// Navigate to a series detail (seasons + episodes in sidebar)
async function navigateToSeries(seriesName) {
  // Find the channel for this series
  const seriesChannel = state.channels.find(ch => {
    if ((ch.type || 'live') !== 'series') return false;
    let name = (ch.name || '').replace(/\s*S\d+\s*E\d+.*$/i, '').replace(/\s*Stagione\s*\d+.*$/i, '').replace(/\s*Season\s*\d+.*$/i, '').replace(/\s*Episodio\s*\d+.*$/i, '').replace(/\s*Episode\s*\d+.*$/i, '').replace(/\s*E\d+.*$/i, '').replace(/\s*-\s*\d+x\d+.*$/i, '').trim();
    if (!name) name = ch.name || '';
    return name === seriesName;
  });

  const source = seriesChannel ? state.sources.find(s => s.id === seriesChannel.sourceId) : null;
  const isXtream = source && source.type === 'xtream' && seriesChannel && seriesChannel.id.startsWith('xtream_series_');

  state.navLevel = 'series_detail';
  state.navType = 'series';
  state.navCategory = seriesName;

  // Update breadcrumb
  const bc = $('#navBreadcrumb');
  const bt = $('#breadcrumbType');
  const bcat = $('#breadcrumbCategory');
  if (bc) bc.style.display = 'block';
  if (bt) bt.innerHTML = ' › <span style="cursor:pointer;color:var(--accent);" onclick="navigateTo(\'type\',\'series\')">📺 Serie</span>';
  if (bcat) bcat.innerHTML = ' › <span style="color:var(--text);">' + escapeHtml(seriesName) + '</span>';

  // Show quick nav
  const qn = $('#quickNav');
  if (qn) qn.style.display = 'flex';

  if (isXtream) {
    // Fetch series info from Xtream API
    window._currentSeries = { name: seriesName, episodes: [], seasons: {}, loading: true, source: source, seriesId: seriesChannel.id.replace('xtream_series_', '') };
    state._seriesSeasons = [];
    state._seriesCurrentSeason = '1';
    renderChannelList();

    try {
      const url = source.url;
      const user = source.user;
      const pass = source.pass;
      const seriesId = seriesChannel.id.replace('xtream_series_', '');
      const infoUrl = url + '/player_api.php?username=' + encodeURIComponent(user) + '&password=' + encodeURIComponent(pass) + '&action=get_series_info&series_id=' + seriesId;
      const resp = await fetch(infoUrl);
      const data = await resp.json();
      const seriesInfo = data.info || {};
      const episodes = data.episodes || {};

      window._currentSeries = {
        name: seriesInfo.name || seriesName,
        info: seriesInfo,
        episodes: episodes,
        seasons: episodes,
        loading: false,
        source: source,
        seriesId: seriesId
      };
      state._seriesSeasons = Object.keys(episodes).sort((a, b) => parseInt(a) - parseInt(b));
      state._seriesCurrentSeason = state._seriesSeasons[0] || '1';
      renderChannelList();
    } catch (err) {
      console.error('Failed to fetch series info:', err);
      window._currentSeries.loading = false;
      window._currentSeries.error = err.message;
      renderChannelList();
    }
  } else {
    // M3U series: group episodes by series name
    const episodes = state.channels.filter(ch => {
      if ((ch.type || 'live') !== 'series') return false;
      let name = extractSeriesName(ch.name || '');
      // Flexible match
      return name === seriesName || name.toLowerCase() === seriesName.toLowerCase() ||
             (ch.name || '').toLowerCase().startsWith(seriesName.toLowerCase());
    });
    console.log('navigateToSeries:', seriesName, 'found', episodes.length, 'episodes');

    const seasons = {};
    episodes.forEach(ep => {
      let season = '1';
      const match = (ep.name || '').match(/S(\d+)/i) || (ep.name || '').match(/Stagione\s*(\d+)/i) || (ep.name || '').match(/Season\s*(\d+)/i);
      if (match) season = String(parseInt(match[1], 10));
      if (!seasons[season]) seasons[season] = [];
      seasons[season].push(ep);
    });

    window._currentSeries = { name: seriesName, episodes: episodes, seasons: seasons, loading: false, source: source };
    state._seriesSeasons = Object.keys(seasons).sort((a, b) => parseInt(a) - parseInt(b));
    state._seriesCurrentSeason = state._seriesSeasons[0] || '1';
    renderChannelList();
  }
}

// Ordinamento categorie: Serie TV alfabetiche; Live/VOD ordine della playlist,
// con "Sala 2026" in cima e le categorie adult/XXX in fondo.
function sortCategoryKeys(keys, type) {
  if (type === 'series') return keys.sort((a, b) => a.localeCompare(b, 'it'));
  const isTop = n => /sala[\s._-]*2026/i.test(n);
  const isBottom = n => /\bxxx\b|\badult\b|x[\s._-]*tra|18\+|porn|hardcore/i.test(n);
  return keys
    .map((name, idx) => ({ name, idx, rank: isTop(name) ? 0 : isBottom(name) ? 2 : 1 }))
    .sort((a, b) => a.rank - b.rank || a.idx - b.idx)
    .map(x => x.name);
}

// Chiave "saga" per raggruppare i film della stessa serie nella lista VOD
function extractSagaKey(name) {
  let s = (name || '').trim();
  s = s.replace(/\s*\(\s*(19|20)\d{2}\s*\)/g, ' ').replace(/\s+(19|20)\d{2}\s*$/, ' ');
  s = s.replace(/\s*(?:[-–—:]\s*)?(?:parte|part|capitolo|chapter|volume|vol|episodio|ep|pt)\.?\s*[0-9IVXLCDM]+(?:\b.*)?$/i, ' ');
  s = s.replace(/\s+[-–—:]\s+.*$/, ' ');
  s = s.replace(/\s+\d+\s*$/, ' ');
  s = s.replace(/\s+[IVXLCDM]+\s*$/, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  return s || (name || '').trim();
}

// Correzione manuale del tipo di un singolo canale (utile per serie classificate male)
function setChannelType(id, type) {
  const ch = state.channels.find(c => c.id === id);
  if (!ch) return;
  ch.type = type;
  state.sources.forEach(s => (s.channels || []).forEach(c => { if (c.id === id) c.type = type; }));
  saveState();
  renderChannelList();
  showToast('Tipo aggiornato: ' + type, 'success');
}
function promptChannelType(id) {
  const ch = state.channels.find(c => c.id === id);
  if (!ch) return;
  const choice = window.prompt('Tipo per "' + ch.name + '":\n1 = Live TV\n2 = Film / VOD\n3 = Serie TV', ch.type === 'series' ? '3' : ch.type === 'vod' ? '2' : '1');
  if (choice === null) return;
  const map = { '1': 'live', '2': 'vod', '3': 'series' };
  if (map[choice]) setChannelType(id, map[choice]);
  else showToast('Scelta non valida', 'error');
}


// ===== IP-TVSOLUTION: logo multi-sorgente (tvg-logo -> EPG icon -> iniziali) =====
function initialsLogo(name) {
  var initials = String(name || '?').trim().split(/\s+/).map(function(w){ return w.charAt(0); }).join('').substring(0, 2).toUpperCase() || '?';
  initials = initials.replace(/[<>&"']/g, '');
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" rx="10" fill="#C83838"/><text x="32" y="43" font-family="Arial,sans-serif" font-size="27" font-weight="bold" fill="#ffffff" text-anchor="middle">' + initials + '</text></svg>';
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
function refreshChannelLogos() {
  var logos = state.epgLogos || {};
  var changed = 0;
  (state.channels || []).forEach(function(ch) {
    if (ch.logo && /^(https?:|data:)/i.test(ch.logo)) return;
    var cand = null;
    var keys = [ch.epgId, ch.id, ch.name].filter(Boolean);
    for (var i = 0; i < keys.length && !cand; i++) {
      var k = String(keys[i]).toLowerCase();
      cand = logos[k] || logos[normalizeEpgName(keys[i])] || null;
    }
    if (cand) { ch.logo = cand; changed++; return; }
    ch.logo = initialsLogo(ch.name);
    changed++;
  });
  if (changed > 0) {
    saveState();
    try { renderChannelList(); } catch (e) {}
    logApp('LOGO', 'INFO', 'Loghi aggiornati automaticamente', { canali: changed });
  }
}

// ===== IP-TVSOLUTION: aggiorna loghi da piu' fonti per la playlist attiva =====
function initialsShort(name) {
  var parts = String(name || '?').trim().split(/\s+/);
  var out = parts.map(function (w) { return w.charAt(0); }).join('').substring(0, 2).toUpperCase();
  return (out || '?').replace(/[<>&"']/g, '');
}
function logoNameKey(value, compact) {
  var s = String(value || '').toLowerCase()
    .replace(/\.[a-z0-9]{2,4}$/i, ' ')
    .replace(/[_+]+/g, ' ')
    .replace(/[-]+/g, ' ')
    .replace(/[\[\(][^\]\)]*[\]\)]/g, ' ')
    .replace(/\b(hd|fhd|uhd|sd|hdtv|4k)\b/g, ' ')
    .replace(/\b(ch|channel|canale)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  s = s.replace(/\s+(it|ita)$/, ' ').trim();
  if (compact) return s.replace(/[^a-z0-9]/g, '');
  return s;
}
function logoKeysFor(value) {
  var a = logoNameKey(value, true);
  var b = logoNameKey(value, false);
  var out = [], seen = {};
  [a, b].forEach(function (k) { if (k && !seen[k]) { seen[k] = 1; out.push(k); } });
  return out;
}
function isDirectPng(url) {
  return /^https?:\/\/[^\s"'<>]+?\.png(\?[^\s"'<>]*)?$/i.test(String(url || ''));
}

// === IP-TVSOLUTION: locandine da database esterni (auto-update) ===
var POSTER_CACHE_KEY = 'iptv_solution_poster_cache';
var TMDB_KEY_KEY = 'iptv_tmdb_key';
function posterTitle(name) {
  return String(name || '')
    .replace(/\s*[-–|]\s*(?: stagione|season|serie|film).*$/i, '')
    .replace(/\((?:19|20)\d{2}\)/g, ' ')
    .replace(/\b(19|20)\d{2}\b/g, ' ')
    .replace(/\b( HD | FHD | UHD | 4K | HDTV | SD | 720p | 1080p )\b/gi, ' ')
    .replace(/[^a-zA-Z0-9\u00E0\u00E8\u00E9\u00EC\u00F2\u00F9\u00C0\u00C8\u00C9\u00CC\u00D2\u00D9 ]+/g, ' ')
    .replace(/\s+/g, ' ').trim();
}
function posterKey(name, type) { return (type === 'series' ? 'tv:' : 'movie:') + posterTitle(name).toLowerCase(); }
function loadPosterCache() {
  try { return JSON.parse(localStorage.getItem(POSTER_CACHE_KEY) || '{}') || {}; } catch (e) { return {}; }
}
function savePosterCache(c) {
  try { localStorage.setItem(POSTER_CACHE_KEY, JSON.stringify(c)); } catch (e) {}
}
function cachedPoster(name, type) {
  var c = loadPosterCache(), v = c[posterKey(name, type)];
  if (v && v.url && Date.now() - (v.ts || 0) < 7 * 24 * 3600 * 1000) return v.url;
  return '';
}
function rememberPoster(name, type, url) {
  if (!/^https?:\/\//i.test(String(url || ''))) return;
  var c = loadPosterCache();
  c[posterKey(name, type)] = { url: url, ts: Date.now() };
  var keys = Object.keys(c);
  if (keys.length > 1200) keys.slice(0, keys.length - 1200).forEach(function (k) { delete c[k]; });
  savePosterCache(c);
}
async function fetchPosterFromExternal(name, type) {
  var title = posterTitle(name);
  if (!title) return '';
  var cached = cachedPoster(title, type);
  if (cached) return cached;
  var apiKey = (localStorage.getItem(TMDB_KEY_KEY) || '').trim();
  var url = '';
  if (apiKey) {
    try {
      var kind = type === 'series' ? 'tv' : 'movie';
      var r = await fetch('https://api.themoviedb.org/3/search/' + kind + '?api_key=' + encodeURIComponent(apiKey) + '&language=it-IT&query=' + encodeURIComponent(title), { cache: 'no-store' });
      if (r.ok) {
        var j = await r.json();
        var hit = (j.results || [])[0];
        if (hit && hit.poster_path) url = 'https://image.tmdb.org/t/p/w500' + hit.poster_path;
      }
    } catch (e) { logApp('LOGO', 'WARN', 'TMDB non disponibile', { titolo: title }); }
  }
  if (!url && type === 'series') {
    try {
      var r2 = await fetch('https://api.tvmaze.com/singlesearch/shows?q=' + encodeURIComponent(title), { cache: 'no-store' });
      if (r2.ok) {
        var j2 = await r2.json();
        url = (j2.image && (j2.image.original || j2.image.medium)) || '';
      }
    } catch (e) { logApp('LOGO', 'WARN', 'TVMaze non disponibile', { titolo: title }); }
  }
  if (!url && type !== 'series') {
    try {
      var r3 = await fetch('https://itunes.apple.com/search?term=' + encodeURIComponent(title) + '&entity=movie&limit=1', { cache: 'no-store' });
      if (r3.ok) {
        var j3 = await r3.json();
        var res = (j3.results || [])[0];
        if (res && res.artworkUrl100) url = res.artworkUrl100.replace('100x100bb', '600x600bb');
      }
    } catch (e) { logApp('LOGO', 'WARN', 'iTunes non disponibile', { titolo: title }); }
  }
  if (url && (type === 'series' ? /^https?:\/\/[^\s"'<>]+?\.(png|jpe?g|webp)(\?[^\s"'<>]*)?$/i.test(url) : /^https?:\/\//i.test(url))) {
    rememberPoster(title, type, url);
    return url;
  }
  return '';
}
async function autoFillMissingPosters(silent, limit) {
  var max = limit || 12;
  var missing = (state.channels || []).filter(function (ch) {
    return (ch.type === 'vod' || ch.type === 'series') && (!ch.logo || /^data:/i.test(ch.logo) || !isDirectImage(ch.logo));
  });
  if (!missing.length) { if (!silent) showToast('Nessuna locandina mancante', 'success'); return 0; }
  var seen = {}, batch = [];
  for (var i = 0; i < missing.length && batch.length < max; i++) {
    var k = posterKey(missing[i].name, missing[i].type);
    if (!seen[k]) { seen[k] = 1; batch.push(missing[i]); }
  }
  var found = 0;
  for (var b = 0; b < batch.length; b++) {
    var ch = batch[b];
    try {
      var u = await fetchPosterFromExternal(ch.name, ch.type);
      if (u) {
        ch.logo = u; ch.cover = u; ch.posterSource = 'external';
        (state.sources || []).forEach(function (src) {
          (src.channels || []).forEach(function (sc) { if (sc.id === ch.id) { sc.logo = u; sc.cover = u; sc.posterSource = 'external'; } });
        });
        found++;
      }
    } catch (e) {}
  }
  if (found) {
    saveState();
    try { renderChannelList(); renderSavedSources(); updatePlaylistButton(); } catch (e) {}
  }
  if (!silent) showToast('Locandine recuperate: ' + found, found ? 'success' : 'warning');
  logApp('LOGO', 'INFO', 'Auto-fill locandine esterne', { trovate: found, mancanti: missing.length });
  return found;
}
function clearPosterCache() {
  localStorage.removeItem(POSTER_CACHE_KEY);
  var cleared = 0;
  (state.channels || []).forEach(function (ch) {
    if ((ch.type === 'vod' || ch.type === 'series') && ch.posterSource === 'external') {
      ch.logo = ''; ch.cover = ''; delete ch.posterSource; cleared++;
      (state.sources || []).forEach(function (src) {
        (src.channels || []).forEach(function (sc) { if (sc.id === ch.id) { sc.logo = ''; sc.cover = ''; delete sc.posterSource; } });
      });
    }
  });
  saveState();
  try { renderChannelList(); renderSavedSources(); updatePlaylistButton(); } catch (e) {}
  showToast('Cache locandine cancellata', 'success');
  setTimeout(function () { refreshLogosFromSources(true); }, 200);
  setTimeout(function () { autoFillMissingPosters(true, 20); }, 900);
}
window.IPtvClearPosterCache = clearPosterCache;
window.IPtvAutoFillPosters = autoFillMissingPosters;

function isDirectImage(url) {
  return /^https?:\/\/[^\s"'<>]+?\.(png|jpe?g|webp)(\?[^\s"'<>]*)?$/i.test(String(url || ''));
}
async function refreshLogosFromSources(silent) {
  if (!state.sources || !state.sources.length) {
    if (!silent) showToast('Nessuna playlist caricata', 'warning');
    return;
  }
  var btn = document.getElementById('btnRefreshLogos');
  if (btn) { btn.disabled = true; btn.textContent = 'Aggiornamento...'; }
  var active = (state.activePlaylist && state.activePlaylist !== 'all')
    ? state.sources.find(function (s) { return s.id === state.activePlaylist; }) : null;
  var targets = active ? [active] : state.sources;
  var map = {};
  async function fetchJson(url) {
    var r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return await r.json();
  }
  function put(k, v, allowImage) {
    if (allowImage ? !isDirectImage(v) : !isDirectPng(v)) return;
    var names = [];
    if (k) names.push(k);
    var file = String(v).split('?')[0].split('/').pop() || '';
    try { file = decodeURIComponent(file); } catch (e) {}
    if (file) names.push(file.replace(/\.(png|jpe?g|webp)$/i, ''));
    names.forEach(function (n) {
      logoKeysFor(n).forEach(function (key) { if (key) map[key] = v; });
    });
  }
  function lookup(ch) {
    var keys = [ch.epgId, ch.tvgId, ch.tvgName, ch.name, ch.id,
      String(ch.id || '').replace(/^xtream(_vod|_series)?_/, ''), ch.streamId, ch.tvgLogo].filter(Boolean);
    for (var i = 0; i < keys.length; i++) {
      var kk = logoKeysFor(keys[i]);
      for (var j = 0; j < kk.length; j++) {
        if (map[kk[j]]) return map[kk[j]];
      }
    }
    return null;
  }
  // Fonte 1: EPG XMLTV (icon src, per id e display-name)
  try { await ensureEpgLoaded(); } catch (e) {}
  Object.keys(state.epgLogos || {}).forEach(function (k) { put(k, state.epgLogos[k]); });

  for (var si = 0; si < targets.length; si++) {
    var src = targets[si];
    // Fonte 2: API Xtream (stream_icon / cover) - solo PNG diretti
    if (src.type === 'xtream' && src.url && src.user && src.pass) {
      var base = String(src.url).replace(/\/+$/, '');
      var api = base + '/player_api.php?username=' + encodeURIComponent(src.user) +
        '&password=' + encodeURIComponent(src.pass) + '&action=';
      var actions = ['get_live_streams', 'get_vod_streams', 'get_series'];
      for (var ai = 0; ai < actions.length; ai++) {
        try {
          var res = await fetch(api + actions[ai]);
          var data = await res.json();
          (data || []).forEach(function (item) {
            var id = item.stream_id || item.series_id;
            var logo = item.stream_icon || item.cover || item.logo || '';
            if (id && logo) put(id, logo, true);
            if (item.name && logo) put(item.name, logo, true);
          });
        } catch (e) { logApp('LOGO', 'ERROR', 'Font Xtream non disponibile', { azione: actions[ai] }); }
      }
    }
    // Fonte 3: file M3U remoto (tvg-logo / tvg-id / tvg-name)
    else if (src.type === 'm3u' && src.url && /^https?:\/\//i.test(src.url)) {
      try {
        var res2 = await fetch(src.url);
        var text = await res2.text();
        var lines = text.split(/\r?\n/);
        for (var li = 0; li < lines.length; li++) {
          var line = lines[li];
          if (line.indexOf('#EXTINF') !== 0) continue;
          var lm = line.match(/tvg-logo\s*=\s*"([^"]+)"/i);
          if (!lm) continue;
          var im = line.match(/tvg-id\s*=\s*"([^"]+)"/i);
          var nm = line.match(/tvg-name\s*=\s*"([^"]+)"/i);
          var comma = line.lastIndexOf(',');
          var plain = comma >= 0 ? line.substring(comma + 1).trim() : '';
          put(im && im[1], lm[1]);
          put(nm && nm[1], lm[1]);
          put(plain, lm[1]);
        }
      } catch (e) { logApp('LOGO', 'ERROR', 'Playlist M3U non raggiungibile', {}); }
    }
  }

  // Fonte 4: Tundrak / IPTV-Italia (iptvitaplus.m3u con tvg-logo PNG)
  try {
    var res3 = await fetch('https://raw.githubusercontent.com/Tundrak/IPTV-Italia/main/iptvitaplus.m3u', { cache: 'no-store' });
    var text3 = await res3.text();
    text3.split(/\r?\n/).forEach(function (line) {
      if (line.indexOf('#EXTINF') !== 0) return;
      var l = line.match(/tvg-logo\s*=\s*"([^"]+)"/i);
      if (!l) return;
      var i = line.match(/tvg-id\s*=\s*"([^"]+)"/i);
      var n = line.match(/tvg-name\s*=\s*"([^"]+)"/i);
      var c = line.lastIndexOf(',');
      var p = c >= 0 ? line.substring(c + 1).trim() : '';
      put(i && i[1], l[1]);
      put(n && n[1], l[1]);
      put(p, l[1]);
    });
  } catch (e) { logApp('LOGO', 'ERROR', 'Font Tundrak IPTV-Italia non disponibile', {}); }

  // Fonte 5: tv-logo/tv-logos (countries/italy/*.png) + fallback statico R2
  var tvlogos = null;
  try {
    tvlogos = await fetchJson('https://api.github.com/repos/tv-logo/tv-logos/contents/countries/italy');
  } catch (e) {
    try {
      var fb = await fetchJson('https://download.ip-tvsolution.online/IP-TVSOLUTION-TVLogos-Italy.json');
      tvlogos = Object.keys(fb).map(function (name) { return { name: name, download_url: fb[name] }; });
    } catch (e2) { logApp('LOGO', 'ERROR', 'Font tv-logo non disponibile', {}); }
  }
  if (Array.isArray(tvlogos)) {
    tvlogos.forEach(function (item) {
      if (item && /\.png$/i.test(item.name || '') && isDirectPng(item.download_url)) {
        put(item.name, item.download_url);
      }
    });
  }

  // Fonte 6: Cloudje (URL PNG diretti consigliati nella guida loghi)
  var cloudje = {
    'BBC One': 'https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-kingdom/bbc-one-hd-uk.png',
    'BBC Two': 'https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-kingdom/bbc-two-hd-uk.png',
    'ITV1': 'https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-kingdom/itv-1-uk.png',
    'Channel 4': 'https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-kingdom/channel-4-uk.png',
    'Sky Sports Main Event': 'https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-kingdom/sky-sports-main-event-uk.png',
    'CNN': 'https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-states/cnn-us.png',
    'ESPN': 'https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-states/espn-us.png',
    'HBO': 'https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-states/hbo-us.png',
    'Fox News': 'https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-states/fox-news-us.png',
    'Discovery Channel': 'https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/united-states/discovery-channel-us.png'
  };
  Object.keys(cloudje).forEach(function (n) { put(n, cloudje[n]); });

  var found = 0, fallback = 0;
  (state.channels || []).forEach(function (ch) {
    var isPoster = ch.type === 'vod' || ch.type === 'series';
    var cand = lookup(ch);
    if (cand && (!isPoster || !isDirectImage(ch.logo))) { ch.logo = cand; found++; }
    else if (!ch.logo || /^data:/i.test(ch.logo) || (isPoster && !isDirectImage(ch.logo))) {
      ch.logo = isPoster && ch.cover ? ch.cover : initialsLogo(ch.name);
      fallback++;
    }
  });
  saveState();
  try { renderChannelList(); renderSavedSources(); updatePlaylistButton(); } catch (e) {}
  if (btn) { btn.disabled = false; btn.textContent = 'Aggiorna loghi (piu fonti)'; }
  if (!silent) showToast('Loghi aggiornati: ' + found + ' trovati' + (fallback ? ', ' + fallback + ' segnaposto' : ''), 'success');
  logApp('LOGO', 'INFO', 'Aggiornamento loghi multi-fonte', {
    trovati: found, segnaposto: fallback, playlist: active ? active.name : 'tutte'
  });
}
function channelItemHtml(ch, tvIdx) {
  if (state.tvBrowserMode || (state.tvStyle !== false && (!ch.type || ch.type === 'live'))) return tvChannelItemHtml(ch, tvIdx);
  const poster = ch.type === 'vod' || ch.type === 'series';
  const isFav = state.favorites.has(ch.id);
  const isActive = state.currentChannel && state.currentChannel.id === ch.id;
  const typeBadge = ch.type ? `<span style="font-size:9px;padding:1px 4px;border-radius:3px;background:var(--bg3);color:var(--text3);margin-left:4px;">${ch.type.toUpperCase()}</span>` : '';
  return `
    <div class="channel-item ${isActive ? 'active' : ''}" data-id="${escapeHtml(ch.id)}" onclick="playChannelById('${escapeAttr(ch.id)}')">
      <div class="channel-icon ${poster ? 'poster' : ''}" data-initials="${escapeAttr(initialsShort(ch.name))}">${ch.logo ? `<img src="${escapeAttr(ch.logo)}" onerror="this.style.display='none';this.parentElement.textContent=this.parentElement.getAttribute('data-initials')||'IPTV';">` : '${escapeAttr(initialsShort(ch.name))}'}</div>
      <div class="channel-info">
        <div class="channel-name">${escapeHtml(ch.name)}${typeBadge}</div>
        <div class="channel-group">${escapeHtml(ch.group || '')}</div>
      </div>
      <span class="channel-fav" onclick="event.stopPropagation();toggleFav('${escapeAttr(ch.id)}')" title="Preferito">${isFav ? '★' : '☆'}</span>
      <span class="channel-fav" onclick="event.stopPropagation();promptChannelType('${escapeAttr(ch.id)}')" title="Cambia tipo (Live/Film/Serie)">⚙</span>
    </div>
  `;
}

function updateSideNav() {
  const cur = state.navLevel === 'home' ? 'all' : state.navType;
  $$('.side-nav-btn').forEach(b => b.classList.toggle('active', b.dataset.nav === cur));
}

function updateViewModeButton() {
  var b = $('#btnViewMode');
  if (!b) return;
  var grid = state.viewMode === 'grid';
  b.textContent = '▦ Modalità';
  b.title = grid ? 'Modalità: griglia · clicca per lista' : 'Modalità: lista · clicca per griglia';
  var b2 = document.getElementById('btnBrowserViewMode');
  if (b2) b2.textContent = grid ? '▤ Lista' : '▦ Griglia';
}

function toggleViewMode() {
  state.viewMode = state.viewMode === 'grid' ? 'list' : 'grid';
  updateViewModeButton();
  saveState();
  renderChannelList();
  showToast('Vista ' + (state.viewMode === 'grid' ? 'griglia' : 'lista') + ' attivata', 'success');
}

function renderChannelList() {
  updateSideNav();
  const list = $('#channelList');
  list.className = 'channel-list ' + (state.viewMode === 'grid' ? 'grid-view' : 'list-view');
  updateViewModeButton();
  renderTvGroupTabs();

  // Filter by active playlist
  let baseChannels = state.channels.slice();
  if (state.activePlaylist && state.activePlaylist !== 'all') {
    baseChannels = baseChannels.filter(c => c.sourceId === state.activePlaylist);
  }

  // Browser TV: mostra direttamente lista/griglia dei canali del bouquet selezionato
  if (state.tvBrowserMode && state.navLevel !== 'series_detail') {
    if (state.tvView === 'categories') {
      var cType = state.tvType || 'live';
      var cBase = baseChannels.filter(function (c) {
        var t = c.type || 'live';
        return t === cType;
      });
      var cGroups = {}, cKeys = [];
      cBase.forEach(function (c) {
        var g = c.group || 'Generale';
        if (!cGroups[g]) cKeys.push(g);
        cGroups[g] = (cGroups[g] || 0) + 1;
      });
      var cHtml = '<div class="tv-cat-head"><button class="tv-back-line" onclick="tvTab(\'all\')">← Home</button>' +
        '<h3>' + escapeHtml(tvCatLabel(cType)) + ' · Categorie</h3></div>';
      if (cKeys.length) {
        cHtml += '<div class="tv-cat-grid">';
        cKeys.forEach(function (g) {
          cHtml += '<button class="tv-cat-card" onclick="tvEnterCategory(\'' + escapeAttr(g) + '\')">' +
            '<span class="tv-cat-icon">' + escapeHtml((g.trim().charAt(0) || '★').toUpperCase()) + '</span>' +
            '<span class="tv-cat-name">' + escapeHtml(g) + '</span>' +
            '<span class="tv-cat-count">' + cGroups[g] + ' canali</span></button>';
        });
        cHtml += '</div>';
      } else {
        cHtml += '<div class="empty-state"><p>Nessuna categoria ' + escapeHtml(tvCatLabel(cType)) + '</p><p class="hint">Carica una playlist con canali ' + escapeHtml(tvCatLabel(cType)) + '.</p></div>';
      }
      list.innerHTML = cHtml;
      tvUpdatePlayBar();
      return;
    }
    var bMode = state.tvBrowse || 'all';
    var shown = baseChannels.slice();
    if (bMode === 'fav') shown = shown.filter(c => state.favorites.has(c.id));
    else if (bMode === 'live') shown = shown.filter(c => !c.type || c.type === 'live');
    else if (bMode === 'vod') shown = shown.filter(c => c.type === 'vod');
    else if (bMode === 'series') shown = shown.filter(c => c.type === 'series');
    else if (bMode !== 'all') shown = shown.filter(c => (c.group || '') === bMode);
    if (state.searchQuery) {
      var q = state.searchQuery.toLowerCase();
      shown = shown.filter(c => ((c.name || '') + ' ' + (c.group || '')).toLowerCase().includes(q));
    }
    var bGroups = {}, bKeys = [];
    shown.forEach(function (c) {
      var g = c.group || 'Generale';
      if (!bGroups[g]) { bGroups[g] = []; bKeys.push(g); }
      bGroups[g].push(c);
    });
    var bHtml = '';
    if (state.tvCategory) bHtml += '<div class="tv-back-line" onclick="tvBackFromCategory()">← Torna alle categorie ' + escapeHtml(tvCatLabel(state.tvType)) + '</div>';
    var bIdx = 0;
    bKeys.forEach(function (g) {
      bHtml += '<div class="tv-group-head">' + escapeHtml(g) + ' (' + bGroups[g].length + ')</div>';
      bGroups[g].forEach(function (ch) { bHtml += channelItemHtml(ch, bIdx++); });
    });
    if (!shown.length) bHtml = '<div class="empty-state"><p>Nessun canale</p><p class="hint">Carica una playlist o scegli un altro bouquet.</p></div>';
    list.innerHTML = bHtml;
    tvUpdatePlayBar();
    return;
  }

  // HOME LEVEL: show type selection cards
  if (state.navLevel === 'home' && !state.searchQuery) {
    const counts = { live: 0, vod: 0, series: 0, fav: 0 };
    baseChannels.forEach(ch => {
      const t = ch.type || 'live';
      if (counts[t] !== undefined) counts[t]++;
      if (state.favorites.has(ch.id)) counts.fav++;
    });
    // Count all channels per type (all categories always visible)
    const visibleCounts = { live: 0, vod: 0, series: 0, fav: 0 };
    baseChannels.forEach(ch => {
      const t = ch.type || 'live';
      if (visibleCounts[t] !== undefined) visibleCounts[t]++;
      if (state.favorites.has(ch.id)) visibleCounts.fav++;
    });

    let html = '<div style="padding:12px;">';
    html += '<div style="font-size:13px;color:var(--text2);margin-bottom:12px;">Seleziona una categoria</div>';

    const types = [
      { key: 'live', icon: '📡', label: 'Live TV', color: '#34C759', count: visibleCounts.live },
      { key: 'vod', icon: '🎬', label: 'Film / VOD', color: '#FF9500', count: visibleCounts.vod },
      { key: 'series', icon: '📺', label: 'Serie TV', color: '#5856D6', count: visibleCounts.series },
      { key: 'fav', icon: '★', label: 'Preferiti', color: '#FFCC00', count: visibleCounts.fav }
    ];

    types.forEach(t => {
      if (t.count === 0 && t.key !== 'fav') return;
      html += `<div class="type-card" onclick="navigateTo('type','${t.key}')" style="display:flex;align-items:center;gap:12px;padding:14px;margin-bottom:8px;background:var(--bg2);border:1px solid var(--border);border-radius:10px;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.borderColor='${t.color}'" onmouseout="this.style.borderColor='var(--border)'">
        <div style="width:44px;height:44px;border-radius:10px;background:${t.color}22;display:flex;align-items:center;justify-content:center;font-size:22px;">${t.icon}</div>
        <div style="flex:1;">
          <div style="font-size:15px;font-weight:600;color:var(--text);">${t.label}</div>
          <div style="font-size:12px;color:var(--text2);">${t.count} elementi</div>
        </div>
        <div style="color:var(--text3);font-size:18px;">›</div>
      </div>`;
    });

    if (baseChannels.length === 0) {
      html += '<div class="empty-state"><p>Nessun canale caricato</p><p class="hint">Aggiungi una sorgente per iniziare</p></div>';
    }
    html += '</div>';
    list.innerHTML = html;
    return;
  }

  // TYPE LEVEL: show categories for the selected type
  // Le Serie TV seguono lo stesso flusso dei Film: prima la categoria, poi la serie, poi stagioni/episodi.
  // (blocco storico di raggruppamento per nome disattivato)
  if (false && state.navType === 'series' && state.navLevel === 'type') {
    // Use cached grouping if available and channels haven't changed
    if (!state._seriesCache || state._seriesCacheChannelCount !== state.channels.length) {
      const seriesChannels = state.channels.filter(c => (c.type || 'live') === 'series');
      console.log('Series type level. Series channels:', seriesChannels.length);

      // Group by series name
      const seriesMap = {};
      seriesChannels.forEach(ch => {
        let seriesName = extractSeriesName(ch.name || 'Serie sconosciuta');
        if (!seriesMap[seriesName]) seriesMap[seriesName] = [];
        seriesMap[seriesName].push(ch);
      });

      const _seriesNames = Object.keys(seriesMap);
      const _singleEpCount = _seriesNames.filter(n => seriesMap[n].length === 1).length;

      // Only run expensive prefix grouping if needed
      if (_singleEpCount > _seriesNames.length * 0.5 && seriesChannels.length > 5) {
        const regrouped = groupSeriesByPrefix(seriesChannels);
        if (regrouped && Object.keys(regrouped).length < _seriesNames.length) {
          Object.keys(seriesMap).forEach(k => delete seriesMap[k]);
          Object.assign(seriesMap, regrouped);
        }
      }

      // Cache the result
      state._seriesCache = seriesMap;
      state._seriesCacheChannelCount = state.channels.length;
      console.log('Series cached:', Object.keys(seriesMap).length, 'series');
    }

    let seriesMap = state._seriesCache;
    let channels = Object.values(seriesMap).flat();

    if (state.searchQuery) {
      channels = channels.filter(c => (c.name || '').toLowerCase().includes(state.searchQuery));
      // Re-group search results
      const searchMap = {};
      channels.forEach(ch => {
        let seriesName = extractSeriesName(ch.name || 'Serie sconosciuta');
        if (!searchMap[seriesName]) searchMap[seriesName] = [];
        searchMap[seriesName].push(ch);
      });
      seriesMap = searchMap;
    }

    const seriesNames = Object.keys(seriesMap).sort();

    if (seriesNames.length === 0) {
      list.innerHTML = '<div class="empty-state"><p>Nessuna serie</p><p class="hint">Nessun risultato</p></div>';
      return;
    }

    let html = '<div style="padding:8px;">';
    html += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
      <button onclick="navigateTo('home')" style="background:var(--bg3);border:1px solid var(--border);border-radius:4px;padding:4px 10px;cursor:pointer;color:var(--text);font-size:12px;">← Home</button>
      <span style="font-size:13px;color:var(--text2);">📺 Serie TV — ${seriesNames.length} serie</span>
    </div>`;

    seriesNames.forEach(seriesName => {
      const episodes = seriesMap[seriesName];
      const firstCh = episodes[0];
      html += `<div class="category-card" onclick="navigateToSeries('${escapeAttr(seriesName)}')" style="display:flex;align-items:center;gap:10px;padding:12px;margin-bottom:6px;background:var(--bg2);border:1px solid var(--border);border-radius:8px;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.borderColor='#5856D6'" onmouseout="this.style.borderColor='var(--border)'">
        <div style="width:36px;height:36px;border-radius:6px;background:#5856D622;display:flex;align-items:center;justify-content:center;font-size:16px;">📺</div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:13px;font-weight:500;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(seriesName)}</div>
          <div style="font-size:11px;color:var(--text2);">${episodes.length} episodi${firstCh.group ? ' · ' + escapeHtml(firstCh.group) : ''}</div>
        </div>
        <div style="color:var(--text3);font-size:16px;">›</div>
      </div>`;
    });
    html += '</div>';
    list.innerHTML = html;
    return;
  }

  if (state.navLevel === 'type') {
    const type = state.navType;
    const typeLabels = { live: 'Live TV', vod: 'Film / VOD', series: 'Serie TV', fav: 'Preferiti' };
    const typeColors = { live: '#34C759', vod: '#FF9500', series: '#5856D6', fav: '#FFCC00' };
    const typeIcons = { live: '📡', vod: '🎬', series: '📺', fav: '★' };

    let channels = baseChannels.slice();
    // All categories are always visible

    if (type === 'fav') {
      channels = channels.filter(c => state.favorites.has(c.id));
    } else {
      channels = channels.filter(c => (c.type || 'live') === type);
    }

    if (state.searchQuery) {
      channels = channels.filter(c => (c.name || '').toLowerCase().includes(state.searchQuery));
    }

    // Group by group-title
    const groups = {};
    channels.forEach(ch => {
      const g = ch.group || 'Generale';
      if (!groups[g]) groups[g] = [];
      groups[g].push(ch);
    });

    // Serie TV: alfabetico. Live/VOD: playlist, con Sala 2026 in cima e adult/XXX in fondo.
    const groupKeys = sortCategoryKeys(Object.keys(groups), type);

    if (groupKeys.length === 0) {
      list.innerHTML = '<div class="empty-state"><p>Nessun canale</p><p class="hint">Nessun risultato</p></div>';
      return;
    }

    let html = '<div style="padding:8px;">';
    html += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
      <button onclick="navigateTo('home')" style="background:var(--bg3);border:1px solid var(--border);border-radius:4px;padding:4px 10px;cursor:pointer;color:var(--text);font-size:12px;">← Home</button>
      <span style="font-size:13px;color:var(--text2);">${typeIcons[type]} ${typeLabels[type]} — ${groupKeys.length} categorie</span>
    </div>`;

    groupKeys.forEach(group => {
      html += `<div class="category-card" onclick="navigateTo('category','${type}','${escapeAttr(group)}')" style="display:flex;align-items:center;gap:10px;padding:12px;margin-bottom:6px;background:var(--bg2);border:1px solid var(--border);border-radius:8px;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.borderColor='${typeColors[type]}'" onmouseout="this.style.borderColor='var(--border)'">
        <div style="width:36px;height:36px;border-radius:6px;background:${typeColors[type]}22;display:flex;align-items:center;justify-content:center;font-size:16px;">${typeIcons[type]}</div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:13px;font-weight:500;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(group)}</div>
          <div style="font-size:11px;color:var(--text2);">${groups[group].length} elementi</div>
        </div>
        <div style="color:var(--text3);font-size:16px;">›</div>
      </div>`;
    });
    html += '</div>';
    list.innerHTML = html;
    return;
  }

  // SERIES DETAIL LEVEL: show seasons and episodes
  if (state.navLevel === 'series_detail') {
    const series = window._currentSeries;
    if (!series) {
      navigateTo('type', 'series');
      return;
    }

    // Loading state
    if (series.loading) {
      let html = '<div style="padding:8px;">';
      html += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
        <button onclick="navigateTo('type','series')" style="background:var(--bg3);border:1px solid var(--border);border-radius:4px;padding:4px 10px;cursor:pointer;color:var(--text);font-size:12px;">← Serie</button>
        <span style="font-size:13px;color:var(--text2);font-weight:600;">${escapeHtml(series.name)}</span>
      </div>`;
      html += '<div style="text-align:center;padding:40px;"><div class="spinner"></div><p style="margin-top:12px;color:var(--text2);">Caricamento episodi...</p></div>';
      html += '</div>';
      list.innerHTML = html;
      return;
    }

    // Error state
    if (series.error) {
      let html = '<div style="padding:8px;">';
      html += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
        <button onclick="navigateTo('type','series')" style="background:var(--bg3);border:1px solid var(--border);border-radius:4px;padding:4px 10px;cursor:pointer;color:var(--text);font-size:12px;">← Serie</button>
        <span style="font-size:13px;color:var(--text2);font-weight:600;">${escapeHtml(series.name)}</span>
      </div>`;
      html += '<div class="empty-state"><p>Errore caricamento</p><p class="hint">' + escapeHtml(series.error) + '</p></div>';
      html += '</div>';
      list.innerHTML = html;
      return;
    }

    const seasons = series.seasons || {};
    const seasonKeys = state._seriesSeasons || Object.keys(seasons).sort((a, b) => parseInt(a) - parseInt(b));
    const currentSeason = state._seriesCurrentSeason || seasonKeys[0] || '1';
    const episodes = seasons[currentSeason] || [];

    // Series info header
    let infoHtml = '';
    if (series.info && series.info.cover) {
      infoHtml += `<img src="${escapeAttr(series.info.cover)}" style="width:60px;height:90px;object-fit:cover;border-radius:6px;float:left;margin-right:10px;margin-bottom:8px;" onerror="this.style.display='none'">`;
    }
    if (series.info && series.info.plot) {
      infoHtml += `<p style="font-size:11px;color:var(--text2);margin-bottom:8px;line-height:1.4;">${escapeHtml(series.info.plot.substring(0, 200))}${series.info.plot.length > 200 ? '...' : ''}</p>`;
    }
    if (series.info && series.info.genre) {
      infoHtml += `<p style="font-size:10px;color:var(--text3);">Genere: ${escapeHtml(series.info.genre)}</p>`;
    }

    let html = '<div style="padding:8px;">';
    // Back button + series name
    html += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
      <button onclick="navigateTo('type','series')" style="background:var(--bg3);border:1px solid var(--border);border-radius:4px;padding:4px 10px;cursor:pointer;color:var(--text);font-size:12px;">← Serie</button>
      <span style="font-size:13px;color:var(--text2);font-weight:600;">${escapeHtml(series.name)}</span>
    </div>`;
    if (infoHtml) {
      html += `<div style="margin-bottom:12px;padding:8px;background:var(--bg3);border-radius:6px;">${infoHtml}<div style="clear:both;"></div></div>`;
    }

    // Season selector
    if (seasonKeys.length > 1) {
      html += '<div style="display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap;">';
      seasonKeys.forEach(s => {
        const isActive = s === currentSeason;
        html += `<button onclick="switchSeriesSeason('${s}')" style="padding:6px 14px;border-radius:20px;border:1px solid ${isActive ? 'var(--accent)' : 'var(--border)'};background:${isActive ? 'var(--accent)' : 'var(--bg3)'};color:${isActive ? 'white' : 'var(--text2)'};font-size:12px;cursor:pointer;">Stagione ${s}</button>`;
      });
      html += '</div>';
    } else {
      html += `<div style="font-size:12px;color:var(--text2);margin-bottom:12px;">Stagione ${currentSeason} · ${episodes.length} episodi</div>`;
    }

    // Episodes
    if (episodes.length === 0) {
      html += '<div class="empty-state"><p>Nessun episodio</p></div>';
    } else {
      episodes.forEach(ep => {
        const epNum = ep.episode_num || ep.id || '';
        const title = ep.title || ep.name || 'Episodio ' + epNum;
        const duration = (ep.info && ep.info.duration) ? ep.info.duration : '';
        const containerExt = ep.container_extension || 'mp4';
        const plot = (ep.info && ep.info.plot) ? ep.info.plot : '';
        const epId = ep.id || epNum;
        const hasDirectUrl = ep.url && ep.url.length > 0;
        const onclick = hasDirectUrl
          ? "playChannelById('" + escapeAttr(ep.id || epId) + "', true)"
          : "playSeriesEpisode('" + escapeAttr(epId) + "', '" + escapeAttr(containerExt) + "', '" + escapeAttr(series.name) + "', '" + escapeAttr(title) + "')";
        html += `
          <div class="channel-item" style="cursor:pointer;" onclick="${onclick}">
            <div class="channel-icon" style="background:#5856D622;color:#5856D6;font-weight:700;font-size:11px;">S${String(currentSeason).padStart(2,'0')}E${String(epNum).padStart(2,'0')}</div>
            <div class="channel-info">
              <div class="channel-name">${escapeHtml(title)}</div>
              <div class="channel-group">${duration ? '⏱ ' + escapeHtml(duration) + ' · ' : ''}VOD · ${escapeHtml(containerExt.toUpperCase())}</div>
              ${plot ? '<div style="font-size:10px;color:var(--text3);margin-top:2px;">' + escapeHtml(plot.substring(0, 80)) + (plot.length > 80 ? '...' : '') + '</div>' : ''}
            </div>
            <span style="color:var(--accent);font-size:18px;">▶</span>
          </div>
        `;
      });
    }
    html += '</div>';
    list.innerHTML = html;
    return;
  }

  // CATEGORY LEVEL: show channels in the selected category
  if (state.navLevel === 'category') {
    const type = state.navType;
    const category = state.navCategory;

    let channels = baseChannels.slice();
    // Filtra per categoria E tipo: una serie non deve comparire dentro i Film/VOD (e viceversa)
    channels = channels.filter(c =>
      (c.group || 'Generale') === category &&
      (type === 'fav' ? state.favorites.has(c.id) : (c.type || 'live') === type)
    );

    if (state.searchQuery) {
      channels = channels.filter(c => (c.name || '').toLowerCase().includes(state.searchQuery));
    }

    if (channels.length === 0) {
      list.innerHTML = '<div class="empty-state"><p>Nessun canale</p><p class="hint">Nessun risultato</p></div>';
      return;
    }

    // SERIE TV: come per Film/VOD, dopo la categoria mostriamo le serie (poi stagioni → episodi)
    if (type === 'series') {
      const seriesMap = {};
      channels.forEach(ch => {
        const sname = extractSeriesName(ch.name || 'Serie sconosciuta');
        if (!seriesMap[sname]) seriesMap[sname] = [];
        seriesMap[sname].push(ch);
      });
      const seriesNames = Object.keys(seriesMap).sort((a, b) => a.localeCompare(b, 'it'));
      let sh = `<div style="padding:8px 12px;display:flex;align-items:center;gap:8px;border-bottom:1px solid var(--border);margin-bottom:4px;">
        <button onclick="navigateTo('type','series')" style="background:var(--bg3);border:1px solid var(--border);border-radius:4px;padding:4px 10px;cursor:pointer;color:var(--text);font-size:12px;">← Indietro</button>
        <span style="font-size:12px;color:var(--text2);font-weight:600;">📺 ${escapeHtml(category)} (${seriesNames.length} serie)</span>
      </div>`;
      seriesNames.forEach(sname => {
        const eps = seriesMap[sname];
        sh += `<div class="category-card" onclick="navigateToSeries('${escapeAttr(sname)}')" style="display:flex;align-items:center;gap:10px;padding:12px;margin-bottom:6px;background:var(--bg2);border:1px solid var(--border);border-radius:8px;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.borderColor='#5856D6'" onmouseout="this.style.borderColor='var(--border)'">
          <div style="width:36px;height:36px;border-radius:6px;background:#5856D622;display:flex;align-items:center;justify-content:center;font-size:16px;">📺</div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:13px;font-weight:500;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(sname)}</div>
            <div style="font-size:11px;color:var(--text2);">${eps.length} episodi</div>
          </div>
          <div style="color:var(--text3);font-size:16px;">›</div>
        </div>`;
      });
      list.innerHTML = sh;
      return;
    }

    let html = '';
    // Back button
    html += `<div style="padding:8px 12px;display:flex;align-items:center;gap:8px;border-bottom:1px solid var(--border);margin-bottom:4px;">
      <button onclick="navigateTo('type','${state.navType}')" style="background:var(--bg3);border:1px solid var(--border);border-radius:4px;padding:4px 10px;cursor:pointer;color:var(--text);font-size:12px;">← Indietro</button>
      <span style="font-size:12px;color:var(--text2);font-weight:600;">${escapeHtml(category)} (${channels.length})</span>
    </div>`;

    if (type === 'vod') {
      // Raggruppa i film della stessa saga, mantenendo l'ordine della playlist
      const sagaMap = {};
      const sagaOrder = [];
      channels.forEach(ch => {
        const key = extractSagaKey(ch.name);
        if (!sagaMap[key]) { sagaMap[key] = []; sagaOrder.push(key); }
        sagaMap[key].push(ch);
      });
      sagaOrder.forEach(key => {
        const items = sagaMap[key];
        if (items.length > 1) {
          html += `<div style="padding:6px 12px;font-size:11px;color:var(--accent);text-transform:uppercase;letter-spacing:0.5px;border-top:1px solid var(--border);margin-top:6px;">🎬 ${escapeHtml(key)} (${items.length}) — Saga</div>`;
        }
        items.forEach(ch => { html += channelItemHtml(ch); });
      });
    } else {
      channels.forEach(ch => { html += channelItemHtml(ch); });
    }
    list.innerHTML = html;
    return;
  }

  // FALLBACK: flat list (when searching or navLevel is 'all')
  let channels = baseChannels.slice();

  // When searching, group series episodes by series name
  if (state.searchQuery) {
    const seriesGroups = {};
    const nonSeriesChannels = [];
    channels.forEach(ch => {
      if ((ch.type || 'live') === 'series' && (ch.name || '').toLowerCase().includes(state.searchQuery)) {
        let seriesName = extractSeriesName(ch.name || '');
        if (!seriesGroups[seriesName]) seriesGroups[seriesName] = [];
        seriesGroups[seriesName].push(ch);
      } else if ((ch.name || '').toLowerCase().includes(state.searchQuery)) {
        nonSeriesChannels.push(ch);
      }
    });
    const groupedChannels = [];
    Object.keys(seriesGroups).sort((a, b) => a.localeCompare(b, 'it')).forEach(sn => {
      const eps = seriesGroups[sn];
      groupedChannels.push({
        id: 'search_series_' + sn,
        name: sn + ' (' + eps.length + ' episodi)',
        group: eps[0].group || 'Serie TV',
        type: 'series',
        url: '',
        logo: eps[0].logo || '',
        _isSeriesGroup: true,
        _seriesName: sn,
        _episodes: eps
      });
    });
    channels = [...groupedChannels, ...nonSeriesChannels];
  } else {
    if (state.filter === 'live') channels = channels.filter(c => c.type === 'live' || !c.type);
    else if (state.filter === 'vod') channels = channels.filter(c => c.type === 'vod');
    else if (state.filter === 'series') channels = channels.filter(c => c.type === 'series');
    else if (state.filter === 'fav') channels = channels.filter(c => state.favorites.has(c.id));
  }

  if (channels.length === 0) {
    const msg = state.channels.length === 0 ? 'Aggiungi una sorgente per iniziare' :
      (state.searchQuery ? 'Nessun risultato per la ricerca' : 'Nessun canale in questa categoria');
    list.innerHTML = `<div class="empty-state"><p>Nessun canale</p><p class="hint">${msg}</p></div>`;
    return;
  }

  const groups = {};
  channels.forEach(ch => {
    const g = ch.group || 'Generale';
    if (!groups[g]) groups[g] = [];
    groups[g].push(ch);
  });

  let html = '';
  const groupKeys = Object.keys(groups).sort();
  groupKeys.forEach(group => {
    if (groupKeys.length > 1) {
      html += `<div style="padding:8px 12px;font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:0.5px;border-top:1px solid var(--border);margin-top:4px;">${escapeHtml(group)} (${groups[group].length})</div>`;
    }
    var tvIdx = 0;
    groups[group].forEach(ch => { html += channelItemHtml(ch, tvIdx++); });
  });
  list.innerHTML = html;
}

function playChannelById(id, directPlay) {
  // La riproduzione parte sempre nell'anteprima; tvExpandPlayer() ingrandisce.
  // Handle virtual series entries from search
  if (id.startsWith('search_series_')) {
    const seriesName = id.replace('search_series_', '');
    navigateToSeries(seriesName);
    return;
  }
  const ch = state.channels.find(c => c.id === id);
  if (ch) playChannel(ch, directPlay);
  else console.warn('Channel not found:', id);
}

function toggleFav(id) {
  if (state.favorites.has(id)) state.favorites.delete(id);
  else state.favorites.add(id);
  saveState();
  renderChannelList();
}

function escapeHtml(s) {
  const div = document.createElement('div');
  div.textContent = s || '';
  return div.innerHTML;
}

function escapeAttr(s) {
  return (s || '').replace(/'/g, "\'").replace(/"/g, '&quot;');
}

// Saved sources
function renderSavedSources() {
  const container = $('#savedSources');
  if (state.sources.length === 0) {
    container.innerHTML = '<p class="hint">Nessuna sorgente salvata</p>';
    return;
  }
  container.innerHTML = state.sources.map(src => {
    const counts = { live: 0, vod: 0, series: 0 };
    (src.channels || []).forEach(c => { if (counts[c.type] !== undefined) counts[c.type]++; else counts.live++; });
    return `
    <div class="saved-source">
      <div>
        <div class="saved-source-name">${escapeHtml(src.name)}</div>
        <div class="saved-source-type">${src.type.toUpperCase()} · ${src.channels ? src.channels.length : 0} elementi (Live:${counts.live} Film:${counts.vod} Serie:${counts.series})</div>
      </div>
      <button class="btn btn-danger" style="padding:4px 8px;font-size:12px;" onclick="deleteSourceEnhanced('${escapeAttr(src.id)}')">✕</button>
    </div>
  `;
  }).join('');
}

function deleteSource(id) {
  if (!confirm('Eliminare questa sorgente?')) return;
  state.sources = state.sources.filter(s => s.id !== id);
  state.channels = state.channels.filter(c => c.sourceId !== id);
  refreshChannelLogos();
  saveState();
  renderChannelList();
  renderSavedSources();
  showToast('Sorgente eliminata', 'success');
}

// Player controls
function toggleFullscreen() {
  const container = $('#videoContainer');
  if (document.fullscreenElement) document.exitFullscreen();
  else container.requestFullscreen().catch(() => {});
}

async function togglePip() {
  const video = $('#videoPlayer');
  try {
    if (document.pictureInPictureElement) await document.exitPictureInPicture();
    else await video.requestPictureInPicture();
  } catch (e) { showToast('PiP non supportato', 'error'); }
}

// Open series detail by name (for M3U series grouped by name)
function openSeriesByName(seriesName) {
  const episodes = state.channels.filter(ch => {
    if ((ch.type || 'live') !== 'series') return false;
    let name = extractSeriesName(ch.name || '');
    return name === seriesName || name.toLowerCase() === seriesName.toLowerCase() ||
           (ch.name || '').toLowerCase().startsWith(seriesName.toLowerCase());
  });

  if (episodes.length === 0) {
    showToast('Nessun episodio trovato', 'error');
    return;
  }

  // Check if it's an Xtream series (has source with xtream type)
  const firstEp = episodes[0];
  const source = state.sources.find(s => s.id === firstEp.sourceId);
  if (source && source.type === 'xtream' && firstEp.id.startsWith('xtream_series_')) {
    // Use Xtream series detail
    openSeriesDetail(firstEp);
    return;
  }

  // M3U series: show episodes directly
  const modal = $('#seriesModal');
  $('#seriesModalTitle').textContent = seriesName;
  const info = $('#seriesInfo');
  info.innerHTML = `<h3 style="margin-bottom:4px;">${escapeHtml(seriesName)}</h3><p style="font-size:12px;color:var(--text2);">${episodes.length} episodi disponibili</p>`;
  $('#seasonSelector').innerHTML = '';
  $('#episodeList').innerHTML = '';

  // Group episodes by season (extract from name)
  const seasons = {};
  episodes.forEach(ep => {
    let season = '1';
    const match = (ep.name || '').match(/S(\d+)/i) || (ep.name || '').match(/Stagione\s*(\d+)/i) || (ep.name || '').match(/Season\s*(\d+)/i);
    if (match) season = String(parseInt(match[1], 10));
    if (!seasons[season]) seasons[season] = [];
    seasons[season].push(ep);
  });

  const seasonKeys = Object.keys(seasons).sort((a, b) => parseInt(a) - parseInt(b));
  const seasonSel = $('#seasonSelector');
  if (seasonKeys.length > 1) {
    seasonSel.innerHTML = seasonKeys.map((s, i) =>
      `<button class="season-btn ${i === 0 ? 'active' : ''}" onclick="showM3uSeason('${escapeAttr(seriesName)}', '${s}', this)">Stagione ${s}</button>`
    ).join('');
  }

  window._m3uEpisodes = seasons;
  if (seasonKeys.length > 0) {
    showM3uSeason(seriesName, seasonKeys[0]);
  }
  showModal('seriesModal');
}

function showM3uSeason(seriesName, season) {
  const seasons = window._m3uEpisodes || {};
  const episodes = seasons[season] || [];
  const list = $('#episodeList');
  $$('.season-btn').forEach(b => b.classList.remove('active'));
  event && event.target && event.target.classList.add('active');

  if (episodes.length === 0) {
    list.innerHTML = '<p class="hint">Nessun episodio</p>';
    return;
  }
  list.innerHTML = episodes.map(ep => {
    // Extract season and episode numbers
    let seasonNum = season;
    let epNum = '';
    const seMatch = (ep.name || '').match(/S(\d+)\s*E(\d+)/i);
    if (seMatch) { seasonNum = seMatch[1]; epNum = seMatch[2]; }
    else {
      const epMatch = (ep.name || '').match(/E(\d+)/i) || (ep.name || '').match(/Episodio\s*(\d+)/i) || (ep.name || '').match(/Episode\s*(\d+)/i);
      if (epMatch) epNum = epMatch[1];
      const sMatch = (ep.name || '').match(/Stagione\s*(\d+)/i) || (ep.name || '').match(/Season\s*(\d+)/i) || (ep.name || '').match(/S(\d+)/i);
      if (sMatch) seasonNum = sMatch[1];
    }
    // Clean title: remove series name, season/episode info
    let title = ep.name || '';
    title = title.replace(/\s*S\d+\s*E\d+.*/i, '').replace(/\s*Stagione\s*\d+.*/i, '').replace(/\s*Season\s*\d+.*/i, '').trim();
    if (!title || title === seriesName) title = ep.name || 'Episodio ' + epNum;

    return `
      <div class="episode-item" onclick="playChannelById('${escapeAttr(ep.id)}', true)">
        <div class="episode-num">S${seasonNum}E${epNum || '?'}</div>
        <div class="episode-info">
          <div class="episode-title">${escapeHtml(title)}</div>
          <div class="episode-meta">${escapeHtml(seriesName)} · Stagione ${seasonNum}</div>
        </div>
        <span style="color:var(--accent);font-size:18px;">▶</span>
      </div>
    `;
  }).join('');
}

// Series detail (Xtream)
async function openSeriesDetail(channel) {
  const modal = $('#seriesModal');
  $('#seriesModalTitle').textContent = channel.name;
  const info = $('#seriesInfo');
  info.innerHTML = '<p class="hint">Caricamento episodi...</p>';
  $('#seasonSelector').innerHTML = '';
  $('#episodeList').innerHTML = '';
  showModal('seriesModal');

  // Find source
  const source = state.sources.find(s => s.id === channel.sourceId);
  if (!source || source.type !== 'xtream') {
    info.innerHTML = '<p class="hint">Episodi disponibili solo per sorgenti Xtream Codes</p>';
    return;
  }

  try {
    const url = source.url;
    const user = source.user;
    const pass = source.pass;
    const seriesId = channel.id.replace('xtream_series_', '');
    const infoUrl = url + '/player_api.php?username=' + encodeURIComponent(user) + '&password=' + encodeURIComponent(pass) + '&action=get_series_info&series_id=' + seriesId;
    const resp = await fetch(infoUrl);
    const data = await resp.json();
    const seriesInfo = data.info || {};
    const episodes = data.episodes || {};

    // Show info
    let infoHtml = '';
    if (seriesInfo.cover) infoHtml += `<img src="${escapeAttr(seriesInfo.cover)}" class="series-poster" style="float:left;margin-right:12px;" onerror="this.style.display='none'">`;
    infoHtml += `<h3 style="margin-bottom:4px;">${escapeHtml(seriesInfo.name || channel.name)}</h3>`;
    if (seriesInfo.plot) infoHtml += `<p style="font-size:12px;color:var(--text2);margin-bottom:8px;">${escapeHtml(seriesInfo.plot)}</p>`;
    if (seriesInfo.genre) infoHtml += `<p style="font-size:11px;color:var(--text3);">Genere: ${escapeHtml(seriesInfo.genre)}</p>`;
    if (seriesInfo.rating) infoHtml += `<p style="font-size:11px;color:var(--text3);">Rating: ${escapeHtml(String(seriesInfo.rating))}</p>`;
    info.innerHTML = infoHtml;

    // Season selector
    const seasons = Object.keys(episodes).sort((a, b) => parseInt(a) - parseInt(b));
    const seasonSel = $('#seasonSelector');
    seasonSel.innerHTML = seasons.map((s, i) =>
      `<button class="season-btn ${i === 0 ? 'active' : ''}" data-season="${s}" onclick="selectSeason('${escapeAttr(seriesId)}', '${escapeAttr(s)}', this)">${s === '0' ? 'Speciali' : 'Stagione ' + s}</button>`
    ).join('');

    // Store episodes data globally
    window._seriesEpisodes = episodes;
    window._seriesSource = source;

    // Show first season
    if (seasons.length > 0) {
      showSeasonEpisodes(seriesId, seasons[0]);
    }
  } catch (err) {
    info.innerHTML = '<p class="hint">Errore caricamento episodi: ' + escapeHtml(err.message) + '</p>';
    console.error(err);
  }
}

function selectSeason(seriesId, season, btn) {
  $$('.season-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  showSeasonEpisodes(seriesId, season);
}

function showSeasonEpisodes(seriesId, season) {
  const episodes = (window._seriesEpisodes || {})[season] || [];
  const list = $('#episodeList');
  if (episodes.length === 0) {
    list.innerHTML = '<p class="hint">Nessun episodio in questa stagione</p>';
    return;
  }
  list.innerHTML = episodes.map(ep => {
    const epNum = ep.episode_num || ep.id;
    // Try multiple fields for title
    const title = ep.title || ep.name || (ep.info && ep.info.name) || (ep.info && ep.info.title) || 'Episodio ' + epNum;
    const duration = (ep.info && ep.info.duration) ? ep.info.duration : (ep.duration || '');
    const containerExt = ep.container_extension || (ep.info && ep.info.container_extension) || 'mp4';
    const plot = (ep.info && ep.info.plot) ? ep.info.plot : (ep.plot || '');
    const rating = (ep.info && ep.info.rating) ? ep.info.rating : '';
    return `
      <div class="episode-item" onclick="playEpisode('${escapeAttr(ep.id)}', '${escapeAttr(containerExt)}')">
        <div class="episode-num">S${String(season).padStart(2,'0')}E${String(epNum).padStart(2,'0')}</div>
        <div class="episode-info">
          <div class="episode-title">${escapeHtml(title)}</div>
          <div class="episode-meta">
            ${duration ? '⏱ ' + escapeHtml(duration) + ' · ' : ''}VOD · ${escapeHtml(containerExt.toUpperCase())}
            ${rating ? ' · ⭐ ' + escapeHtml(String(rating)) : ''}
            ${plot ? '<br>' + escapeHtml(plot.substring(0, 120)) + (plot.length > 120 ? '...' : '') : ''}
          </div>
        </div>
        <span style="color:var(--accent);font-size:18px;">▶</span>
      </div>
    `;
  }).join('');
}

async function playEpisode(episodeId, ext, seriesName, title) {
  // ===== Parental Control PIN gate =====
  if (pinLockEnabled()) {
    const pinState = getPinState();
    if (Date.now() < pinState.lockUntil) {
      const waitSec = Math.ceil((pinState.lockUntil - Date.now()) / 1000);
      showToast('Troppi tentativi di PIN. Riprova tra ' + waitSec + ' secondi.', 'error');
      return;
    }
    showPinModal(() => startEpisodePlayback(episodeId, ext, seriesName, title));
    return;
  }
  await startEpisodePlayback(episodeId, ext, seriesName, title);
}

async function startEpisodePlayback(episodeId, ext, seriesName, title) {
  const source = window._seriesSource;
  if (!source) {
    showToast('Sorgente non trovata. Riprova.', 'error');
    return;
  }
  const safeExt = ext || 'mp4';
  let url = null;
  if (source.user && source.pass) {
    // Xtream Codes source: build series URL
    url = source.url + '/series/' + source.user + '/' + source.pass + '/' + episodeId + '.' + safeExt;
  } else {
    // M3U source: look for the episode channel with its URL
    const chEp = state.channels.find(c => c.id === episodeId || c.id === 'xtream_series_' + episodeId);
    if (chEp && chEp.url) {
      url = chEp.url;
    } else {
      url = source.url + '/series/' + source.user + '/' + source.pass + '/' + episodeId + '.' + safeExt;
    }
  }
  console.log('Playing episode:', url);
  const video = $('#videoPlayer');
  const epLabel = (seriesName ? (title ? seriesName + ' - ' + title : seriesName) : 'Episodio ' + episodeId);
  $('#currentChannelName').textContent = epLabel;
  $('#currentChannelInfo').textContent = 'Serie TV · ' + safeExt.toUpperCase();

  if (state.hls) { state.hls.destroy(); state.hls = null; }

  // Auto-convert .ts to .m3u8
  let playUrl = url;
  if (url.toLowerCase().includes('.ts') && !url.toLowerCase().includes('.m3u8')) {
    playUrl = url.replace(/\.ts(\?|$)/i, '.m3u8$1');
  }
  const isHls = playUrl.toLowerCase().includes('.m3u8');

  if (isHls) {
    if (typeof Hls === 'undefined') {
      video.src = playUrl;
      video.play().catch(err => console.error('Native play failed:', err));
    } else if (Hls.isSupported()) {
      state.hls = new Hls({ enableWorker: true, lowLatencyMode: true, backBufferLength: 90 });
      state.hls.loadSource(playUrl);
      state.hls.attachMedia(video);
      state.hls.on(Hls.Events.MANIFEST_PARSED, () => { video.play().catch(err => console.warn('Play failed:', err)); });
      state.hls.on(Hls.Events.ERROR, (e, data) => {
        if (data.fatal) {
          showToast('Errore HLS. Prova con output=m3u8.', 'error');
          state.hls.destroy();
          state.hls = null;
        }
      });
    } else {
      video.src = playUrl;
      video.play().catch(() => {});
    }
  } else {
    video.src = playUrl;
    video.load();
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(err => {
        console.error('Play error:', err, 'URL:', playUrl);
        if (err.name === 'NotSupportedError') {
          showToast('Formato non supportato. Prova a cambiare output=m3u8 nell\'URL della sorgente.', 'error');
        } else if (err.name === 'NotAllowedError') {
          showToast('Riproduzione bloccata. Clicca sul video per avviare.', 'error');
        } else {
          showToast('Impossibile riprodurre: ' + err.message, 'error');
        }
      });
    }
  }
  hideModal('seriesModal');
}

// EPG from XMLTV
async function loadEpgFromUrl() {
  const url = $('#settingEpgUrl').value.trim();
  if (!url) { showToast('Inserisci un URL XMLTV', 'error'); return; }
  state.settings.epgUrl = url;
  saveState();
  showLoading('Caricamento EPG...');
  try {
    state._epgLoading = false;
    await ensureEpgLoaded();
    const total = Object.values(state.epgData || {}).reduce((s, a) => s + a.length, 0);
    if (total > 0) showToast('EPG caricato: ' + total + ' programmi', 'success');
    else showToast('Nessun programma EPG trovato', 'warning');
  } finally { hideLoading(); }
}

function normalizeEpgName(s) {
  return String(s || '').toLowerCase()
    .replace(/\b(hd|fhd|uhd|sd)\b/g, ' ')
    .replace(/[^a-z0-9à-ÿ]+/g, ' ')
    .trim();
}
function findEpgKey(channel) {
  const data = state.epgData || {};
  if (channel.epgId && data[channel.epgId]) return channel.epgId;
  if (channel.id && data[channel.id]) return channel.id;
  const target = normalizeEpgName(channel.name);
  const names = state._epgNames || {};
  if (!target) return null;
  for (const name in names) {
    if (normalizeEpgName(name) === target) return names[name];
  }
  for (const name in names) {
    const n = normalizeEpgName(name);
    if (n && (n.indexOf(target) >= 0 || target.indexOf(n) >= 0)) return names[name];
  }
  return null;
}

// Enhanced EPG display
function loadEpg(channel) {
  const panel = $('#epgPanel');
  panel.style.display = 'flex';
  const content = $('#epgContent');
  content.innerHTML = '<p class="hint">Caricamento guida...</p>';

  setTimeout(() => {
    const epgData = state.epgData || {};
    const key = findEpgKey(channel);
    const channelEpg = key ? (epgData[key] || []) : [];
    const now = new Date();
    const totalProgrammi = Object.values(epgData).reduce((s, a) => s + a.length, 0);

    if (channelEpg.length === 0) {
      const msg = totalProgrammi > 0
        ? 'Guida TV caricata, ma nessun programma per questo canale'
        : 'Guida TV non disponibile: controlla la connessione';
      content.innerHTML = `
        <div class="epg-item">
          <div class="epg-time">Ora</div>
          <div class="epg-title">${escapeHtml(channel.name)}</div>
          <div class="epg-desc">Riproduzione in corso · ${channel.type ? channel.type.toUpperCase() : ''}</div>
        </div>
        <div class="epg-item">
          <div class="epg-time">📺</div>
          <div class="epg-title">${msg}</div>
          <div class="epg-desc">${totalProgrammi > 0 ? totalProgrammi + ' programmi disponibili per altri canali' : 'La guida si carica automaticamente all\'avvio'}</div>
        </div>
      `;
      return;
    }

    // Parse and filter current/upcoming
    const parsed = channelEpg.map(p => {
      const start = parseXmltvTime(p.start);
      const stop = parseXmltvTime(p.stop);
      return { ...p, startDate: start, stopDate: stop };
    }).sort((a, b) => a.startDate - b.startDate);

    const current = parsed.find(p => p.startDate <= now && p.stopDate > now);
    const upcoming = parsed.filter(p => p.startDate > now).slice(0, 5);

    let html = '';
    if (current) {
      html += `<div class="epg-item epg-now">
        <div class="epg-time">${formatTime(current.startDate)} - ${formatTime(current.stopDate)} (IN ONDA)</div>
        <div class="epg-title">${escapeHtml(current.title)}</div>
        ${current.desc ? `<div class="epg-desc">${escapeHtml(current.desc)}</div>` : ''}
      </div>`;
    }
    upcoming.forEach(p => {
      html += `<div class="epg-item epg-upcoming">
        <div class="epg-time">${formatTime(p.startDate)} - ${formatTime(p.stopDate)}</div>
        <div class="epg-title">${escapeHtml(p.title)}</div>
        ${p.desc ? `<div class="epg-desc">${escapeHtml(p.desc.substring(0, 100))}</div>` : ''}
      </div>`;
    });
    if (!current && upcoming.length === 0) {
      html = '<p class="hint">Nessun programma trovato per questo canale</p>';
    }
    content.innerHTML = html;
  }, 200);
}

function parseXmltvTime(str) {
  if (!str) return new Date();
  // Format: 20231225120000 +0100
  const match = str.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})\s*([+-]\d{4})?$/);
  if (!match) return new Date(str);
  const [, y, mo, d, h, mi, s, tz] = match;
  let dateStr = `${y}-${mo}-${d}T${h}:${mi}:${s}`;
  if (tz) {
    const tzSign = tz[0];
    const tzH = tz.substring(1, 3);
    const tzM = tz.substring(3, 5);
    dateStr += `${tzSign}${tzH}:${tzM}`;
  }
  return new Date(dateStr);
}

function formatTime(date) {
  if (!(date instanceof Date) || isNaN(date)) return '--:--';
  return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}

// Analyze playlist structure
function analyzePlaylist() {
  if (state.channels.length === 0) {
    showToast('Nessun canale caricato. Carica una playlist prima.', 'warning');
    return;
  }
  // Collect unique group titles and their counts
  const groups = {};
  state.channels.forEach(ch => {
    const g = ch.group || '(nessun gruppo)';
    if (!groups[g]) groups[g] = { count: 0, types: {}, sampleUrl: '' };
    groups[g].count++;
    groups[g].types[ch.type] = (groups[g].types[ch.type] || 0) + 1;
    if (!groups[g].sampleUrl && ch.url) groups[g].sampleUrl = ch.url;
  });

  const sorted = Object.keys(groups).sort((a, b) => groups[b].count - groups[a].count);

  // Separate groups by dominant type
  const byType = { live: [], vod: [], series: [] };
  sorted.forEach(g => {
    const info = groups[g];
    const types = Object.keys(info.types);
    let dominant = 'live';
    let maxCount = 0;
    types.forEach(t => {
      if (info.types[t] > maxCount) { maxCount = info.types[t]; dominant = t; }
    });
    if (!byType[dominant]) byType[dominant] = [];
    byType[dominant].push({ name: g, ...info });
  });

  let html = '<div style="max-height:500px;overflow-y:auto;">';
  html += '<h3 style="margin-bottom:8px;">Analisi Playlist (' + state.channels.length + ' canali)</h3>';

  // Summary counts
  const totalLive = state.channels.filter(c => (c.type || 'live') === 'live').length;
  const totalVod = state.channels.filter(c => c.type === 'vod').length;
  const totalSeries = state.channels.filter(c => c.type === 'series').length;
  html += '<div style="display:flex;gap:12px;margin-bottom:12px;font-size:12px;">';
  html += '<span style="color:#34C759;">Live: ' + totalLive + '</span>';
  html += '<span style="color:#FF9500;">Film: ' + totalVod + '</span>';
  html += '<span style="color:#5856D6;">Serie: ' + totalSeries + '</span>';
  html += '</div>';

  // Groups separated by type
  ['live', 'vod', 'series'].forEach(type => {
    const typeGroups = byType[type] || [];
    if (typeGroups.length === 0) return;
    const totalCount = typeGroups.reduce((s, g) => s + g.count, 0);
    const typeLabel = type === 'live' ? 'LIVE TV' : type === 'vod' ? 'FILM / VOD' : 'SERIE TV';
    const typeColor = type === 'live' ? '#34C759' : type === 'vod' ? '#FF9500' : '#5856D6';

    html += '<div style="margin-bottom:16px;">';
    html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;padding:6px 8px;border-radius:6px;background:var(--bg3);">';
    html += '<span style="font-weight:700;color:' + typeColor + ';">' + typeLabel + '</span>';
    html += '<span style="margin-left:auto;font-size:11px;color:var(--text2);">' + typeGroups.length + ' categorie . ' + totalCount + ' canali</span>';
    html += '</div>';
    html += '<table style="width:100%;font-size:11px;border-collapse:collapse;">';
    typeGroups.sort((a, b) => b.count - a.count).forEach(g => {
      const typeStr = Object.keys(g.types).map(t => t + ':' + g.types[t]).join(', ');
      const shortUrl = g.sampleUrl ? g.sampleUrl.replace(/^https?:\/\/[^\/]+/, '').substring(0, 50) : '';
      html += '<tr style="border-bottom:1px solid var(--border);">';
      html += '<td style="padding:3px 4px;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="' + escapeHtml(g.name) + '">' + escapeHtml(g.name) + '</td>';
      html += '<td style="text-align:right;padding:3px 4px;">' + g.count + '</td>';
      html += '<td style="padding:3px 4px;font-size:10px;">' + typeStr + '</td>';
      html += '<td style="padding:3px 4px;font-size:9px;color:var(--text3);max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="' + escapeHtml(g.sampleUrl) + '">' + escapeHtml(shortUrl) + '</td>';
      html += '</tr>';
    });
    html += '</table>';
    html += '</div>';
  });
  html += '</div>';

  const overlay = document.createElement('div');
  overlay.className = 'dynamic-overlay';
  overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);z-index:10000;display:flex;align-items:center;justify-content:center;';
  const content = document.createElement('div');
  content.style.cssText = 'background:var(--bg2);border-radius:12px;padding:20px;max-width:700px;width:95%;max-height:85vh;overflow-y:auto;';
  content.innerHTML = html + '<button class="btn btn-primary" style="margin-top:12px;width:100%;" onclick="this.parentElement.parentElement.remove()">Chiudi</button>';
  overlay.appendChild(content);
  document.body.appendChild(overlay);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}

// Category overview: show all groups separated by Live/VOD/Series
function showCategoryOverview() {
  const overviewChannels = (state.activePlaylist && state.activePlaylist !== 'all')
    ? state.channels.filter(function (c) { return c.sourceId === state.activePlaylist; })
    : state.channels;
  if (overviewChannels.length === 0) {
    showToast('Nessun canale caricato', 'warning');
    return;
  }

  const byType = { live: {}, vod: {}, series: {} };
  overviewChannels.forEach(ch => {
    const type = ch.type || 'live';
    const group = ch.group || 'Generale';
    if (!byType[type]) byType[type] = {};
    if (!byType[type][group]) byType[type][group] = 0;
    byType[type][group]++;
  });

  const typeLabels = { live: '📡 LIVE TV', vod: '🎬 FILM / VOD', series: '📺 SERIE TV' };
  const typeColors = { live: '#34C759', vod: '#FF9500', series: '#5856D6' };

  let html = '<div style="max-height:500px;overflow-y:auto;">';
  html += '<h3 style="margin-bottom:12px;">Categorie per tipo</h3>';
  html += '<input type="text" id="catSearchInput" placeholder="Cerca categoria..." style="width:100%;padding:8px 12px;margin-bottom:12px;background:var(--bg3);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:13px;" oninput="filterCategoryOverview(this.value)">';

  ['live', 'vod', 'series'].forEach(type => {
    const groups = byType[type];
    const groupKeys = sortCategoryKeys(Object.keys(groups), type);
    const totalCount = Object.values(groups).reduce((s, c) => s + c, 0);
    if (groupKeys.length === 0) return;

    html += `<div data-cat-section style="margin-bottom:16px;">`;
    html += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;padding:8px;border-radius:6px;background:var(--bg3);">`;
    html += `<span style="font-size:16px;">${typeLabels[type].split(' ')[0]}</span>`;
    html += `<span style="font-weight:700;color:${typeColors[type]};">${typeLabels[type].split(' ').slice(1).join(' ')}</span>`;
    html += `<span style="margin-left:auto;font-size:12px;color:var(--text2);">${groupKeys.length} categorie · ${totalCount} canali</span>`;
    html += `</div>`;

    groupKeys.forEach(g => {
      html += `<div data-cat-row data-cat-name="${escapeAttr(g)}" style="display:flex;justify-content:space-between;align-items:center;padding:6px 8px;font-size:12px;border-bottom:1px solid var(--border);cursor:pointer;transition:background 0.15s;" onmouseover="this.style.background='var(--bg3)'" onmouseout="this.style.background=''" onclick="navigateToCategory('${escapeAttr(type)}','${escapeAttr(g)}')">
        <span style="color:var(--text);flex:1;">${escapeHtml(g)}</span>
        <span style="color:var(--text2);margin-right:8px;">${groups[g]}</span>
        <span style="display:flex;gap:2px;align-items:center;">
          <span style="color:var(--accent);font-size:14px;">›</span>
        </span>
      </div>`;
    });
    html += `</div>`;
  });

  html += '</div>';

  const overlay = document.createElement('div');
  overlay.className = 'dynamic-overlay';
  overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);z-index:10000;display:flex;align-items:center;justify-content:center;';
  const content = document.createElement('div');
  content.style.cssText = 'background:var(--bg2);border-radius:12px;padding:20px;max-width:600px;width:90%;max-height:85vh;overflow-y:auto;';
  content.innerHTML = html + '<button class="btn btn-primary" style="margin-top:12px;width:100%;" onclick="this.parentElement.parentElement.remove()">Chiudi</button>';
  overlay.appendChild(content);
  document.body.appendChild(overlay);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}

// Show raw M3U content
function showRawM3u() {
  if (state.sources.length === 0) {
    showToast('Nessuna sorgente caricata', 'warning');
    return;
  }
  const src = state.sources[0];
  if (!src.rawText) {
    showToast('Contenuto raw non disponibile per questa sorgente', 'warning');
    return;
  }
  const lines = src.rawText.split(/\r?\n/);
  const preview = lines.slice(0, 50).join('\n');
  const overlay = document.createElement('div');
  overlay.className = 'dynamic-overlay';
  overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);z-index:10000;display:flex;align-items:center;justify-content:center;';
  const content = document.createElement('div');
  content.style.cssText = 'background:var(--bg2);border-radius:12px;padding:20px;max-width:800px;width:95%;max-height:85vh;overflow-y:auto;';
  content.innerHTML = '<h3 style="margin-bottom:12px;">Contenuto raw M3U (prime 50 righe)</h3>' +
    '<pre style="font-size:11px;color:var(--text2);background:var(--bg3);padding:12px;border-radius:8px;overflow-x:auto;white-space:pre-wrap;word-break:break-all;">' + escapeHtml(preview) + '</pre>' +
    '<p style="font-size:11px;color:var(--text3);margin-top:8px;">Totale righe: ' + lines.length + '</p>' +
    '<button class="btn btn-primary" style="margin-top:12px;width:100%;" onclick="this.parentElement.parentElement.remove()">Chiudi</button>';
  overlay.appendChild(content);
  document.body.appendChild(overlay);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}

// Reclassify a category (change all channels in that group to a new type)
function reclassifyCategory(group, newType) {
  let count = 0;
  state.channels.forEach(ch => {
    if ((ch.group || 'Generale') === group) {
      ch.type = newType;
      count++;
    }
  });
  // Also update in sources
  state.sources.forEach(src => {
    if (src.channels) {
      src.channels.forEach(ch => {
        if ((ch.group || 'Generale') === group) ch.type = newType;
      });
    }
  });
  saveState();
  showToast(count + ' canali riclassificati come ' + (newType === 'vod' ? 'Film' : newType === 'series' ? 'Serie TV' : 'Live'), 'success');
  // Re-render
  showCategoryOverview();
  renderChannelList();
}

// Re-categorize all channels
function recategorizeAll() {
  let count = 0;
  state.channels.forEach(ch => {
    const oldType = ch.type;
    ch.type = detectChannelType(ch.name, ch.group, ch.url, {});
    if (oldType !== ch.type) count++;
  });
  state._seriesCache = null;
  state._seriesCacheChannelCount = 0;
  state.sources.forEach(src => {
    if (src.channels) {
      src.channels.forEach(ch => {
        ch.type = detectChannelType(ch.name, ch.group, ch.url, {});
      });
    }
  });
  saveState();
  renderChannelList();
  showToast('Ricategorizzati ' + state.channels.length + ' canali (' + count + ' modificati)', 'success');
}

// Navigate to a specific category from the category overview
function navigateToCategory(type, category) {
  // Close the dynamic overlay
  document.querySelectorAll('.dynamic-overlay').forEach(el => el.remove());
  // Also close any open modal
  $$('.modal').forEach(m => m.classList.remove('active'));
  navigateTo('category', type, category);
}

// Filter category overview by search term
function filterCategoryOverview(term) {
  term = (term || '').toLowerCase();
  document.querySelectorAll('[data-cat-row]').forEach(row => {
    const name = (row.getAttribute('data-cat-name') || '').toLowerCase();
    row.style.display = name.includes(term) ? '' : 'none';
  });
  // Also hide empty type sections
  document.querySelectorAll('[data-cat-section]').forEach(section => {
    const visibleRows = section.querySelectorAll('[data-cat-row]:not([style*="display: none"])');
    section.style.display = visibleRows.length > 0 ? '' : 'none';
  });
}

// Debug info
function showDebugInfo() {
  const video = $('#videoPlayer');
  const info = [
    'Browser: ' + navigator.userAgent,
    'HLS.js: ' + (typeof Hls !== 'undefined' ? 'loaded (v' + (Hls.version || '?') + ')' : 'NOT loaded'),
    'Video src: ' + (video.src || '(vuoto)'),
    'Video readyState: ' + video.readyState,
    'Video networkState: ' + video.networkState,
    'Video error: ' + (video.error ? video.error.code + ' - ' + video.error.message : 'nessuno'),
    'Can play HLS: ' + video.canPlayType('application/vnd.apple.mpegurl'),
    'Can play MP4: ' + video.canPlayType('video/mp4'),
    'Can play WebM: ' + video.canPlayType('video/webm'),
    'Current channel: ' + (state.currentChannel ? state.currentChannel.name + ' (' + state.currentChannel.type + ')' : 'nessuno'),
    'Channel URL: ' + (state.currentChannel ? state.currentChannel.url : 'N/A'),
    'Total channels: ' + state.channels.length,
    'HLS instance: ' + (state.hls ? 'active' : 'none')
  ].join('\n');
  alert(info);
  console.log('Debug info:', info);
}

// Playlist management
async function reloadAllSources() {
  if (state.sources.length === 0) { showToast('Nessuna sorgente da ricaricare', 'warning'); return; }
  if (!confirm('Ricaricare tutte le ' + state.sources.length + ' sorgenti?')) return;
  showLoading('Ricaricamento sorgenti...');
  let success = 0, failed = 0;
  for (const src of state.sources) {
    try {
      if (src.type === 'm3u' || src.type === 'file') {
        let text;
        try {
          const resp = await fetch(src.url);
          if (!resp.ok) throw new Error('HTTP ' + resp.status);
          text = await resp.text();
        } catch (e) {
          const proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(src.url);
          const resp = await fetch(proxyUrl);
          if (!resp.ok) throw new Error('HTTP ' + resp.status);
          text = await resp.text();
        }
        const channels = parseM3u(text);
        if (channels.length > 0) {
          src.channels = channels;
          success++;
        } else { failed++; }
      } else if (src.type === 'xtream') {
        // Re-fetch Xtream channels
        const url = src.url;
        const user = src.user;
        const pass = src.pass;
        const channels = [];
        try {
          const liveUrl = url + '/player_api.php?username=' + encodeURIComponent(user) + '&password=' + encodeURIComponent(pass) + '&action=get_live_streams';
          const liveResp = await fetch(liveUrl);
          const liveData = await liveResp.json();
          const catUrl = url + '/player_api.php?username=' + encodeURIComponent(user) + '&password=' + encodeURIComponent(pass) + '&action=get_live_categories';
          const catResp = await fetch(catUrl);
          const catData = await catResp.json();
          const catMap = {};
          (catData || []).forEach(c => catMap[c.category_id] = c.category_name);
          (liveData || []).forEach(ch => {
            channels.push({
              id: 'xtream_' + ch.stream_id,
              name: ch.name || 'Canale ' + ch.stream_id,
              logo: ch.stream_icon || '',
              group: catMap[ch.category_id] || 'Live',
              epgId: ch.epg_channel_id || '',
              url: url + '/live/' + user + '/' + pass + '/' + ch.stream_id + '.ts',
              type: 'live'
            });
          });
        } catch (e) { console.warn('Live reload failed:', e); }
        try {
          const vodUrl = url + '/player_api.php?username=' + encodeURIComponent(user) + '&password=' + encodeURIComponent(pass) + '&action=get_vod_streams';
          const vodResp = await fetch(vodUrl);
          const vodData = await vodResp.json();
          const vodCatUrl = url + '/player_api.php?username=' + encodeURIComponent(user) + '&password=' + encodeURIComponent(pass) + '&action=get_vod_categories';
          const vodCatResp = await fetch(vodCatUrl);
          const vodCatData = await vodCatResp.json();
          const vodCatMap = {};
          (vodCatData || []).forEach(c => vodCatMap[c.category_id] = c.category_name);
          (vodData || []).forEach(v => {
            channels.push({
              id: 'xtream_vod_' + v.stream_id,
              name: v.name || 'VOD ' + v.stream_id,
              logo: v.stream_icon || '',
              group: vodCatMap[v.category_id] || 'VOD',
              url: url + '/movie/' + user + '/' + pass + '/' + v.stream_id + '.' + (v.container_extension || 'mp4'),
              type: 'vod'
            });
          });
        } catch (e) { console.warn('VOD reload failed:', e); }
        src.channels = channels;
        success++;
      } else {
        failed++;
      }
    } catch (err) {
      console.error('Reload failed for:', src.name, err);
      failed++;
    }
  }
  // Rebuild channels array
  state.channels = [];
  state.sources.forEach(src => {
    if (src.channels) {
      state.channels.push(...src.channels.map(ch => ({ ...ch, sourceId: src.id })));
    }
  });
  state._seriesCache = null;
  state._seriesCacheChannelCount = 0;
  refreshChannelLogos();
  saveState();
  renderChannelList();
  renderSavedSources();
  hideLoading();
  showToast('Ricaricate: ' + success + ' OK, ' + failed + ' errori', success > 0 ? 'success' : 'error');
}

function exportPlaylists() {
  if (state.sources.length === 0) { showToast('Nessuna sorgente da esportare', 'warning'); return; }
  const data = {
    exported: new Date().toISOString(),
    app: 'IP-TVSOLUTION Web',
    sources: state.sources.map(s => ({
      name: s.name,
      type: s.type,
      url: s.url,
      channels: s.channels ? s.channels.length : 0
    }))
  };
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'iptv-playlists-' + new Date().toISOString().slice(0,10) + '.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('Lista playlist esportata', 'success');
}

// Enhanced deleteSource with confirmation
function deleteSourceEnhanced(id) {
  const src = state.sources.find(s => s.id === id);
  if (!src) return;
  const chCount = src.channels ? src.channels.length : 0;
  if (!confirm('Eliminare "' + src.name + '" (' + chCount + ' canali)?')) return;
  state.sources = state.sources.filter(s => s.id !== id);
  state.channels = state.channels.filter(c => c.sourceId !== id);
  state._seriesCache = null;
  state._seriesCacheChannelCount = 0;
  refreshChannelLogos();
  saveState();
  renderChannelList();
  renderSavedSources();
  showToast('Playlist eliminata: ' + src.name, 'success');
}

// Playlist selector
function showPlaylistSelector() {
  const list = $('#playlistList');
  if (state.sources.length === 0) {
    list.innerHTML = '<p class="hint">Nessuna playlist salvata</p>';
  } else {
    list.innerHTML = state.sources.map(src => {
      const isActive = state.activePlaylist === src.id;
      const count = src.channels ? src.channels.length : 0;
      const counts = { live: 0, vod: 0, series: 0 };
      (src.channels || []).forEach(c => { if (counts[c.type] !== undefined) counts[c.type]++; });
      return `<div class="saved-source" style="cursor:pointer;${isActive ? 'border:2px solid var(--accent);' : ''}" onclick="filterByPlaylist('${escapeAttr(src.id)}')">
        <div>
          <div class="saved-source-name">${escapeHtml(src.name)} ${isActive ? '✓' : ''}</div>
          <div class="saved-source-type">${src.type.toUpperCase()} · ${count} elementi (L:${counts.live} F:${counts.vod} S:${counts.series})</div>
        </div>
        <button class="btn btn-danger" style="padding:4px 8px;font-size:12px;" onclick="event.stopPropagation();deleteSourceEnhanced('${escapeAttr(src.id)}')">✕</button>
      </div>`;
    }).join('');
  }
  // Update active playlist name in button
  updatePlaylistButton();
  showModal('playlistModal');
}

function filterByPlaylist(sourceId) {
  state.activePlaylist = sourceId;
  state.searchQuery = '';
  var searchField = document.getElementById('searchChannels');
  if (searchField) searchField.value = '';
  state._seriesCache = null;
  state._seriesCacheChannelCount = 0;
  saveState();
  hideModal('playlistModal');
  renderSavedSources();
  // Torna alla home e renderizza subito i canali della playlist selezionata
  navigateTo('home', null, null);
  updatePlaylistButton();
  const src = state.sources.find(s => s.id === sourceId);
  if (sourceId === 'all') {
    showToast('Tutte le playlist (' + state.channels.length + ' canali)', 'success');
  } else if (src) {
    showToast('Playlist: ' + src.name, 'success');
  }
}

function updatePlaylistButton() {
  const btn = $('#btnPlaylistSelector');
  if (!btn) return;
  if (state.activePlaylist === 'all') {
    btn.textContent = '📋 Playlist';
    btn.title = 'Tutte le playlist';
  } else {
    const src = state.sources.find(s => s.id === state.activePlaylist);
    btn.textContent = src ? '📋 Playlist · ' + src.name : '📋 Playlist';
    btn.title = src ? src.name : 'Playlist';
  }
}

// Data management
function exportData() {
  const data = JSON.stringify({ sources: state.sources, favorites: [...state.favorites], settings: state.settings }, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'iptv-solution-backup.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('Dati esportati', 'success');
}

function clearData() {
  if (!confirm('Cancellare tutti i dati? Questa azione è irreversibile.')) return;
  localStorage.removeItem(STORAGE_KEY);
  state.sources = [];
  state.channels = [];
  state.favorites = new Set();
  state.currentChannel = null;
  $('#videoPlayer').src = '';
  renderChannelList();
  renderSavedSources();
  showToast('Dati cancellati', 'success');
}
