// figures.js — derive the PRINTED figured-bass stack from a chord spec + key.
//
// A chord is key-independent: { tones: [[degree, chromaticAlter], ...], bass,
//   seventh, printNums? }  where `tones` are in stacked-thirds (root..7th) order
//   and `bass` is the index of the sounding bass tone.
//
// Figured bass = the diatonic INTERVALS of the non-bass tones reckoned UPWARD
// from the bass, reduced to one octave, largest interval on top, with an
// accidental glyph on any interval whose pitch deviates from the key signature.
// Quality otherwise comes from the key. (See research-synthesis.md §1–§5.)
(function () {
  'use strict';
  const DS = (window.DS = window.DS || {});
  const T = DS.theory;

  // Monochrome accidental glyphs. Rendered via a 'Noto Music'-first CSS font
  // stack so the browser never substitutes a colour-emoji glyph (see render.js).
  const GLYPH = { '-2': '♭♭', '-1': '♭', '0': '♮', '1': '♯', '2': '×' };

  // Generic diatonic interval number (2..7) of toneDeg above bassDeg; 8 = octave.
  function intervalNumber(bassDeg, toneDeg) {
    let d = (toneDeg - bassDeg) % 7;
    if (d < 0) d += 7;
    return d === 0 ? 8 : d + 1;
  }

  // The accidental a figure must show for a tone, relative to the key signature.
  // Empty string when the tone is diatonic (no figure accidental needed).
  function figAccidental(key, deg, alter) {
    const p = T.degreeNote(key, deg, alter);          // actual spelled pitch
    const sig = T.keyAccidentals(key)[p.step] || 0;   // what the key gives that letter
    if (p.alter === sig) return '';
    return GLYPH[String(p.alter)] || '';
  }

  // Canonical printed numerals by chord type & inversion (the shorthand:
  // root triad blank; 6; 6/4; 7; 6/5; 4/3; 4/2 — the 7 dropped on inversions).
  const TRIAD = [[], [6], [6, 4]];
  const SEVENTH = [[7], [6, 5], [4, 3], [4, 2]];

  // Returns { rows: [{num|null, acc}], printed: "6/4" }  (rows ordered top->bottom).
  function figureFor(chord, key) {
    const tones = chord.tones;
    const bassDeg = tones[chord.bass][0];
    const isSeventh = tones.length >= 4;

    // accidental glyph per interval-number present above the bass
    const altByNum = {};
    tones.forEach((t, i) => {
      if (i === chord.bass) return;
      const num = intervalNumber(bassDeg, t[0]);
      if (num === 8) return;                            // octave — never figured
      altByNum[num] = figAccidental(key, t[0], t[1]);
    });

    const printNums = (chord.printNums || (isSeventh ? SEVENTH : TRIAD)[chord.bass] || []).slice();

    const rows = [];
    const used = new Set();
    for (const n of printNums) { rows.push({ num: n, acc: altByNum[n] || '' }); used.add(n); }

    // Any chromatically-altered interval not already printed must still appear:
    // an altered 3rd as a lone accidental; anything else as accidental+numeral.
    Object.keys(altByNum).forEach((k) => {
      const n = +k;
      if (used.has(n) || !altByNum[n]) return;
      if (n === 3) rows.push({ num: null, acc: altByNum[n] });
      else rows.push({ num: n, acc: altByNum[n] });
    });

    // Largest interval on top; a lone-accidental (3rd) sorts at position 3.
    const pos = (r) => (r.num == null ? 3 : r.num);
    rows.sort((a, b) => pos(b) - pos(a));

    const printed = rows.map((r) => (r.acc || '') + (r.num == null ? '' : r.num)).join('/');
    return { rows, printed };
  }

  DS.figures = { figureFor, intervalNumber, figAccidental, GLYPH };
})();
