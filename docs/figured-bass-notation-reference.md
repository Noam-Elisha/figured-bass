# Figured Bass — Notation Reference

> Research synthesis that drove this project: a fact-checked spec of figured-bass
> notation (conventions, the figure→inversion tables, accidentals, suspensions,
> the Rule of the Octave, engraving conventions, datasets, rendering strategy).
> Compiled from multiple sources with an adversarial verification pass.

This spec drives a web app that **generates** bass lines with figured-bass notation for keyboard-harmony practice. All contradictions in the source research are resolved in favor of the four verification verdicts, which take precedence. Implementation-critical resolutions are flagged inline as **[VERDICT]**.

---

## 1. What Figured Bass IS (and IS NOT)

**IS:** A Baroque shorthand (c. 1600–1750) in which Arabic numerals + accidental symbols, written **directly under a notated bass note**, tell a keyboard/chordal player which **intervals to sound ABOVE that bass note**.

Core invariants (treat as axioms in code):

1. **Numbers = generic diatonic intervals above the BASS note**, counted in scale steps — not above the root, not in semitones. Over a C bass, `6` = A (a sixth up), `4` = F (a fourth up).
2. **Quality is supplied by the prevailing key signature**, not by the number. A `6` can be a major or minor sixth depending on key. Accidentals (Section 3) override the diatonic default.
3. **The bass note is never part of the figure.** Figures only reckon upward. There is no `1`.
4. **Octave-agnostic.** `3` may be realized as a 3rd, 10th, or 17th. Figures specify pitch-classes/intervals above the bass, not voicing or register.
5. **Stacking: largest interval on top, smallest on bottom** (descending interval size top→bottom). `6` over `4`, never `4` over `6`. **[VERDICT: confirmed]**
6. **Most figures are abbreviations** of a fuller stack (Section 5).

**IS NOT:**

- **Not Roman-numeral analysis.** A `6` does not mean "submediant" — it means "a sixth above this bass" (a first-inversion triad). Roman numerals name root/function; figures name intervals.
- **Not chord-quality labels.** `7` is not "dominant seventh"; `6` is not "major-sixth chord."
- **Not semitone counts.**
- **Not a fixed voicing** unless explicitly forced (Section 5).
- **The `/` in `6/4` is a typographic stand-in for vertical stacking, NOT an engraved slash or fraction bar.** An actual slash *through* a digit is a different thing entirely (Section 3).

---

## 2. Complete Figure → Intervals → Chord/Inversion Table

Stacking order in the "Engraved stack" column is literal: top line = top of the printed column. **[VERDICT: confirmed]** for all rows.

### Triads

| Inversion | Bass note is the… | Intervals above bass | Full figure | **Printed figure** | Engraved stack (top→bottom) |
|---|---|---|---|---|---|
| Root | root | 3, 5 | 5/3 | *(blank)* | — |
| 1st | 3rd | 3, 6 | 6/3 | **6** | `6` |
| 2nd | 5th | 4, 6 | 6/4 | **6/4** (always full) | `6` / `4` |

- Triads have **no third inversion** (only three notes).
- 2nd inversion is **never abbreviated to a single number** — it must stay `6/4`, or it reads as 1st inversion.

### Seventh Chords

| Inversion | Bass note is the… | Intervals above bass | Full figure | **Printed figure** | Engraved stack (top→bottom) |
|---|---|---|---|---|---|
| Root | root | 3, 5, 7 | 7/5/3 | **7** | `7` |
| 1st | 3rd | 3, 5, 6 | 6/5/3 | **6/5** | `6` / `5` |
| 2nd | 5th | 3, 4, 6 | 6/4/3 | **4/3** | `4` / `3` |
| 3rd | 7th | 2, 4, 6 | 6/4/2 | **4/2** (or bare **2**) | `4` / `2` |

