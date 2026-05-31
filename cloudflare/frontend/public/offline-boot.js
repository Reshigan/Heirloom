// Offline page logic — the honest, presentational holding queue. This lives in
// an EXTERNAL file (not inline in offline.html) because the production CSP is
// `script-src 'self' …` with no 'unsafe-inline'; an inline <script> is blocked,
// which left the queue dead and the page static. A same-origin file is allowed.
//
// Because offline.html is the service-worker offline fallback, this file is
// PRECACHED by sw.js (see PRECACHE) so it is available with no network — edit
// the two together and bump the SW CACHE version when either changes.
//
// Shares the localStorage key the in-app Offline route
// (src/loom/pages/Offline.tsx) reads, so a line written here is still there
// when the SPA reloads. Nothing is sent while offline; we never claim it synced.
(function () {
  var KEY = 'heirloom-offline-holding';
  var SINCE = 'heirloom-offline-since';
  function read() { try { var r = JSON.parse(localStorage.getItem(KEY)); return Array.isArray(r) ? r : []; } catch (e) { return []; } }
  function write(q) { try { localStorage.setItem(KEY, JSON.stringify(q)); } catch (e) {} }
  function esc(s) { return String(s).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }

  var draft = document.getElementById('draft');
  var holdBtn = document.getElementById('hold');
  var queueEl = document.getElementById('queue');
  var queueSection = document.getElementById('queue-section');
  var queueLabel = document.getElementById('queue-label');
  var countEl = document.getElementById('holding-count');
  var syncLink = document.getElementById('sync');

  function render() {
    var q = read();
    countEl.textContent = q.length + (q.length === 1 ? ' entry holding' : ' entries holding');
    if (q.length === 0) { queueSection.style.display = 'none'; return; }
    queueSection.style.display = 'block';
    queueLabel.textContent = 'holding offline · ' + q.length;
    queueEl.innerHTML = q.map(function (e) {
      return '<div class="held"><span class="tick"></span>' +
        '<span class="text">' + esc(e.text) + '</span>' +
        '<span class="holdtag">holding</span></div>';
    }).join('');
  }

  draft.addEventListener('input', function () { holdBtn.disabled = !draft.value.trim(); });
  holdBtn.addEventListener('click', function () {
    var text = draft.value.trim();
    if (!text) return;
    var q = read();
    q.unshift({ id: 'h_' + Date.now().toString(36), text: text, at: Date.now(), dye: 'walnut' });
    write(q);
    draft.value = ''; holdBtn.disabled = true;
    render();
  });

  // The sync link reloads in place (CSP blocks inline onclick, so it is wired
  // here). href="/" is the no-JS fallback.
  if (syncLink) {
    syncLink.addEventListener('click', function (ev) { ev.preventDefault(); location.reload(); });
  }

  // offline-since clock
  var since;
  try { since = Number(localStorage.getItem(SINCE)) || Date.now(); localStorage.setItem(SINCE, String(since)); } catch (e) { since = Date.now(); }
  var t = new Date(since).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  document.getElementById('since').textContent = 'offline · since ' + t;

  window.addEventListener('online', function () { location.reload(); });
  render();
})();
