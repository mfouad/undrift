(function () {
  'use strict';
  var LS = 'fh.settings', LP = 'fh.pomo', LSLOT = 'fh.lastSlot';
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
    document.body.dataset.bg = g.bg;
    $('#bg').style.backgroundImage = g.bg === 'image' && /^https?:\/\//i.test(g.bgImage) ? 'url("' + encodeURI(g.bgImage) + '")' : '';
    $('#launcher').classList.toggle('nolabels', !S.launcher.labels);
    $('#date').hidden = !g.showDate;
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
  var RING = 2 * Math.PI * 96, flashT = null, flashMsg = '';
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
    $('#pomoLabel').textContent = PHASE_LABEL[P.phase];
    $('#pomo').dataset.phase = P.phase;
    $('#ringBar').style.strokeDashoffset = String(RING * (1 - Math.min(1, left / total)));
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
  function curEngine() {
    var e = S.ask.engines;
    return e.filter(function (x) { return x.id === S.ask.engine; })[0] || e[0] || { id: '', name: 'Google', url: 'https://www.google.com/search?q=%s' };
  }
  function renderEngines() {
    var box = $('#engines'), cur = curEngine(); box.textContent = '';
    S.ask.engines.forEach(function (e) {
      box.appendChild(el('button', { type: 'button', class: e.id === cur.id ? 'on' : '', text: e.name,
        onclick: function () { S.ask.engine = e.id; save(); renderEngines(); renderEngineList(); $('#q').focus(); } }));
    });
    $('#q').placeholder = 'Ask ' + cur.name.replace(/\s*\(.*\)$/, '') + '…';
  }
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
      var eng = curEngine(), has = eng.url.indexOf('%s') >= 0;
      var url = safeUrl(has ? eng.url.split('%s').join(encodeURIComponent(text)) : eng.url);
      if (!url) return toast('That engine has an invalid address — fix it in Settings › Ask');
      var go = function () {
        if (S.ask.newTab) { window.open(url, '_blank', 'noopener'); q.value = ''; grow(); }
        else location.href = url;
      };
      if (!has || S.ask.copy) copyText(text).then(function (ok) {
        if (!has) toast(ok ? 'Question copied — press Ctrl+V in ' + eng.name.replace(/\s*\(.*\)$/, '') : 'Could not copy the question');
        setTimeout(go, has ? 0 : 500);
      }); else go();
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
  function renderLauncher() {
    var root = $('#launcher'); root.textContent = '';
    S.launcher.groups.forEach(function (g, gi) {
      var tiles = el('div', { class: 'tiles' });
      g.items.forEach(function (it, ii) {
        var url = safeUrl(it.url), ico = el('span', { class: 'ico' }), h = host(url);
        var src = it.icon && /^(https?:|data:image\/)/i.test(it.icon) ? it.icon
          : h ? 'https://www.google.com/s2/favicons?domain=' + encodeURIComponent(h) + '&sz=64' : '';
        if (src) {
          var img = el('img', { alt: '', loading: 'lazy', referrerpolicy: 'no-referrer' });
          img.addEventListener('error', function () { img.remove(); letterIcon(ico, it.name); });
          img.src = src; ico.appendChild(img);
        } else letterIcon(ico, it.name);
        var a = el('a', { class: 'tile', href: url || '#', title: it.name, draggable: 'true',
          target: S.launcher.newTab ? '_blank' : false, rel: 'noopener noreferrer' },
          [ico, el('span', { class: 'lbl', text: it.name })]);
        a.addEventListener('contextmenu', function (e) { e.preventDefault(); openItem(gi, ii); });
        a.addEventListener('dragstart', function (e) { drag = { g: gi, i: ii }; a.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', it.url); });
        a.addEventListener('dragend', function () { drag = null; $$('.dragging,.over').forEach(function (x) { x.classList.remove('dragging', 'over'); }); });
        a.addEventListener('dragover', function (e) { if (drag) { e.preventDefault(); a.classList.add('over'); } });
        a.addEventListener('dragleave', function () { a.classList.remove('over'); });
        a.addEventListener('drop', function (e) { if (drag) { e.preventDefault(); e.stopPropagation(); moveItem(drag, gi, ii); } });
        tiles.appendChild(a);
      });
      tiles.appendChild(el('button', { type: 'button', class: 'tile add', title: 'Add bookmark to ' + g.name,
        onclick: function () { openItem(gi, -1); } }, [el('span', { class: 'ico', text: '+' }), el('span', { class: 'lbl', text: 'Add' })]));
      tiles.addEventListener('dragover', function (e) { if (drag) e.preventDefault(); });
      tiles.addEventListener('drop', function (e) { if (drag) { e.preventDefault(); moveItem(drag, gi, g.items.length); } });
      root.appendChild(el('div', { class: 'group' }, [
        el('div', { class: 'group-head' }, [
          el('span', { class: 'gname', text: g.name }),
          el('button', { type: 'button', class: 'mini', title: 'Open all in tabs', text: '⧉', onclick: function () { openAll(g); } })
        ]), tiles]));
    });
    if (!S.launcher.groups.length) root.appendChild(el('p', { class: 'note', text: 'No groups yet — add one in Settings › Launcher.' }));
  }
  function moveItem(from, tg, ti) {
    var gs = S.launcher.groups, it = gs[from.g].items.splice(from.i, 1)[0];
    if (from.g === tg && from.i < ti) ti--;
    gs[tg].items.splice(ti, 0, it); drag = null; save(); renderLauncher();
  }
  function openAll(g) {
    var blocked = 0;
    g.items.forEach(function (it) { var u = safeUrl(it.url); if (u && !window.open(u, '_blank')) blocked++; });
    if (blocked) toast('Chrome blocked ' + blocked + ' tab(s) — allow pop-ups for this site to use “open all”');
  }
  function openItem(gi, ii) {
    var f = $('#itemForm'), it = ii >= 0 ? S.launcher.groups[gi].items[ii] : { name: '', url: '', icon: '' };
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
      save(); renderLauncher(); dlg.close();
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
  function renderEngineList() {
    var box = $('#engineList'); box.textContent = '';
    S.ask.engines.forEach(function (e, i) {
      var r = el('input', { type: 'radio', name: 'defEngine', title: 'Use as default' }); r.checked = e.id === curEngine().id;
      r.addEventListener('change', function () { S.ask.engine = e.id; save(); renderEngines(); });
      var n = el('input', { type: 'text', class: 'nm', placeholder: 'Name' }); n.value = e.name;
      n.addEventListener('input', function () { e.name = n.value; save(); renderEngines(); });
      var u = el('input', { type: 'text', placeholder: 'https://…?q=%s' }); u.value = e.url;
      u.addEventListener('input', function () { e.url = u.value.trim(); save(); });
      box.appendChild(el('div', { class: 'li' }, [r, n, u, sureButton('✕', function () {
        S.ask.engines.splice(i, 1); save(); renderEngineList(); renderEngines();
      })]));
    });
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
    applyLook(); renderClock(); renderEngines(); renderLauncher(); renderPomo(); renderChip();
    fillInputs(); renderEngineList(); renderGroupList(); renderNotifState();
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
        applyLook(); renderClock(); renderPomo(); renderChip();
        if (inp.dataset.k === 'launcher.newTab') renderLauncher();
        if (inp.dataset.k === 'pomodoro.notify' && v) askNotifyPermission();
      };
      inp.addEventListener(inp.type === 'checkbox' || inp.tagName === 'SELECT' ? 'change' : 'input', onchg);
    });
    $('#settingsBtn').addEventListener('click', function () { openSettings(true); });
    $('#themeBtn').addEventListener('click', function () {
      S.general.theme = curTheme() === 'light' ? 'dark' : 'light'; save(); applyLook(); fillInputs();
    });
    if (sysLight && sysLight.addEventListener) sysLight.addEventListener('change', applyLook);
    $('#closeSettings').addEventListener('click', function () { openSettings(false); });
    $('#scrim').addEventListener('click', function () { openSettings(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('#itemDlg').open) openSettings(false); });
    $$('#setTabs button').forEach(function (b) {
      b.addEventListener('click', function () {
        $$('#setTabs button').forEach(function (x) { x.classList.toggle('on', x === b); });
        $$('.pane').forEach(function (p) { p.classList.toggle('on', p.dataset.pane === b.dataset.tab); });
      });
    });
    $('#addEngine').addEventListener('click', function () { S.ask.engines.push({ id: uid(), name: 'New engine', url: 'https://example.com/search?q=%s' }); save(); renderEngineList(); renderEngines(); });
    $('#addGroup').addEventListener('click', function () { S.launcher.groups.push({ id: uid(), name: 'New group', items: [] }); save(); renderGroupList(); renderLauncher(); });
    $('#testChime').addEventListener('click', function () { doChime(new Date()); });
    $('#testPomo').addEventListener('click', function () { announce('work', { phase: 'short', auto: false }); });
    $('#chimeBtn').addEventListener('click', function () {
      var wasOK = soundOK;
      checkSound().then(function () {
        if (!wasOK && S.chime.enabled) return toast('Sound enabled');   // first click only unlocks sound
        S.chime.enabled = !S.chime.enabled; save(); renderChip(); fillInputs();
        toast(S.chime.enabled ? 'Time chime on' : 'Time chime off');
      });
    });
    $('#exportBtn').addEventListener('click', function () {
      var a = el('a', { href: URL.createObjectURL(new Blob([JSON.stringify({ app: 'focus-home', settings: S }, null, 2)], { type: 'application/json' })), download: 'focus-home-settings.json' });
      document.body.appendChild(a); a.click(); a.remove();
    });
    $('#importFile').addEventListener('change', function (e) {
      var file = e.target.files[0]; if (!file) return;
      var r = new FileReader();
      r.onload = function () {
        try {
          var o = JSON.parse(r.result); S = deepMerge(clone(DEFAULTS), o.settings || o); save(); refreshAll(); toast('Settings imported');
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
      rb.classList.remove('sure'); rb.textContent = 'Reset everything'; refreshAll(); toast('Everything reset');
    });
  }

  /* ---------- start ---------- */
  var lastMin = -1;
  function tick() {
    renderClock(); pomoTick();
    var m = Math.floor(Date.now() / 60000);
    if (m !== lastMin) { lastMin = m; chimeCheck(); renderChip(); }
  }
  function startTicker() {
    try {
      var w = new Worker('worker.js');
      w.onmessage = tick;
      w.onerror = function () { w.terminate(); setInterval(tick, 1000); };
    } catch (e) { setInterval(tick, 1000); }
  }

  bindPomo(); bindAsk(); bindItemDialog(); bindSettings();
  refreshAll();
  lastMin = Math.floor(Date.now() / 60000);
  startTicker();
  checkSound();
  fillVoices();
  if ('speechSynthesis' in window) speechSynthesis.addEventListener('voiceschanged', fillVoices);

  ['pointerdown', 'keydown'].forEach(function (ev) {
    window.addEventListener(ev, function () { stopFlash(); if (!soundOK) checkSound(); }, true);
  });
  window.addEventListener('focus', stopFlash);
  window.addEventListener('storage', function (e) {   // keep several open copies in step
    if (e.key === LP) { P = loadPomo(); renderPomo(); }
    if (e.key === LS) { S = loadSettings(); refreshAll(); }
  });
  if (location.hash === '#settings') openSettings(true);
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(function () {});
})();
