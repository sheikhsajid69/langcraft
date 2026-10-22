# LangCraft - System & Shaping Architecture

## 1. System Overview
LangCraft is designed around an in-memory, deterministic transformation pipeline that converts Microsoft Word OpenXML (`.docx`) archives into high-fidelity, HarfBuzz-shaped PDF vector documents with embedded OpenType fonts.

```
┌─────────────────┐       ┌────────────────────────┐       ┌────────────────────────┐
│  Upload .docx   │ ───>  │ Secure In-Memory ZIP   │ ───>  │  OOXML Fast Parser     │
│  Binary Stream  │       │ Verification & Defense │       │  (XXE / DTD Disabled)  │
└─────────────────┘       └────────────────────────┘       └────────────────────────┘
                                                                       │
                                                                       ▼
┌─────────────────┐       ┌────────────────────────┐       ┌────────────────────────┐
│ Verified PDF    │ <───  │ HarfBuzz Shaping &     │ <───  │ Script Detection &     │
│ Zero-Tofu Stream│       │ OpenType PDF Engine    │       │ Font Normalization AST │
└─────────────────┘       └────────────────────────┘       └────────────────────────┘
```

---

## 2. Core Modules & Pipelines

### 2.1 In-Memory DOCX XML Inspector (`src/lib/docx-processor.ts`)
- Utilizes `jszip` entirely in buffer memory without writing raw archives to disk.
- Parses three core OOXML parts:
  1. `word/document.xml`: Body paragraphs (`w:p`), tables (`w:tbl`), runs (`w:r`), text nodes (`w:t`), and run properties (`w:rPr`).
  2. `word/fontTable.xml`: Declared document fonts (`w:font`) and panose-1 signatures.
  3. `word/styles.xml`: Paragraph and character hierarchy styles.
- Sanitizes XML parsing using `fast-xml-parser` with entity expansion and DTD processing permanently disabled (`processEntities: false`, `allowBooleanAttributes: false`).

### 2.2 Script Detection & Linguistic Classifier (`src/lib/script-detector.ts`)
- Analyzes text runs across Unicode code point ranges:
  - **Devanagari (`U+0900–U+097F`)**: Checks for Hindi vs. Sanskrit features. Sanskrit is differentiated by the presence of Vedic accent blocks (`U+1CD0–U+1CFF`, `U+A8E0–U+A8FF`), high virama (`्` `U+094D`) cluster density (> 12% of consonant counts), Sanskrit punctuation (Avagraha `ऽ`, Visarga `ः`, Om `ॐ`, anusvara/chandrabindu markers).
  - **Kannada (`U+0C80–U+0CFF`)**: Detects consonant clusters with virama (`್` `U+0CCD`), *ottakshara* subjoined forms, and *arkavattu* (`ರ್`).
  - **Telugu (`U+0C00–U+0C7F`)**: Identifies subscript consonant markers (*vattulu*) via virama (`్` `U+0C4D`), *pollu*, and compound vowel signs.
  - **Tamil (`U+0B80–U+0BFF`)**: Distinguishes pre-base vowel signs (`ெ`, `ே`, `ை`), *pulli* (`்`), and Grantha loan ligatures (`க்ஷ`, `ஸ்ரீ`, `ஸ`, `ஷ`, `ஜ`, `ஹ`).

### 2.3 Legacy ASCII-to-Unicode Transcoding Engine (`src/lib/legacy-transcoder.ts`)
- Identifies legacy font signatures in font definitions and runs:
  - Hindi: `Kruti Dev 010`, `Kruti Dev 011`, `Chanakya`, `Walkman-Chanakya`.
  - Kannada: `Nudi 01e`, `Nudi 05e`, `Baraha`.
  - Tamil: `Bamini`, `Kaveri`.
- Executes deterministic glyph-to-Unicode mapping tables.
- Reorders pre-base glyphs (such as Kruti Dev `f` representing Devanagari short-i `ि`) after the consonant base, and shifts post-positioned reph glyphs (`z`) to their logical pre-consonant Unicode order (`U+0930 + U+094D`).
- Applies standard Unicode Normalization Form C (`NFC`).

### 2.4 Font Substitution Matrix & OpenType Mapping
```
Proprietary Windows Font                Target OpenType Noto / Tiro Font
──────────────────────────────────────────────────────────────────────────
Nirmala UI (Devanagari)       ────>    Noto Sans Devanagari (wght: 400, 700)
Mangal                        ────>    Noto Sans Devanagari
Kokila                        ────>    Noto Sans Devanagari / Tiro Devanagari Sanskrit
Aparajita                     ────>    Noto Sans Devanagari
Utsaah                        ────>    Noto Sans Devanagari
Tunga                         ────>    Noto Sans Kannada (wght: 400, 700)
Kedage                        ────>    Noto Sans Kannada
Gautami                       ────>    Noto Sans Telugu (wght: 400, 700)
Vani                          ────>    Noto Sans Telugu
Pothana2000                   ────>    Noto Sans Telugu
Latha                         ────>    Noto Sans Tamil (wght: 400, 700)
Vijaya                        ────>    Noto Sans Tamil
```

