// app.js — controls, state, persistence. Reads Difficulty / Length / Key,
// generates an exercise, engraves it, and re-lays it out on resize.
(function () {
  'use strict';
  const DS = window.DS;
  const T = DS.theory;
  const $ = (id) => document.getElementById(id);
  const STORE = 'fb.settings.v1';

  // Keys up to four sharps/flats, ordered flat-side -> sharp-side for the menu.
  const KEYS = [
    { mode: 'major', step: 5, alter: -1 }, // Ab
    { mode: 'major', step: 2, alter: -1 }, // Eb
    { mode: 'major', step: 6, alter: -1 }, // Bb
    { mode: 'major', step: 3, alter: 0 },  // F
    { mode: 'major', step: 0, alter: 0 },  // C
    { mode: 'major', step: 4, alter: 0 },  // G
    { mode: 'major', step: 1, alter: 0 },  // D
    { mode: 'major', step: 5, alter: 0 },  // A
    { mode: 'major', step: 2, alter: 0 },  // E
    { mode: 'minor', step: 3, alter: 0 },  // F minor
    { mode: 'minor', step: 0, alter: 0 },  // C minor
    { mode: 'minor', step: 4, alter: 0 },  // G minor
    { mode: 'minor', step: 1, alter: 0 },  // D minor
    { mode: 'minor', step: 5, alter: 0 },  // A minor
    { mode: 'minor', step: 2, alter: 0 },  // E minor
    { mode: 'minor', step: 6, alter: 0 },  // B minor
    { mode: 'minor', step: 3, alter: 1 },  // F# minor
    { mode: 'minor', step: 0, alter: 1 },  // C# minor
  ];
  const pretty = (s) => s.replace(/#/g, '♯').replace(/b/g, '♭');
  const keyName = (k) => pretty(T.name({ step: k.step, alter: k.alter }));
  const keyLabel = (k) => keyName(k) + (k.mode === 'major' ? ' major' : ' minor');
  const keyObj = (k) => ({ tonic: { step: k.step, alter: k.alter }, mode: k.mode });
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const DEFAULTS = { source: 'generated', difficulty: 2, length: 2, key: 'rand-any', theme: 'light' };
  let state = load();
  let current = null;

  function load() {
    try { return Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem(STORE) || '{}')); }
    catch (e) { return Object.assign({}, DEFAULTS); }
  }
  function save() {
    try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) {}
  }

  // ---- segmented controls -------------------------------------------------
  function buildSeg(container, name, items, current, onChange) {
    container.innerHTML = '';
    items.forEach((it) => {
      const label = document.createElement('label');
      const input = document.createElement('input');
      input.type = 'radio'; input.name = name; input.value = String(it.value);
      if (String(it.value) === String(current)) input.checked = true;
      const span = document.createElement('span');
      span.textContent = it.label;
      input.addEventListener('change', () => onChange(it.value));
      label.appendChild(input); label.appendChild(span);
      container.appendChild(label);
    });
  }

  function buildKeySelect() {
    const sel = $('sel-key');
    sel.innerHTML = '';
    const og = (label) => { const g = document.createElement('optgroup'); g.label = label; sel.appendChild(g); return g; };
    const opt = (g, value, label) => { const o = document.createElement('option'); o.value = value; o.textContent = label; g.appendChild(o); };
    const gr = og('Random');
    opt(gr, 'rand-any', 'Random key');
    opt(gr, 'rand-major', 'Random major');
    opt(gr, 'rand-minor', 'Random minor');
    const gMaj = og('Major');
    const gMin = og('Minor');
    KEYS.forEach((k, i) => opt(k.mode === 'major' ? gMaj : gMin, String(i), keyLabel(k)));
    sel.value = state.key;
    sel.addEventListener('change', () => { state.key = sel.value; save(); newLine(); });
  }

  function resolveKey(selVal) {
    if (selVal === 'rand-any') return { key: keyObj(pick(KEYS)) };
    if (selVal === 'rand-major') return { key: keyObj(pick(KEYS.filter((k) => k.mode === 'major'))) };
    if (selVal === 'rand-minor') return { key: keyObj(pick(KEYS.filter((k) => k.mode === 'minor'))) };
    return { key: keyObj(KEYS[+selVal] || KEYS[4]) };
  }

  // ---- Bach corpus (with transposition) -----------------------------------
  const bachData = (window.FB_BACH && window.FB_BACH.chorales) || [];
  const SHARP_ORDER = [3, 0, 4, 1, 5, 2, 6], FLAT_ORDER = [6, 2, 5, 1, 4, 0, 3];
  const sigMap = (sig) => { const m = {}; if (sig > 0) for (let i = 0; i < sig; i++) m[SHARP_ORDER[i]] = 1; if (sig < 0) for (let i = 0; i < -sig; i++) m[FLAT_ORDER[i]] = -1; return m; };
  const GLYPH_ALTER = { '♯': 1, '♭': -1, '♮': 0, '×': 2 };
  const ALTER_GLYPH = { '1': '♯', '-1': '♭', '0': '♮', '2': '×', '-2': '♭♭' };

  // A figure's interval is invariant under transposition, but its accidental
  // glyph depends on the key signature (a "raised 6th" is ♯ in one key, ♮ in
  // another), so recompute the glyph from the alteration-relative-to-the-scale.
  function recompCell(c, origBassStep, newBassStep, origSig, newSig) {
    const N = c.num == null ? 3 : c.num;
    const origUpper = (origBassStep + N - 1) % 7;
    const newUpper = (newBassStep + N - 1) % 7;
    const alteration = c.acc ? ((GLYPH_ALTER[c.acc] || 0) - (origSig[origUpper] || 0)) : 0;
    if (alteration === 0) return { num: c.num, acc: '' };
    return { num: c.num, acc: ALTER_GLYPH[String((newSig[newUpper] || 0) + alteration)] || '' };
  }

  function transposeChorale(ch, phrases, toKey) {
    const origSig = sigMap(ch.sig);
    const newSigFifths = T.fifths(toKey);
    const newSig = sigMap(newSigFifths);
    const iv = T.intervalBetween(
      { step: ch.key.tonic.step, alter: ch.key.tonic.alter, oct: 4 },
      { step: toKey.tonic.step, alter: toKey.tonic.alter, oct: 4 });
    const events = [];
    phrases.forEach((p) => p.forEach((e) => {
      if (e.step < 0) { events.push(Object.assign({ pitchAlter: 0 }, e)); return; }
      const np = T.transposeNote({ step: e.step, alter: e.alter, oct: e.oct }, iv);
      const ev = Object.assign({}, e, { step: np.step, alter: np.alter, oct: np.oct, pitchAlter: np.alter });
      delete ev.fb;
      if (e.fb && e.fb.figure) ev.figure = { rows: e.fb.figure.rows.map((c) => recompCell(c, e.step, np.step, origSig, newSig)) };
      else if (e.fb && e.fb.moving) ev.moving = { stacks: e.fb.moving.stacks.map((st) => st.map((c) => recompCell(c, e.step, np.step, origSig, newSig))) };
      else if (e.fb && e.fb.hold) ev.hold = true;
      events.push(ev);
    }));
    const sound = events.filter((e) => e.step >= 0);
    if (sound.length) {
      const mean = sound.reduce((s, e) => s + T.midi({ step: e.step, alter: e.alter, oct: e.oct }), 0) / sound.length;
      const shift = Math.round((47 - mean) / 12);
      if (shift) events.forEach((e) => { if (e.step >= 0) e.oct += shift; });
    }
    if (events.length) events[events.length - 1].endBar = true;
    return { events, sig: newSigFifths };
  }

  function buildBachModel() {
    if (!bachData.length) return null;
    const sel = state.key;
    let modeWanted = null, targetKeyEntry = null;
    if (sel === 'rand-major') modeWanted = 'major';
    else if (sel === 'rand-minor') modeWanted = 'minor';
    else if (sel !== 'rand-any') { targetKeyEntry = KEYS[+sel]; modeWanted = targetKeyEntry && targetKeyEntry.mode; }

    let pool = modeWanted ? bachData.filter((c) => c.key.mode === modeWanted) : bachData;
    if (!pool.length) pool = bachData;
    const N = state.length;
    const longEnough = pool.filter((c) => c.phrases.length >= N);
    const ch = pick(longEnough.length ? longEnough : pool);
    const take = Math.min(N, ch.phrases.length);
    const start = Math.floor(Math.random() * (ch.phrases.length - take + 1));
    const chosen = ch.phrases.slice(start, start + take);

    let toKey;
    if (targetKeyEntry) toKey = keyObj(targetKeyEntry);
    else toKey = keyObj(pick(KEYS.filter((k) => k.mode === ch.key.mode)));

    const { events, sig } = transposeChorale(ch, chosen, toKey);
    return { source: 'bach', bwv: ch.bwv, title: ch.title, sig, key: toKey, meter: { num: ch.num, den: ch.den }, phrases: take, events };
  }

  // ---- generate + render --------------------------------------------------
  function newLine() {
    if (state.source === 'bach') {
      const m = buildBachModel();
      if (m) current = m;
      else { state.source = 'generated'; syncSourceUI(); } // no data -> fall back
    }
    if (state.source !== 'bach') {
      const { key } = resolveKey(state.key);
      current = DS.generator.generate({ difficulty: state.difficulty, key, phrases: state.length });
    }
    $('empty-hint').hidden = true;
    renderCurrent();
    updateGivens();
  }

  function renderCurrent() {
    if (!current) return;
    const staff = $('staff');
    const width = staff.clientWidth || 700;
    const scale = Math.min(1.95, Math.max(1.4, width / 400));
    DS.render.render(staff, current, { scale });
  }

  const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

  function updateGivens() {
    if (!current) return;
    const k = current.key;
    const nm = keyName(k.tonic) + (k.mode === 'major' ? ' major' : ' minor');
    const ph = current.phrases === 1 ? '1 phrase' : current.phrases + ' phrases';
    let html = `<span class="given"><span class="noto">𝄢</span> <b>${nm}</b></span>`;
    if (current.source === 'bach') {
      html += `<span class="given">Bach · <b>BWV ${esc(current.bwv)}</b></span>` +
        `<span class="given given-title">${esc(current.title)}</span>`;
    } else {
      html += `<span class="given">Difficulty <b>${current.difficulty}</b></span>`;
    }
    html += `<span class="given"><b>${ph}</b></span>`;
    $('givens').innerHTML = html;
  }

  function syncSourceUI() {
    $('ctl-difficulty').hidden = state.source === 'bach';
  }

  // ---- wiring -------------------------------------------------------------
  function init() {
    const haveBach = bachData.length > 0;
    if (!haveBach) state.source = 'generated';
    if (![1, 2, 4, 6, 8].includes(state.length)) state.length = 2; // coerce stale persisted value
    buildSeg($('seg-source'), 'source',
      [{ value: 'bach', label: 'Bach' }, { value: 'generated', label: 'Generated' }],
      state.source, (v) => { state.source = v; save(); syncSourceUI(); newLine(); });
    syncSourceUI();

    buildSeg($('seg-difficulty'), 'difficulty',
      [1, 2, 3, 4, 5].map((n) => ({ value: n, label: String(n) })),
      state.difficulty, (v) => { state.difficulty = +v; save(); newLine(); });

    buildSeg($('seg-length'), 'length',
      [1, 2, 4, 6, 8].map((n) => ({ value: n, label: String(n) })),
      state.length, (v) => { state.length = +v; save(); newLine(); });

    buildKeySelect();

    $('btn-new').addEventListener('click', newLine);

    $('btn-theme').addEventListener('click', () => {
      const dark = document.documentElement.getAttribute('data-theme') === 'dark';
      if (dark) document.documentElement.removeAttribute('data-theme');
      else document.documentElement.setAttribute('data-theme', 'dark');
      state.theme = dark ? 'light' : 'dark'; save();
    });

    const dlg = $('dlg-about');
    $('btn-about').addEventListener('click', () => dlg.showModal());

    document.addEventListener('keydown', (e) => {
      if (e.target.matches('input, select, textarea')) return;
      if (e.key === 'n' || e.key === 'N') { e.preventDefault(); newLine(); }
    });

    let rt;
    const relayout = () => { clearTimeout(rt); rt = setTimeout(renderCurrent, 140); };
    window.addEventListener('resize', relayout);
    window.addEventListener('orientationchange', relayout);

    // start with a line on screen
    newLine();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
