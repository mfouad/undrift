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

/* Persona presets for the launcher. Feeds (X, LinkedIn, YouTube, Reddit) link to the page
   where you make something (compose, post, studio) rather than the scrolling feed.
   Each app has a short description, shown as its tooltip. */
function A(name, url, desc) { return { name: name, url: url, desc: desc }; }
var APP = {
  gmail: A('Gmail', 'https://mail.google.com', 'Email (Google)'),
  calendar: A('Calendar', 'https://calendar.google.com', 'Meetings and schedule (Google Calendar)'),
  drive: A('Drive', 'https://drive.google.com', 'Files and shared folders (Google Drive)'),
  docs: A('Docs', 'https://docs.google.com', 'Write and share documents (Google Docs)'),
  sheets: A('Sheets', 'https://sheets.google.com', 'Spreadsheets (Google Sheets)'),
  meet: A('Meet', 'https://meet.google.com', 'Video calls (Google Meet)'),
  notion: A('Notion', 'https://www.notion.so', 'Docs, wiki and lightweight databases'),
  whatsapp: A('WhatsApp', 'https://web.whatsapp.com', 'Chats on the web'),
  slack: A('Slack', 'https://app.slack.com', 'Team chat'),
  discord: A('Discord', 'https://discord.com/app', 'Community chat servers'),
  zoom: A('Zoom', 'https://app.zoom.us', 'Video meetings and webinars'),
  github: A('GitHub', 'https://github.com', 'Code hosting, pull requests and issues'),
  linear: A('Linear', 'https://linear.app', 'Fast issue tracker and product roadmap'),
  figma: A('Figma', 'https://www.figma.com', 'Collaborative design and prototyping'),
  vercel: A('Vercel', 'https://vercel.com/dashboard', 'Deploy and host web apps'),
  supabase: A('Supabase', 'https://supabase.com/dashboard', 'Postgres database, auth and storage'),
  cloudflare: A('Cloudflare', 'https://dash.cloudflare.com', 'DNS, CDN, Workers and Pages'),
  railway: A('Railway', 'https://railway.com/dashboard', 'Deploy servers and databases in a click'),
  sentry: A('Sentry', 'https://sentry.io', 'Error and performance monitoring'),
  resend: A('Resend', 'https://resend.com/emails', 'Email API for developers'),
  localhost: A('localhost', 'http://localhost:3000', 'Your local dev server (port 3000)'),
  v0: A('v0', 'https://v0.dev', 'Vercel’s AI that builds UI and apps from a prompt'),
  lovable: A('Lovable', 'https://lovable.dev', 'AI app builder — describe it, get a working app'),
  bolt: A('Bolt', 'https://bolt.new', 'AI full-stack app builder in the browser'),
  replit: A('Replit', 'https://replit.com', 'Online IDE with an AI agent and hosting'),
  cursor: A('Cursor', 'https://cursor.com', 'AI code editor'),
  mdn: A('MDN', 'https://developer.mozilla.org', 'Web platform docs (HTML, CSS, JS)'),
  stackoverflow: A('Stack Overflow', 'https://stackoverflow.com', 'Programming Q&A'),
  npm: A('npm', 'https://www.npmjs.com', 'JavaScript package registry'),
  stripe: A('Stripe', 'https://dashboard.stripe.com', 'Payments, subscriptions and revenue'),
  mercury: A('Mercury', 'https://app.mercury.com', 'Banking for startups'),
  ramp: A('Ramp', 'https://app.ramp.com', 'Corporate cards and spend management'),
  carta: A('Carta', 'https://app.carta.com', 'Cap table and equity management'),
  gusto: A('Gusto', 'https://app.gusto.com', 'Payroll, benefits and HR'),
  deel: A('Deel', 'https://app.deel.com', 'Hire and pay people worldwide'),
  docusign: A('DocuSign', 'https://app.docusign.com', 'E-signatures for contracts'),
  quickbooks: A('QuickBooks', 'https://qbo.intuit.com', 'Accounting and bookkeeping'),
  xero: A('Xero', 'https://go.xero.com', 'Accounting and invoicing'),
  onepassword: A('1Password', 'https://my.1password.com', 'Shared password manager'),
  attio: A('Attio', 'https://app.attio.com', 'Modern CRM for deals and relationships'),
  hubspot: A('HubSpot', 'https://app.hubspot.com', 'CRM, marketing and sales hub'),
  pipedrive: A('Pipedrive', 'https://app.pipedrive.com', 'Sales pipeline CRM'),
  salesnav: A('Sales Navigator', 'https://www.linkedin.com/sales/', 'LinkedIn prospecting for sales'),
  apollo: A('Apollo', 'https://app.apollo.io', 'Lead database and outreach sequences'),
  clay: A('Clay', 'https://app.clay.com', 'Enrich leads with data and AI'),
  lemlist: A('lemlist', 'https://app.lemlist.com', 'Cold email and LinkedIn outreach'),
  fireflies: A('Fireflies', 'https://app.fireflies.ai', 'AI notetaker for meetings'),
  docsend: A('DocSend', 'https://www.docsend.com', 'Share pitch decks and see who reads them'),
  crunchbase: A('Crunchbase', 'https://www.crunchbase.com', 'Company and investor research'),
  calendly: A('Calendly', 'https://calendly.com/app', 'Let people book time with you'),
  calcom: A('Cal.com', 'https://app.cal.com', 'Open-source scheduling links'),
  intercom: A('Intercom', 'https://app.intercom.com', 'Customer support chat and help center'),
  crisp: A('Crisp', 'https://app.crisp.chat', 'Live chat and shared inbox'),
  helpscout: A('Help Scout', 'https://secure.helpscout.net', 'Support email inbox'),
  analytics: A('Analytics', 'https://analytics.google.com', 'Website traffic (Google Analytics)'),
  posthog: A('PostHog', 'https://us.posthog.com', 'Product analytics, session replay and feature flags'),
  plausible: A('Plausible', 'https://plausible.io/sites', 'Simple, privacy-friendly site analytics'),
  searchconsole: A('Search Console', 'https://search.google.com/search-console', 'How your site shows up in Google search'),
  systeme: A('Systeme.io', 'https://systeme.io/dashboard', 'All-in-one funnels, email, courses and sites'),
  xpost: A('X (post)', 'https://x.com/compose/post', 'Write a post on X — skips the feed'),
  lipost: A('LinkedIn (post)', 'https://www.linkedin.com/feed/?shareActive=true', 'Write a LinkedIn post — opens straight to the editor'),
  ytstudio: A('YouTube Studio', 'https://studio.youtube.com', 'Manage your channel and uploads — not the feed'),
  redditpost: A('Reddit (post)', 'https://www.reddit.com/submit', 'Start a Reddit post — skips the feed'),
  buffer: A('Buffer', 'https://publish.buffer.com', 'Schedule social posts'),
  typefully: A('Typefully', 'https://typefully.com', 'Write and schedule threads and posts'),
  beehiiv: A('Beehiiv', 'https://app.beehiiv.com', 'Newsletter platform'),
  canva: A('Canva', 'https://www.canva.com', 'Quick graphics, slides and social images'),
  capcut: A('CapCut', 'https://www.capcut.com', 'Video editing for short-form content'),
  descript: A('Descript', 'https://web.descript.com', 'Edit video and podcasts by editing text'),
  opusclip: A('Opus Clip', 'https://www.opus.pro', 'AI turns long videos into short clips'),
  gamma: A('Gamma', 'https://gamma.app', 'AI-made decks, docs and web pages'),
  meetup: A('Meetup', 'https://www.meetup.com', 'Find and host local events and groups'),
  luma: A('Luma', 'https://lu.ma/home', 'Event pages, RSVPs and calendars'),
  eventbrite: A('Eventbrite', 'https://www.eventbrite.com/organizations/home', 'Ticketing for events'),
  circle: A('Circle', 'https://app.circle.so', 'Community platform with courses and events'),
  skool: A('Skool', 'https://www.skool.com', 'Community and courses in one place'),
  discourse: A('Discourse', 'https://meta.discourse.org', 'Open-source community forums'),
  commonroom: A('Common Room', 'https://app.commonroom.io', 'See who is active across your community'),
  tally: A('Tally', 'https://tally.so/dashboard', 'Free forms and surveys'),
  framer: A('Framer', 'https://framer.com/projects', 'Design and publish websites'),
  webflow: A('Webflow', 'https://webflow.com/dashboard', 'Visual website builder and CMS'),
  spline: A('Spline', 'https://app.spline.design', '3D design for the web'),
  relume: A('Relume', 'https://www.relume.io', 'AI sitemaps and wireframes for websites'),
  pinterest: A('Pinterest', 'https://www.pinterest.com', 'Visual inspiration boards'),
  cosmos: A('Cosmos', 'https://www.cosmos.so', 'Calm, ad-free visual inspiration library'),
  arena: A('Are.na', 'https://www.are.na', 'Collect and connect ideas and references'),
  mobbin: A('Mobbin', 'https://mobbin.com', 'Library of real app screens and flows'),
  dribbble: A('Dribbble', 'https://dribbble.com', 'Design showcase and inspiration'),
  behance: A('Behance', 'https://www.behance.net', 'Creative portfolios'),
  fonts: A('Google Fonts', 'https://fonts.google.com', 'Free web fonts'),
  coolors: A('Coolors', 'https://coolors.co', 'Colour palette generator'),
  unsplash: A('Unsplash', 'https://unsplash.com', 'Free high-quality photos'),
  iconify: A('Iconify', 'https://icon-sets.iconify.design', 'Huge library of open-source icons'),
  linkedinjobs: A('LinkedIn Jobs', 'https://www.linkedin.com/jobs/', 'Job search on LinkedIn'),
  indeed: A('Indeed', 'https://www.indeed.com', 'Large job search engine'),
  wellfound: A('Wellfound', 'https://wellfound.com/jobs', 'Startup jobs (formerly AngelList Talent)'),
  glassdoor: A('Glassdoor', 'https://www.glassdoor.com', 'Company reviews, salaries and interview questions'),
  wttj: A('Welcome to the Jungle', 'https://www.welcometothejungle.com', 'Curated jobs with company profiles'),
  remoteok: A('Remote OK', 'https://remoteok.com', 'Remote job board'),
  wwr: A('We Work Remotely', 'https://weworkremotely.com', 'Remote job board'),
  teal: A('Teal', 'https://www.tealhq.com', 'Resume builder and job application tracker'),
  huntr: A('Huntr', 'https://huntr.co', 'Track job applications on a board'),
  simplify: A('Simplify', 'https://simplify.jobs', 'Autofill applications and track them'),
  leetcode: A('LeetCode', 'https://leetcode.com', 'Coding interview practice'),
  exponent: A('Exponent', 'https://www.tryexponent.com', 'Interview prep for tech roles'),
  claude: A('Claude', 'https://claude.ai', 'Anthropic’s AI assistant'),
  chatgpt: A('ChatGPT', 'https://chatgpt.com', 'OpenAI’s AI assistant'),
  gemini: A('Gemini', 'https://gemini.google.com', 'Google’s AI assistant'),
  grok: A('Grok', 'https://grok.com', 'xAI’s AI assistant'),
  perplexity: A('Perplexity', 'https://www.perplexity.ai', 'AI search with sources'),
  notebooklm: A('NotebookLM', 'https://notebooklm.google.com', 'Ask questions about your own docs; makes audio overviews')
};
function L() { return Array.prototype.map.call(arguments, function (k) { return APP[k]; }); }
var AI_APPS = L('claude', 'chatgpt', 'gemini', 'grok', 'perplexity', 'notebooklm');
var BASICS = L('gmail', 'calendar', 'drive');
var PERSONAS = [
  { id: 'solo', name: 'Solo founder', desc: 'Build it, sell it, run it — alone', groups: [
    { name: 'Daily', items: BASICS.concat(L('notion', 'whatsapp')) },
    { name: 'Build', items: L('github', 'vercel', 'supabase', 'lovable', 'figma', 'linear') },
    { name: 'Grow', items: L('stripe', 'systeme', 'posthog', 'xpost', 'lipost', 'ytstudio', 'meetup') },
    { name: 'AI', items: AI_APPS } ] },
  { id: 'startup', name: 'Startup founder', desc: 'Team, product, money and fundraising', groups: [
    { name: 'Team', items: L('gmail', 'calendar', 'slack', 'notion', 'meet') },
    { name: 'Product', items: L('linear', 'github', 'figma', 'posthog') },
    { name: 'Company', items: L('stripe', 'mercury', 'ramp', 'carta', 'gusto', 'docusign') },
    { name: 'Fundraise', items: L('attio', 'docsend', 'crunchbase', 'lipost', 'calendly', 'gamma') },
    { name: 'AI', items: AI_APPS } ] },
  { id: 'builder', name: 'Builder', desc: 'Developer or indie hacker shipping product', groups: [
    { name: 'Daily', items: BASICS.concat(L('notion')) },
    { name: 'Code', items: L('github', 'localhost', 'cursor', 'linear', 'figma') },
    { name: 'Ship', items: L('vercel', 'cloudflare', 'railway', 'supabase', 'resend', 'sentry', 'posthog') },
    { name: 'AI builders', items: L('v0', 'lovable', 'bolt', 'replit') },
    { name: 'Docs', items: L('mdn', 'stackoverflow', 'npm') },
    { name: 'AI', items: AI_APPS } ] },
  { id: 'marketer', name: 'Marketer / creator', desc: 'Content, social and growth', groups: [
    { name: 'Daily', items: BASICS.concat(L('notion')) },
    { name: 'Publish', items: L('xpost', 'lipost', 'buffer', 'typefully', 'beehiiv', 'systeme') },
    { name: 'Create', items: L('canva', 'capcut', 'descript', 'opusclip', 'gamma', 'ytstudio') },
    { name: 'Measure', items: L('analytics', 'posthog', 'searchconsole', 'plausible') },
    { name: 'AI', items: AI_APPS } ] },
  { id: 'community', name: 'Community manager', desc: 'Members, events and engagement', groups: [
    { name: 'Daily', items: BASICS.concat(L('notion', 'slack')) },
    { name: 'Community', items: L('discord', 'circle', 'skool', 'discourse', 'whatsapp') },
    { name: 'Events', items: L('meetup', 'luma', 'eventbrite', 'zoom', 'calendly') },
    { name: 'Engage', items: L('xpost', 'lipost', 'redditpost', 'typefully', 'beehiiv', 'canva') },
    { name: 'Measure', items: L('commonroom', 'tally', 'posthog', 'sheets') },
    { name: 'AI', items: AI_APPS } ] },
  { id: 'sales', name: 'Sales / customer', desc: 'Pipeline, meetings and support', groups: [
    { name: 'Daily', items: BASICS.concat(L('slack')) },
    { name: 'Pipeline', items: L('hubspot', 'attio', 'pipedrive', 'salesnav') },
    { name: 'Prospect', items: L('apollo', 'clay', 'lemlist') },
    { name: 'Meetings', items: L('calendly', 'calcom', 'meet', 'zoom', 'fireflies') },
    { name: 'Support', items: L('intercom', 'crisp', 'helpscout') },
    { name: 'AI', items: AI_APPS } ] },
  { id: 'designer', name: 'Designer', desc: 'Product, brand and web design', groups: [
    { name: 'Daily', items: BASICS.concat(L('notion')) },
    { name: 'Design', items: L('figma', 'framer', 'webflow', 'relume', 'spline') },
    { name: 'Inspire', items: L('pinterest', 'cosmos', 'arena', 'mobbin', 'dribbble', 'behance') },
    { name: 'Assets', items: L('fonts', 'coolors', 'unsplash', 'iconify') },
    { name: 'AI', items: AI_APPS.concat(L('v0')) } ] },
  { id: 'ops', name: 'Ops / admin', desc: 'Money, people and paperwork', groups: [
    { name: 'Daily', items: BASICS.concat(L('sheets')) },
    { name: 'Money', items: L('quickbooks', 'xero', 'mercury', 'ramp', 'stripe') },
    { name: 'People', items: L('gusto', 'deel', 'slack') },
    { name: 'Docs', items: L('docusign', 'onepassword', 'notion', 'tally') },
    { name: 'AI', items: AI_APPS } ] },
  { id: 'jobs', name: 'Job seeker', desc: 'Find roles, apply, track and prepare', groups: [
    { name: 'Daily', items: BASICS.concat(L('docs')) },
    { name: 'Find', items: L('linkedinjobs', 'indeed', 'wellfound', 'wttj', 'glassdoor', 'remoteok', 'wwr') },
    { name: 'Apply & track', items: L('teal', 'huntr', 'simplify', 'canva') },
    { name: 'Prepare', items: L('leetcode', 'exponent', 'glassdoor', 'meetup', 'lipost') },
    { name: 'AI', items: AI_APPS } ] }
];
/* url -> description, for tooltips on any saved app that matches a known one. */
var APP_DESC = {};
Object.keys(APP).forEach(function (k) { APP_DESC[String(APP[k].url).replace(/\/+$/, '').toLowerCase()] = APP[k].desc; });
function appDesc(it) {
  return (it && it.desc) || APP_DESC[String(it && it.url || '').replace(/\/+$/, '').toLowerCase()] || '';
}
/* A fresh copy of a persona's folders, with ids. */
function personaGroups(id) {
  var p = PERSONAS.filter(function (x) { return x.id === id; })[0] || PERSONAS[0];
  return JSON.parse(JSON.stringify(p.groups)).map(function (g, i) {
    g.id = p.id + i + Math.random().toString(36).slice(2, 6);
    g.items.forEach(function (it) { delete it.desc; });   // descriptions come from the catalog
    return g;
  });
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
  { id: 'drag-task', text: 'Drag a planned block up or down the calendar to move it. It snaps to 30-minute slots.' },
  { id: 'tick-done', text: 'Tick the circle on a calendar block when you finish it — you get a little celebration and a count of what you got done today.' },
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
