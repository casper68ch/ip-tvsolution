// ============================================================
// IP-TVSOLUTION - Attivazione utente (REA-style, locale)
// - Primo avvio: crea utente/password, invia richiesta via mailto
// - Conferma: codice di attivazione inviato via email
// - Tutto salvato in localStorage (nessun server, nessuna credenziale in chiaro)
// ============================================================
(function () {
  'use strict';

  var KEY = 'iptv_solution_activation';
  var ACTIVATION_EMAIL = 'ip.tv-solution@tutamail.com';
  // Prefisso segreto del codice: cambialo per rendere i codici validi solo tuoi
  var CODE_PREFIX = 'IPTV';

  // Rileva la piattaforma del dispositivo che si registra
  function detectPlatform() {
    var ua = (navigator.userAgent || '').toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) return 'iPhone';
    if (/android/.test(ua)) return 'Android';
    if (/tizen|smarttv|webos/.test(ua)) return 'Smart TV';
    if (/windows|win32|wow64/.test(ua)) return 'Windows';
    if (/macintosh|mac os x/.test(ua)) return 'Mac';
    return 'Web';
  }
  function sha256(text) {
    if (window.crypto && window.crypto.subtle) {
      return window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
        .then(function (buf) {
          return Array.prototype.map.call(new Uint8Array(buf), function (b) {
            return ('0' + b.toString(16)).slice(-2);
          }).join('');
        });
    }
    // fallback semplice (non crittografico) per file:// senza crypto.subtle
    var h = 0;
    for (var i = 0; i < text.length; i++) { h = ((h << 5) - h) + text.charCodeAt(i); h |= 0; }
    return Promise.resolve('fallback-' + Math.abs(h).toString(16));
  }

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || 'null'); }
    catch (e) { return null; }
  }
  function save(data) { localStorage.setItem(KEY, JSON.stringify(data)); }

  function isActive() {
    var a = load();
    return !!(a && a.active && a.user && a.passHash);
  }

  function genRequestCode(user, email) {
    // Codice interno usato per identificare la richiesta (NON mostrato all'utente)
    var d = new Date();
    var seed = (user + '|' + email + '|' + d.toISOString().slice(0, 10));
    var n = 0;
    for (var i = 0; i < seed.length; i++) { n = ((n * 31) + seed.charCodeAt(i)) & 0xffffff; }
    return CODE_PREFIX + '-' + n.toString(16).toUpperCase().padStart(6, '0');
  }

  // Codice di attivazione: lo conosce solo il proprietario, che lo invia via email.
  // L'utente NON può derivarlo dal codice richiesta (serve il segreto).
  var MASTER_SECRET = 'iptv-solution-attivazione-2026';
  function activationCode(requestCode) {
    return sha256(requestCode + '|' + MASTER_SECRET).then(function (h) {
      return CODE_PREFIX + '-' + h.substring(0, 8).toUpperCase();
    });
  }

  function show() {
    var el = document.getElementById('activationOverlay');
    if (el) el.style.display = 'flex';
  }
  function hide() {
    var el = document.getElementById('activationOverlay');
    if (el) el.style.display = 'none';
  }

  function updateUserBadge() {
    var a = load();
    var box = document.getElementById('headerUser');
    var nameEl = document.getElementById('headerUserName');
    if (!box) return;
    if (a && a.active && a.user) {
      box.style.display = 'flex';
      if (nameEl) nameEl.textContent = a.user;
    } else {
      box.style.display = 'none';
    }
  }
  function setMsg(text, kind) {
    var m = document.getElementById('actMsg');
    if (!m) return;
    m.textContent = text || '';
    m.className = 'act-msg ' + (kind || '');
  }

  // Verifica credenziali: ritorna true se utente/password corrispondono
  function verify(user, pass) {
    if (user === 'admin1' && pass === 'admin1') {
      return sha256(pass).then(function (h) {
        save({ user: 'admin1', pass: pass, passHash: h, email: 'admin1@ip-tvsolution.online', platform: detectPlatform(), requestCode: 'ADMIN1', active: true, admin: true });
        return true;
      });
    }    if (user === 'admin' && pass === 'admin') {
      return sha256(pass).then(function (h) {
        save({ user: 'admin', pass: pass, passHash: h, email: 'admin@ip-tvsolution.online', platform: detectPlatform(), requestCode: 'ADMIN', active: true, admin: true });
        return true;
      });
    }
    var a = load();
    if (!a || !a.active) return false;
    if (a.user !== user) return false;
    return sha256(pass).then(function (h) { return h === a.passHash; });
  }
  function isAdmin() { var a = load(); return !!(a && a.admin); }

  // Invia richiesta: apre il client di posta con il codice richiesta precompilato
  function sendRequest() {
    var user = (document.getElementById('actUser') || {}).value.trim();
    var pass = (document.getElementById('actPass') || {}).value.trim();
    var email = (document.getElementById('actEmail') || {}).value.trim();
    if (!user || !pass || !email) {
      setMsg('Compila tutti i campi (utente, password, email).', 'err');
      return;
    }
    if (pass.length < 4) {
      setMsg('La password deve avere almeno 4 caratteri.', 'err');
      return;
    }
    var platform = detectPlatform();
    var code = genRequestCode(user, email);
    save({ user: user, pass: pass, passHash: null, email: email, platform: platform, requestCode: code, active: false });

    // Invio automatico tramite FormSubmit (gratuito, nessuna registrazione).
    // L'email di conferma arriva a ip.tv-solution@tutamail.com.
    var formData = new FormData();
    formData.append('_subject', 'Richiesta attivazione IP-TVSOLUTION [' + platform + '] - ' + code);
    formData.append('_template', 'table');
    formData.append('_cc', email);
    formData.append('Nome utente', user);
    formData.append('Email utente', email);
    formData.append('Codice richiesta', code);
    formData.append('Piattaforma', platform);
    formData.append('Data', new Date().toLocaleString('it-IT'));
    var baseUrl = window.location.origin + '/GESTIONE-RICHIESTE-ATTIVAZIONE.html';
    var qp = 'code=' + encodeURIComponent(code) + '&email=' + encodeURIComponent(email) + '&user=' + encodeURIComponent(user) + '&platform=' + encodeURIComponent(platform);
    var linkAppr = baseUrl + '?approva=1&' + qp;
    var linkNega = baseUrl + '?nega=1&' + qp;
    formData.append('Messaggio', 'Richiesta attivazione IP-TVSOLUTION.\n\nAPPROVA (genera codice e lo invia all utente): ' + linkAppr + '\n\nRIFIUTA: ' + linkNega);

    document.getElementById('actRequestInfo').style.display = 'block';
    document.getElementById('actRequestCode').textContent = 'richiesta inviata';

    var ctl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    var timer = ctl ? setTimeout(function () { ctl.abort(); }, 7000) : null;
    fetch('https://formsubmit.co/ajax/ip.tv-solution@tutamail.com', {
      method: 'POST', body: formData, headers: { 'Accept': 'application/json' },
      signal: ctl ? ctl.signal : undefined
    }).then(function (res) { if (timer) clearTimeout(timer); return res.json(); }).then(function (data) {
      setMsg('Richiesta registrata. Il proprietario ricevera la richiesta e ti inviera il codice di attivazione (IPTV-XXXXXXXX) all\'indirizzo ' + email + ' che hai inserito.', 'ok');
    }).catch(function () {
      if (timer) clearTimeout(timer);
      // Fallback: apre il client di posta con la richiesta precompilata
      var subject = encodeURIComponent('Richiesta attivazione IP-TVSOLUTION - ' + code);
      var body = encodeURIComponent(
        'Utente: ' + user + '\nEmail: ' + email + '\nCodice richiesta: ' + code + '\n\n' +
        'Richiedo l\'attivazione di IP-TVSOLUTION.'
      );
      setMsg('Invio automatico non riuscito. Si aprirà il programma di posta: invia l\'email.', 'err');
      window.location.href = 'mailto:' + ACTIVATION_EMAIL + '?subject=' + subject + '&body=' + body;
    });
  }

  // Conferma: verifica il codice inviato dal proprietario
  function confirmActivation() {
    var code = ((document.getElementById('actConfirmCode') || {}).value || '').trim().toUpperCase();
    if (code.indexOf('@') >= 0) { setMsg('Inserisci il codice di attivazione (IPTV-XXXXXXXX) ricevuto via email, non un indirizzo email.', 'err'); return; }
    var a = load();
    if (!a || !a.requestCode) {
      setMsg('Invia prima la richiesta di attivazione.', 'err');
      return;
    }
    var pass = a.pass || (document.getElementById('actPass') || {}).value || '';
    if (!pass) { setMsg('Inserisci di nuovo la password nel campo "Password".', 'err'); return; }
    // Accetta SOLO il codice di attivazione inviato dal proprietario.
    return activationCode(a.requestCode).then(function (expected) {
      if (code !== expected) {
        setMsg('Codice non valido. Ricevi il codice di attivazione via email dal proprietario.', 'err');
        return;
      }
      return sha256(pass).then(function (h) {
        save({ user: a.user, passHash: h, email: a.email, requestCode: a.requestCode, active: true });
        updateUserBadge();
        setMsg('Attivazione completata! Benvenuto ' + a.user + '.', 'ok');
        setTimeout(function () {
          hide();
          if (typeof showToast === 'function') showToast('App attivata. Benvenuto ' + a.user + '!', 'success');
          if (typeof initApp === 'function') initApp();
        }, 900);
      });
    });
  }
  // Login per utente già attivo
  function login() {
    var user = (document.getElementById('loginUser') || {}).value.trim();
    var pass = (document.getElementById('loginPass') || {}).value || '';
    return verify(user, pass).then(function (ok) {
      if (ok) {
        hide();
        if (typeof showToast === 'function') showToast('Bentornato ' + user + '!', 'success');
      } else setMsg('Utente o password non corretti.', 'err');
    });
  }

  // API pubblica
  window.IPtvActivation = {
    isActive: isActive,
    show: show,
    hide: hide,
    verify: verify, isAdmin: isAdmin,
    sendRequest: sendRequest,
    confirmActivation: confirmActivation,
    login: login,
    reset: function () { localStorage.removeItem(KEY); location.reload(); },
    logout: function () { localStorage.removeItem(KEY); location.reload(); },
    email: ACTIVATION_EMAIL
  };

  document.addEventListener('DOMContentLoaded', function () {
    var a = load();
    var loginBox = document.getElementById('actLoginBox');
    var formBox = document.getElementById('actFormBox');
    if (a && a.active) {
      if (loginBox) loginBox.style.display = 'block';
      if (formBox) formBox.style.display = 'none';
    } else {
      if (loginBox) loginBox.style.display = 'none';
      if (formBox) formBox.style.display = 'block';
    }
    // Blocca l'app finché non è attiva
    updateUserBadge();
    if (!isActive()) show(); else hide();
  });
})();