**[VERDICT — category-error correction]:** `6/4/3` and `4/3` are the **same chord** (2nd-inversion 7th); `6/4/3` is the full form, `4/3` the standard abbreviation. Likewise `6/5/3`=`6/5`, `6/4/2`=`4/2`. Do not model them as distinct chords. Similarly `6/4/2`/`4/2`/`2` are one chord with three notations.

**Hard rule:** **Drop the `7` on every inverted seventh chord.** Never emit `7/6/5`, `6/5/3` routinely, etc. The stacks `6/5`, `4/3`, `4/2` occur *only* with seventh chords, so the `7` is redundant.

### Ninth (suspension-flavored)

| Figure | Realization | Note |
|---|---|---|
| `9` | 9/5/3 | usually a 9-8 suspension (Section 4) |

---

## 3. Accidental Conventions **[VERDICT: corrected — apply these precisely]**

### 3a. Lone accidental (no number) → the THIRD above the bass

A `♯`, `♭`, or `♮` standing alone **always** alters the note a 3rd above the bass (the chordal third). Unanimous, no exceptions in scope.

- Lone `♯` = ♯3, lone `♭` = ♭3, lone `♮` = ♮3.
- This is the standard way to **raise the leading tone** in a minor-key dominant: an otherwise-blank bass note gets a single `♯` (or `♮`).
- It never alters the bass note and never applies to the whole chord.

### 3b. Accidental beside a number → that specific interval

- Sits **immediately to the LEFT** of its numeral by default (`♯6`, `♭7`, `♮5`). May appear to the right (`6♯`) in some sources — identical meaning. **Default to left-placement.**
- A `♯` beside a number **raises**; a `♭` **lowers**; a `♮` **cancels** (direction depends on key signature). **[VERDICT]:** a plain beside-number accidental is NOT inherently a "raise" — only `♯`/slash/`+` raise. Do the literal thing the accidental says.
- The accidental binds **only its own row** in a stack. In `6/♯4/3` only the 4 is raised.
- **Mechanism:** alteration is relative to the key signature — `♭`→`♮`, `♮`→`♯` — not an absolute accidental.

### 3c. Raised interval — three equivalent devices **[VERDICT: corrected, distinguish them]**

1. **`♯` before the number** (`♯6`).
2. **`+` (plus/cross) BESIDE the number** (`6+` or `+6`) — sits beside, not through.
3. **Slash THROUGH the digit** (the "slashed 6").

All three mean **raise that interval one chromatic semitone**. `6`, `6+`, and slashed-`6` are the **same chord**, not three different ones.

**[VERDICT — critical direction/exception rules]:**

- The **default raising stroke is a back-slash through the digit**. A **forward slash** is the rarer **lowering** sign.
- **Diminished-fifth exception:** a slashed `5` conventionally means a **lowered (diminished) fifth** — the reverse of "slash = raise." Special-case `5`.
- **Convention `3` is normally NOT slashed**; the raised third uses a real `♯`/`♮` or `+`.
- Conventions vary by publisher/era. For a *generator*, pick one house style and be internally consistent (recommendation below).

### Generator recommendation for accidentals

To avoid the slash-direction minefield on a small screen, **emit explicit accidental glyphs (`♯`/`♭`/`♮`) beside numerals by default**, with the lone-accidental-on-3rd convention for raised thirds. Treat slashed digits and `+` as **optional render styles** of "raised," not as the source-of-truth data. Internally store each figure as `{ number, accidental: '#'|'b'|'n'|null, alteration: 'raise'|'lower'|null }` so the renderer can choose glyph vs. slash vs. plus.

---

## 4. Suspensions & Continuation Lines **[VERDICT: corrected]**

### 4a. Two distinct horizontal devices — do not conflate

| Device | Meaning | Looks like |
|---|---|---|
| **Suspension dash** (`4–3`) | ONE voice MOVES from one interval to another over a held/repeated bass | two different numbers, short dash between, on one row |
| **Hold / continuation line** | upper voices are HELD (static) while the bass MOVES or repeats | one figure, then a thin horizontal extender line running right |

