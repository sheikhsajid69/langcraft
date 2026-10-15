# LangCraft - Product Requirements Document (PRD)

## 1. Executive Summary & Problem Statement
LangCraft is an enterprise-grade Indic DOCX-to-PDF conversion engine purpose-built to eradicate the notorious "tofu" bug (`□□□` / `.notdef` / replacement glyph corruption) across major Indian language scripts: **Hindi, Kannada, Telugu, Tamil, and Sanskrit**.

### The Root Cause of Indic PDF "Tofu"
Mainstream cloud DOCX-to-PDF converters (e.g., iLovePDF, Smallpdf, standard headless LibreOffice containers) fail consistently on Indic documents due to three compounding systemic failures:
1. **Missing Proprietary Windows Indic Fonts:** Microsoft Office authoring on Windows relies on proprietary typography:
   - *Hindi / Sanskrit:* Nirmala UI, Mangal, Kokila, Aparajita, Utsaah.
   - *Kannada:* Tunga, Kedage.
   - *Telugu:* Gautami, Vani, Pothana2000.
   - *Tamil:* Latha, Vijaya.
   Standard Linux server environments lack these licensed fonts and default to unshaped fallbacks or missing font glyph fallbacks (`.notdef`).
2. **Failure of Complex Text Layout (CTL) & OpenType Shaping (`GSUB` / `GPOS`):**
   Indic scripts are not linear left-to-right character sequences; they are syllabic abugidas requiring OpenType Complex Text Layout (CTL). Consonant clusters form conjuncts (*samyuktaksharas* / *ottaksharas* / *vattulu*), pre-base matras (such as Devanagari short-i `ि`, Tamil `ெ`) must visually precede the initial consonant, and above/below vowel signs must be precisely positioned via glyph substitution (`GSUB`) and glyph positioning (`GPOS`). When converters lack HarfBuzz or bypass OpenType tables, characters are decomposed into disconnected components and empty boxes (`.notdef`).
3. **Legacy ASCII-Encoded Font Corruption:**
   Millions of legacy legal, government, and educational documents across India were authored using 8-bit ASCII typewriter fonts (*Kruti Dev 010/020*, *Chanakya*, *Nudi 01e/Baraha*, *Bamini*). These fonts hijack ASCII code points (e.g., typing "k" to display "क"). Standard converters treat these as Latin characters or scramble them into incomprehensible gibberish.

---

## 2. Target Languages & Unicode Specifications

| Language | Primary Script | Unicode Blocks | Key Linguistic & CTL Characteristics | Target Normalization Fonts |
| :--- | :--- | :--- | :--- | :--- |
| **Hindi** | Devanagari | `U+0900–U+097F` | Half-forms, conjuncts (*ksha*, *tra*, *gya*), *reph* (`र्`), pre-base short-i (`ि`), *nukta* (`U+093C`). | `Noto Sans Devanagari` |
| **Sanskrit** | Devanagari + Vedic | `U+0900–U+097F`, `U+A8E0–U+A8FF`, `U+1CD0–U+1CFF` | Vedic svara accents (*udatta*, *anudatta*, *svarita*), complex samyuktaksharas (up to 4 consonants e.g., *kārtsnyam*), *visarga*, *anusvara*, *avagraha* (`ऽ`). | `Tiro Devanagari Sanskrit`, `Noto Sans Devanagari` |
| **Kannada** | Kannada | `U+0C80–U+0CFF` | Consonant conjuncts (*ottakshara* subjoined forms), *arkavattu* (reph `ರ್`), vowel signs with virama `\u0CCD`. | `Noto Sans Kannada` |
| **Telugu** | Telugu | `U+0C00–U+0C7F` | Complex subscript consonants (*vattulu*), *pollu* (virama `\u0C4D`), *vaddi* ligatures. | `Noto Sans Telugu` |
| **Tamil** | Tamil (+ Grantha) | `U+0B80–U+0BFF` | Pre-base vowel signs (`ெ`, `ே`, `ை`), two-part split vowels (`ொ`, `ோ`, `ௌ`), *pulli* (`்`), Grantha loan ligatures (`ஸ`, `ஷ`, `ஜ`, `ஹ`, `க்ஷ`, `ஸ்ரீ`). | `Noto Sans Tamil` |

---

## 3. User Experience & Conversion Workflow
LangCraft provides an intuitive, high-density Notion-style workspace:
1. **Drag-and-Drop Ingestion:**
   - Instant client/server pre-flight validation (Magic bytes, max 25 MB, Zip-Bomb prevention).
2. **Instant Pre-Flight Diagnostic Table:**
   - Immediate extraction and display of detected Unicode blocks, document scripts, legacy font signatures, and XML font declarations.
3. **Automated Font Normalization & Transcoding:**
   - Automatic rewriting of proprietary font references to canonical Google Noto OpenType fonts.
   - Transparent transcoding of legacy ASCII-mapped runs into canonical Unicode (NFC).
4. **HarfBuzz Complex Text Layout Rendering:**
   - PDF generation embedding OpenType CID subsets (`Identity-H`) with full `GSUB`/`GPOS` table execution.
5. **Zero-Tofu Post-Render Validation:**
   - Binary stream inspection of generated PDF verifying 0 replacement characters (`\uFFFD`) and zero unmapped `.notdef` glyph references.
6. **Side-by-Side Split View & Verified Download:**
   - Interactive split view: Document structure and live web font rendering on the left, high-fidelity generated PDF preview with verified status badge on the right.

---

## 4. Technical Constraints & Non-Functional Requirements
- **Performance:** End-to-end conversion within < 3 seconds for standard documents (< 20 pages).
- **Security:** Ephemeral zero-retention storage. No customer data persists on disk after stream completion. Memory limits enforced. DTD/XXE completely disabled.
- **Reliability:** 100% deterministic font embedding; standalone operation without external network dependencies during conversion.
- **Browser Compatibility:** Works across modern Evergreen browsers (Chrome, Edge, Firefox, Safari).
