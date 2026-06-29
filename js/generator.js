// generator.js — generate a figured-bass exercise: a bass line (spelled pitches
// in a comfortable bass-clef range) with a correct figured-bass figure under
// each note, organised into phrases that each close with a cadence.
//
// The harmonic engine (chord catalog, difficulty-gated transition tables,
// cadence templates, body walk) is adapted from the Dictation Studio
// progression generator; figures are derived by DS.figures from the same
// key-independent chord specs, so every figure is correct by construction.
(function () {
  'use strict';
  const DS = (window.DS = window.DS || {});
  const T = DS.theory;
  const clone = (o) => JSON.parse(JSON.stringify(o));

  // ---- chord catalog ------------------------------------------------------
  // {tones:[[deg,alter]...] root..7th order, bass: idx, lt, seventh, cad64,
  //  fn:T|PD|D, rT, printNums?} — printNums overrides figure numerals for the
  //  non-tertian chromatic chords (augmented sixths, Neapolitan).
  function C(tones, bass, opts = {}) {
    return { tones, bass, lt: null, seventh: null, cad64: false, fn: 'T', rT: null, ...opts };
  }

  const CAT = {
    major: {
      I: C([[1, 0], [3, 0], [5, 0]], 0),
      I6: C([[1, 0], [3, 0], [5, 0]], 1),
      I64c: C([[1, 0], [3, 0], [5, 0]], 2, { cad64: true, fn: 'D' }),
      ii: C([[2, 0], [4, 0], [6, 0]], 0, { fn: 'PD' }),
      ii6: C([[2, 0], [4, 0], [6, 0]], 1, { fn: 'PD' }),
      ii65: C([[2, 0], [4, 0], [6, 0], [1, 0]], 1, { seventh: 3, fn: 'PD' }),
      IV: C([[4, 0], [6, 0], [1, 0]], 0, { fn: 'PD' }),
      IV6: C([[4, 0], [6, 0], [1, 0]], 1, { fn: 'PD' }),
      V: C([[5, 0], [7, 0], [2, 0]], 0, { lt: 1, fn: 'D', rT: 1 }),
      V6: C([[5, 0], [7, 0], [2, 0]], 1, { lt: 1, fn: 'D', rT: 1 }),
      V7: C([[5, 0], [7, 0], [2, 0], [4, 0]], 0, { lt: 1, seventh: 3, fn: 'D', rT: 1 }),
      V65: C([[5, 0], [7, 0], [2, 0], [4, 0]], 1, { lt: 1, seventh: 3, fn: 'D', rT: 1 }),
      V43: C([[5, 0], [7, 0], [2, 0], [4, 0]], 2, { lt: 1, seventh: 3, fn: 'D', rT: 1 }),
      V42: C([[5, 0], [7, 0], [2, 0], [4, 0]], 3, { lt: 1, seventh: 3, fn: 'D', rT: 1 }),
      vi: C([[6, 0], [1, 0], [3, 0]], 0),
      iii: C([[3, 0], [5, 0], [7, 0]], 0),
      iii6: C([[3, 0], [5, 0], [7, 0]], 1),
      viio6: C([[7, 0], [2, 0], [4, 0]], 1, { lt: 0, fn: 'D', rT: 1 }),
      'V/V': C([[2, 0], [4, 1], [6, 0]], 0, { lt: 1, fn: 'PD', rT: 5 }),
      'V7/V': C([[2, 0], [4, 1], [6, 0], [1, 0]], 0, { lt: 1, seventh: 3, fn: 'PD', rT: 5 }),
      'V65/V': C([[2, 0], [4, 1], [6, 0], [1, 0]], 1, { lt: 1, seventh: 3, fn: 'PD', rT: 5 }),
      'viio7/V': C([[4, 1], [6, 0], [1, 0], [3, -1]], 0, { lt: 0, seventh: 3, fn: 'PD', rT: 5 }),
      'V/ii': C([[6, 0], [1, 1], [3, 0]], 0, { lt: 1, fn: 'T', rT: 2 }),
      'V7/ii': C([[6, 0], [1, 1], [3, 0], [5, 0]], 0, { lt: 1, seventh: 3, fn: 'T', rT: 2 }),
      'V/vi': C([[3, 0], [5, 1], [7, 0]], 0, { lt: 1, fn: 'T', rT: 6 }),
      'V7/vi': C([[3, 0], [5, 1], [7, 0], [2, 0]], 0, { lt: 1, seventh: 3, fn: 'T', rT: 6 }),
      'V7/IV': C([[1, 0], [3, 0], [5, 0], [7, -1]], 0, { lt: 1, seventh: 3, fn: 'T', rT: 4 }),
      iv: C([[4, 0], [6, -1], [1, 0]], 0, { fn: 'PD' }),
      bVI: C([[6, -1], [1, 0], [3, -1]], 0, { fn: 'PD' }),
      N6: C([[2, -1], [4, 0], [6, -1]], 1, { fn: 'PD', printNums: [6] }),
      It6: C([[6, -1], [1, 0], [4, 1]], 0, { lt: 2, fn: 'PD', rT: 5, aug6: true, printNums: [6] }),
      Fr43: C([[6, -1], [1, 0], [2, 0], [4, 1]], 0, { lt: 3, fn: 'PD', rT: 5, aug6: true, printNums: [6, 4, 3] }),
      Ger65: C([[6, -1], [1, 0], [3, -1], [4, 1]], 0, { lt: 3, fn: 'PD', rT: 5, aug6: true, printNums: [6, 5, 3] }),
    },
    minor: {
      i: C([[1, 0], [3, 0], [5, 0]], 0),
      i6: C([[1, 0], [3, 0], [5, 0]], 1),
      i64c: C([[1, 0], [3, 0], [5, 0]], 2, { cad64: true, fn: 'D' }),
      iio6: C([[2, 0], [4, 0], [6, 0]], 1, { fn: 'PD' }),
      'iiø65': C([[2, 0], [4, 0], [6, 0], [1, 0]], 1, { seventh: 3, fn: 'PD' }),
      iv: C([[4, 0], [6, 0], [1, 0]], 0, { fn: 'PD' }),
      iv6: C([[4, 0], [6, 0], [1, 0]], 1, { fn: 'PD' }),
      V: C([[5, 0], [7, 1], [2, 0]], 0, { lt: 1, fn: 'D', rT: 1 }),
      V6: C([[5, 0], [7, 1], [2, 0]], 1, { lt: 1, fn: 'D', rT: 1 }),
      V7: C([[5, 0], [7, 1], [2, 0], [4, 0]], 0, { lt: 1, seventh: 3, fn: 'D', rT: 1 }),
      V65: C([[5, 0], [7, 1], [2, 0], [4, 0]], 1, { lt: 1, seventh: 3, fn: 'D', rT: 1 }),
      V43: C([[5, 0], [7, 1], [2, 0], [4, 0]], 2, { lt: 1, seventh: 3, fn: 'D', rT: 1 }),
      V42: C([[5, 0], [7, 1], [2, 0], [4, 0]], 3, { lt: 1, seventh: 3, fn: 'D', rT: 1 }),
      VI: C([[6, 0], [1, 0], [3, 0]], 0),
      III: C([[3, 0], [5, 0], [7, 0]], 0),
      viio6: C([[7, 1], [2, 0], [4, 0]], 1, { lt: 0, fn: 'D', rT: 1 }),
      viio7: C([[7, 1], [2, 0], [4, 0], [6, 0]], 0, { lt: 0, seventh: 3, fn: 'D', rT: 1 }),
      'V/V': C([[2, 0], [4, 1], [6, 1]], 0, { lt: 1, fn: 'PD', rT: 5 }),
      'V7/V': C([[2, 0], [4, 1], [6, 1], [1, 0]], 0, { lt: 1, seventh: 3, fn: 'PD', rT: 5 }),
      'viio7/V': C([[4, 1], [6, 1], [1, 0], [3, 0]], 0, { lt: 0, seventh: 3, fn: 'PD', rT: 5 }),
      'V/iv': C([[1, 0], [3, 1], [5, 0]], 0, { lt: 1, fn: 'T', rT: 4 }),
      'V7/iv': C([[1, 0], [3, 1], [5, 0], [7, 0]], 0, { lt: 1, seventh: 3, fn: 'T', rT: 4 }),
      N6: C([[2, -1], [4, 0], [6, 0]], 1, { fn: 'PD', printNums: [6] }),
      It6: C([[6, 0], [1, 0], [4, 1]], 0, { lt: 2, fn: 'PD', rT: 5, aug6: true, printNums: [6] }),
      Fr43: C([[6, 0], [1, 0], [2, 0], [4, 1]], 0, { lt: 3, fn: 'PD', rT: 5, aug6: true, printNums: [6, 4, 3] }),
      Ger65: C([[6, 0], [1, 0], [3, 0], [4, 1]], 0, { lt: 3, fn: 'PD', rT: 5, aug6: true, printNums: [6, 5, 3] }),
    },
  };

  const RESOLUTION = {
    'V/V': ['V', 'V7'], 'V7/V': ['V', 'V7'], 'V65/V': ['V'], 'viio7/V': ['V'],
    'V/ii': ['ii', 'ii6'], 'V7/ii': ['ii', 'ii6'], 'V/vi': ['vi'], 'V7/vi': ['vi'],
    'V7/IV': ['IV', 'IV6'], 'V/iv': ['iv', 'iv6'], 'V7/iv': ['iv', 'iv6'],
  };

  // ---- difficulty-gated transition tables ---------------------------------
  function table(difficulty, mode) {
    const t = {};
    const add = (from, pairs) => { t[from] = (t[from] || []).concat(pairs); };
    if (mode === 'major') {
      add('I', [['IV', 3], ['V', 2], ['V7', 1.2], ['I6', 1.5], ['vi', 0.8]]);
      add('I6', [['IV', 2.5], ['V', 2]]);
      add('IV', [['V', 2.5], ['V7', 1.5], ['I', 1], ['I6', 0.8]]);
      add('V', [['I', 2.5], ['I6', 1.2], ['vi', 0.85]]);
      add('V7', [['I', 2.5], ['vi', 0.7]]);
      add('vi', [['IV', 2.5]]);
      if (difficulty >= 2) {
        add('I', [['ii6', 1.5], ['V65', 0.5], ['viio6', 0.5], ['vi', 0.5]]);
        add('I6', [['viio6', 0.6], ['ii6', 2], ['ii', 1], ['IV6', 0.8], ['V43', 0.5]]);
        add('IV', [['ii6', 1.2], ['viio6', 0.5], ['V42', 0.6], ['ii65', 0.6]]);
        add('IV6', [['V', 1.5], ['V6', 1], ['ii65', 0.8]]);
        add('ii', [['V', 2], ['V7', 1.5], ['viio6', 0.6], ['ii6', 0.6]]);
        add('ii6', [['V', 2.5], ['V7', 1.8], ['viio6', 0.6], ['V65', 0.6]]);
        add('ii65', [['V', 3]]);
        add('viio6', [['I', 2], ['I6', 2.2]]);
        add('V6', [['I', 3]]); add('V65', [['I', 3]]);
        add('V43', [['I', 1.5], ['I6', 2.5]]); add('V42', [['I6', 3]]);
        add('V', [['V42', 0.8], ['vi', 0.4]]);
        add('vi', [['ii6', 2], ['ii', 1], ['V', 0.6]]);
      }
      if (difficulty >= 3) {
        add('I', [['iii', 0.9]]);
        add('iii', [['IV', 1.3], ['vi', 1.8], ['ii6', 1.0], ['I6', 0.6]]);
        add('vi', [['iii', 1.3]]);
        add('I', [['V7/IV', 1.5], ['V/V', 1.2], ['V7/V', 1.2], ['V/vi', 1.0], ['V7/vi', 0.9], ['V/ii', 0.7], ['V7/ii', 0.9], ['viio7/V', 0.8]]);
        add('I6', [['V/V', 1.1], ['V7/IV', 1.0], ['V7/vi', 0.6]]);
        add('IV', [['V/V', 1.0], ['V7/V', 0.8]]);
        add('IV6', [['V7/V', 0.5]]);
        add('vi', [['V/V', 1.0], ['V65/V', 0.7], ['V/ii', 0.4]]);
        add('ii6', [['V/V', 0.6]]); add('ii', [['V7/V', 0.4]]);
      }
      if (difficulty >= 4) {
        add('I', [['iv', 0.9], ['bVI', 0.7], ['V7/IV', 0.8]]);
        add('I6', [['iv', 0.6]]);
        add('iv', [['V', 1.2], ['V7', 1.0], ['ii6', 0.4]]);
        add('bVI', [['IV', 0.8], ['ii6', 0.6], ['V', 0.6]]);
      }
    } else {
      add('i', [['iv', 3], ['V', 2], ['V7', 1.2], ['i6', 1.5], ['VI', 0.8]]);
      add('i6', [['iv', 2.5], ['V', 2]]);
      add('iv', [['V', 2.5], ['V7', 1.5], ['i', 1], ['i6', 0.8]]);
      add('V', [['i', 2.5], ['i6', 1.2], ['VI', 0.85]]);
      add('V7', [['i', 2.5], ['VI', 0.7]]);
      add('VI', [['iv', 2.5]]);
      if (difficulty >= 2) {
        add('i', [['viio6', 0.5], ['iio6', 1.2], ['V65', 0.5]]);
        add('i6', [['viio6', 0.6], ['iio6', 1.8], ['iiø65', 1], ['V43', 0.4]]);
        add('iv', [['iio6', 0.6], ['V42', 0.6], ['viio6', 0.4]]);
        add('iv6', [['V', 2], ['V7', 1]]);
        add('iio6', [['V', 2.5], ['V7', 1.8], ['V65', 0.6]]);
        add('iiø65', [['V', 3]]);
        add('viio6', [['i', 2], ['i6', 2.2]]);
        add('V6', [['i', 3]]); add('V65', [['i', 3]]);
        add('V43', [['i', 1.5], ['i6', 2.5]]); add('V42', [['i6', 3]]);
        add('V', [['V42', 0.8]]);
        add('III', [['iv', 1.3], ['iio6', 1], ['VI', 1.3], ['iv6', 0.6]]);
        add('VI', [['iio6', 1.5], ['iiø65', 0.8]]);
        add('i', [['iv6', 0.4]]);
      }
      if (difficulty >= 3) {
        add('i', [['V/V', 1.1], ['V7/V', 1.1], ['V/iv', 1.0], ['V7/iv', 0.9], ['viio7/V', 0.8], ['III', 1.0]]);
        add('i6', [['V7/V', 0.6], ['V/iv', 0.5]]);
        add('VI', [['V/V', 0.7], ['V7/V', 0.5]]);
        add('iv', [['V/V', 0.7]]);
        add('III', [['V/iv', 0.7], ['V7/iv', 0.5]]);
      }
      if (difficulty >= 4) {
        add('i', [['viio7', 0.7]]);
        add('i6', [['viio7', 0.5]]);
        add('viio7', [['i', 2], ['i6', 1]]);
      }
    }
    return t;
  }

  // ---- cadence templates ---------------------------------------------------
  const CADENCES = [
    { syms: ['V7', 'I'], type: 'PAC', minD: 1 },
    { syms: ['V', 'I'], type: 'PAC', minD: 1 },
    { syms: ['IV', 'V7', 'I'], type: 'PAC', minD: 1 },
    { syms: ['IV', 'V', 'I'], type: 'PAC', minD: 1 },
    { syms: ['I64c', 'V7', 'I'], type: 'PAC', minD: 1 },
    { syms: ['ii6', 'V7', 'I'], type: 'PAC', minD: 2 },
    { syms: ['ii6', 'V', 'I'], type: 'PAC', minD: 2 },
    { syms: ['ii65', 'V', 'I'], type: 'PAC', minD: 2 },
    { syms: ['ii6', 'I64c', 'V7', 'I'], type: 'PAC', minD: 2 },
    { syms: ['IV', 'I64c', 'V7', 'I'], type: 'PAC', minD: 2 },
    { syms: ['V6', 'I'], type: 'IAC', minD: 2 },
    { syms: ['IV', 'V'], type: 'HC', minD: 1 },
    { syms: ['I6', 'V'], type: 'HC', minD: 1 },
    { syms: ['ii6', 'V'], type: 'HC', minD: 2 },
    { syms: ['V7', 'vi'], type: 'DC', minD: 3 },
    { syms: ['N6', 'I64c', 'V7', 'I'], type: 'PAC', minD: 5 },
    { syms: ['Ger65', 'I64c', 'V7', 'I'], type: 'PAC', minD: 5 },
    { syms: ['It6', 'I64c', 'V7', 'I'], type: 'PAC', minD: 5 },
    { syms: ['Fr43', 'I64c', 'V7', 'I'], type: 'PAC', minD: 5 },
    { syms: ['N6', 'V'], type: 'HC', minD: 5 },
    { syms: ['It6', 'V'], type: 'HC', minD: 5 },
    { syms: ['Ger65', 'I64c', 'V'], type: 'HC', minD: 5 },
    { syms: ['V7/V', 'V'], type: 'HC', minD: 3 },
    { syms: ['IV', 'I'], type: 'PC', minD: 2 },
    { syms: ['IV', 'V', 'vi'], type: 'DC', minD: 2 },
  ];
  const CADENCE_WEIGHT = { PAC: 4.5, IAC: 1.2, HC: 2.2, DC: 1.2, PHC: 1.0, PC: 1.0 };

  function minorize(syms) {
    const map = { I: 'i', I6: 'i6', I64c: 'i64c', IV: 'iv', ii6: 'iio6', ii65: 'iiø65', vi: 'VI' };
    return syms.map((s) => map[s] || s);
  }

  function pickCadence(rng, difficulty, mode, maxLen, cadenceClass, chromatic) {
    let pool = CADENCES.filter((c) => c.minD <= difficulty && c.syms.length <= maxLen);
    if (mode === 'minor' && difficulty >= 3) pool = pool.concat([{ syms: ['iv6', 'V'], type: 'PHC', minD: 3 }]);
    if (cadenceClass === 'authentic') pool = pool.filter((c) => c.type === 'PAC' || c.type === 'IAC');
    if (!pool.length) pool = CADENCES.filter((c) => c.type === 'PAC' && c.syms.length <= maxLen);
    const weighted = pool.map((c) => {
      let w = (CADENCE_WEIGHT[c.type] / Math.sqrt(c.syms.length)) * (1 + 0.6 * c.minD);
      if (cadenceClass === 'open') w *= (c.type === 'HC' || c.type === 'PHC' || c.type === 'PC') ? 3 : c.type === 'DC' ? 1.5 : 0.3;
      if (!chromatic && c.syms.some((s) => /^(N6|It6|Fr43|Ger65)$/.test(s))) w *= 0.6;
      return [c, w];
    });
    const chosen = DS.rng.weighted(rng, weighted);
    const syms = mode === 'minor' ? minorize(chosen.syms) : chosen.syms.slice();
    return { syms, type: chosen.type };
  }

  // ---- body walk -----------------------------------------------------------
  const CADENCE_ONLY = new Set(['I64c', 'i64c', 'N6', 'It6', 'Fr43', 'Ger65']);

  function tendencyCompatible(from, to) {
    const toDeg = new Set(to.tones.map((t) => t[0]));
    if (from.seventh != null) {
      const d7 = from.tones[from.seventh][0];
      const down = d7 === 1 ? 7 : d7 - 1;
      if (!toDeg.has(d7) && !toDeg.has(down)) return false;
    }
    if (from.lt != null && from.rT != null) {
      const dLt = from.tones[from.lt][0];
      if (!toDeg.has(dLt) && !toDeg.has(from.rT)) return false;
    }
    return true;
  }

  function canPrecede(t, fromSym, toSym, mode) {
    const from = CAT[mode][fromSym];
    const to = CAT[mode][toSym];
    if (!tendencyCompatible(from, to)) return false;
    const edges = t[fromSym];
    if (edges && edges.some(([s, w]) => s === toSym && w > 0)) return true;
    if (RESOLUTION[fromSym]) return RESOLUTION[fromSym].includes(toSym);
    if (toSym === 'I64c' || toSym === 'i64c') return from.fn !== 'D' || from.rT === 5;
    if (toSym.startsWith('V')) return true;
    return from.fn !== 'D';
  }

  const isColour = (s) => /\//.test(s) || /^(bVI|iv|iio6|iiø65|viio7|N6|It6|Fr43|Ger65)$/.test(s);

  function walkBody(rng, t, start, len, cadenceHead, mode, chromatic) {
    for (let attempt = 0; attempt < 80; attempt++) {
      const out = [start];
      let ok = true;
      while (out.length < len) {
        const cur = out[out.length - 1];
        const remaining = len - out.length;
        let options = (t[cur] || []).filter(
          ([s, w]) => w > 0 && s !== cur && !CADENCE_ONLY.has(s) && tendencyCompatible(CAT[mode][cur], CAT[mode][s])
        );
        if (RESOLUTION[cur]) options = RESOLUTION[cur].map((s) => [s, 1]);
        if (remaining === 1) options = options.filter(([s]) => !RESOLUTION[s]);
        if (!options.length) { ok = false; break; }
        if (chromatic) options = options.map(([s, w]) => [s, isColour(s) ? w * 2.2 : w]);
        out.push(DS.rng.weighted(rng, options));
      }
      if (!ok) continue;
      const last = out[out.length - 1];
      if (RESOLUTION[last]) continue;
      if (!canPrecede(t, last, cadenceHead, mode)) continue;
      if (last === cadenceHead) continue;
      return out;
    }
    return null;
  }

  // ---- harmonic rhythm: 2 bars of 4/4 per phrase (48 = quarter) ------------
  // Favour slower harmonic rhythm (halves and quarter-pairs) — idiomatic for
  // thoroughbass and it gives the figures room to breathe under each note.
  const BODY_BARS = [
    [[96, 96], 3], [[96, 48, 48], 1.8], [[48, 48, 96], 1.8],
    [[48, 96, 48], 0.8], [[48, 48, 48, 48], 2],
  ];
  const FINAL_BARS = [
    [[96, 96], 3], [[48, 48, 96], 2.4], [[144, 48], 0.8],
  ];

  function buildRhythm(rng) {
    return DS.rng.weighted(rng, BODY_BARS).concat(DS.rng.weighted(rng, FINAL_BARS));
  }

  // Generate one phrase's chord sequence (each chord: {sym, dur, ...spec}).
  function generatePhrase(rng, { difficulty, mode, cadenceClass, chromatic }) {
    const tonic = mode === 'minor' ? 'i' : 'I';
    const t = table(difficulty, mode);
    for (let attempt = 0; attempt < 40; attempt++) {
      const durations = buildRhythm(rng);
      const M = durations.length;
      const cadence = pickCadence(rng, difficulty, mode, M - 1, cadenceClass, chromatic);
      const bodyLen = M - cadence.syms.length;
      if (bodyLen < 1) continue;
      const body = walkBody(rng, t, tonic, bodyLen, cadence.syms[0], mode, chromatic);
      if (!body) continue;
      const syms = body.concat(cadence.syms);
      const chords = syms.map((sym, i) => ({ ...clone(CAT[mode][sym]), sym, dur: durations[i] }));
      chords.cadence = cadence.type;
      return chords;
    }
    // fallback: simple authentic phrase
    const base = mode === 'minor' ? ['i', 'iv', 'V7', 'i'] : ['I', 'IV', 'V7', 'I'];
    const durations = [48, 48, 96, 192].slice(0, 4);
    const chords = base.map((sym, i) => ({ ...clone(CAT[mode][sym]), sym, dur: durations[i] }));
    chords.cadence = 'PAC';
    return chords;
  }

  // ---- bass-line placement (octaves) --------------------------------------
  const CENTER = 47;   // ~B2, middle of a comfortable continuo range
  const LO = 38, HI = 62;

  function placeOctaves(events, key) {
    let prev = null;
    for (const ev of events) {
      const base = T.degreeNote(key, ev.deg, ev.alter); // {step, alter}
      let best = null;
      for (let oct = 1; oct <= 4; oct++) {
        const m = T.midi({ step: base.step, alter: base.alter, oct });
        if (m < LO - 2 || m > HI + 2) continue;
        const leap = prev == null ? 0 : Math.abs(m - prev);
        const center = Math.abs(m - CENTER);
        const oob = m < LO ? (LO - m) * 3 : m > HI ? (m - HI) * 3 : 0;
        const cost = leap + 0.2 * center + oob + (prev != null && leap > 7 ? (leap - 7) * 1.5 : 0);
        if (!best || cost < best.cost) best = { oct, m, cost };
      }
      if (!best) best = { oct: 2, m: T.midi({ step: base.step, alter: base.alter, oct: 2 }) };
      ev.step = base.step; ev.pitchAlter = base.alter; ev.oct = best.oct; ev.midi = best.m;
      prev = best.m;
    }
  }

  // ---- suspensions (D3+): a held bass note carrying figure motion ----------
  function injectSuspensions(events, key, difficulty, rng) {
    if (difficulty < 3) return;
    const p43 = difficulty >= 4 ? 0.5 : 0.38;
    const p76 = difficulty >= 4 ? 0.16 : 0.1;
    const susp = (ev) => !!(ev && ev.moving);
    for (let i = 0; i < events.length - 1; i++) {
      const ev = events[i], nx = events[i + 1], pv = events[i - 1];
      if (ev.moving || susp(pv) || susp(nx)) continue; // never cluster suspensions
      // 4-3 over a structural dominant triad resolving to tonic (not after a 6/4)
      if (/^V$/.test(ev.sym) && /^[Ii]$/.test(nx.sym) && !(pv && /64c$/.test(pv.sym)) && rng() < p43) {
        const third = ev.tones[ev.lt != null ? ev.lt : 1];
        const acc = DS.figures.figAccidental(key, third[0], third[1]);
        ev.moving = { stacks: [[{ num: 4, acc: '' }], [{ num: 3, acc: acc || '' }]] };
        ev.figure = null;
        continue;
      }
      // 7-6 over a mid-phrase first-inversion triad, well clear of the cadence
      const nearCadence = nx.fermata || (events[i + 2] && events[i + 2].fermata);
      if ((ev.figure && ev.figure.printed === '6') && ev.dur >= 48 && !nearCadence && rng() < p76) {
        ev.moving = { stacks: [[{ num: 7, acc: '' }], [{ num: 6, acc: '' }]] };
        ev.figure = null;
      }
    }
  }

  // ---- top-level exercise --------------------------------------------------
  // opts: { difficulty 1..5, key:{tonic:{step,alter}, mode}, phrases 1..4, seed }
  function generate(opts) {
    const seed = opts.seed != null ? opts.seed : DS.rng.newSeed();
    const rng = DS.rng.create(seed);
    const mode = opts.key.mode;
    const d = Math.min(5, Math.max(1, opts.difficulty || 1));
    const tableD = Math.min(4, d);          // harmonic vocabulary tops out at the D4 table
    const chromatic = d >= 5;               // D5 = lean into chromaticism + spicier cadences
    const cadenceD = d;                     // cadence pool still uses the full 1..5 ladder
    const nPhrases = Math.min(8, Math.max(1, opts.phrases || 2));

    const events = [];
    for (let p = 0; p < nPhrases; p++) {
      const last = p === nPhrases - 1;
      const cadenceClass = last ? 'authentic' : (p === 0 ? undefined : 'open');
      const chords = generatePhrase(rng, { difficulty: tableD, mode, cadenceClass, chromatic, cadenceD });
      chords.forEach((ch, i) => {
        const bassTone = ch.tones[ch.bass];
        events.push({
          deg: bassTone[0], alter: bassTone[1], dur: ch.dur, sym: ch.sym,
          tones: ch.tones, bass: ch.bass, seventh: ch.seventh, lt: ch.lt,
          printNums: ch.printNums, phrase: p,
          fermata: i === chords.length - 1,
          figure: DS.figures.figureFor(ch, opts.key),
        });
      });
    }
    placeOctaves(events, opts.key);
    injectSuspensions(events, opts.key, d, rng);
    return { key: opts.key, meter: { num: 4, den: 4 }, phrases: nPhrases, difficulty: d, seed, events };
  }

  DS.generator = { generate, CAT };
})();
