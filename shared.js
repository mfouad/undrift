/* Defaults and pure logic (no DOM). */
var DEFAULTS = {
  general: { tips: true, theme: 'auto', name: '', h24: false, showSeconds: false, showDate: true, showProgress: true, weekStart: 1, accent: '#ff7a59', bg: 'aurora', bgImage: '' },
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
  launcher: { newTab: false, iconSize: 40, labels: true, iconStyle: 'muted', persona: '',
    groups: [] }
};

/* Persona presets for the launcher. Feeds (X, LinkedIn, YouTube) link to the page where
   you make something (compose, post, studio) rather than the scrolling feed. */
function A(name, url) { return { name: name, url: url }; }
var AI_APPS = [A('Claude', 'https://claude.ai'), A('ChatGPT', 'https://chatgpt.com'), A('Gemini', 'https://gemini.google.com'), A('Perplexity', 'https://www.perplexity.ai')];
var BASICS = [A('Gmail', 'https://mail.google.com'), A('Calendar', 'https://calendar.google.com'), A('Drive', 'https://drive.google.com')];
var X_POST = A('X (post)', 'https://x.com/compose/post'), LI_POST = A('LinkedIn (post)', 'https://www.linkedin.com/feed/?shareActive=true');
var PERSONAS = [
  { id: 'solo', name: 'Solo founder', desc: 'Build it, sell it, run it — alone', groups: [
    { name: 'Daily', items: BASICS.concat([A('Notion', 'https://www.notion.so'), A('WhatsApp', 'https://web.whatsapp.com')]) },
    { name: 'Build', items: [A('GitHub', 'https://github.com'), A('Vercel', 'https://vercel.com/dashboard'), A('Supabase', 'https://supabase.com/dashboard'), A('Figma', 'https://www.figma.com'), A('Linear', 'https://linear.app')] },
    { name: 'Grow', items: [A('Stripe', 'https://dashboard.stripe.com'), X_POST, LI_POST, A('Analytics', 'https://analytics.google.com'), A('YouTube Studio', 'https://studio.youtube.com')] },
    { name: 'AI', items: AI_APPS } ] },
  { id: 'startup', name: 'Startup founder', desc: 'Team, product, money and fundraising', groups: [
    { name: 'Team', items: BASICS.slice(0, 2).concat([A('Slack', 'https://app.slack.com'), A('Notion', 'https://www.notion.so'), A('Meet', 'https://meet.google.com')]) },
    { name: 'Product', items: [A('Linear', 'https://linear.app'), A('GitHub', 'https://github.com'), A('Figma', 'https://www.figma.com'), A('Analytics', 'https://analytics.google.com')] },
    { name: 'Company', items: [A('Stripe', 'https://dashboard.stripe.com'), A('Mercury', 'https://app.mercury.com'), A('Carta', 'https://app.carta.com'), A('Gusto', 'https://app.gusto.com'), A('DocuSign', 'https://app.docusign.com')] },
    { name: 'Fundraise', items: [A('Attio', 'https://app.attio.com'), A('DocSend', 'https://www.docsend.com'), A('Crunchbase', 'https://www.crunchbase.com'), LI_POST, A('Calendly', 'https://calendly.com/app')] },
    { name: 'AI', items: AI_APPS } ] },
  { id: 'builder', name: 'Builder', desc: 'Developer or indie hacker shipping product', groups: [
    { name: 'Daily', items: BASICS.concat([A('Notion', 'https://www.notion.so')]) },
    { name: 'Code', items: [A('GitHub', 'https://github.com'), A('localhost', 'http://localhost:3000'), A('Linear', 'https://linear.app'), A('Figma', 'https://www.figma.com')] },
    { name: 'Ship', items: [A('Vercel', 'https://vercel.com/dashboard'), A('Cloudflare', 'https://dash.cloudflare.com'), A('Supabase', 'https://supabase.com/dashboard'), A('Sentry', 'https://sentry.io')] },
    { name: 'Docs', items: [A('MDN', 'https://developer.mozilla.org'), A('Stack Overflow', 'https://stackoverflow.com'), A('npm', 'https://www.npmjs.com'), A('Can I use', 'https://caniuse.com')] },
    { name: 'AI', items: AI_APPS } ] },
  { id: 'marketer', name: 'Marketer / creator', desc: 'Content, social and growth', groups: [
    { name: 'Daily', items: BASICS.concat([A('Notion', 'https://www.notion.so')]) },
    { name: 'Publish', items: [X_POST, LI_POST, A('Buffer', 'https://publish.buffer.com'), A('Typefully', 'https://typefully.com'), A('Beehiiv', 'https://app.beehiiv.com')] },
    { name: 'Create', items: [A('Canva', 'https://www.canva.com'), A('CapCut', 'https://www.capcut.com'), A('YouTube Studio', 'https://studio.youtube.com'), A('Descript', 'https://web.descript.com')] },
    { name: 'Measure', items: [A('Analytics', 'https://analytics.google.com'), A('Search Console', 'https://search.google.com/search-console'), A('Plausible', 'https://plausible.io/sites')] },
    { name: 'AI', items: AI_APPS } ] },
  { id: 'sales', name: 'Sales / customer', desc: 'Pipeline, meetings and support', groups: [
    { name: 'Daily', items: BASICS.concat([A('Slack', 'https://app.slack.com')]) },
    { name: 'Pipeline', items: [A('HubSpot', 'https://app.hubspot.com'), A('Attio', 'https://app.attio.com'), A('Pipedrive', 'https://app.pipedrive.com'), A('Sales Navigator', 'https://www.linkedin.com/sales/')] },
    { name: 'Meetings', items: [A('Calendly', 'https://calendly.com/app'), A('Cal.com', 'https://app.cal.com'), A('Meet', 'https://meet.google.com'), A('Zoom', 'https://app.zoom.us')] },
    { name: 'Support', items: [A('Intercom', 'https://app.intercom.com'), A('Crisp', 'https://app.crisp.chat'), A('Help Scout', 'https://secure.helpscout.net')] },
    { name: 'AI', items: AI_APPS } ] },
  { id: 'designer', name: 'Designer', desc: 'Product, brand and web design', groups: [
    { name: 'Daily', items: BASICS.concat([A('Notion', 'https://www.notion.so')]) },
    { name: 'Design', items: [A('Figma', 'https://www.figma.com'), A('Framer', 'https://framer.com/projects'), A('Webflow', 'https://webflow.com/dashboard'), A('Spline', 'https://app.spline.design')] },
    { name: 'Inspire', items: [A('Mobbin', 'https://mobbin.com'), A('Dribbble', 'https://dribbble.com'), A('Behance', 'https://www.behance.net')] },
    { name: 'Assets', items: [A('Google Fonts', 'https://fonts.google.com'), A('Coolors', 'https://coolors.co'), A('Unsplash', 'https://unsplash.com'), A('Iconify', 'https://icon-sets.iconify.design')] },
    { name: 'AI', items: AI_APPS } ] },
  { id: 'ops', name: 'Ops / admin', desc: 'Money, people and paperwork', groups: [
    { name: 'Daily', items: BASICS.concat([A('Sheets', 'https://sheets.google.com')]) },
    { name: 'Money', items: [A('QuickBooks', 'https://qbo.intuit.com'), A('Xero', 'https://go.xero.com'), A('Mercury', 'https://app.mercury.com'), A('Stripe', 'https://dashboard.stripe.com')] },
    { name: 'People', items: [A('Gusto', 'https://app.gusto.com'), A('Deel', 'https://app.deel.com'), A('Slack', 'https://app.slack.com')] },
    { name: 'Docs', items: [A('DocuSign', 'https://app.docusign.com'), A('1Password', 'https://my.1password.com'), A('Notion', 'https://www.notion.so')] },
    { name: 'AI', items: AI_APPS } ] }
];
/* A fresh copy of a persona's folders, with ids. */
function personaGroups(id) {
  var p = PERSONAS.filter(function (x) { return x.id === id; })[0] || PERSONAS[0];
  return JSON.parse(JSON.stringify(p.groups)).map(function (g, i) { g.id = p.id + i + Math.random().toString(36).slice(2, 6); return g; });
}
DEFAULTS.launcher.groups = personaGroups('solo');

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

