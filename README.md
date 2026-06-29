# Figured Bass

A static web page for practising **playing from figured bass** (thoroughbass / basso
continuo). It shows a bass line on the bass staff with figured-bass numerals beneath each
note — either freshly **generated** or a real **Bach chorale** with his own figures — and you
read the figures and realise the harmony at the keyboard. There is no playback and no answer,
just the line to play. Built to read well on an iPad and on a PC.

## Quick start

No build, no server, no network:

1. **Double-click `index.html`.** (Or host the folder on any static server / GitHub Pages.)
2. Pick a difficulty, length and key, then tap **New line** (or press <kbd>N</kbd>).

Everything — the notation engine, fonts — is bundled locally, so it works offline.

## What it does

Pick a **Source**:

- **Generated** — a fresh rule-generated bass line in **1–8 two-bar phrases**, each closing with
  a cadence (internal phrases lean on half cadences, the last on an authentic cadence) and a
  fermata. Each bass note carries the **correct figured-bass figure**, derived by construction
  from the underlying chord and inversion, so the figures are always right.
- **Bach** — a real chorale from the **BCFB / FiBaC corpus** (122 clean four-part chorales) with
  **Bach's own figures** from the NBA edition, shown a chosen number of fermata-delimited phrases
  at a time, and **transposed** to a fresh key each time for variety (the figures' accidentals are
  recomputed for the new key).

The engraving reflows to the screen width — more bars per line on a PC, fewer on an iPad — and
justifies each full system, so it looks like a natural score on either device.

- **Difficulty** (generated only) sets the harmonic vocabulary:
  1. triads and the dominant seventh — figures `(blank)` · `6` · `6/4` · `7`
  2. adds ii, leading-tone chords and inverted sevenths — `6/5` · `4/3` · `4/2`
  3. adds suspensions (`4–3`, `7–6`) and secondary dominants
  4. leans further into chromatic harmony
  5. adds mode mixture, the Neapolitan and augmented sixths
- **Length** — number of phrases (1, 2, 4, 6 or 8).
- **Key** — fixed or random (up to four sharps or flats). For Bach it transposes a chorale into
  that key. *(Key is independent of difficulty.)*

### Reading the figures

Numbers are **intervals above the written bass note** (not Roman numerals); their quality
comes from the key. Larger numbers sit on top. An accidental alone alters the third above
the bass; beside a number it alters that interval. A dash (`4–3`) is a suspension. See
[`docs/figured-bass-notation-reference.md`](docs/figured-bass-notation-reference.md) for the
full conventions this app follows.

## How it's engraved

The staff (clef, key signature, notes, ledger lines, barlines, fermatas) is engraved with
**abcjs**. The figures are **not** abcjs annotations — those render their accidental glyphs as
colour emoji inside SVG text. Instead each figure stack is positioned HTML, aligned to its
notehead via abcjs's per-note geometry, and its accidentals are drawn as **inline SVG**
(`currentColor`) so they are crisp and monochrome at any size, on any browser, in light or
dark mode. The engraving auto-fits the screen width and re-lays-out on rotation.

## Project layout

```
index.html              UI shell
css/style.css           design system ("The Engraver's Desk")
fonts/                   vendored fonts (Fraunces, Inter, Noto Music — OFL)
js/rng.js                seeded PRNG (deterministic exercises)
js/theory.js             spelled-pitch / key / interval model
js/figures.js            chord + key -> printed figured-bass stack
js/generator.js          harmonic generator -> bass line + figures + cadences
js/render.js             exercise -> engraved staff (abcjs) + figure overlay
js/app.js                controls, state, persistence, resize
js/data/bach-fb.js       122 Bach chorales: continuo bass + Bach's own figures
js/vendor/abcjs-basic-min.js   notation engraving (MIT)
tools/build-bach-fb.mjs  data pipeline: BCFB **kern -> js/data/bach-fb.js
docs/                    figured-bass notation reference (research synthesis)
```

## Rebuilding the Bach data

`js/data/bach-fb.js` is generated from the BCFB corpus. To regenerate it:

```bash
git clone https://github.com/juyaolongpaul/Bach_chorale_FB tools/bcfb-src
node tools/build-bach-fb.mjs
```

The pipeline reads the continuo `**kern` spine and the `**fb` figured-bass spine from each
file, decodes the figures (stacks, accidentals, slashed/raised figures, suspensions,
continuation lines), splits each chorale into fermata-delimited phrases, and keeps the clean
four-part chorales (dropping elaborate cantata movements).

## Possible future additions

- Tenor-clef / grand-staff display; the Rule of the Octave as a dedicated drill; 3/4 generated
  metre; transposition of the Bach lines.

## Licences & attribution

- **Bach figures:** [BCFB / FiBaC](https://github.com/juyaolongpaul/Bach_chorale_FB) (Ju et al.),
  **CC BY 4.0**; the music itself is public domain. The derived `js/data/bach-fb.js` inherits CC BY 4.0.
- **abcjs** — MIT. **Fraunces, Inter, Noto Music** — SIL Open Font License.
- App code: MIT. Engraving conventions follow standard common-practice thoroughbass usage
  (see the notation reference).
