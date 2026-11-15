/* Defaults and pure logic (no DOM). */
var DEFAULTS = {
  general: { theme: 'auto', name: '', h24: false, showSeconds: false, showDate: true, accent: '#ff7a59', bg: 'aurora', bgImage: '' },
  pomodoro: { work: 25, short: 5, long: 15, longEvery: 4, autoBreaks: true, autoWork: false,
              sound: true, notify: true, speak: true, volume: 0.7 },
  chime: { enabled: true, interval: 30, beep: true, speak: true, tone: 'warm', volume: 0.6,
           voice: '', rate: 1, pitch: 1, template: "It's {time}",
           quiet: false, quietFrom: '23:00', quietTo: '07:00' },
  ask: { engine: 'aimode', newTab: false, copy: false,
    engines: [
      { id: 'aimode', name: 'Google AI Mode', url: 'https://www.google.com/search?udm=50&q=%s' },
      { id: 'gemini', name: 'Gemini app (paste)', url: 'https://gemini.google.com/app' },
      { id: 'chatgpt', name: 'ChatGPT', url: 'https://chatgpt.com/?q=%s' },
      { id: 'claude', name: 'Claude', url: 'https://claude.ai/new?q=%s' },
      { id: 'perplexity', name: 'Perplexity', url: 'https://www.perplexity.ai/search?q=%s' },
      { id: 'google', name: 'Google', url: 'https://www.google.com/search?q=%s' }
    ] },
  launcher: { newTab: false, iconSize: 52, labels: true,
    groups: [
      { id: 'g1', name: 'Daily', items: [
        { name: 'Gmail', url: 'https://mail.google.com' },
        { name: 'Calendar', url: 'https://calendar.google.com' },
        { name: 'Drive', url: 'https://drive.google.com' },
        { name: 'YouTube', url: 'https://www.youtube.com' },
        { name: 'WhatsApp', url: 'https://web.whatsapp.com' } ] },
      { id: 'g2', name: 'Work', items: [
        { name: 'GitHub', url: 'https://github.com' },
        { name: 'Notion', url: 'https://www.notion.so' },
        { name: 'LinkedIn', url: 'https://www.linkedin.com' },
        { name: 'Figma', url: 'https://www.figma.com' } ] },
      { id: 'g3', name: 'AI', items: [
        { name: 'Gemini', url: 'https://gemini.google.com' },
        { name: 'ChatGPT', url: 'https://chatgpt.com' },
        { name: 'Claude', url: 'https://claude.ai' },
        { name: 'Perplexity', url: 'https://www.perplexity.ai' } ] }
    ] }
};

function deepMerge(base, over) {
  if (Array.isArray(base)) return Array.isArray(over) ? over : base;
  if (base && typeof base === 'object') {
    var out = {};
    Object.keys(base).forEach(function (k) {
      out[k] = deepMerge(base[k], over && typeof over === 'object' ? over[k] : undefined);
    });
    return out;
  }
  return over === undefined ? base : over;
}

/* Pomodoro phase logic — deterministic so page and background agree. */
function pomoDuration(phase, cfg) {
  var m = phase === 'work' ? cfg.work : phase === 'short' ? cfg.short : cfg.long;
  return Math.max(1, Number(m) || 1) * 60000;
}
function pomoNext(phase, count, cfg) {
  if (phase === 'work') {
    var c = count + 1;
    var next = c % Math.max(1, cfg.longEvery) === 0 ? 'long' : 'short';
    return { phase: next, count: c, auto: !!cfg.autoBreaks };
  }
  return { phase: 'work', count: count, auto: !!cfg.autoWork };
}
var PHASE_LABEL = { work: 'Focus', short: 'Short break', long: 'Long break' };

/* Time chime helpers */
function speakTimeText(d, chime, h24) {
  var h = d.getHours(), m = d.getMinutes(), t;
  if (h24) {
    t = m === 0 ? h + " hundred" : h + ':' + String(m).padStart(2, '0');
    if (m === 0 && h === 0) t = 'midnight';
  } else {
    var ap = h < 12 ? 'AM' : 'PM', h12 = h % 12 || 12;
    t = m === 0 ? h12 + ' ' + ap : h12 + ':' + String(m).padStart(2, '0') + ' ' + ap;
    if (m === 0 && h === 12) t = 'noon';
    if (m === 0 && h === 0) t = 'midnight';
  }
  return String(chime.template || "It's {time}").replace('{time}', t);
}
function toMin(s) { var p = String(s || '0:0').split(':'); return (+p[0] || 0) * 60 + (+p[1] || 0); }
function inQuietHours(d, from, to) {
  var m = d.getHours() * 60 + d.getMinutes(), a = toMin(from), b = toMin(to);
  return a <= b ? (m >= a && m < b) : (m >= a || m < b);
}
function isChimeMinute(d, chime) {
  if (!chime.enabled) return false;
  var m = d.getHours() * 60 + d.getMinutes();
  if (m % Math.max(1, chime.interval)) return false;
  if (chime.quiet && inQuietHours(d, chime.quietFrom, chime.quietTo)) return false;
  return true;
}