These look similar but mean opposites (moving voice vs. static voice). Model them as separate object types.

### 4b. Standard suspension pairs

Dissonance first, resolves **down by step** to the consonance, both under one sustained bass:

| Figure | Literal full form | Type |
|---|---|---|
| `4–3` | 5/4 → 5/3 (the held 5 usually unwritten) | upper-voice |
| `7–6` | 7/3 → 6/3 | upper-voice |
| `9–8` | 9/5/3 → 8/5/3 | upper-voice |
| `2–3` | **BASS suspension** — see below | bass-voice |
| `6–5` | 6 → 5 (sometimes appears) | upper-voice |

**[VERDICT — key nuances]:**

- `4–3`, `7–6`, `9–8` are **abbreviations**; the held tones (the 5, the 5/3) are implied, not printed.
- **`2–3` is categorically different — the BASS is the suspended/moving voice.** The lower interval *grows* (2→3) as the bass resolves **down** by step against a held upper voice. It is **never** `3–2`. (Measured against the relevant upper voice the motion may look like 4–3 or 10–9; the conventional figure is `2–3`.)
- The dash is **conventional and optional** — its presence/absence does not change the realization. But do **not** omit the resolution *figure*.
- **Successive figures on one bass note = melodic resolution, not a stack.** `7` then `6` over the same bass = a 6/3 chord with a 7–6 suspension (realize 7/3 then 6/3), NOT a 7th chord plus a sixth.

### 4c. Cadential six-four **[VERDICT: corrected]**

Over **one sustained bass note** (scale-degree 5 / the dominant): `6/4` → `5/3`, with **6→5 and 4→3 both resolving down by step simultaneously**.

- Standard textbook figure: **`6/4 → 5/3`**.
- More explicit voice-leading figure: **`6–5` over `4–3`** (two stacked suspension pairs), sometimes abbreviated to just `4–3` with `8/5` understood.

```
6 — 5
4 — 3
```

- Same single held/repeated bass under both columns. Column 1 (`6`,`4`) is the strong beat; column 2 (`5`,`3`) the resolution.
- It is NOT a root-position ii chord and NOT an independent tonic — the bass is the dominant throughout.

### 4d. Horizontal alignment rules

- **Within a chord:** vertical stack, largest on top.
- **Suspension:** two stacks side-by-side on the same row(s); first numeral horizontally aligned under the beat where the dissonance sounds, second under the beat of resolution. The dash spans only its own row and binds only the two numbers it connects (a `6–5` dash does not affect a `4` on another row).
- **Hold line:** thin extender at the numeral's mid-height (x-height), starting a small gap after the figure, ending exactly where the held interval stops. Each stacked figure gets its own line on its own row.
- **Line weight:** light, like the thin part of a tie — never beam-like.

---

## 5. Omission / Shorthand Rules

**The omitted defaults are 3, 5, and 8.** Figures are printed only to (a) replace one of these defaults, (b) introduce a non-default interval (4, 7, 9, 2…), or (c) carry an accidental.

| Situation | Print | Do NOT print |
|---|---|---|
| Root-position triad | *(blank)* | `5/3` (unless forcing a voicing) |
| 1st-inv triad | `6` | `6/3` |
| 2nd-inv triad | `6/4` | bare `6` |
| Root 7th | `7` | `7/5/3` |
| 1st-inv 7th | `6/5` | `6/5/3`, `7/6/5` |
| 2nd-inv 7th | `4/3` | `6/4/3`, `7/4/3` |
| 3rd-inv 7th | `4/2` or `2` | `6/4/2` with a 7 |
| Raised 3rd | lone `♯`/`♮`/`♭` | `♯3` (the 3 is dropped) |

Documented omission logic (from BCFB/NBA practice, useful as generator defaults):

- `3` omitted unless a 4th is present or it resolves a 4–3 suspension.
- `5` omitted unless a 6th is present, a 6–5 suspension, or an accidental applies to it.
- `8` omitted unless a 9th is present or a 9–8 suspension.
- `6` omitted only when the chord is `6/4/3` or `6/4/2` (i.e., it becomes `4/3`/`4/2`).