/* Day / week / month progress. weekStart: 0 = Sunday, 1 = Monday, 6 = Saturday. */
function periodProgress(d, weekStart) {
  var y = d.getFullYear(), mo = d.getMonth(), day = d.getDate();
  var dayStart = new Date(y, mo, day), dayEnd = new Date(y, mo, day + 1);
  var back = (d.getDay() - (Number(weekStart) || 0) + 7) % 7;
  var wkStart = new Date(y, mo, day - back), wkEnd = new Date(y, mo, day - back + 7);
  var moStart = new Date(y, mo, 1), moEnd = new Date(y, mo + 1, 1);
  function part(a, b) {
    return { start: a, end: b, frac: Math.min(1, Math.max(0, (d - a) / (b - a))), left: Math.max(0, b - d) };
  }
  return { day: part(dayStart, dayEnd), week: part(wkStart, wkEnd), month: part(moStart, moEnd) };
}
function fmtLeft(ms) {
  var min = Math.floor(ms / 60000), dd = Math.floor(min / 1440), h = Math.floor(min % 1440 / 60), m = min % 60;
  if (dd) return dd + 'd ' + h + 'h';
  if (h) return h + 'h ' + m + 'm';
  return m + 'm';
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

/* Daily tips. One shows per day until dismissed, in this order.
   Tips are tracked by id, so to add more just append new entries with a new id —
   people who dismissed the old ones will see the new ones next. Never reuse an id. */
var TIPS = [
  { id: 'focus-folder', text: 'Hover a folder and click ⤢ to focus on it — the other folders hide. Click ⤡ to zoom back out.' },
  { id: 'icon-style', text: 'The drop button at the top switches app icons between muted, greyscale and full colour. Muted icons pull less attention.' },
  { id: 'launch-count', text: 'The small ×3 next to an app is how many times you opened it today. It resets at midnight.' },
  { id: 'start-session', text: 'Press Start session above the calendar to plan the next 4 hours in pomos.' },
  { id: 'plan-slot', text: 'Click any empty calendar slot to plan a 30-minute or 1-hour pomo. Click a block to edit it or mark it done.' },
  { id: 'full-day', text: 'Switch the calendar to Full day to see everything you planned today.' },
  { id: 'pomo-task', text: 'When a planned block is running, its name shows under the pomodoro timer.' },
  { id: 'task-start', text: 'When a planned block starts, Undrift says its name and shows a notification, using your Pomodoro sound settings.' },
  { id: 'day-meter', text: 'The Day meter runs from 6 AM to 6 AM. The faded blocks at the end are night hours.' },
  { id: 'meter-colours', text: 'The day, week and month meters turn amber at half left and red at a quarter left.' },
  { id: 'suggested-apps', text: 'The grid-plus button at the top opens Suggested apps. Drag any of them onto a folder to add it.' },
  { id: 'edit-bookmark', text: 'Right-click any app to edit, move or delete it.' },
  { id: 'drag-apps', text: 'Drag apps to reorder them or move them to another folder. Drag a folder by its name to reorder folders.' },
  { id: 'rename-folder', text: 'Double-click a folder name to rename it.' },
  { id: 'open-all', text: 'The ⧉ button on a folder opens every app in it at once.' },
  { id: 'ask-enter', text: 'Type in the Ask box and press Enter to ask Google AI Mode. Shift+Enter adds a new line.' },
  { id: 'chime', text: 'The time chime says the time every 30 minutes so you notice when you drift. Change it in Settings › Time chime.' },
  { id: 'pomo-dots', text: 'The dots under the timer count focus sessions toward a long break. Double-click them to reset.' },
  { id: 'backup', text: 'Everything lives in this browser. Use Settings › Backup to export a copy.' },
  { id: 'startup', text: 'Set Undrift as your Chrome startup page and home button so every new start lands here.' }
];
/* Pick today's tip: none if one was already dismissed today, else the first not yet dismissed. */
function pickTip(state, today) {
  if (state.dismissedOn === today) return null;
  var done = state.dismissed || [];
  for (var i = 0; i < TIPS.length; i++) if (done.indexOf(TIPS[i].id) < 0) return TIPS[i];
  return null;
}
