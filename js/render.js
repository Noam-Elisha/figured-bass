// render.js — turn a generated exercise into an engraved bass staff (abcjs) with
// figured-bass numerals overlaid beneath each note.
//
// The staff (clef, key signature, notes, ledger lines, barlines, fermatas) is
// engraved by abcjs. The figures are NOT abcjs annotations — those render their
// accidental glyphs as colour-emoji inside SVG <text>. Instead each figure stack
// is positioned HTML, aligned to its notehead via abcjs's per-note geometry, so
// accidentals render as crisp monochrome glyphs (Noto Music) at any size.
(function () {
  'use strict';
  const DS = (window.DS = window.DS || {});
  const T = DS.theory;

  const MAJOR_OF_SIG = ['Cb', 'Gb', 'Db', 'Ab', 'Eb', 'Bb', 'F', 'C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#'];
  const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const SHARP_ORDER = [3, 0, 4, 1, 5, 2, 6];
  const FLAT_ORDER = [6, 2, 5, 1, 4, 0, 3];
  const ACC = { '-2': '__', '-1': '_', 0: '=', 1: '^', 2: '^^' };
  const TPQ = 48, BAR = 192, UNIT = 24; // L:1/8 -> 1 unit = an eighth = 24 ticks

  function sigMapOf(sig) {
    const map = {};
    if (sig > 0) for (let i = 0; i < sig; i++) map[SHARP_ORDER[i]] = 1;
    if (sig < 0) for (let i = 0; i < -sig; i++) map[FLAT_ORDER[i]] = -1;
    return map;
  }

  function pitchStr(step, oct) {
    const letter = LETTERS[step];
    if (oct >= 5) return letter.toLowerCase() + "'".repeat(oct - 5);
    return letter + ','.repeat(4 - oct);
  }

  // Build the ABC source for the bass voice as one continuous line — abcjs
  // reflows it to as many bars per system as the width allows and justifies each
  // full line. Barlines come from explicit per-event `endBar` flags (Bach data)
  // or, failing that, from tick accumulation (generated). Rests, ties, fermatas
  // and explicit accidentals are all handled.
  function toAbc(model) {
    const sig = model.sig != null ? model.sig : T.fifths(model.key);
    const sigMap = sigMapOf(sig);
    const head = ['X:1', `M:${model.meter.num}/${model.meter.den}`, 'L:1/8',
      `K:${MAJOR_OF_SIG[sig + 7]} clef=bass`];
    const evs = model.events;
    const explicitBars = evs.some((e) => 'endBar' in e);
    const barLen = (model.meter.num / model.meter.den) * 4 * TPQ;

    let cur = '';
    let barTick = 0;
    let acc = new Map();
    evs.forEach((ev, idx) => {
      let tok = '';
      if (ev.fermata) tok += '!fermata!';
      if (ev.step < 0) {
        tok += 'z';
      } else {
        const key = `${ev.step}:${ev.oct}`;
        const expected = acc.has(key) ? acc.get(key) : (sigMap[ev.step] || 0);
        if (ev.pitchAlter !== expected) { tok += ACC[ev.pitchAlter]; acc.set(key, ev.pitchAlter); }
        tok += pitchStr(ev.step, ev.oct);
      }
      const units = ev.dur / UNIT;
      if (units !== 1) tok += Number.isInteger(units) ? units : units.toFixed(3).replace(/\.?0+$/, '');
      if (ev.tie && ev.step >= 0) tok += '-';
      cur += (cur && !cur.endsWith(' ') ? ' ' : '') + tok;

      barTick += ev.dur;
      const atBar = explicitBars ? ev.endBar : barTick >= barLen - 0.5;
      if (atBar) {
        barTick = 0; acc = new Map();
        if (idx !== evs.length - 1) cur += ' |';
      }
    });
    if (!cur.trimEnd().endsWith('|')) cur = cur.trimEnd();
    cur = cur.replace(/\s*\|?\s*$/, '') + ' |]';
    return head.concat([cur.trim()]).join('\n') + '\n';
  }

  // ---- figure HTML --------------------------------------------------------
  // Accidentals are drawn as inline SVG (currentColor) rather than font glyphs.
  // Unicode ♯ ♭ ♮ (U+266x) get colour-emoji substituted by some browsers (and
  // the substitution is maddeningly context-dependent); inline SVG is monochrome
  // on every browser and OS and scales with the figure's font-size.
  const SV = 'viewBox="0 0 10 28" width="0.6em" height="1.15em" fill="none" stroke="currentColor" stroke-linejoin="round"';
  const ACC_SVG = {
    '♯': `<svg class="fb-acc-svg" ${SV} stroke-width="1.5"><line x1="3.3" y1="6.5" x2="3.3" y2="24.5"/><line x1="6.9" y1="3.5" x2="6.9" y2="21.5"/><line x1="1" y1="13" x2="9.2" y2="10.6" stroke-width="2.7"/><line x1="1" y1="18.4" x2="9.2" y2="16" stroke-width="2.7"/></svg>`,
    // Natural: offset stems (left drops below, right rises above) with the two
    // bars strictly BETWEEN the stems — distinct from the sharp at small sizes.
    '♮': `<svg class="fb-acc-svg" ${SV} stroke-width="1.5"><line x1="3.2" y1="9.5" x2="3.2" y2="25.5"/><line x1="6.9" y1="2" x2="6.9" y2="18"/><line x1="3.2" y1="10.2" x2="6.9" y2="8.4" stroke-width="2.7"/><line x1="3.2" y1="19.4" x2="6.9" y2="17.6" stroke-width="2.7"/></svg>`,
    '♭': `<svg class="fb-acc-svg" ${SV} stroke-width="1.5"><line x1="3" y1="2.5" x2="3" y2="23"/><path d="M3 13 C6.6 11.4 9.3 14 7.6 18 C6.6 20.3 4.7 22 3 23 Z" fill="currentColor" stroke="none"/></svg>`,
    '×': `<svg class="fb-acc-svg fb-dbl" viewBox="0 0 16 16" width="0.72em" height="0.72em" fill="none" stroke="currentColor" stroke-width="2.7" stroke-linecap="round"><line x1="3.5" y1="3.5" x2="12.5" y2="12.5"/><line x1="12.5" y1="3.5" x2="3.5" y2="12.5"/></svg>`,
  };
  function wrapAcc(s) {
    let out = '';
    for (const ch of String(s)) {
      if (ACC_SVG[ch]) out += `<span class="fb-acc">${ACC_SVG[ch]}</span>`;
      else out += ch;
    }
    return out;
  }
  const cellHTML = (c) => wrapAcc((c.acc || '') + (c.num == null ? '' : c.num));

  function figureHTML(ev) {
    let rows = [];
    if (ev.moving) {
      // successive figures over a held bass (a suspension); zip the stacks into
      // rows, each row's cells joined by a dash: 6/4 -> 5/3 renders 6–5 over 4–3
      const stacks = ev.moving.stacks;
      const maxLen = Math.max.apply(null, stacks.map((s) => s.length));
      for (let i = 0; i < maxLen; i++) {
        const cells = stacks.map((s) => s[i]).filter(Boolean);
        rows.push(`<span class="fb-row fb-move">${cells.map(cellHTML).join('<span class="fb-dash">–</span>')}</span>`);
      }
    } else if (ev.figure && ev.figure.rows.length) {
      rows = ev.figure.rows.map((r) => `<span class="fb-row">${cellHTML(r)}</span>`);
    } else if (ev.hold) {
      rows = ['<span class="fb-row fb-hold">—</span>']; // held harmony, bass moves
    }
    if (!rows.length) return null;
    return `<span class="fb-figure">${rows.join('')}</span>`;
  }

  // ---- main render --------------------------------------------------------
  function render(container, model, opts = {}) {
    const width = container.clientWidth || 700;
    const target = Math.max(220, width - 40); // leave an edge gutter for figure stacks
    const abc = toAbc(model);
    container.classList.add('fb-staff');
    container.style.minHeight = ''; // reset from any previous (taller) exercise
    // Fixed-ish note size; abcjs reflows the one continuous line to fit `target`,
    // packing as many bars per system as the width allows and justifying each
    // full line — natural on a wide PC and on a narrow iPad alike.
    const scale = opts.scale || Math.min(1.55, Math.max(1.05, width / 620));
    ABCJS.renderAbc(container, abc, {
      add_classes: true, scale, staffwidth: target,
      wrap: { minSpacing: 1.8, maxSpacing: 2.8, preferredMeasuresPerLine: 0 },
      staffsep: 92, paddingtop: 4, paddingbottom: 40, paddingleft: 0, paddingright: 0,
    });
    let svg = container.querySelector('svg');
    if (!svg) return;
    // overlay layer for figures, sized so figures stay ~70% of a notehead and
    // as wide as the engraving so figures scroll with it on a narrow screen
    const overlay = document.createElement('div');
    overlay.className = 'fb-overlay';
    overlay.style.fontSize = (opts.figScale || scale * 10.4).toFixed(1) + 'px';
    overlay.style.width = container.clientWidth + 'px';
    container.appendChild(overlay);

    const cRect = container.getBoundingClientRect();
    const noteEls = [...container.querySelectorAll('.abcjs-note')];
    const staffEls = [...container.querySelectorAll('.abcjs-staff')];

    // per-system baseline: below the lowest note (and the staff) of that system
    const sysBottom = staffEls.map((s) => s.getBoundingClientRect().bottom - cRect.top);
    const lineOf = (el) => { const m = (el.getAttribute('class') || '').match(/abcjs-l(\d+)/); return m ? +m[1] : 0; };
    noteEls.forEach((n) => {
      const li = lineOf(n);
      const b = n.getBoundingClientRect().bottom - cRect.top;
      if (b > (sysBottom[li] || 0)) sysBottom[li] = b;
    });

    // figures map to sounding notes only — abcjs '.abcjs-note' excludes rests
    const sounding = model.events.filter((e) => e.step >= 0);
    const GUT = opts.gutter != null ? opts.gutter : 9;
    const n = Math.min(noteEls.length, sounding.length);
    let maxBottom = 0;
    for (let i = 0; i < n; i++) {
      const html = figureHTML(sounding[i]);
      if (!html) continue;
      const el = noteEls[i];
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2 - cRect.left;
      const li = lineOf(el);
      const top = (sysBottom[li] || (r.bottom - cRect.top)) + GUT;
      const fig = document.createElement('div');
      fig.className = 'fb-fig';
      fig.style.top = top + 'px';
      fig.innerHTML = html;
      overlay.appendChild(fig);
      // center on the notehead by measured width (not a transform, so the box
      // doesn't add phantom scroll width at the right edge)
      fig.style.left = Math.round(cx - fig.offsetWidth / 2) + 'px';
      maxBottom = Math.max(maxBottom, top + fig.offsetHeight);
    }
    // grow the container if the lowest figure stack sits below the engraving
    if (maxBottom + 4 > container.clientHeight) container.style.minHeight = Math.ceil(maxBottom + 6) + 'px';
    return { notes: noteEls.length, events: model.events.length };
  }

  DS.render = { render, toAbc };
})();
