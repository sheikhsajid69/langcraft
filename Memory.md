# LangCraft - Persistent Agent Context Log (`Memory.md`)

## 1. Project Initialization & Context
- **Date & Time:** 2026-10-15T20:29:45+05:30
- **Mission:** Autonomously architect, build, style, secure, test, and ship LangCraft (`https://github.com/sheikhsajid69/langcraft.git`).
- **Core Problem:** Eradicate Indic "tofu" boxes (`.notdef` / `\uFFFD`) in cloud DOCX-to-PDF rendering across Hindi, Kannada, Telugu, Tamil, and Sanskrit.
- **Root Causes Addressed:**
  1. Missing proprietary Windows Indic fonts (`Nirmala UI`, `Mangal`, `Tunga`, `Gautami`, `Latha`, `Kokila`).
  2. Bypassing HarfBuzz Complex Text Layout (CTL) shaping (`GSUB`/`GPOS` OpenType tables).
  3. Legacy non-Unicode ASCII-encoded fonts (`Kruti Dev`, `Chanakya`, `Nudi`, `Baraha`, `Bamini`).

---

## 2. Architectural Decisions & Key Baselines
- **Frontend / Framework:** Next.js (App Router, strict TypeScript), Tailwind CSS, Notion Design System tokens.
- **DOCX Ingestion:** Safe in-memory parsing with `jszip` and `fast-xml-parser` with DTD and entity expansion permanently disabled to neutralize XXE vulnerabilities.
- **Font Substitution Matrix:**
  - `Mangal`, `Nirmala UI`, `Kokila`, `Aparajita`, `Utsaah` -> `Noto Sans Devanagari` / `Tiro Devanagari Sanskrit`
  - `Tunga`, `Kedage` -> `Noto Sans Kannada`
  - `Gautami`, `Vani`, `Pothana2000` -> `Noto Sans Telugu`
  - `Latha`, `Vijaya` -> `Noto Sans Tamil`
- **PDF Engine & HarfBuzz:**
  - High-fidelity PDF rendering with full OpenType layout features (`kern`, `liga`, `clig`, `calt`, `pres`, `abvs`, `blws`, `psts`, `haln`).
  - Font subsetting with `Identity-H` CMap encoding.
  - Zero-Tofu stream verification: Automated post-render scan ensuring 0 `\uFFFD` and 0 `.notdef` corruptions.
- **Security Hardening:**
  - Magic-byte verification (`PK\x03\x04`).
  - Strict Zip-Bomb mitigation (max 25MB archive, max 100MB uncompressed, max 40:1 ratio, max 1,000 files).
  - Zip-Slip directory traversal defense.
  - Ephemeral zero-retention storage.

---

## 3. Phase Log & Gate Verifications

### [Phase 1: Perfect Blueprint Initialization]
- **Status:** COMPLETED
- **Artifacts Created:**
  - `PRD.md`: Full product requirements, language coverage, CTL requirements, workflow.
  - `Architecture.md`: Deep system design, AST parser, font matrix, dual-mode engine, stream validator.
  - `Rules.md`: Strict TypeScript standards, zero-tofu invariants, security constraints.
  - `Phases.md`: Granular checklist for Phases 1–5.
  - `Design.md`: Notion design tokens, layout specifications, component architecture.
  - `Memory.md`: Initialized context memory and architectural records.
- **Gate 1 Verification:** All 6 foundational markdown files confirmed created and populated.

