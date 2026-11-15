/* Soft, low-pitched chimes synthesised with WebAudio (no audio files). */
(function () {
  var ctx = null;
  var TONES = {
    // two-note descending "ding-dong", G4 -> E4
    warm:   [{ f: 392.0, t: 0, d: 1.3 }, { f: 329.6, t: 0.5, d: 1.8 }],
    // single deep bell, C4
    soft:   [{ f: 261.6, t: 0, d: 2.2 }],
    // two gentle taps, F4
    double: [{ f: 349.2, t: 0, d: 0.7 }, { f: 349.2, t: 0.38, d: 1.1 }],
    // Westminster-ish four notes, low register
    clock:  [{ f: 329.6, t: 0, d: 0.9 }, { f: 261.6, t: 0.55, d: 0.9 }, { f: 293.7, t: 1.1, d: 0.9 }, { f: 196.0, t: 1.65, d: 1.8 }]
  };
  // Pomodoro end: rising, mid register (not shrill)
  var POMO = [{ f: 293.7, t: 0, d: 0.9 }, { f: 370.0, t: 0.28, d: 0.9 }, { f: 440.0, t: 0.56, d: 1.6 }];

  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function play(kind, vol) {
    var notes = kind === 'pomo' ? POMO : (TONES[String(kind).replace('chime:', '')] || TONES.warm);
    var c = getCtx();
    var master = c.createGain();
    master.gain.value = Math.max(0, Math.min(1, vol == null ? 0.6 : vol)) * 0.5;
    var lp = c.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 1600;
    master.connect(lp); lp.connect(c.destination);
    var end = 0, now = c.currentTime + 0.05;
    notes.forEach(function (n) {
      [[1, 1, 'sine'], [2, 0.12, 'sine'], [3, 0.04, 'triangle']].forEach(function (h) {
        var o = c.createOscillator(), g = c.createGain(), t0 = now + n.t;
        o.type = h[2]; o.frequency.value = n.f * h[0];
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(h[1], t0 + 0.025);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + n.d);
        o.connect(g); g.connect(master);
        o.start(t0); o.stop(t0 + n.d + 0.05);
      });
      end = Math.max(end, n.t + n.d);
    });
    return new Promise(function (res) { setTimeout(res, (end + 0.1) * 1000); });
  }
  function ready() {
    var c;
    try { c = getCtx(); } catch (e) { return Promise.resolve(false); }
    if (c.state === 'running') return Promise.resolve(true);
    return Promise.race([
      c.resume().then(function () { return c.state === 'running'; }, function () { return false; }),
      new Promise(function (r) { setTimeout(function () { r(c.state === 'running'); }, 400); })
    ]);
  }
  window.Sound = { play: play, unlock: getCtx, ready: ready, tones: Object.keys(TONES) };
})();
