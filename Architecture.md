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