### [Phase 2: Notion Design System & Frontend Workspace]
- **Status:** COMPLETED
- **Frontend Architecture & Components Implemented:**
  - `src/app/layout.tsx` & `src/app/globals.css`: Loaded Google Noto Sans Devanagari, Tiro Devanagari Sanskrit, Noto Sans Kannada, Noto Sans Telugu, and Noto Sans Tamil fonts with OpenType CTL font features (`kern`, `liga`, `clig`, `calt`, `pres`, `abvs`, `blws`, `psts`, `haln`).
  - `src/components/Sidebar.tsx`: Collapsible Notion sidebar with workspace branding, language filter pills, conversion history, and HarfBuzz CTL status indicator.
  - `src/components/Topbar.tsx`: Breadcrumb navigation, font registry trigger, theme toggle, and repository link.
  - `src/components/Dropzone.tsx`: Notion callout dropzone with client magic-byte pre-flight inspection and quick sample loader for all 5 Indic scripts.
  - `src/components/DiagnosticTable.tsx`: Notion database view presenting source fonts from `word/fontTable.xml`, target Noto fonts, script identification, and zero-tofu status.
  - `src/components/FontRegistryModal.tsx`: Interactive modal displaying the full 12-rule substitution matrix.
  - `src/components/PreviewSplitView.tsx`: Split-screen live preview with web font CTL rendering on the left and PDF vector output preview on the right.
  - `src/app/page.tsx`: Workspace orchestration with API integration and keyboard shortcuts (`Ctrl+\`).
- **Gate 2 Verification:** Strict TypeScript compilation (`npx tsc --noEmit`) succeeded with 0 errors.

### [Phase 3: Indic DOCX Parser, Legacy Transcoder & HarfBuzz PDF Engine]
- **Status:** COMPLETED
- **Backend Architecture & Modules Implemented:**
  - `src/lib/script-detector.ts`: Multi-script Unicode block classifier with Sanskrit vs. Hindi discriminator (evaluating Vedic accent ranges `U+1CD0-U+1CFF`, `U+A8E0-U+A8FF`, Avagraha `ऽ`, Visarga `ः`, Om `ॐ`, and virama density). Kannada ottaksharas & arkavattu detection; Telugu vattulu detection; Tamil Grantha & pulli detection.
  - `src/lib/legacy-transcoder.ts`: Transcoding engines for Kruti Dev 010/020, Chanakya, Bamini, and Nudi with pre-base short-i (`ि`) and post-positioned reph (`र्`) reordering into canonical Unicode NFC order.
  - `src/lib/docx-processor.ts`: Memory-only OOXML extraction, XML entity disabling, font rewriting (`<w:rFonts>` to Noto OpenType fonts), HTML AST generation, and synthetic multi-script sample DOCX generator (`createSampleDocx`).
  - `src/lib/pdf-engine.ts`: Vector PDF generator with OpenType CID font embedding, PDF document metadata, print-accurate CSS layout, and binary stream `tofuValidator` scanning for `\uFFFD` and `.notdef`.
  - `fonts.conf`: Linux OS-level Fontconfig substitution rules mapping Windows fonts directly to Noto Indic OpenType font paths.
  - `Dockerfile`: Multi-stage container definition with `libharfbuzz0b`, `libpango-1.0-0`, `fonts-noto-core`, `fonts-noto-extra`, and font cache initialization.
  - `src/app/api/convert/route.ts`: API endpoint with rate limiting, multipart OOXML handling, and GET sample generation.
- **Gate 3 Verification:** Clean compilation (`npx tsc --noEmit`) with 0 errors.

### [Phase 4: Security Hardening & Multi-Script Test Suite]
- **Status:** COMPLETED
- **Security & Test Coverage:**
  - `src/lib/security.ts`: Implemented PKZIP magic byte inspection (`0x50 0x4B 0x03 0x04`), Zip-Bomb defense (max 25MB archive, max 100MB uncompressed, max 40:1 ratio, max 1,000 files), Zip-Slip traversal defense, XXE entity & DTD blocking, and token-bucket IP rate limiting.
  - `next.config.mjs`: Strict Content Security Policy, nosniff, frame-options DENY, strict referrer policy.
  - `tests/indic-conversion.test.ts`:
    - TC-01 (Hindi Matras & Conjuncts): Mangal/Nirmala UI -> Noto Sans Devanagari, 0 tofu boxes (PASSED)
    - TC-02 (Sanskrit Samyuktaksharas & Vedic Marks): Kokila -> Tiro Devanagari Sanskrit, 0 tofu boxes (PASSED)
    - TC-03 (Kannada Ottaksharas & Arkavattu): Tunga -> Noto Sans Kannada, 0 tofu boxes (PASSED)
    - TC-04 (Telugu Vattulu & Pollu): Gautami -> Noto Sans Telugu, 0 tofu boxes (PASSED)
    - TC-05 (Tamil Uyirmei & Grantha Ligatures): Latha -> Noto Sans Tamil, 0 tofu boxes (PASSED)
    - TC-06 (Mixed 5-Script Polyglot DOCX): Tables with all 5 scripts simultaneously, 0 tofu boxes (PASSED)
    - TC-10 (Legacy Font Transcoding): Kruti Dev, Nudi, Bamini transcoding with short-i and reph reordering (PASSED)
  - `tests/security.test.ts`:
    - TC-07 (XXE Injection Defense): Malicious DOCTYPE / SYSTEM entities blocked with SecurityError (PASSED)
    - TC-08 (Zip-Bomb & Ratio Defense): Excessive entries and bomb ratios rejected (PASSED)
    - TC-09 (Magic-Byte Spoofing & Zip-Slip Defense): PE binary/script spoofing and path traversal blocked (PASSED)
    - Rate Limiting: Token bucket rate limiter enforced (PASSED)
- **Gate 4 Verification:** `npm test` executed with 11/11 tests passing (100% green assertions).

### [Phase 5: Final Audit & Ship to GitHub]
- **Status:** COMPLETED
- **Audit Verifications:**
  - Strict TypeScript Compilation (`npx tsc --noEmit`): 0 errors
  - Linter (`npm run lint`): 0 warnings, 0 errors
  - Vitest Test Suites (`npm test`): 2 files passed, 11 tests passed (100% green assertions)
  - Production Build (`npm run build`): Completed successfully (Next.js 14.2.35)
  - Blueprint Documentation: `PRD.md`, `Architecture.md`, `Rules.md`, `Phases.md`, `Design.md`, `Memory.md`, and comprehensive `README.md` verified.
  - Deployment Artifacts: `fonts.conf`, `Dockerfile` verified.
  - Secret & Hygiene: No secrets, `.gitignore` active.
- **Git Remote Target:** `https://github.com/sheikhsajid69/langcraft.git` on branch `main`.

### [Addendum: Professional Documentation & Apache 2.0 Licensing]
- **Date & Time:** 2026-10-15T20:49:15+05:30
- **Updates Completed:**
  - Added official [Apache License, Version 2.0](file:///c:/Users/Sajid/Downloads/LangCraft/LICENSE) (`LICENSE`).
  - Upgraded [README.md](file:///c:/Users/Sajid/Downloads/LangCraft/README.md) to enterprise-grade quality: comprehensive before/after visual breakdown of Indic `.notdef` tofu bug, Mermaid architecture flowchart, Notion workspace diagrams, complete Indic typography substitution matrix, security model, REST API documentation with `curl` examples, 10-case test matrix, and Docker/Fontconfig deployment guide.
  - Committed and pushed changes to GitHub `origin/main` (commit hash: `b63c381`).

### [Critical Hotfix: True 1:1 WYSIWYG DOCX-to-PDF Chromium HarfBuzz Pipeline]
- **Date & Time:** 2026-10-15T21:10:00+05:30
- **Problem Resolved:** Output PDF previously contained a 1-page diagnostic manifest instead of rendering the user's actual document pages (e.g., 1,802 paragraphs and 3 tables).
- **Architectural Fixes Implemented:**
  - **Rule 1 (Zero Diagnostic Watermarks):** Completely deleted diagnostic text and manifest tables from the generated PDF. All diagnostic stats are returned strictly via JSON inspection endpoints and response headers.
  - **Rule 2 (Stage A - OOXML Font Normalization in `src/lib/docx-processor.ts`):** In-memory parsing of `word/document.xml`, `word/styles.xml`, and `word/fontTable.xml` with `jszip`. Proprietary Windows Indic fonts (`Mangal`, `Nirmala UI`, `Aparajita`, `Utsaah`, `Kokila`, `Tunga`, `Gautami`, `Latha`, `Cambria Math`) rewritten to metric-compatible OpenType Google Noto fonts (`Noto Sans Devanagari`, `Noto Serif Devanagari`, `Noto Sans Kannada`, `Noto Sans Telugu`, `Noto Sans Tamil`, `Noto Sans Math`) while preserving all formatting, colors, bold, italics, page sizes (`<w:pgSz>`), margins (`<w:pgMar>`), tables, and embedded images (`word/media/*`).
  - **Rule 2 (Stage B - Headless Chromium HarfBuzz in `src/lib/pdf-engine.ts`):** Integrated `playwright` (Chromium) + `docx-preview`. Renders the normalized `.docx` buffer with full CSS OpenType feature settings (`font-feature-settings: "kern" 1, "liga" 1, "clig" 1, "calt" 1, "pres" 1, "abvs" 1, "blws" 1, "psts" 1, "haln" 1`), waits for web fonts and images, and outputs exact Word page-for-page vector PDF via `page.pdf({ printBackground: true, preferCSSPageSize: true })`.
  - **Rule 3 (Endpoint Separation):**
    - `POST /api/inspect`: Returns JSON metadata for the Notion UI table (scripts, paragraph counts, table counts, image counts, font substitutions).
    - `POST /api/convert`: Returns the pure, multi-page vector PDF binary matching Microsoft Word page-for-page with zero diagnostic watermarks.
  - **Rule 4 (Verification):** Added automated test TC-11 verifying that the output PDF contains 100% user document content and zero diagnostic manifest strings. All 12 test suites passing (100% green). Production build completed cleanly.

### [2026-10-16 Remediation Pass]
- Wired the Epic Elephant asset into public assets, metadata, workspace switcher, breadcrumb, and page header.
- Kept the existing Playwright + docx-preview document-only pipeline; zero print margins leave source section margin geometry to docx-preview.
- Removed external OOXML relationships during normalization and abort non-font browser egress.
- Tightened upload validation to PK 03 04 at the client and server boundary.
- Verification: npx tsc --noEmit, npm run lint, and npm test passed; 13 tests total.
- Git: commit 33595b1 was pushed to origin/main. A prior production build completed successfully; after the metadataBase warning fix, the repeat build reached ENOSPC writing Next's disposable cache because the host C: drive had no free space.

### [2026-10-21 Session Restart Recovery & Hardening]
- **Date & Time:** 2026-10-21T12:35:00+05:30
- **Context:** Server restarted; all previous subagents killed. Rolled-back codebase confirmed at commit `2e943e9`. Playwright Chromium verified operational. 13/13 tests passing.
- **Fixes Applied:**
  - `src/lib/security.ts`: `MAX_COMPRESSION_RATIO` corrected from 40 → **100** (real `.docx` files with large OOXML text tables can compress at ratios beyond 40:1, causing false zip-bomb rejections on legitimate documents).
  - Error message in `inspectZipArchive` updated to reference 100:1 threshold.
  - `src/components/DiagnosticTable.tsx`: Added Notion-authentic colored `SCRIPT_PILL` map with per-script colors — Hindi=amber `#CB912F`, Sanskrit=purple `#9065B0`, Kannada=yellow-orange `#C07926`, Telugu=blue `#337EA9`, Tamil=green `#448361`, Mixed=brown `#9F6B53`. Both the Primary Script meta pill and font-mapping table rows now use these Notion property colors.
  - Removed unused `Tag` and `Hash` Lucide imports.
- **Verification Gates (All Passed):**
  - `npx tsc --noEmit` → 0 errors ✅
  - `npm run lint` → No ESLint warnings or errors ✅
  - `npm test` → 13/13 passing (TC-01 to TC-11, 5 security tests) ✅
  - `npm run build` → Next.js 14.2.35 compiled successfully; 6 routes generated ✅
- **Known State:**
  - `src/lib/pdf-engine.ts` — Stage B Playwright + docx-preview WYSIWYG rendering confirmed working with zero diagnostic watermarks
  - `src/lib/docx-processor.ts` — Stage A OOXML font normalization confirmed correct with complete font substitution matrix
  - `public/Epic-Elephant-langcraft.png` — Logo wired to sidebar, topbar, page header (72px), layout metadata
  - All 6 blueprint files intact: `PRD.md`, `Architecture.md`, `Rules.md`, `Phases.md`, `Design.md`, `Memory.md`

---

### [2026-10-22 Layout Fidelity, Pagination & Metric-Exact Rendering Overhaul]
- **Date & Time:** 2026-10-22T23:25:00+05:30
- **Context:** User requested resolving all visual defects (BUG-01 through BUG-05) relating to page-break line slicing, margin clipping, lack of block justification, flattened footnote markers, font metric drift, and hanging indent loss.
- **Root Causes & Solutions Executed:**
  - **BUG-01 (Line Slicing & Margin Clipping):** Await `document.fonts.ready` before calling `docx.renderAsync()`. Render unclipped with `ignoreHeight: true`, `breakPages: false`, and apply exact native CSS `@page` margins from `w:pgMar`. Added CSS `page-break-inside: avoid; break-inside: avoid-page; orphans: 3; widows: 3;` on `p, li, blockquote, tr, img, figure`.
  - **BUG-02 (Ragged Right Edges):** Propagated `w:jc="both"` from default/Normal styles in `styles.xml` to `document.xml`. Normalized `w:jc="distribute"` to `both`. Enforced `text-align: justify; text-justify: inter-word;` via CSS and post-render DOM pass.
  - **BUG-03 (Footnote Superscript Flattening):** Enforced `<w:vertAlign w:val="superscript"/>` on `w:footnoteReference`, `w:endnoteReference`, and `FootnoteReference` styled runs. Enforced CSS `vertical-align: super !important; font-size: 0.68em !important; line-height: 0 !important;`.
  - **BUG-04 (Font Metric Drift):** Non-destructive font preservation. Extracted and de-obfuscated embedded fonts from `word/fonts/*.odttf` using ECMA-376 Part 2 §8.5.1 GUID XOR de-obfuscation (`deobfuscateODTTF`). Injected composite font stacks mapping serif vs. sans Indic typefaces accurately.
  - **BUG-05 (Numbered Bibliography & Indents):** Preserved `<w:ind>` (`w:left`, `w:hanging`, `w:firstLine`) and `<w:spacing>` without global margin/padding resets overriding docx-preview styling.
- **Verification Gates (All Passed):**
  - `npx tsc --noEmit` → 0 errors ✅
  - `npm run lint` → 0 warnings, 0 errors ✅
  - `npm test` → 19/19 passing (TC-01 through TC-11, 5 security tests, TC-LAYOUT-01 through TC-LAYOUT-05) ✅
  - `npm run build` → Next.js production build succeeded; 6 static/dynamic routes compiled cleanly ✅

---

### [2026-11-04 Ponytail Audit & Code Review Pass]
- **Date & Time:** 2026-11-04T21:05:00+05:30
- **Context:** User requested `/ponytail-review` of changes, `/ponytail-audit` of repository, and shipping changes to GitHub.
- **Remediations Executed:**
  - `package.json`: Pruned 4 completely unused packages (`@pdf-lib/fontkit`, `pdf-lib`, `clsx`, `tailwind-merge`).
  - `src/lib/pdf-engine.ts`: Cut speculative unused LibreOffice fallback and `child_process` import; cut unused `createPdfDocument` wrapper (-93 lines).
  - `src/lib/docx-processor.ts`: Cut unused `getCompositeFontStack` helper, removed dead `justifiedParagraphIndices` field, simplified `processDocxBuffer` alias (-20 lines).
  - `src/types/index.ts`: Cut unused `ConversionResponse` interface and `sha256` field (-10 lines).
  - `src/app/page.tsx`: Removed unused `AlertCircle` import.
- **Verification Gates (All Passed):**
  - `npx tsc --noEmit` → 0 errors ✅
  - `npm run lint` → 0 warnings, 0 errors ✅
  - `npm test` → 19/19 passing ✅
  - `npm run build` → Production build clean ✅

---

### [2026-11-05 Verbatim Unicode Character Fidelity & Anti-Orphan Headings Overhaul]
- **Date & Time:** 2026-11-05T22:10:00+05:30
- **Context:** TOON/1.0 prompt addressing forensic bugs FIX-01 through FIX-05 identified on the Maithilisharan Gupta academic paper ("23.मैथिलीशरण गुप्त के काव्य में नारी भावना").
- **Root Causes & Solutions Executed:**
  - **FIX-01 (Sequential Heading Order):** Replaced non-sequential text extraction with strict linear DOM order parsing. Main paper title ("23.मैथिलीशरण गुप्त के काव्य में नारी भावना") remains at index 0, followed by "1. प्रस्तावना :", without bucket-sorting headings.
  - **FIX-02 (Zero Text Mutation):** Introduced strict two-factor guard in `transcodeText()`. If text contains any valid Unicode Indic character (`[\u0900-\u0D7F]`), it is 100% untouched. Preserved all matras (मैथिलीशरण, अबला, प्राचीन कथा ओं), colons (:), pipes (|), and double dandas (॥) verbatim.
  - **FIX-03 (Single-Line Quotes):** Verified and enforced zero artificial line-break injection. Poetry quotes under "यशोधरा से:" and "साकेत से:" retain exact line integrity without punctuation-induced splits.
  - **FIX-04 (Anti-Orphan Headings):** Injected `break-after: avoid-page !important` and `data-keep-next="true"` on headings (`h1-h6`), `w:keepNext` elements, and colon-terminated subheadings ("उपसंहार :", "यशोधरा से:", "साकेत से:", "संदर्भ सूची:"), pinning them to the following paragraph.
  - **FIX-05 (Layout & Bibliography Fidelity):** Preserved 100% of OOXML paragraph properties (`w:pPr`), hanging indents (`w:ind`), justification (`w:jc`), and author block typography ("Syed Fiza...").
- **Test Suite:**
  - Created `tests/maithilisharan-fidelity.test.ts` covering TC-FIDELITY-01 to TC-FIDELITY-05.
- **Verification Gates (All Passed):**
  - `npx tsc --noEmit` → 0 errors ✅
  - `npm run lint` → 0 warnings, 0 errors ✅
  - `npm test` → 24/24 passing (4 test suites) ✅
  - `npm run build` → Production build succeeded cleanly ✅

---

### [2026-11-06 Mobile/Tablet Responsiveness, Logo Optimization & BiDi LTR Fidelity Overhaul]
- **Date & Time:** 2026-11-06T19:05:00+05:30
- **Context:** User requested full browser QA of `https://lc.sheikhsajid69.qzz.io`, fixing mobile/tablet layout breakouts, logo sizing issues, and testing end-to-end with `9557e827-50be-4f20-a0f4-12c4668b2aa5.docx`.
- **Root Causes & Solutions Executed:**
  - **Logo Memory Starvation:** Replaced 6.7 MB unoptimized PNG with 256x256 high-DPI logo (163 KB) and 64x64 favicon (11 KB). Configured `images: { unoptimized: true }` in `next.config.mjs` to eliminate on-demand sharp memory exhaustion timeouts. Added `object-contain` across Topbar, Header, Sidebar, and Footer.
  - **Mobile Sidebar Leaking & Horizontal Bleed:** In `src/components/Sidebar.tsx`, `w-0 -translate-x-full` calculated `-100% * 0 = 0px` translation, leaking footer text into viewport at x >= 0. Resolved by fixing drawer width to `w-64`, keeping `-translate-x-full` off-canvas, and applying `overflow-hidden`.
  - **Tablet Screen Squeeze (< 1024px):** Shifted breakpoint for docked desktop sidebar from 768px (`md`) to 1024px (`lg`). Tablet portrait (768px-820px) now renders canvas at full 100% width with a slide-out drawer instead of squeezing the workspace into 528px.
  - **Footer 3-Column Collision:** Updated `Footer.tsx` grid to `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8` with 3rd column spanning 2 on tablet, preventing developer profile links and typography specs from colliding.
  - **BiDi / RTL Parenthesis Reversal:** Sanitized `<w:rtl\s*\/?>` and `<w:bidi\s*\/?>` tags erroneously inserted by Microsoft Word in `word/document.xml` and `word/styles.xml`. Enforced `direction: ltr !important; unicode-bidi: normal !important;` in Chromium PDF shell. The author block `3rd year BSc (PMCs) (5th Sem)` now renders with 100% correct LTR ordering (no reversed `)PMCs( )5th Sem(3`).
  - **Google Fonts Unicode-Range Preloading:** Pre-loaded Indic unicode slices with sample text (`मैथिलीशरण गुप्त`, `संस्कृतम्`, `ಕನ್ನಡ`, `తెలుగు`, `தமிழ்`) via CSS Font Loading API, ensuring HarfBuzz and Skia have OpenType GSUB tables available.
- **Verification Gates (All Passed):**
  - Tested with `9557e827-50be-4f20-a0f4-12c4668b2aa5.docx` -> 2 pages exact, zero tofu, correct title at index 0, clean author block, non-orphaned `उपसंहार :`.
  - `npx tsc --noEmit` → 0 errors ✅
  - `npm test` → 24/24 passing (4 test suites) ✅
  - `npm run build` → Production build succeeded cleanly ✅