**Performer/realizer assumption:** an unfigured bass note = **root-position diatonic triad** built from the key signature, departing only when a figure/accidental/context demands.

**Explicit overrides (the generator must support emitting these on demand):**

- **`tasto solo`** (text, often `t.s.`) = play bass line alone, no chords, until the next figure or `tutti`. Cancels the "assume a triad" default.
- **Explicit `5/3` or `8` or `8/5/3`** = deliberately force a voicing/octave doubling (e.g., confirm a plain triad after chromaticism).
- `8/8/8` = bass in octaves only.

**Caveat for *consuming* real datasets** (not for generating): historical sources are *partially figured* — a missing figure is not guaranteed to be `8/5/3`. When generating, you control the figures, so emit complete-enough figures for unambiguous practice.

---

## 6. Rule of the Octave (Regola dell'Ottava) — Generator Tables

**[VERDICT: corrected — there is NO single canonical table.]** The RotO is a *norm*, not a fixed set; figures differ by treatise and by direction. The app should ship a **selectable version** (Basic vs. Fenaroli) and **must distinguish ascending from descending**. Below are two defensible, citable standard versions for MAJOR plus the minor adjustments.

Design logic: **stable degrees 1, 5, 8 → root-position triad (5/3); mobile degrees 2,3,4,6,7 → sixth/seventh-inversion chords** whose dissonances resolve by step into the adjacent stable degree.

### 6a. MAJOR — Basic / skeletal version (teach first)

| Degree (bass) | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|
| Figure | 5/3 | 6 | 6 | 6 | 5/3 | 6 | 6 | 5/3 |

Rule: 5/3 on 1/5/8; `6` (=6/3) on everything else. **[VERDICT]:** degree 3 is a **first-inversion `6`**, NOT a root-position 5/3 — this is the single most common error to guard against.

### 6b. MAJOR — Fuller / Fenaroli version (Open Music Theory)

**Ascending (1→8):**

| Degree | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|
| Printed figure | 5/3 | **4/3** | 6 | **6/5** (with ♯4-type raise → 5) | 5/3 | 6 | **6/5** (on leading tone, dim 5th → 8) | 5/3 |
| Full form | 5/3 | 6/4/3 | 6/3 | 6/5/3 | 5/3 | 6/3 | 6/5/3 | 5/3 |

Maximally-dissonant chords fall on **degrees 4 and 7** — the steps just before stable 5 and 8.

**Descending (8→1):** **[VERDICT — directions differ; do not reuse ascending figures]**

| Degree | 8 | 7 | 6 | 5 | 4 | 3 | 2 | 1 |
|---|---|---|---|---|---|---|---|---|
| Printed figure | 5/3 | **6** *(plain, NOT 6/5)* | **4/2** with ♯4 | 5/3 | **4/2** (or 6/5 variant) | 6 | **4/3** | 5/3 |
| Full form | 5/3 | 6/3 | 6/4/2 (♯4) | 5/3 | 6/4/2 | 6/3 | 6/4/3 | 5/3 |

**[VERDICT — single most common error]:** descending degree 7 (when 7→6) uses a **plain `6`**, NOT `6/5`, because the diminished 5th cannot resolve. Hard-block `6/5` on descending 7.

Note: degree 2 is `4/3` (6/4/3) in Fenaroli but plain `6` in Scarlatti/Mozart versions — offer as a variant toggle if desired.

### 6c. MINOR — Fenaroli

Uses melodic-minor inflections: **degrees 6 & 7 raised ascending, lowered descending.**

**Ascending:**

| Degree | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|
| Figure | 5/3 | 6 | 6/4 *(region)* | 5/3 | 5/3 | 6 (♯6) | 6/5 (♯7=leading tone → 8) | 5/3 |

**Descending:**

