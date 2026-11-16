(function () {
  'use strict';
  var DAY_START = 6, NIGHT_HOURS = 6;
  var ICON_STYLES = ['color', 'muted', 'grey'], ICON_STYLE_NAME = { color: 'full colour', muted: 'muted', grey: 'greyscale' };
  var LTIPS = 'fh.tips';
  var LLAUNCH = 'fh.launches', LFOCUS = 'fh.folderFocus';
  var LS = 'fh.settings', LP = 'fh.pomo', LSLOT = 'fh.lastSlot', LPLAN = 'fh.plan';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clone = function (o) { return JSON.parse(JSON.stringify(o)); };

  function el(tag, props, kids) {
    var n = document.createElement(tag);
    Object.keys(props || {}).forEach(function (k) {
      if (k === 'class') n.className = props[k];
      else if (k === 'text') n.textContent = props[k];
      else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), props[k]);
      else if (props[k] !== false && props[k] != null) n.setAttribute(k, props[k]);
    });
    (kids || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }

  /* ---------- settings ---------- */
  function loadSettings() {
    var saved = {};
    try { saved = JSON.parse(lsGet(LS) || '{}') || {}; } catch (e) {}
    return deepMerge(clone(DEFAULTS), saved);
  }
  var firstRun = lsGet(LS) == null;
  var S = loadSettings();
  function save() { if (!lsSet(LS, JSON.stringify(S))) toast('Could not save — browser storage is unavailable'); }
  function getK(k) { return k.split('.').reduce(function (o, p) { return o[p]; }, S); }
  function setK(k, v) { var p = k.split('.'), last = p.pop(); p.reduce(function (o, x) { return o[x]; }, S)[last] = v; }
  function uid() { return 'x' + Math.random().toString(36).slice(2, 9); }

  var toastT;
  function toast(msg) {
    var t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('show'); }, 3200);
  }

  /* ---------- appearance, clock ---------- */
  var sysLight = window.matchMedia ? matchMedia('(prefers-color-scheme: light)') : null;
  function curTheme() {
    var t = S.general.theme;
    return t === 'light' || t === 'dark' ? t : (sysLight && sysLight.matches ? 'light' : 'dark');
  }
  function applyLook() {
    var g = S.general, th = curTheme();
    document.documentElement.dataset.theme = th;
    $('#icoSun').toggleAttribute('hidden', th === 'light'); $('#icoMoon').toggleAttribute('hidden', th !== 'light');
    var meta = $('meta[name="theme-color"]'); if (meta) meta.content = th === 'light' ? '#f3f5fb' : '#0e1220';
    document.documentElement.style.setProperty('--accent', g.accent);
    document.documentElement.style.setProperty('--ico', S.launcher.iconSize + 'px');
    fitFolders();
    document.body.dataset.bg = g.bg;
    $('#bg').style.backgroundImage = g.bg === 'image' && /^https?:\/\//i.test(g.bgImage) ? 'url("' + encodeURI(g.bgImage) + '")' : '';
    $('#launcher').classList.toggle('nolabels', !S.launcher.labels);
    document.body.dataset.icons = S.launcher.iconStyle;
    var ib = $('#iconStyleBtn');
    if (ib) { ib.title = 'App icons: ' + ICON_STYLE_NAME[S.launcher.iconStyle] + ' — click to change'; ib.classList.toggle('on', S.launcher.iconStyle !== 'color'); }
    $('#date').hidden = !g.showDate;
    $('#progress').hidden = !g.showProgress;
  }
  function renderClock() {
    var d = new Date(), g = S.general, h = d.getHours(), m = String(d.getMinutes()).padStart(2, '0');
    var c = $('#clock'); c.textContent = '';
    var hh = g.h24 ? String(h).padStart(2, '0') : String(h % 12 || 12);
    c.appendChild(document.createTextNode(hh + ':' + m));
    if (g.showSeconds) c.appendChild(el('span', { class: 'sec', text: String(d.getSeconds()).padStart(2, '0') }));
    if (!g.h24) c.appendChild(el('small', { text: h < 12 ? 'AM' : 'PM' }));
    $('#date').textContent = d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
    var part = h < 5 ? 'Good night' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
    $('#greet').textContent = part + (g.name ? ', ' + g.name : '');
    if (g.showProgress) renderProgress(d);
  }
  /* Time-left meters: one segment per unit (hour / day / day). Spent units go dim,
     the current unit drains, and the colour shifts from calm to urgent as the period runs out. */
  function renderProgress(d) {
    var p = periodProgress(d, S.general.weekStart);
    // The day runs 6 AM -> 6 AM, so the hours after midnight still count toward "today".
    var ds = new Date(d.getFullYear(), d.getMonth(), d.getDate(), DAY_START);
    if (d < ds) ds = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1, DAY_START);
    var de = new Date(ds.getFullYear(), ds.getMonth(), ds.getDate() + 1, DAY_START);
    p.day = { start: ds, end: de, frac: (d - ds) / (de - ds), left: de - d };
    var unit = { day: 3600000, week: 86400000, month: 86400000 };
    var h = d.getHours();
    var here = {
      day: S.general.h24 ? String(h).padStart(2, '0') + ':00' : (h % 12 || 12) + (h < 12 ? ' AM' : ' PM'),
      week: d.toLocaleDateString(undefined, { weekday: 'short' }),
      month: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    };
    var endDay = new Date(p.week.end - 1).toLocaleDateString(undefined, { weekday: 'short' });
    ['day', 'week', 'month'].forEach(function (k) {
      var row = $('.meter[data-p="' + k + '"]'), per = p[k], u = unit[k];
      var n = Math.round((per.end - per.start) / u), segs = row.querySelector('.m-segs');
      if (segs.children.length !== n) {
        segs.textContent = '';
        for (var i = 0; i < n; i++) segs.appendChild(el('i', { class: k === 'day' && i >= 24 - NIGHT_HOURS ? 'night' : '' }, [el('b')]));
      }
      var spent = (d - per.start) / u;
      $$('i', segs).forEach(function (seg, i) {
        var f = Math.max(0, Math.min(1, i + 1 - spent));   // remaining share of this unit
        seg.firstChild.style.width = (f * 100).toFixed(1) + '%';
      });
      var left = 1 - per.frac;
      row.dataset.level = left > 0.5 ? 'calm' : left > 0.25 ? 'mid' : 'low';
      var txt = k === 'month' ? (per.left < 86400000 ? 'last day' : Math.ceil(per.left / 86400000) + 'd left')
        : fmtLeft(per.left) + ' left';
      var lab = row.querySelector('.m-left'); lab.textContent = '';
      lab.appendChild(el('b', { text: here[k] })); lab.appendChild(el('span', { text: txt }));
      row.title = k.charAt(0).toUpperCase() + k.slice(1) + ': ' + Math.round(left * 100) + '% left'
        + (k === 'day' ? ' · the day runs 6 AM to 6 AM, night hours are faded' : k === 'week' ? ' · ends ' + endDay : '');
    });
  }

  /* ---------- sound + speech ---------- */
  var soundOK = false;
  function checkSound() {
    return Sound.ready().then(function (ok) { soundOK = ok; renderChip(); return ok; });
  }
  function speak(text, vol) {
    return new Promise(function (res) {
      if (!('speechSynthesis' in window)) return res();
      var c = S.chime, u = new SpeechSynthesisUtterance(text);
      u.rate = Number(c.rate) || 1; u.pitch = Number(c.pitch) || 1; u.volume = Math.max(0, Math.min(1, vol));
      var v = speechSynthesis.getVoices().filter(function (x) { return x.name === c.voice; })[0];
      if (v) { u.voice = v; u.lang = v.lang; }
      u.onend = u.onerror = function () { res(); };
      try { speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) { res(); }
      setTimeout(res, 12000);
    });
  }
  function fillVoices() {
    if (!('speechSynthesis' in window)) return;
    var sel = $('#voiceSel'), vs = speechSynthesis.getVoices();
    if (!vs.length) return;
    sel.textContent = '';
    sel.appendChild(el('option', { value: '', text: 'System default' }));
    vs.forEach(function (v) { sel.appendChild(el('option', { value: v.name, text: v.name + ' (' + v.lang + ')' })); });
    sel.value = S.chime.voice || '';
  }

  /* ---------- time chime ---------- */
  function doChime(d) {
    var c = S.chime;
    return checkSound().then(function (ok) {
      if (!ok) return;
      var p = c.beep ? Sound.play('chime:' + c.tone, c.volume) : Promise.resolve();
      return p.then(function () { if (c.speak) return speak(speakTimeText(d, c, S.general.h24), c.volume); });
    });
  }
  function chimeCheck() {
    var d = new Date(Math.floor(Date.now() / 60000) * 60000);
    if (!isChimeMinute(d, S.chime)) return;
    var slot = String(d.getTime());
    var run = function () {
      if (lsGet(LSLOT) === slot) return;
      lsSet(LSLOT, slot);
      return doChime(d);
    };
    // The lock makes sure only one open copy of the page chimes.
    if (navigator.locks) navigator.locks.request('fh-chime', { ifAvailable: true }, function (l) { return l ? run() : null; });
    else run();
  }
  function nextChime() {
    var base = Math.floor(Date.now() / 60000) * 60000;
    for (var i = 1; i <= 1440; i++) {
      var d = new Date(base + i * 60000);
      if (isChimeMinute(d, S.chime)) return d;
    }
    return null;
  }
  function fmtTime(d) {
    var h = d.getHours(), m = String(d.getMinutes()).padStart(2, '0');
    return S.general.h24 ? String(h).padStart(2, '0') + ':' + m : (h % 12 || 12) + ':' + m + (h < 12 ? ' AM' : ' PM');
  }
  function renderChip() {
    var b = $('#chimeBtn'), c = S.chime;
    b.classList.toggle('warn', c.enabled && !soundOK);
    b.classList.toggle('off', !c.enabled);
    if (!c.enabled) b.textContent = 'Chime off';
    else if (!soundOK) b.textContent = 'Click to enable sound';
    else { var n = nextChime(); b.textContent = 'Chime on' + (n ? ' · next ' + fmtTime(n) : ''); }
  }

  /* ---------- pomodoro ---------- */
  var flashT = null, flashMsg = '';
  function loadPomo() {
    var p = null;
    try { p = JSON.parse(lsGet(LP) || 'null'); } catch (e) {}
    if (!p || !PHASE_LABEL[p.phase]) p = { phase: 'work', count: 0, running: false, endAt: 0, remaining: null };
    return p;
  }
  var P = loadPomo();
  function savePomo() { lsSet(LP, JSON.stringify(P)); }
  function pomoLeft() {
    if (P.running) return Math.max(0, P.endAt - Date.now());
    return P.remaining != null ? P.remaining : pomoDuration(P.phase, S.pomodoro);
  }
  function renderPomo() {
    var left = pomoLeft(), total = pomoDuration(P.phase, S.pomodoro);
    var s = Math.ceil(left / 1000), txt = String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
    $('#pomoTime').textContent = txt;
    var cur = currentTask(), lab = $('#pomoLabel'); lab.textContent = '';
    lab.appendChild(document.createTextNode(PHASE_LABEL[P.phase]));
    if (cur && P.phase === 'work') { lab.appendChild(document.createTextNode(' · ')); lab.appendChild(el('b', { text: cur.title })); }
    lab.title = cur ? 'Planned now: ' + cur.title : '';
    $('#pomo').dataset.phase = P.phase;
    $('#pomoFill').style.width = (Math.max(0, Math.min(1, 1 - left / total)) * 100).toFixed(2) + '%';
    $('#icoPlay').toggleAttribute('hidden', P.running); $('#icoPause').toggleAttribute('hidden', !P.running);
    $$('#pomoTabs button').forEach(function (b) { b.classList.toggle('on', b.dataset.phase === P.phase); });
    var n = Math.max(1, S.pomodoro.longEvery), done = P.phase === 'long' ? n : P.count % n, dots = $('#pomoDots');
    if (dots.children.length !== n) { dots.textContent = ''; for (var i = 0; i < n; i++) dots.appendChild(el('i')); }
    $$('i', dots).forEach(function (d, i) { d.classList.toggle('on', i < done); });
    if (!flashT) document.title = P.running || P.remaining != null ? txt + ' · ' + PHASE_LABEL[P.phase] : 'Home';
  }
  function askNotifyPermission() {
    if (S.pomodoro.notify && 'Notification' in window && Notification.permission === 'default') {
      try { Notification.requestPermission().then(renderNotifState); } catch (e) {}
    }
  }
  function renderNotifState() {
    var n = $('#notifState');
    if (!('Notification' in window)) n.textContent = 'not supported here';
    else n.textContent = { granted: 'allowed', denied: 'blocked in Chrome site settings', default: 'Chrome will ask when you start a timer' }[Notification.permission];
  }
  function notify(title, body) {
    if (!S.pomodoro.notify || !('Notification' in window) || Notification.permission !== 'granted') return;
    var opt = { body: body, icon: 'icons/icon-192.png', tag: 'fh-pomo' };
    var plain = function () { try { new Notification(title, opt); } catch (e) {} };
    if (navigator.serviceWorker && navigator.serviceWorker.controller)
      navigator.serviceWorker.ready.then(function (r) { return r.showNotification(title, opt); }).catch(plain);
    else plain();
  }
  function flash(msg) {
    stopFlash(); flashMsg = msg;
    if (document.hasFocus()) return;
    var on = false;
    flashT = setInterval(function () { on = !on; document.title = on ? '⏰ ' + flashMsg : 'Home'; }, 1000);
  }
  function stopFlash() { if (flashT) { clearInterval(flashT); flashT = null; renderPomo(); } }
  function announce(was, n) {
    var p = S.pomodoro;
    var title = was === 'work' ? 'Focus session complete' : 'Break is over';
    var msg = n.phase === 'work' ? (n.auto ? 'Focus has started.' : 'Ready to focus again?')
      : 'Time for a ' + (n.phase === 'long' ? 'long' : 'short') + ' break' + (n.auto ? '. It has started.' : '.');
    notify(title, msg); flash(title);
    return checkSound().then(function (ok) {
      if (!ok) return;
      var a = p.sound ? Sound.play('pomo', p.volume) : Promise.resolve();
      return a.then(function () { if (p.speak) return speak(title + '. ' + msg, p.volume); });
    });
  }
  function pomoComplete() {
    var was = P.phase, n = pomoNext(P.phase, P.count, S.pomodoro);
    P.phase = n.phase; P.count = n.count; P.remaining = null; P.running = n.auto;
    P.endAt = n.auto ? Date.now() + pomoDuration(n.phase, S.pomodoro) : 0;
    savePomo(); renderPomo(); announce(was, n);
  }
  function pomoTick() {
    if (P.running && Date.now() >= P.endAt) {
      var run = function () { P = loadPomo(); if (P.running && Date.now() >= P.endAt) pomoComplete(); };
      if (navigator.locks) navigator.locks.request('fh-pomo', { ifAvailable: true }, function (l) { if (l) run(); });
      else run();
    }
    renderPomo();
  }
  function bindPomo() {
    $('#pomoToggle').addEventListener('click', function () {
      if (P.running) { P.remaining = pomoLeft(); P.running = false; }
      else { P.endAt = Date.now() + pomoLeft(); P.remaining = null; P.running = true; askNotifyPermission(); }
      savePomo(); renderPomo();
    });
    $('#pomoReset').addEventListener('click', function () { P.running = false; P.remaining = null; savePomo(); renderPomo(); });
    $('#pomoSkip').addEventListener('click', function () {
      if (P.phase === 'work') P.phase = (P.count + 1) % Math.max(1, S.pomodoro.longEvery) === 0 ? 'long' : 'short';
      else P.phase = 'work';
      P.running = false; P.remaining = null; savePomo(); renderPomo();
    });
    $$('#pomoTabs button').forEach(function (b) {
      b.addEventListener('click', function () { P.phase = b.dataset.phase; P.running = false; P.remaining = null; savePomo(); renderPomo(); });
    });
    $('#pomoDots').addEventListener('dblclick', function () { P.count = 0; savePomo(); renderPomo(); toast('Session count reset'); });
  }

  /* ---------- ask box ---------- */
  var AI_MODE = 'https://www.google.com/search?udm=50&q=%s';
  function copyText(t) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(t).then(function () { return true; }, function () { return legacyCopy(t); });
    return Promise.resolve(legacyCopy(t));
  }
  function legacyCopy(t) {
    var a = el('textarea', { style: 'position:fixed;opacity:0' }); a.value = t; document.body.appendChild(a); a.select();
    var ok = false; try { ok = document.execCommand('copy'); } catch (e) {}
    a.remove(); return ok;
  }
  function safeUrl(u) {
    u = String(u || '').trim();
    if (!u) return '';
    if (!/^[a-z][a-z0-9+.-]*:/i.test(u)) u = 'https://' + u;
    try { var p = new URL(u); return /^(https?|mailto|tel|chrome|file):$/.test(p.protocol) ? p.href : ''; } catch (e) { return ''; }
  }
  function bindAsk() {
    var q = $('#q');
    var grow = function () { q.style.height = 'auto'; q.style.height = Math.min(180, q.scrollHeight) + 'px'; };
    q.addEventListener('input', grow);
    q.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); $('#askForm').requestSubmit(); }
    });
    $('#askForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var text = q.value.trim(); if (!text) return;
      var url = AI_MODE.split('%s').join(encodeURIComponent(text));
      var go = function () {
        if (S.ask.newTab) { window.open(url, '_blank', 'noopener'); q.value = ''; grow(); }
        else location.href = url;
      };
      if (S.ask.copy) copyText(text).then(go); else go();
    });
  }

  /* ---------- launcher ---------- */
  var COLORS = ['#e4572e', '#17bebb', '#7b5ea7', '#f0a202', '#2e86ab', '#d1495b', '#3c8d5a', '#5c6bc0'];
  var drag = null, editing = null;
  function host(u) { try { return new URL(u).hostname; } catch (e) { return ''; } }
  function letterIcon(ico, name) {
    var ch = (name || '?').trim().charAt(0).toUpperCase() || '?', n = 0;
    for (var i = 0; i < name.length; i++) n += name.charCodeAt(i);
    ico.textContent = ch; ico.classList.add('letter'); ico.style.background = COLORS[n % COLORS.length];
  }
  var dragG = null;
  /* Launch counts: how many times each bookmark was opened today. Resets at midnight. */
  function todayKey() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function loadLaunches() {
    var o = null;
    try { o = JSON.parse(lsGet(LLAUNCH) || 'null'); } catch (e) {}
    return o && o.day === todayKey() && o.counts ? o : { day: todayKey(), counts: {} };
  }
  function launchCount(url) { return loadLaunches().counts[url] || 0; }
  function countLaunch(url) {
    var o = loadLaunches(); o.counts[url] = (o.counts[url] || 0) + 1; lsSet(LLAUNCH, JSON.stringify(o));
  }
  var lastLaunchDay = todayKey();
  function focusedGroup() {
    var id = lsGet(LFOCUS);
    return id ? S.launcher.groups.filter(function (g) { return g.id === id; })[0] || null : null;
  }
  function toggleFocus(g) {
    if (focusedGroup() === g) { try { localStorage.removeItem(LFOCUS); } catch (e) {} }
    else { save(); lsSet(LFOCUS, g.id); }
    renderLauncher();
  }
  var ICO_MAX = '<svg viewBox="0 0 24 24"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>';
  var ICO_MIN = '<svg viewBox="0 0 24 24"><path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7"/></svg>';
  function tipFor(it) { var d = appDesc(it); return d ? it.name + ' — ' + d : it.name; }
  function makeIco(it) {
    var url = safeUrl(it.url), ico = el('span', { class: 'ico' }), h = host(url);
    var src = it.icon && /^(https?:|data:image\/)/i.test(it.icon) ? it.icon
      : h ? 'https://www.google.com/s2/favicons?domain=' + encodeURIComponent(h) + '&sz=64' : '';
    if (src) {
      var img = el('img', { alt: '', loading: 'lazy', referrerpolicy: 'no-referrer' });
      img.addEventListener('error', function () { img.remove(); letterIcon(ico, it.name); });
      img.src = src; ico.appendChild(img);
    } else letterIcon(ico, it.name);
    return ico;
  }
  function renderLauncher() {
    var root = $('#launcher'); root.textContent = '';
    S.launcher.groups.forEach(function (g) { if (!g.id) g.id = uid(); });
    var foc = focusedGroup();
    root.classList.toggle('focused', !!foc);
    S.launcher.groups.forEach(function (g, gi) {
      if (foc && g !== foc) return;
      var tiles = el('div', { class: 'tiles' });
      g.items.forEach(function (it, ii) {
        var url = safeUrl(it.url), ico = makeIco(it);
        var a = el('a', { class: 'tile', href: url || '#', title: tipFor(it), 'data-url': url, draggable: 'true',
          target: S.launcher.newTab ? '_blank' : false, rel: 'noopener noreferrer' },
          [ico, el('span', { class: 'lbl' }, [el('span', { class: 'lbl-n', text: it.name }), launchBadge(url)])]);
        a.addEventListener('click', function () { if (url) { countLaunch(url); refreshBadges(); } });
        a.addEventListener('auxclick', function (e) { if (e.button === 1 && url) { countLaunch(url); refreshBadges(); } });
        a.addEventListener('contextmenu', function (e) { e.preventDefault(); openItem(gi, ii); });
        a.addEventListener('dragstart', function (e) { e.stopPropagation(); drag = { g: gi, i: ii }; a.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', it.url); });
        a.addEventListener('dragend', clearDrag);
        a.addEventListener('dragover', function (e) { if (drag) { e.preventDefault(); a.classList.add('over'); } });
        a.addEventListener('dragleave', function () { a.classList.remove('over'); });
        a.addEventListener('drop', function (e) { if (drag) { e.preventDefault(); e.stopPropagation(); moveItem(drag, gi, ii); } });
        tiles.appendChild(a);
      });
      var name = el('span', { class: 'gname', text: g.name || 'Untitled', title: 'Double-click to rename' });
      name.addEventListener('dblclick', function () { renameGroup(gi, name); });
      var focusBtn = el('button', { type: 'button', class: 'mini focus-btn' + (foc ? ' on' : ''),
        title: foc ? 'Zoom out — show all folders' : 'Focus — show only this folder', onclick: function () { toggleFocus(g); } });
      focusBtn.innerHTML = foc ? ICO_MIN : ICO_MAX;
      var head = el('div', { class: 'group-head', draggable: 'true' }, [
        name,
        el('span', { class: 'gcount', text: String(g.items.length) }),
        el('button', { type: 'button', class: 'mini add-btn', title: 'Add an app to ' + g.name, text: '+', onclick: function () { openItem(gi, -1); } }),
        el('button', { type: 'button', class: 'mini', title: 'Open all in tabs', text: '⧉', onclick: function () { openAll(g); } }),
        focusBtn
      ]);
      var box = el('div', { class: 'group' + (g.items.length ? '' : ' empty') }, [head, tiles]);
      head.addEventListener('dragstart', function (e) { dragG = gi; box.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', g.name); });
      head.addEventListener('dragend', clearDrag);
      box.addEventListener('dragover', function (e) { if (drag || dragG != null || dragNew) { e.preventDefault(); if (dragG != null || dragNew) box.classList.add('over'); } });
      box.addEventListener('dragleave', function (e) { if (!box.contains(e.relatedTarget)) box.classList.remove('over'); });
      box.addEventListener('drop', function (e) {
        e.preventDefault();
        if (dragNew) addSuggested(dragNew, gi);
        else if (drag) moveItem(drag, gi, g.items.length);
        else if (dragG != null && dragG !== gi) { var gs = S.launcher.groups; gs.splice(gi, 0, gs.splice(dragG, 1)[0]); dragG = null; save(); renderLauncher(); renderGroupList(); }
      });
      root.appendChild(box);
    });
    fitFolders();
  }
  function launchBadge(url) {
    var n = url ? launchCount(url) : 0;
    return el('span', { class: 'lbl-c', text: n ? '×' + n : '', title: n ? 'Opened ' + n + '× today' : '' });
  }
  function refreshBadges() {
    var c = loadLaunches().counts;
    $$('#launcher .tile[data-url]').forEach(function (a) {
      var n = c[a.dataset.url] || 0, b = a.querySelector('.lbl-c');
      b.textContent = n ? '×' + n : ''; b.title = n ? 'Opened ' + n + '× today' : '';
    });
  }
  /* Pick the column count that gives the biggest folders while all of them fit in the
     space left on screen. Folders are never taller than they are wide. If there are too
     many to fit at a usable size (two icons per row), they keep that size and the folder
     area scrolls instead of overlapping. */
  var FGAP = 14;
  function fitFolders() {
    var root = $('#launcher'), n = $$('.group', root).length;
    if (!n || !root.clientWidth) return;
    if (root.classList.contains('focused')) {
      root.style.gridTemplateColumns = 'minmax(0, 1fr)'; root.style.gridAutoRows = root.clientHeight + 'px'; return;
    }
    var W = root.clientWidth, H = root.clientHeight, ico = S.launcher.iconSize;
    var minSide = ico * 2 + 100, best = null;
    for (var c = 1; c <= n; c++) {
      var r = Math.ceil(n / c), w = (W - (c - 1) * FGAP) / c, h = (H - (r - 1) * FGAP) / r;
      if (c > 1 && w < minSide) break;
      var side = Math.min(w, h);
      if (!best || side > best.side + 0.5) best = { c: c, w: w, side: side };
    }
    var cols = best.c, rowH = Math.min(best.w, best.side);
    if (best.side < minSide) {   // does not fit: fall back to usable size + scrolling
      cols = Math.max(1, Math.floor((W + FGAP) / (minSide + FGAP)));
      rowH = Math.min(minSide, (W - (cols - 1) * FGAP) / cols);
    }
    root.style.gridTemplateColumns = 'repeat(' + cols + ', minmax(0, 1fr))';
    root.style.gridAutoRows = Math.floor(rowH) + 'px';
  }
  function clearDrag() { drag = null; dragG = null; dragNew = null; $$('.dragging,.over').forEach(function (x) { x.classList.remove('dragging', 'over'); }); }
  function renameGroup(gi, span) {
    var g = S.launcher.groups[gi], inp = el('input', { class: 'gname-in', type: 'text' }); inp.value = g.name;
    var done = false, finish = function (ok) {
      if (done) return; done = true;
      if (ok && inp.value.trim()) { g.name = inp.value.trim(); save(); }
      renderLauncher(); renderGroupList();
    };
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') finish(true); if (e.key === 'Escape') { e.stopPropagation(); finish(false); } });
    inp.addEventListener('blur', function () { finish(true); });
    span.replaceWith(inp); inp.focus(); inp.select();
  }
  function moveItem(from, tg, ti) {
    var gs = S.launcher.groups, it = gs[from.g].items.splice(from.i, 1)[0];
    if (from.g === tg && from.i < ti) ti--;
    gs[tg].items.splice(ti, 0, it); clearDrag(); save(); renderLauncher();
  }
  function openAll(g) {
    var blocked = 0;
    g.items.forEach(function (it) { var u = safeUrl(it.url); if (!u) return; if (!window.open(u, '_blank')) blocked++; else countLaunch(u); });
    refreshBadges();
    if (blocked) toast('Chrome blocked ' + blocked + ' tab(s) — allow pop-ups for this site to use “open all”');
  }
  function openItem(gi, ii, prefill) {
    var f = $('#itemForm'), it = ii >= 0 ? S.launcher.groups[gi].items[ii] : prefill || { name: '', url: '', icon: '' };
    editing = { g: gi, i: ii };
    $('#itemTitle').textContent = ii >= 0 ? 'Edit bookmark' : 'Add bookmark';
    f.elements.name.value = it.name; f.elements.url.value = it.url; f.elements.icon.value = it.icon || '';
    var sel = $('#itemGroup'); sel.textContent = '';
    S.launcher.groups.forEach(function (g, i) { sel.appendChild(el('option', { value: i, text: g.name })); });
    sel.value = String(gi);
    $('#itemDelete').hidden = ii < 0;
    $('#itemDlg').showModal();
  }
  function bindItemDialog() {
    var dlg = $('#itemDlg'), f = $('#itemForm');
    $('#itemCancel').addEventListener('click', function () { dlg.close(); });
    $('#itemDelete').addEventListener('click', function () {
      S.launcher.groups[editing.g].items.splice(editing.i, 1); save(); renderLauncher(); dlg.close();
    });
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var url = safeUrl(f.elements.url.value);
      if (!url) return toast('That address does not look valid');
      var it = { name: f.elements.name.value.trim() || host(url), url: url }, icon = f.elements.icon.value.trim();
      if (icon) it.icon = icon;
      var gs = S.launcher.groups, tg = Number(f.elements.group.value);
      if (editing.i >= 0) {
        if (tg === editing.g) gs[tg].items[editing.i] = it;
        else { gs[editing.g].items.splice(editing.i, 1); gs[tg].items.push(it); }
      } else gs[tg].items.push(it);
      save(); renderLauncher(); renderSuggest(); dlg.close();
    });
  }

  /* ---------- planner calendar ---------- */
  var SLOT = 30 * 60000, SESS_LEN = 4 * 3600000, slotEdit = null, lastCalKey = '', calScrolled = false;
  function loadPlan() {
    var p = null;
    try { p = JSON.parse(lsGet(LPLAN) || 'null'); } catch (e) {}
    if (!p || !Array.isArray(p.tasks)) p = { tasks: [], session: null, mode: 'session' };
    if (p.mode !== 'day') p.mode = 'session';
    var cut = Date.now() - 14 * 86400000;
    p.tasks = p.tasks.filter(function (t) { return t && t.start > cut; });
    return p;
  }
  var PL = loadPlan();
  function savePlan() { lsSet(LPLAN, JSON.stringify(PL)); }
  function floorSlot(t) { var d = new Date(t); d.setSeconds(0, 0); d.setMinutes(d.getMinutes() < 30 ? 0 : 30); return d.getTime(); }
  function sessionActive() { return !!(PL.session && Date.now() < PL.session.end); }
  function currentTask() {
    var now = Date.now();
    return PL.tasks.filter(function (t) { return !t.done && t.start <= now && now < t.start + t.dur * 60000; })
      .sort(function (a, b) { return a.start - b.start; })[0] || null;
  }
  function calRange() {
    if (PL.mode === 'day') { var d = new Date(); return { a: new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(), b: new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime() }; }
    return sessionActive() ? { a: PL.session.start, b: PL.session.end } : null;
  }
  function shortTime(t) { return fmtTime(new Date(t)).replace(' AM', 'a').replace(' PM', 'p'); }
  function startSession() {
    var now = Date.now(), a = floorSlot(now);
    PL.session = { start: a, end: a + Math.ceil((now + SESS_LEN - a) / SLOT) * SLOT, announced: false };
    PL.mode = 'session'; savePlan(); renderCal(true); renderPomo();
    toast('Session started — until ' + fmtTime(new Date(PL.session.end)));
  }
  function endSession() { if (PL.session) { PL.session.end = Date.now(); PL.session.announced = true; } savePlan(); renderCal(true); }
  function checkSessionEnd() {
    var s = PL.session;
    if (s && !s.announced && Date.now() >= s.end) {
      s.announced = true; savePlan();
      toast('Session finished'); notify('Session finished', 'Start a new session when you are ready to plan again.');
    }
  }
  /* When a planned block starts, say its name and show a notification.
     Only blocks that started in the last few minutes count, so opening the page
     mid-block stays quiet. The lock + saved flag make sure only one open tab announces. */
  function checkTaskStart() {
    var run = function () {
      PL = loadPlan();
      var now = Date.now();
      var due = PL.tasks.filter(function (t) { return !t.done && !t.announced && t.start <= now && now - t.start < 3 * 60000; })
        .sort(function (a, b) { return a.start - b.start; });
      if (!due.length) return;
      due.forEach(function (t) { t.announced = true; });
      savePlan(); renderCal(true); renderPomo();
      var t = due[due.length - 1], p = S.pomodoro;
      var mins = t.dur === 60 ? '1 hour' : '30 minutes', msg = 'Now: ' + t.title;
      toast(msg + ' · ' + mins); notify(msg, mins + ' — until ' + fmtTime(new Date(t.start + t.dur * 60000)));
      flash(msg);
      return checkSound().then(function (ok) {
        if (!ok) return;
        var a = p.sound ? Sound.play('pomo', p.volume) : Promise.resolve();
        return a.then(function () { if (p.speak) return speak('Time for ' + t.title + '. ' + mins + '.', p.volume); });
      });
    };
    if (navigator.locks) navigator.locks.request('fh-task', { ifAvailable: true }, function (l) { return l ? run() : null; });
    else run();
  }
  function renderCal(force) {
    var r = calRange(), act = sessionActive(), now = Date.now(), cal = $('#cal'), body = $('#calBody');
    cal.dataset.mode = PL.mode;
    $$('#calMode button').forEach(function (b) { b.classList.toggle('on', b.dataset.mode === PL.mode); });
    var sb = $('#sessBtn'); sb.textContent = act ? 'End session' : 'Start session'; sb.classList.toggle('primary', !act);
    $('#calInfo').textContent = act ? shortTime(PL.session.start) + ' – ' + shortTime(PL.session.end) + ' · ' + fmtLeft(PL.session.end - now) + ' left'
      : PL.session ? 'Session ended' : 'No session yet';
    var key = JSON.stringify([PL.mode, r, PL.tasks, PL.session, Math.floor(now / SLOT), S.general.h24]);
    if (!force && key === lastCalKey) return placeNow(r);
    lastCalKey = key;
    var keep = body.scrollTop; body.textContent = '';
    if (!r) {
      body.appendChild(el('div', { class: 'cal-empty' }, [
        el('p', { text: PL.session ? 'Session finished. Press Start session when you are ready to plan the next block.'
          : 'Start a session to plan the next 4 hours in 30-minute and 1-hour pomos.' })]));
      return;
    }
    var n = Math.round((r.b - r.a) / SLOT), span = r.b - r.a, grid = el('div', { class: 'cal-grid' });
    grid.style.setProperty('--rows', n);
    var pct = function (t) { return ((t - r.a) / span * 100).toFixed(3) + '%'; };
    for (var i = 0; i < n; i++) (function (t) {
      var d = new Date(t), full = d.getMinutes() === 0;
      var lbl = PL.mode === 'day' && !full ? '' : shortTime(t);
      grid.appendChild(el('div', { class: 'slot' + (full ? '' : ' hour') + (t + SLOT <= now ? ' past' : ''),
        onclick: function () { openSlot(null, t); } }, [el('span', { class: 'slot-t', text: lbl })]));
    })(r.a + i * SLOT);
    if (PL.mode === 'day' && PL.session) {
      var sa = Math.max(r.a, PL.session.start), se = Math.min(r.b, PL.session.end);
      if (se > sa) { var sh = el('div', { class: 'sess-shade' }); sh.style.top = pct(sa); sh.style.height = ((se - sa) / span * 100) + '%'; grid.appendChild(sh); }
    }
    PL.tasks.filter(function (t) { return t.start < r.b && t.start + t.dur * 60000 > r.a; }).forEach(function (t) {
      var end = t.start + t.dur * 60000, isNow = !t.done && t.start <= now && now < end;
      var b = el('div', { class: 'task' + (t.done ? ' done' : '') + (isNow ? ' now' : ''), title: t.title },
        [el('span', { class: 'tt', text: (t.done ? '✓ ' : '') + t.title }), el('span', { class: 'td', text: t.dur === 60 ? '1h' : '30m' })]);
      var top = Math.max(t.start, r.a);
      b.style.top = pct(top); b.style.height = 'calc(' + ((Math.min(end, r.b) - top) / span * 100) + '% - 4px)';
      b.addEventListener('click', function (e) { e.stopPropagation(); openSlot(t, t.start); });
      grid.appendChild(b);
    });
    grid.appendChild(el('div', { class: 'now-line', id: 'nowLine' }));
    body.appendChild(grid);
    placeNow(r);
    if (PL.mode === 'day') {
      if (!calScrolled) { calScrolled = true; body.scrollTop = Math.max(0, grid.offsetHeight * (now - r.a) / span - body.clientHeight / 3); }
      else body.scrollTop = keep;
    }
  }
  function placeNow(r) {
    var nl = $('#nowLine'); if (!nl || !r) return;
    var now = Date.now(); nl.hidden = now < r.a || now >= r.b;
    nl.style.top = ((now - r.a) / (r.b - r.a) * 100).toFixed(3) + '%';
  }
  function setDur(d) { slotEdit.dur = d; $$('#slotDur button').forEach(function (b) { b.classList.toggle('on', Number(b.dataset.d) === d); }); }
  function openSlot(task, t) {
    var f = $('#slotForm');
    slotEdit = { task: task, start: t, dur: task ? task.dur : 30 };
    $('#slotTitle').textContent = task ? 'Edit pomo' : 'Plan a pomo';
    f.elements.title.value = task ? task.title : '';
    f.elements.done.checked = !!(task && task.done);
    f.elements.done.parentNode.hidden = !task;
    $('#slotDelete').hidden = !task;
    setDur(slotEdit.dur);
    var upd = function () { $('#slotWhen').textContent = new Date(t).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) + ', ' + fmtTime(new Date(t)) + ' – ' + fmtTime(new Date(t + slotEdit.dur * 60000)); };
    upd(); slotEdit.upd = upd;
    $('#slotDlg').showModal(); f.elements.title.focus();
  }
  function bindCal() {
    var dlg = $('#slotDlg'), f = $('#slotForm');
    $('#sessBtn').addEventListener('click', function () { sessionActive() ? endSession() : startSession(); });
    $$('#calMode button').forEach(function (b) {
      b.addEventListener('click', function () { PL.mode = b.dataset.mode; calScrolled = false; savePlan(); renderCal(true); });
    });
    $$('#slotDur button').forEach(function (b) { b.addEventListener('click', function () { setDur(Number(b.dataset.d)); slotEdit.upd(); }); });
    $('#slotCancel').addEventListener('click', function () { dlg.close(); });
    $('#slotDelete').addEventListener('click', function () {
      PL.tasks = PL.tasks.filter(function (x) { return x !== slotEdit.task; }); savePlan(); renderCal(true); renderPomo(); dlg.close();
    });
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var title = f.elements.title.value.trim(); if (!title) return;
      if (slotEdit.task) { slotEdit.task.title = title; slotEdit.task.dur = slotEdit.dur; slotEdit.task.done = f.elements.done.checked; }
      else PL.tasks.push({ id: uid(), start: slotEdit.start, dur: slotEdit.dur, title: title, done: false });
      savePlan(); renderCal(true); renderPomo(); dlg.close();
    });
    window.addEventListener('resize', function () { placeNow(calRange()); });
  }

  /* ---------- persona presets ---------- */
  function applyPersona(id) {
    S.launcher.groups = personaGroups(id); S.launcher.persona = id; save();
    try { localStorage.removeItem(LFOCUS); } catch (e) {}
    renderLauncher(); renderGroupList();
  }
  function bindPersonas() {
    var dlg = $('#personaDlg'), list = $('#personaList'), sel = $('#presetSel');
    PERSONAS.forEach(function (p) {
      list.appendChild(el('button', { type: 'button', class: 'persona', onclick: function () {
        applyPersona(p.id); dlg.close(); toast('Folders set up for ' + p.name);
      } }, [el('b', { text: p.name }), el('span', { text: p.desc }),
            el('small', { text: p.groups.map(function (g) { return g.name; }).join(' · ') }),
            el('span', { class: 'p-icons' }, distinctApps(p).slice(0, 12).map(function (it) { var i = makeIco(it); i.title = tipFor(it); return i; }))]));
      sel.appendChild(el('option', { value: p.id, text: p.name }));
    });
    $('#personaSkip').addEventListener('click', function () { S.launcher.persona = 'solo'; save(); dlg.close(); });
    dlg.addEventListener('cancel', function () { save(); });
    var b = $('#presetApply');
    b.addEventListener('click', function () {
      if (!b.classList.contains('sure')) {
        b.classList.add('sure'); b.textContent = 'Click again to replace';
        return setTimeout(function () { b.classList.remove('sure'); b.textContent = 'Replace my folders'; }, 3000);
      }
      b.classList.remove('sure'); b.textContent = 'Replace my folders';
      var p = PERSONAS.filter(function (x) { return x.id === sel.value; })[0];
      applyPersona(sel.value); toast('Folders replaced with ' + p.name);
    });
    if (firstRun) dlg.showModal();
  }

  /* ---------- suggested apps ---------- */
  var dragNew = null;
  function normUrl(u) { return String(safeUrl(u) || '').replace(/\/+$/, '').toLowerCase(); }
  function personaApps(p) {
    var seen = {}, out = [];
    p.groups.forEach(function (g) { g.items.forEach(function (it) { var k = normUrl(it.url); if (!seen[k]) { seen[k] = 1; out.push(it); } }); });
    return out;
  }
  /* A persona's apps with the shared basics (mail, calendar, drive, AI) moved to the end. */
  function distinctApps(p) {
    var common = {};
    BASICS.concat(AI_APPS).forEach(function (it) { common[normUrl(it.url)] = 1; });
    var apps = personaApps(p);
    return apps.filter(function (it) { return !common[normUrl(it.url)]; }).concat(apps.filter(function (it) { return common[normUrl(it.url)]; }));
  }
  function haveUrls() {
    var have = {};
    S.launcher.groups.forEach(function (g) { g.items.forEach(function (it) { have[normUrl(it.url)] = 1; }); });
    return have;
  }
  function addSuggested(it, gi) {
    var g = S.launcher.groups[gi]; if (!g) return;
    g.items.push({ name: it.name, url: it.url }); dragNew = null; save();
    clearDrag(); renderLauncher(); renderSuggest(); toast(it.name + ' added to ' + g.name);
  }
  function renderSuggest() {
    var box = $('#suggestList'); if (!box || !$('#suggest').classList.contains('open')) return;
    var q = $('#suggestQ').value.trim().toLowerCase(), have = haveUrls(), mine = S.launcher.persona, shown = {}, total = 0;
    box.textContent = '';
    var order = PERSONAS.slice().sort(function (a, b) { return (b.id === mine) - (a.id === mine); });
    order.forEach(function (p) {
      var apps = personaApps(p).filter(function (it) {
        var k = normUrl(it.url);
        if (have[k] || shown[k]) return false;
        return !q || it.name.toLowerCase().indexOf(q) >= 0 || p.name.toLowerCase().indexOf(q) >= 0;
      });
      if (!apps.length) return;
      apps.forEach(function (it) { shown[normUrl(it.url)] = 1; });
      total += apps.length;
      var grid = el('div', { class: 'sg-grid' });
      apps.forEach(function (it) {
        var t = el('button', { type: 'button', class: 'tile sg', draggable: 'true', title: tipFor(it) + '\nDrag onto a folder, or click to choose one' },
          [makeIco(it), el('span', { class: 'lbl' }, [el('span', { class: 'lbl-n', text: it.name })])]);
        t.addEventListener('click', function () { openItem(0, -1, { name: it.name, url: it.url, icon: '' }); });
        t.addEventListener('dragstart', function (e) { dragNew = it; t.classList.add('dragging'); e.dataTransfer.effectAllowed = 'copy'; e.dataTransfer.setData('text/plain', it.url); });
        t.addEventListener('dragend', clearDrag);
        grid.appendChild(t);
      });
      box.appendChild(el('h3', { text: p.name + (p.id === mine ? ' · your preset' : '') }));
      box.appendChild(grid);
    });
    if (!total) box.appendChild(el('p', { class: 'note', text: q ? 'No suggested apps match “' + q + '”.' : 'You already have every suggested app.' }));
  }
  function openSuggest(on) {
    $('#suggest').classList.toggle('open', on); $('#suggest').setAttribute('aria-hidden', String(!on));
    $('#suggestBtn').classList.toggle('on', on);
    if (on) { renderSuggest(); $('#suggestQ').focus(); }
  }
  function bindSuggest() {
    $('#suggestBtn').addEventListener('click', function () { openSuggest(!$('#suggest').classList.contains('open')); });
    $('#closeSuggest').addEventListener('click', function () { openSuggest(false); });
    $('#suggestQ').addEventListener('input', renderSuggest);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('dialog[open]')) openSuggest(false); });
  }

  /* ---------- daily tip ---------- */
  function loadTips() {
    var o = null;
    try { o = JSON.parse(lsGet(LTIPS) || 'null'); } catch (e) {}
    return o && Array.isArray(o.dismissed) ? o : { dismissed: [], dismissedOn: '' };
  }
  var shownTip = null;
  function renderTip() {
    var st = loadTips(), t = S.general.tips ? pickTip(st, todayKey()) : null, box = $('#tip');
    shownTip = t; box.hidden = !t; document.body.classList.toggle('has-tip', !!t);
    if (!t) return;
    $('#tipText').textContent = t.text;
    $('#tipN').textContent = 'Tip ' + (TIPS.indexOf(t) + 1) + ' of ' + TIPS.length;
  }
  function bindTip() {
    $('#tipClose').addEventListener('click', function () {
      if (!shownTip) return;
      var st = loadTips();
      if (st.dismissed.indexOf(shownTip.id) < 0) st.dismissed.push(shownTip.id);
      st.dismissedOn = todayKey(); lsSet(LTIPS, JSON.stringify(st)); renderTip();
    });
  }

  /* ---------- settings UI ---------- */
  function sureButton(label, fn) {
    var b = el('button', { type: 'button', title: 'Delete', text: label });
    b.addEventListener('click', function () {
      if (b.classList.contains('sure')) return fn();
      b.classList.add('sure'); b.textContent = 'Delete?';
      setTimeout(function () { b.classList.remove('sure'); b.textContent = label; }, 2500);
    });
    return b;
  }
  function renderGroupList() {
    var box = $('#groupList'); box.textContent = '';
    var gs = S.launcher.groups;
    gs.forEach(function (g, i) {
      var n = el('input', { type: 'text', placeholder: 'Group name' }); n.value = g.name;
      n.addEventListener('input', function () { g.name = n.value; save(); renderLauncher(); });
      var mv = function (d) { return function () { var j = i + d; if (j < 0 || j >= gs.length) return; gs.splice(j, 0, gs.splice(i, 1)[0]); save(); renderGroupList(); renderLauncher(); }; };
      box.appendChild(el('div', { class: 'li' }, [n,
        el('button', { type: 'button', title: 'Move up', text: '↑', onclick: mv(-1) }),
        el('button', { type: 'button', title: 'Move down', text: '↓', onclick: mv(1) }),
        sureButton('✕', function () { gs.splice(i, 1); save(); renderGroupList(); renderLauncher(); })]));
    });
  }
  function fillInputs() {
    $$('[data-k]').forEach(function (inp) {
      var v = getK(inp.dataset.k);
      if (inp.type === 'checkbox') inp.checked = !!v; else inp.value = v;
    });
  }
  function refreshAll() {
    applyLook(); renderClock(); renderLauncher(); renderPomo(); renderCal(true); renderChip();
    fillInputs(); renderGroupList(); renderNotifState(); renderTip();
  }
  function openSettings(on) {
    $('#settings').classList.toggle('open', on); $('#settings').setAttribute('aria-hidden', String(!on)); $('#scrim').hidden = !on;
    if (on) { fillInputs(); renderNotifState(); }
  }
  function bindSettings() {
    $$('[data-k]').forEach(function (inp) {
      var onchg = function () {
        var v = inp.type === 'checkbox' ? inp.checked
          : (inp.type === 'number' || inp.type === 'range' || inp.hasAttribute('data-num')) ? Number(inp.value) : inp.value;
        if (inp.type === 'number' && !(v >= 1)) return;
        setK(inp.dataset.k, v); save();
        applyLook(); renderClock(); renderPomo(); renderChip(); renderTip();
        if (inp.dataset.k === 'launcher.newTab') renderLauncher();
        if (inp.dataset.k === 'general.h24') renderCal(true);
        if (inp.dataset.k === 'pomodoro.notify' && v) askNotifyPermission();
      };
      inp.addEventListener(inp.type === 'checkbox' || inp.tagName === 'SELECT' ? 'change' : 'input', onchg);
    });
    $('#settingsBtn').addEventListener('click', function () { openSettings(true); });
    $('#iconStyleBtn').addEventListener('click', function () {
      var i = ICON_STYLES.indexOf(S.launcher.iconStyle);
      S.launcher.iconStyle = ICON_STYLES[(i + 1) % ICON_STYLES.length]; save(); applyLook(); fillInputs();
      toast('App icons: ' + ICON_STYLE_NAME[S.launcher.iconStyle]);
    });
    $('#themeBtn').addEventListener('click', function () {
      S.general.theme = curTheme() === 'light' ? 'dark' : 'light'; save(); applyLook(); fillInputs();
    });
    if (sysLight && sysLight.addEventListener) sysLight.addEventListener('change', applyLook);
    $('#closeSettings').addEventListener('click', function () { openSettings(false); });
    $('#scrim').addEventListener('click', function () { openSettings(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('dialog[open]')) openSettings(false); });
    $$('#setTabs button').forEach(function (b) {
      b.addEventListener('click', function () {
        $$('#setTabs button').forEach(function (x) { x.classList.toggle('on', x === b); });
        $$('.pane').forEach(function (p) { p.classList.toggle('on', p.dataset.pane === b.dataset.tab); });
      });
    });
    $('#addGroup').addEventListener('click', function () { S.launcher.groups.push({ id: uid(), name: 'New folder', items: [] }); save(); renderGroupList(); renderLauncher(); });
    $('#testChime').addEventListener('click', function () { doChime(new Date()); });
    $('#testPomo').addEventListener('click', function () { announce('work', { phase: 'short', auto: false }); });
    $('#chimeBtn').addEventListener('click', function () {
      // Only ever turns the chime on (and unlocks sound). Turning it off lives in Settings > Time chime.
      var was = S.chime.enabled && soundOK;
      if (!S.chime.enabled) { S.chime.enabled = true; save(); fillInputs(); }
      checkSound().then(function () { renderChip(); if (!was) toast('Time chime on'); });
    });
    $('#exportBtn').addEventListener('click', function () {
      var a = el('a', { href: URL.createObjectURL(new Blob([JSON.stringify({ app: 'focus-home', settings: S, plan: PL }, null, 2)], { type: 'application/json' })), download: 'focus-home-settings.json' });
      document.body.appendChild(a); a.click(); a.remove();
    });
    $('#importFile').addEventListener('change', function (e) {
      var file = e.target.files[0]; if (!file) return;
      var r = new FileReader();
      r.onload = function () {
        try {
          var o = JSON.parse(r.result); S = deepMerge(clone(DEFAULTS), o.settings || o); save();
          if (o.plan && Array.isArray(o.plan.tasks)) { PL = o.plan; savePlan(); PL = loadPlan(); } refreshAll(); toast('Settings imported');
        } catch (err) { toast('That file is not a valid settings export'); }
        e.target.value = '';
      };
      r.readAsText(file);
    });
    var rb = $('#resetBtn');
    rb.addEventListener('click', function () {
      if (!rb.classList.contains('sure')) {
        rb.classList.add('sure'); rb.textContent = 'Click again to erase all settings';
        return setTimeout(function () { rb.classList.remove('sure'); rb.textContent = 'Reset everything'; }, 3000);
      }
      S = clone(DEFAULTS); save(); P = { phase: 'work', count: 0, running: false, endAt: 0, remaining: null }; savePomo();
      PL = { tasks: [], session: null, mode: 'session' }; savePlan();
      try { localStorage.removeItem(LTIPS); } catch (e) {}
      rb.classList.remove('sure'); rb.textContent = 'Reset everything'; refreshAll(); toast('Everything reset'); openSettings(false); $('#personaDlg').showModal();
    });
  }

  /* ---------- start ---------- */
  var lastMin = -1;
  function tick() {
    renderClock(); pomoTick();
    var m = Math.floor(Date.now() / 60000);
    if (m !== lastMin) { lastMin = m; chimeCheck(); renderChip(); checkSessionEnd(); checkTaskStart(); renderCal();
      if (todayKey() !== lastLaunchDay) { lastLaunchDay = todayKey(); refreshBadges(); renderTip(); } }
    else placeNow(calRange());
  }
  function startTicker() {
    try {
      var w = new Worker('worker.js');
      w.onmessage = tick;
      w.onerror = function () { w.terminate(); setInterval(tick, 1000); };
    } catch (e) { setInterval(tick, 1000); }
  }

  bindPomo(); bindAsk(); bindItemDialog(); bindCal(); bindTip(); bindSuggest(); bindSettings();
  if (window.ResizeObserver) new ResizeObserver(fitFolders).observe($('#launcher'));
  else window.addEventListener('resize', fitFolders);
  refreshAll();
  lastMin = Math.floor(Date.now() / 60000);
  bindPersonas();
  startTicker();
  checkSound();
  fillVoices();
  if ('speechSynthesis' in window) speechSynthesis.addEventListener('voiceschanged', fillVoices);

  ['pointerdown', 'keydown'].forEach(function (ev) {
    window.addEventListener(ev, function () { stopFlash(); if (!soundOK) checkSound(); }, true);
  });
  window.addEventListener('focus', stopFlash);
  window.addEventListener('pageshow', refreshBadges);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) refreshBadges(); });
  window.addEventListener('storage', function (e) {   // keep several open copies in step
    if (e.key === LP) { P = loadPomo(); renderPomo(); }
    if (e.key === LLAUNCH) refreshBadges();
    if (e.key === LTIPS) renderTip();
    if (e.key === LFOCUS) renderLauncher();
    if (e.key === LPLAN) { PL = loadPlan(); renderCal(true); renderPomo(); }
    if (e.key === LS) { S = loadSettings(); refreshAll(); }
  });
  if (location.hash === '#settings') openSettings(true);
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(function () {});
})();
