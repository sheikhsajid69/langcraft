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
