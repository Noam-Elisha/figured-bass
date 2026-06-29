// Build js/data/bach-fb.js from the BCFB / FiBaC corpus (translated_kern).
// Extracts the continuo bass line (the **kern spine immediately left of **fb)
// and Bach's own figured-bass figures, segments each chorale into fermata-
// delimited phrases, and emits a compact bundle: window.FB_BACH.
//
//   node tools/build-bach-fb.mjs
//
// Source: github.com/juyaolongpaul/Bach_chorale_FB (CC BY 4.0).
import fs from 'fs';
import path from 'path';

const SRC = 'tools/bcfb-src/FB_source/translated_kern';
const OUT = 'js/data/bach-fb.js';
const TPW = 192; // ticks per whole note (quarter = 48)
const STEP_OF_LETTER = { c: 0, d: 1, e: 2, f: 3, g: 4, a: 5, b: 6 };
const ACC2 = { '#': '♯', n: '♮', '-': '♭' };

function parseBass(tok) {
  // returns { step, alter, oct, dur, fermata, tie } or null on unparseable
  if (/[qQ]/.test(tok)) return null; // grace note
  const dm = tok.match(/(\d+)(\.*)/);
  if (!dm) return null;
  const base = TPW / Number(dm[1]);
  let dur = base;
  for (let i = 0; i < dm[2].length; i++) dur += base / Math.pow(2, i + 1);
  dur = Math.round(dur);
  const fermata = tok.includes(';');
  const tie = tok.includes('[') || tok.includes('_'); // tie start / continuation
  if (tok.includes('r')) return { step: -1, alter: 0, oct: 0, dur, fermata, tie: false };
  const pm = tok.match(/([a-gA-G]+)(##|#|--|-|n)?/);
  if (!pm) return null;
  const letters = pm[1];
  if (!letters.split('').every((c) => c.toLowerCase() === letters[0].toLowerCase())) return null;
  const lower = letters[0] === letters[0].toLowerCase();
  const step = STEP_OF_LETTER[letters[0].toLowerCase()];
  const oct = lower ? 3 + letters.length : 4 - letters.length;
  const a = pm[2] || '';
  const alter = a === 'n' ? 0 : a.startsWith('#') ? a.length : a.startsWith('-') ? -a.length : 0;
  return { step, alter, oct, dur, fermata, tie };
}

// Decode one **fb token to a stack [{num, acc}] (top->bottom), or 'CONT'.
function decodeStack(tok) {
  tok = tok.trim();
  if (tok === '' || tok === '.' || tok === '..' || tok === '_' || tok === '._') return 'CONT';
  const rows = [];
  for (let e of tok.split(/\s+/)) {
    if (e === '_' || e === '.' || e === '') continue;
    e = e.replace(/_$/, '');
    let m;
    if ((m = e.match(/^#?(\d+)[\\|]+$/))) rows.push({ num: +m[1], acc: '♯' });       // slashed = raised
    else if ((m = e.match(/^([#n-])r(\d+)$/))) rows.push({ num: +m[2], acc: ACC2[m[1]] });
    else if ((m = e.match(/^([#n-])(\d+)$/))) rows.push({ num: +m[2], acc: ACC2[m[1]] });
    else if ((m = e.match(/^(\d+)([#n-])$/))) rows.push({ num: +m[1], acc: ACC2[m[2]] });
    else if (/^[#n-]$/.test(e)) rows.push({ num: null, acc: ACC2[e] });             // accidental on the 3rd
    else if ((m = e.match(/^(\d+)$/))) rows.push({ num: +m[1], acc: '' });
    // else: unknown mark (e.g. "X") — drop
  }
  if (!rows.length) return 'CONT';
  rows.sort((a, b) => (b.num == null ? 3 : b.num) - (a.num == null ? 3 : a.num));
  return rows;
}

function figureFromTokens(tokens) {
  const stacks = [];
  let hold = false;
  for (const t of tokens) {
    const s = decodeStack(t);
    if (s === 'CONT') hold = true;
    else stacks.push(s);
  }
  if (!stacks.length) return hold ? { hold: true } : null;
  if (stacks.length === 1) return { figure: { rows: stacks[0] } };
  // suspension over a held bass: keep the successive stacks (the renderer zips
  // them into dashed rows; transposition recomputes each cell's accidental)
  return { moving: { stacks } };
}

const ENT = { szlig: 'ß', auml: 'ä', ouml: 'ö', uuml: 'ü', Auml: 'Ä', Ouml: 'Ö', Uuml: 'Ü', eacute: 'é', amp: '&', apos: "'", quot: '"' };
const decodeEntities = (s) => String(s).replace(/&([a-zA-Z]+);/g, (m, n) => ENT[n] || m).replace(/&#(\d+);/g, (m, d) => String.fromCharCode(+d));

function parseFile(text, bwv) {
  const lines = text.split(/\r?\n/);
  const hdr = lines.find((l) => l.startsWith('**'));
  if (!hdr) return null;
  const cols = hdr.split('\t');
  const fbCol = cols.indexOf('**fb');
  if (fbCol < 1 || cols[fbCol - 1] !== '**kern') return null;
  const bassCol = fbCol - 1;

  let sig = null, num = null, den = null, title = null, mode = null, tonicStep = null, tonicAlter = 0;
  const events = [];
  let cur = null;

  const flushFb = () => { if (cur) cur.fb = figureFromTokens(cur._tok); };

  for (const line of lines) {
    if (line === '') continue;
    if (line.startsWith('!')) {
      const m = line.match(/^!!!([^:]+):\s*(.*)$/);
      if (m && m[1] === 'OTL' && !title) title = m[2];
      continue;
    }
    const c = line.split('\t');
    if (line.startsWith('*')) {
      const b = c[bassCol] || '';
      let m;
      if ((m = b.match(/^\*M(\d+)\/(\d+)$/))) { num = +m[1]; den = +m[2]; }
      else if ((m = b.match(/^\*k\[([a-g#\-]*)\]$/))) {
        const accs = m[1].match(/[a-g][#-]/g) || [];
        sig = accs.length === 0 ? 0 : accs[0].endsWith('#') ? accs.length : -accs.length;
      } else if ((m = b.match(/^\*([a-gA-G])([#-]*):/))) {
        tonicStep = STEP_OF_LETTER[m[1].toLowerCase()];
        tonicAlter = m[2] === '#' ? 1 : m[2] === '-' ? -1 : 0;
        mode = m[1] === m[1].toLowerCase() ? 'minor' : 'major';
      }
      continue;
    }
    if (line.startsWith('=')) { if (events.length) events[events.length - 1].endBar = true; continue; }

    // data row
    const bt = c[bassCol], ft = c[fbCol];
    if (bt !== '.' && bt !== undefined) {
      flushFb();
      const n = parseBass(bt);
      if (!n) { cur = null; continue; } // unparseable bass token -> drop note
      n._tok = [];
      events.push(n);
      cur = n;
      if (ft && ft !== '.') cur._tok.push(ft);
    } else if (cur && ft && ft !== '.') {
      cur._tok.push(ft);
    }
  }
  flushFb();
  events.forEach((e) => delete e._tok);

  if (!events.length || num == null) return null;
  if (sig == null) sig = 0;
  if (tonicStep == null) { tonicStep = ((sig * 4) % 7 + 7) % 7; tonicAlter = 0; mode = 'major'; } // best-effort

  // segment into fermata-delimited phrases
  const phrases = [];
  let phr = [];
  for (const e of events) {
    phr.push(e);
    if (e.fermata) { phrases.push(phr); phr = []; }
  }
  if (phr.length) phrases.push(phr);

  return {
    bwv, title: decodeEntities(title || bwv), sig, num, den,
    key: { tonic: { step: tonicStep, alter: tonicAlter }, mode: mode || 'major' },
    phrases,
  };
}

// Keep only clean 4-part-chorale-style entries — drop the elaborate cantata
// movements (huge phrases) and any file whose figures didn't extract cleanly.
function isChoraleLike(ch) {
  if (ch.phrases.length < 2) return false;
  const notes = ch.phrases.reduce((a, p) => a + p.length, 0);
  const figured = ch.phrases.reduce((a, p) => a + p.filter((e) => e.fb).length, 0);
  const avg = notes / ch.phrases.length;
  const maxP = Math.max(...ch.phrases.map((p) => p.length));
  return avg <= 24 && maxP <= 48 && figured / notes >= 0.25;
}

// ---- main ----
const files = fs.readdirSync(SRC).filter((f) => f.endsWith('.krn')).sort();
const chorales = [];
let skipped = 0;
const seen = new Set(); // dedupe by bwv (keep first; a/b variants kept separately)
for (const f of files) {
  const bwv = (f.match(/BWV_([0-9.a-b]+)/) || [, f])[1];
  let ch;
  try { ch = parseFile(fs.readFileSync(path.join(SRC, f), 'utf8'), bwv); }
  catch (e) { ch = null; }
  if (!ch || !isChoraleLike(ch)) { skipped++; continue; }
  if (seen.has(bwv)) continue;
  seen.add(bwv);
  chorales.push(ch);
}

// stats
const totalPhrases = chorales.reduce((s, c) => s + c.phrases.length, 0);
const totalNotes = chorales.reduce((s, c) => s + c.phrases.reduce((a, p) => a + p.length, 0), 0);
const withFig = chorales.reduce((s, c) => s + c.phrases.reduce((a, p) => a + p.filter((e) => e.fb).length, 0), 0);

const json = JSON.stringify({ chorales });
const header =
  '// Generated by tools/build-bach-fb.mjs — do not edit by hand.\n' +
  '// Bach figured-bass from the BCFB / FiBaC corpus (Ju et al.),\n' +
  '// github.com/juyaolongpaul/Bach_chorale_FB — CC BY 4.0. Music is public domain.\n' +
  '// Each chorale: continuo bass + Bach\'s own figures, split into fermata phrases.\n';
fs.mkdirSync('js/data', { recursive: true });
fs.writeFileSync(OUT, header + 'window.FB_BACH = ' + json + ';\n');

console.log(`chorales: ${chorales.length} (skipped ${skipped})`);
console.log(`phrases: ${totalPhrases}, bass notes: ${totalNotes}, notes with a figure: ${withFig}`);
console.log(`output: ${OUT} (${(fs.statSync(OUT).size / 1024).toFixed(0)} KB)`);
console.log('sample chorale:', chorales[0].bwv, chorales[0].title, '| key sig', chorales[0].sig, '| phrases', chorales[0].phrases.length);
