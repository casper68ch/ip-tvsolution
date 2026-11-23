/* IP-TVSOLUTION - deterrente anti-clone.
   Nota: nessun sito statico è "non clonabile" al 100%; questo rende
   difficile la copia casuale (tasto destro, selezione, drag, devtools). */
(function () {
  "use strict";

  // 1. Niente menu contestuale (tasto destro)
  document.addEventListener("contextmenu", function (e) { e.preventDefault(); }, { passive: false });

  // 2. Niente copia / taglia / incolla / salva / sorgente / devtools
  document.addEventListener("keydown", function (e) {
    var k = (e.key || "").toLowerCase();
    var ctrl = e.ctrlKey || e.metaKey;
    if (k === "f12") { e.preventDefault(); return; }
    if (ctrl && ["c", "x", "v", "u", "s", "p", "i", "j"].indexOf(k) !== -1) { e.preventDefault(); return; }
    if (ctrl && e.shiftKey && ["i", "c", "j", "k"].indexOf(k) !== -1) { e.preventDefault(); return; }
  }, { passive: false });

  // 3. Niente selezione del testo (integrato con CSS user-select)
  document.addEventListener("selectstart", function (e) { e.preventDefault(); }, { passive: false });
  document.addEventListener("dragstart", function (e) { e.preventDefault(); }, { passive: false });

  // 4. Blocca il trascinamento di immagini e link
  document.addEventListener("mousedown", function (e) {
    if (e.target && (e.target.tagName === "IMG" || e.target.tagName === "A")) e.preventDefault();
  }, { passive: false });

  // 5. Rilevamento devtools (diminuisce la finestra -> avviso)
  var acc = 0;
  setInterval(function () {
    var dx = window.outerWidth - window.innerWidth;
    var dy = window.outerHeight - window.innerHeight;
    if (dx > 160 || dy > 160) {
      acc++;
      if (acc === 2) {
        document.body.innerHTML =
          '<div style="font-family:sans-serif;display:grid;place-items:center;height:100vh;background:#0B0F14;color:#F2F5F8;text-align:center;padding:24px">' +
          '<div><div style="font-size:48px">&#129488;</div>' +
          '<h1 style="color:#C83838">Contenuto protetto</h1>' +
          '<p>La lettura del codice sorgente non è consentita.</p>' +
          '<button onclick="location.reload()" style="margin-top:16px;padding:10px 20px;background:#C83838;color:#fff;border:0;border-radius:8px;cursor:pointer">Ricarica</button>' +
          '</div></div>';
      }
    } else { acc = 0; }
  }, 1000);

  // 6. Console disclaimer
  console.log("%cIP-TVSOLUTION", "color:#C83838;font-size:20px;font-weight:bold");
  console.log("Solo player multimediali. Nessun contenuto, playlist o credenziale IPTV è fornito.");
})();