| Degree | 8 | 7 | 6 | 5 | 4 | 3 | 2 | 1 |
|---|---|---|---|---|---|---|---|---|
| Figure | 5/3 | 6 (♭7) | **4/2 + ♯4 = augmented sixth** (against lowered bass 6) | 5/3 | 4/2 (or ♯4/♭3/6 variant) | 6 | 4/3 | 5/3 |

**[VERDICT]:** the descending-6 augmented-sixth color **requires the inner raised 4 (♯4) against the lowered bass 6** — omitting that accidental loses the characteristic sonority.

### 6d. Standard bass-motion / sequence patterns (generator-usable)

All figures below are the **printed** abbreviations.

**Descending-fifths (circle of 5ths):**
- Plain triads: alternating `5/3` throughout (root motion down a 5th / up a 4th).
- 7ths on alternate chords: `7` on alternate chords, `5/3` between.
- 7ths every chord (alternating complete/incomplete): `7` chain.
- Alternate inversion: alternating `5/3` and `6`.
- Inverted + 7th: alternating `5/3` and `6/5`.

**Descending 5–6 (= descending-thirds / "Pachelbel"):** stepwise descending bass, alternating `5/3` and `6` (figure pattern `5/3 – 6 – 5/3 – 6 …`). **[VERDICT]:** do **NOT** raise minor-key scale-degree 7 here (sequence leads away from tonic; use subtonic ♭7).

**Ascending 5–6:** stepwise ascending bass, two chords per bass note, alternating `5/3` and `6`. **[VERDICT]:** keep root-position diminished triads (iio/viio) off strong beats — invert or place weak.

**7–6 suspension chain:** stepwise descending bass; figure pattern `7–6 | 7–6 | 7–6`. Each `6` resolution prepares the next `7`. Realize 7/3 on the strong part, 6/3 on resolution.

**Ascending-fifths:** mostly root-position `5/3`; avoid diminished triad on a strong beat.

---

## 7. Visual / Engraving Conventions (readable on a small iPad)

### Stacking & placement
- One **vertical stack of small Arabic numerals**, placed in the gutter **directly BELOW the bass staff** (below the bottom line and below any ledger lines of low notes). Below-staff is the default for this app; never above.
- **Largest interval on top**, descending. `6`/`5`, `4`/`3`, `4`/`2`, `6`/`4`. **[VERDICT: confirmed]**
- **Top-aligned ("hanging"):** the top numeral's baseline sits at a fixed distance below the staff; additional figures hang downward. Multi-figure stacks grow down, not symmetrically. (Matches MuseScore/scholarly default.)
- Each stack **horizontally centered (or left-aligned) on its bass notehead** via `text-anchor: middle` so multi-digit growth stays centered.
- **No fraction bar / no slash between stacked digits** — they are simply stacked. The inline `/` is documentation-only.

### Size & spacing
- Figures **noticeably smaller than noteheads** — roughly **60–75% of notehead/staff-text height** (caption-number size). Oversized digits look like fingerings/tuplets — avoid.
- **Tight vertical gap** between stacked numerals (~¼ numeral height), consistent.
- Upright, slightly condensed numeral face.

### Accidentals
- Same small size; immediately **LEFT** of (or right of, by house style — pick one) the numeral, vertically centered on that numeral's row, edge-aligned so a column of accidentals forms a neat margin.
- Lone accidental occupies the row where a `3` would sit.
- Slash through digit = short diagonal stroke through the digit body (back-slash raise; forward-slash lower; special-case slashed-5 = diminished). `+` sits beside (upper-right). **For this app, prefer explicit `♯/♭/♮` glyphs** for unambiguous reading on small screens (see Section 3 recommendation).

### Suspensions / hold lines
- Suspension: two numerals on one row joined by a short dash at numeral mid-height; second numeral under the resolution beat.
- Hold line: thin horizontal extender at numeral mid-height; light weight; ends where the harmony changes.
- Cadential 6/4: two-row, two-column block (`6–5` over `4–3`), columns vertically aligned, both rows over one bass note.