### 2.5 Dual-Mode Rendering & HarfBuzz Shaping Engine
1. **Primary Node.js / Headless Engine (`src/lib/pdf-engine.ts`):**
   - Synthesizes an HTML5/CSS3 print template with pre-injected WOFF2/TTF web fonts for all five target scripts.
   - Activates CSS OpenType features:
     ```css
     font-feature-settings: "kern" 1, "liga" 1, "clig" 1, "calt" 1, "pres" 1, "abvs" 1, "blws" 1, "psts" 1, "haln" 1;
     text-rendering: optimizeLegibility;
     -webkit-font-smoothing: antialiased;
     ```
   - Invokes headless rendering engine (Playwright / Chromium with native HarfBuzz complex text layout shaper) to print-to-PDF with PDF/A compliance and embedded subsetted CID fonts (`Identity-H`).
2. **Container Mode (`Dockerfile` & `fonts.conf`):**
   - Pre-installs Linux HarfBuzz runtime libraries (`libharfbuzz0b`, `libpango-1.0-0`, `fonts-noto-core`, `fonts-noto-extra`).
   - Custom `/etc/fonts/fonts.conf` redirects all font requests for `Mangal`, `Nirmala UI`, `Tunga`, `Gautami`, `Latha` directly to `/usr/share/fonts/truetype/noto/`.

### 2.6 Zero-Tofu Stream Validator (`tofuValidator`)
- Examines generated PDF binary streams:
  - Scans for Unicode replacement characters (`\uFFFD`).
  - Verifies `/ToUnicode` CMap streams in embedded fonts.
  - Checks for non-rendered `.notdef` character fallback sequences.
  - Confirms embedded font subset dictionaries exist for each script detected in the source OOXML document.

---

## 3. Rendering and Egress Boundary — 2026-10-16

POST /api/inspect returns diagnostics only. POST /api/convert returns Chromium PDF bytes directly; it never creates a diagnostic page. Playwright permits only Google font hosts, while normalized OOXML has no external relationships.

---

## 4. Layout Fidelity, Page Geometry & Typography Engine Upgrades — 2026-10-22

### 4.1 Page Geometry & Native CSS @page Print Margins
- Extracts exact dimensions from `<w:sectPr>`:
  - Width: `w:pgSz[@w:w] / 1440` (default 8.268in for A4)
  - Height: `w:pgSz[@w:h] / 1440` (default 11.693in for A4)
  - Margins: `w:pgMar[@w:top] / 1440`, `w:pgMar[@w:bottom] / 1440`, `w:pgMar[@w:left] / 1440`, `w:pgMar[@w:right] / 1440` (default 1.000in)
- Injects native CSS `@page` margin rules matching Word geometry exactly.
- Resets `.docx-wrapper, section.docx` to `padding: 0 !important; margin: 0 !important; height: auto !important; overflow: visible !important;` so section boundaries never conflict with `@page` print margins or clip text lines.

### 4.2 Horizontal Line Slicing Elimination Across Page Breaks
- Calls `docx.renderAsync()` with `ignoreHeight: true` and `breakPages: false` to stop `docx-preview` from generating artificial fixed-height DOM containers.
- Enforces CSS page-break rules:
  ```css
  p, li, blockquote, tr, img, figure {
    page-break-inside: avoid;
    break-inside: avoid-page;
    orphans: 3;
    widows: 3;
  }
  h1, h2, h3, h4, h5, h6 {
    page-break-after: avoid;
    break-after: avoid-page;
    page-break-inside: avoid;
    break-inside: avoid-page;
  }
  ```
- Native Chromium print pagination cleanly moves lines to the next page instead of horizontally slicing text across page boundaries.

### 4.3 Embedded Font Extraction & ECMA-376 ODTTF De-obfuscation
- Scans `word/fonts/*.odttf` and `word/fonts/*.ttf`.
- For obfuscated `.odttf` fonts, maps `w:fontKey` GUIDs from `word/fontTable.xml` and relationships from `word/_rels/fontTable.xml.rels`.
- Executes ECMA-376 Part 2 §8.5.1 de-obfuscation: parses 32-character GUID into 16 bytes, reverses byte order, and XORs the first 32 bytes of the font binary to recover the raw TrueType/OpenType font stream.
- Injects recovered fonts directly as Base64 `@font-face` rules into the rendering page.

### 4.4 Non-Destructive Composite Font Stacks
- Preserves original font names in `<w:rFonts>` first in stack, followed by metric-matched Google Noto OpenType fonts.
- Composite font stacks map serif vs. sans Indic typefaces accurately:
  - `Mangal`, `Nirmala UI`, `Aparajita`, `Utsaah` -> `"Mangal", "Nirmala UI", "Noto Sans Devanagari", sans-serif`
  - `Kokila`, `Siddhanta`, `Sanskrit 2003`, `Chandas` -> `"Kokila", "Siddhanta", "Noto Serif Devanagari", "Tiro Devanagari Sanskrit", serif`
  - `Tunga`, `Kedage` -> `"Tunga", "Noto Sans Kannada", sans-serif`
  - `Gautami`, `Vani` -> `"Gautami", "Noto Sans Telugu", sans-serif`
  - `Latha`, `Vijaya` -> `"Latha", "Noto Sans Tamil", sans-serif`

### 4.5 Block Justification & Superscript Fidelity
- Propagates default paragraph justification (`w:jc="both"` or `"distribute"`) from `styles.xml` into `document.xml` paragraphs that lack explicit alignment.
- Normalizes `w:jc="distribute"` to `w:jc="both"` so `docx-preview` generates `text-align: justify`.
- Enforces `text-justify: inter-word;` on justified blocks.
- Wraps footnote reference runs (`FootnoteReference` / `w:footnoteReference`) and `<w:vertAlign w:val="superscript"/>` runs with `vertical-align: super !important; font-size: 0.68em !important; line-height: 0 !important;` to ensure footnote indices never flatten into inline numbers.