### iPad-readability do's and don'ts
**Do:** generous tap targets if interactive; high contrast (figures should be as dark/legible as noteheads despite smaller size); reserve a fixed below-staff gutter so stacks never collide with the next system; align all stacks on a consistent baseline grid (a plain `6` and a `6/4` share the same top edge); keep horizontal spacing between bass notes wide enough that adjacent stacks don't touch.
**Avoid:** small number on top; oversized digits; figures above the staff; figures detached/misaligned from their note; rendering `/` as a literal slash; engraving a suspension as a vertical `4`-over-`3` stack (that's a chord); a slashed digit where a `/`-as-stacking was meant; thick/beam-like lines; uneven vertical gaps; stacks colliding with low ledger-line notes.

---

## 8. Datasets — What Exists and Usability

For a static JS web app. Note: **the app generates figures, so a dataset is optional** — useful for validating the generator, seeding exercises, or sourcing real bass lines.

| Dataset | Content | Formats | License | Usability |
|---|---|---|---|---|
| **BCFB / FiBaC** (Bach Chorales Figured Bass; Ju et al., ISMIR 2020) | **139 chorales with Bach's OWN figures** from the NBA, aligned to bass-note onset slices; 143 files (4 dupes) | MusicXML, Humdrum **kern, MEI + `reference_table.csv` | **CC BY 4.0 (commercial OK w/ attribution)** | **Best.** The only large openly-licensed corpus of real composer-authored figures aligned to bass. GitHub: `juyaolongpaul/Bach_chorale_FB`; Zenodo DOI 10.5281/zenodo.5084914. Uses NBA conventions: top-to-bottom stacks, **backslash-through-numeral = raised, forward-slash = lowered**, dash suspensions (`4-3`, `7-6`, `9-8`, `6-5`), continuation lines. **Use the human-encoded ground-truth files**, not the machine-generated ones (the latter use literal ♯/♭ and omit continuation lines). Dedupe via `reference_table.csv`. |
| **DCMLab/corelli** | 36 Corelli trio sonatas / 149 movements, thoroughbass figures throughout | MuseScore `.mscx` + Frictionless TSV | **CC BY-NC-SA 4.0 (NON-commercial)** | Larger continuo repertoire, but **do not ship in a commercial app.** Literal figures live in the `.mscx`; the harmonies TSV is DCML Roman-numeral labels, not figures. |
| **KernScores / CCARH** | 371 Bach chorales **kern (source of 109 BCFB chorales) | **kern | (varies) | Note source; figures only for the subset BCFB drew from. |
| **craigsapp/bach-370-chorales** | 371 chorales, **notes only** | **kern | — | **NO figures.** Clean note source only. |
| **When-in-Rome, DCMLab/ABC** | Roman-numeral functional analysis | RomanText + MusicXML / MuseScore | CC BY-SA / etc. | **Not figured bass.** Different question; convertible only with effort. |
| **BCMCL** | chord labels derived from BCFB | — | — | If you want chord labels rather than raw figures. |

**Parsing for static client-side use:** BCFB **MusicXML** → parse/render with **OpenSheetMusicDisplay**; BCFB ****kern** → render with **Verovio** in-browser (note: Verovio substitutes an underscore for **kern extension lines). Humdrum `**fb` syntax: stacked figures space-separated (`6 4` = 6-over-4), accidentals `#`/`n`/`-`(flat), `:` = suspension separator.

---

## 9. Recommended Browser Rendering Strategy

### Recommendation: **abcjs as primary, coordinate-overlay for special glyphs, VexFlow as the heavy fallback.**

Rationale: abcjs has **no native figured-bass feature**, but its annotation syntax yields clean stacking for free, which covers the majority of generated figures.

### Tier 1 — abcjs annotation trick (plain figures)

- ABC below-note annotation = quoted string prefixed `_`: `"_6"` places `6` below the next note.
- **ABC v2.1 standard: consecutive same-placement annotations auto-stack on separate lines, first-listed on TOP.** So `"_6""_4" C` renders `6` over `4` below C — **exactly figured-bass stacking (largest first/top), auto-aligned to the notehead, no coordinate math.**
- Render with `add_classes: true` so every element gets CSS classes; reserve a below-staff gutter with a disabled-fill `w:` (lyric) line so stacks don't collide with the next system.
- This handles: blank/`6`/`6/4`/`7`/`6/5`/`4/3`/`4/2`/`2`, and plain accidentals placed in the annotation text.

### Tier 2 — coordinate overlay (slashes, dashes, SMuFL, pixel-perfect)

For slashed numerals, suspension dashes/hold lines, true SMuFL glyphs, or exact control:

1. Render music with `add_classes: true`.
2. Get per-note pixel geometry two ways:
   - **`TimingCallbacks` `eventCallback`** → each note's `left/top/width/height` (SVG px) + `elements[]` DOM nodes + `startCharArray/endCharArray` + `measureNumber/line`.
   - **`add_classes` element classes** → `getBoundingClientRect()` on each notehead.
   - `clickListener(abcelem, …)` gives `startChar/endChar` to map a clicked notehead back to the ABC source (treat `abcelem` internals as unstable per docs).
3. Absolutely-position an HTML/SVG figure stack: `center x = notehead center x`, `top y = staff-bottom + constant`, `text-anchor: middle`.
4. **Re-read positions after every render** — abcjs `left/top` are relative to the SVG; convert to page coords (or position the overlay inside the same positioned container) before using `getBoundingClientRect` values. Never hard-code offsets that break on re-layout.

### Tier 3 — VexFlow (fully custom engraving)

Stronger for bespoke control:
- Stack `Annotation` modifiers with `setVerticalJustification(Annotation.VerticalJustify.BOTTOM)` per `StaveNote`; **but** known issues (#321/#292/#1469) misplace annotations under whole/beamed notes — test or self-position.
- Or query `StaveNote.getAbsoluteX()` / `getBoundingBox()` and draw your own stacked numerals, optionally with **Bravura SMuFL figured-bass glyphs (SMuFL block U+EA50–U+EA6F:** combining digits 0–9 with raise/lower inflection variants, accidentals, brackets, parentheses, `+`, combining raise U+EA6D / lower U+EA6E).

### Practical plan for the static iPad page
Render once with abcjs; use the `"_x""_y"` annotation trick for all plain figures; drop to the coordinate-overlay only for the minority of figures needing slashes, suspension dashes, hold lines, or cadential-6/4 two-row blocks. Keep figures small (Section 7), in a reserved below-staff gutter, centered under noteheads.

---

## Appendix — Generator Data Model (suggested)

```
Figure        = { number: int|null, accidental: '#'|'b'|'n'|null,
                  alteration: 'raise'|'lower'|null }   // alteration → slash/+ render
ChordFigure   = { stack: Figure[] (top→bottom), printed: string }   // e.g. "6/4"
BassEvent     = { bassPitch, beat, duration,
                  chordFigure | null,                    // null = root triad (blank)
                  suspension?: { rows: [{from:Figure, to:Figure}], holdBass:bool },
                  holdLine?: bool, tastoSolo?: bool }
```

**Generation invariants to assert in tests:** largest-on-top ordering; no `7` on inverted 7ths; `6/4` never collapsed; lone accidental ⇒ raised/altered 3rd; RotO degree 3 = `6` not `5/3`; descending RotO degree 7 = `6` not `6/5`; `2-3` never `3-2`; ascending vs. descending RotO use different figures; minor descending-6 carries ♯4; no raised minor-key ̂7 inside descending sequences.

---

Working directory `D:\OneDrive\1Documents\Claude Code\Figured bass` is currently empty — no spec files were written there per the task's "return findings directly, do not write .md files" instruction. The complete spec is the response above and is ready to drive code.