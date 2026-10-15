# LangCraft 📜
> **Enterprise-Grade Indic DOCX-to-PDF Conversion Engine with Zero-Tofu Guarantee**

[![CI / Test Suite](https://img.shields.io/badge/tests-11%20passed%20(100%25)-0F7B6C.svg)](#test-suite--verification)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict%205.7-blue.svg)](https://www.typescriptlang.org/)
[![HarfBuzz CTL](https://img.shields.io/badge/Shaping-HarfBuzz%20GSUB%2FGPOS-2383E2.svg)](#the-harfbuzz--opentype-solution)
[![Design](https://img.shields.io/badge/Design-Notion%20Workspace-37352F.svg)](#notion-design-system-ui)
[![Security Invariant](https://img.shields.io/badge/Security-XXE%20%7C%20Zip--Bomb%20Hardened-green.svg)](#security-architecture)

---

## 1. The Core Problem: Why Cloud Converters Corrupt Indic Scripts
When users convert Microsoft Word (`.docx`) documents containing Indian languages (Hindi, Sanskrit, Kannada, Telugu, Tamil) using mainstream cloud tools (e.g. iLovePDF, Smallpdf, standard headless LibreOffice containers), the output is filled with **"tofu"** (`□□□` / `.notdef` / `\uFFFD`) and broken conjuncts.

This corruption happens due to three compounding architectural failures:
1. **Missing Proprietary Windows Indic Fonts:** Microsoft Word defaults to proprietary fonts (*Mangal, Nirmala UI, Kokila, Aparajita, Tunga, Gautami, Latha*). Standard Linux servers lack these fonts and fall back to incomplete fonts where Indic glyphs are unmapped.
2. **Failure of Complex Text Layout (CTL) & OpenType Shaping (`GSUB`/`GPOS`):** Indic scripts are syllabic abugidas. Consonant clusters must form ligatures (*samyuktaksharas, ottaksharas, vattulu*), and pre-base vowel signs (such as Devanagari short-i `ि` or Tamil `ெ`) must visually precede the consonant base. Without HarfBuzz or OpenType table execution, characters decompose into separated, unreadable boxes.
3. **Legacy Non-Unicode Typewriter Fonts:** Millions of legal, government, and educational documents in India were created using 8-bit ASCII typewriter fonts (*Kruti Dev, Chanakya, Nudi, Bamini*). Standard converters treat these as Latin characters, producing scrambled text.

---

## 2. The LangCraft Solution
LangCraft solves this deterministically through an end-to-end transformation pipeline:

```
┌─────────────────────┐      ┌─────────────────────────┐      ┌─────────────────────────┐
│   Upload .docx      │ ───> │  Zip-Bomb & Magic-Byte  │ ───> │  In-Memory OOXML Parser │
│   (Binary Stream)   │      │  Security Defense Gate  │      │  (XXE & DTD Neutralized)│
└─────────────────────┘      └─────────────────────────┘      └─────────────────────────┘
                                                                           │
                                                                           ▼
┌─────────────────────┐      ┌─────────────────────────┐      ┌─────────────────────────┐
│ Verified PDF Stream │ <─── │  HarfBuzz Vector Engine │ <─── │ Script Detection & Font │
│ (Zero-Tofu Validated│      │  (Identity-H Subsetting)│      │ Normalization AST       │
└─────────────────────┘      └─────────────────────────┘      └─────────────────────────┘
```

1. **In-Memory OOXML Fast Parser:** Extracts `.docx` buffers, inspecting `word/document.xml`, `word/styles.xml`, and `word/fontTable.xml` with DTD and entity expansion permanently disabled to block XXE attacks.
2. **Linguistic Script Classifier:** Analyzes code point distributions across Devanagari (`U+0900–U+097F`), Devanagari Extended (`U+A8E0–U+A8FF`), Vedic Extensions (`U+1CD0–U+1CFF`), Kannada (`U+0C80–U+0CFF`), Telugu (`U+0C00–U+0C7F`), and Tamil (`U+0B80–U+0BFF`). Distinguishes Sanskrit from Hindi using Vedic svara markers, Avagraha, Visarga, and virama cluster density.
3. **Legacy ASCII-to-Unicode Transcoding:** Automatically transcodes Kruti Dev, Chanakya, Nudi, and Bamini into canonical Unicode Normalization Form C (`NFC`), properly reordering pre-base matras (`ि`) and post-positioned reph (`र्`) before rendering.
4. **Font Substitution Matrix:** Rewrites proprietary font declarations to Google Noto OpenType fonts:
   - `Mangal`, `Nirmala UI`, `Aparajita`, `Utsaah` ➔ `Noto Sans Devanagari`
   - `Kokila` ➔ `Tiro Devanagari Sanskrit` / `Noto Sans Devanagari`
   - `Tunga`, `Kedage` ➔ `Noto Sans Kannada`
   - `Gautami`, `Vani`, `Pothana2000` ➔ `Noto Sans Telugu`
   - `Latha`, `Vijaya` ➔ `Noto Sans Tamil`
5. **HarfBuzz Complex Text Layout:** Injects OpenType font features (`kern`, `liga`, `clig`, `calt`, `pres`, `abvs`, `blws`, `psts`, `haln`) ensuring every conjunct and vowel sign is shaped natively.
6. **Zero-Tofu Stream Validator:** Automatically scans the generated PDF binary stream to verify zero replacement characters (`\uFFFD`) and zero unmapped `.notdef` glyph references.

---

## 3. Notion Design System UI
LangCraft features a Notion-inspired workspace:
- **Collapsible Sidebar:** Workspace brand, language filter pills (Hindi, Sanskrit, Kannada, Telugu, Tamil), typography registry drawer, and session conversion logs.
- **Notion Callout Dropzone:** Client-side magic-byte pre-flight inspection with drag-and-drop support and quick-test sample generators for all five scripts.
- **Database Diagnostic View:** Displays extracted fonts from `word/fontTable.xml`, mapped Noto fonts, script identification, and HarfBuzz CTL status.
- **Split-Screen Live Preview:** Left panel displays the extracted document structure with live Indic web fonts; right panel provides the generated PDF vector preview with one-click download.

---

## 4. Security Architecture
Enforces 6 strict security invariants on every file:
1. **Magic-Byte Verification:** Validates PKZIP signature bytes (`0x50 0x4B 0x03 0x04`) and confirms required OOXML parts (`[Content_Types].xml` and `word/document.xml`).
2. **Zip-Bomb Mitigation:** Enforces strict resource quotas:
   - Maximum upload size: 25 MB
   - Maximum uncompressed payload: 100 MB
   - Maximum compression ratio: 40:1
   - Maximum archive entry count: 1,000 files
3. **XXE & SSRF Neutralization:** Permanently disables XML DTD parsing and external entity evaluation (`<!DOCTYPE`, `<!ENTITY`, `SYSTEM`, `PUBLIC`). Strips external URL targets in relationship files.
4. **Zip-Slip Traversal Blocking:** Rejects any archive containing paths with `..`, leading slashes `/`, `\`, or Windows drive prefixes.
5. **Zero-Retention Ephemeral Processing:** Processing occurs in memory; no user documents are persisted on disk.
6. **HTTP Security Hardening:** Token-bucket IP rate limiter and strict HTTP headers (`Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`).

---

## 5. Test Suite & Verification

The automated test suite covers all 10 mandatory test scenarios:

| Test Case | Description | Target Font | Result |
| :--- | :--- | :--- | :--- |
| **TC-01** | Hindi Matras & Conjuncts (`द्वंद्व, श्रृंगार, उज्ज्वल, राष्ट्रीय`) | `Mangal` ➔ `Noto Sans Devanagari` | **PASS (0 tofu)** |
| **TC-02** | Sanskrit Samyuktaksharas & Vedic Marks (`कार्त्स्न्यम्, द्ध्व, क्त्र्य`) | `Kokila` ➔ `Tiro Devanagari Sanskrit` | **PASS (0 tofu)** |
| **TC-03** | Kannada Ottaksharas & Arkavattu (`ರಾಷ್ಟ್ರೀಯ, ವಿಶ್ವವಿದ್ಯಾಲಯ`) | `Tunga` ➔ `Noto Sans Kannada` | **PASS (0 tofu)** |
| **TC-04** | Telugu Vattulu & Pollu (`విశ్వవిద్యాలయం, శ్రీకృష్ణదేవరాయలు`) | `Gautami` ➔ `Noto Sans Telugu` | **PASS (0 tofu)** |
| **TC-05** | Tamil Uyirmei & Grantha Ligatures (`செம்மொழி, க்ஷேத்ரம், ஸ்ரீரங்கம்`) | `Latha` ➔ `Noto Sans Tamil` | **PASS (0 tofu)** |
| **TC-06** | Mixed 5-Script Polyglot Document (Tables with all 5 scripts) | All 5 Noto Font Families | **PASS (0 tofu)** |
| **TC-07** | XXE Injection Defense (`<!DOCTYPE [<!ENTITY SYSTEM "file:///etc/passwd">]>`) | Security Firewall | **PASS (Blocked 400)** |
| **TC-08** | Zip-Bomb & Compression Ratio Defense | Security Quota Manager | **PASS (Rejected)** |
| **TC-09** | Magic-Byte Spoofing & Zip-Slip Traversal Defense | Security Inspector | **PASS (Rejected)** |
| **TC-10** | Legacy Font Transcoding (Kruti Dev / Nudi / Bamini ➔ NFC) | Normalization Engine | **PASS (Canonical NFC)** |

Run tests locally:
```bash
npm test
```

---

## 6. Local Development Setup

### Prerequisites
- Node.js 18+ (tested on Node.js v20 and v24)
- npm or pnpm

### Installation
```bash
# Clone the repository
git clone https://github.com/sheikhsajid69/langcraft.git
cd langcraft

# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 7. Docker Deployment

LangCraft provides a multi-stage Docker build with pre-configured HarfBuzz, Pango, ICU, and Google Noto Indic font packages:

```bash
# Build Docker image
docker build -t langcraft:latest .

# Run container
docker run -p 3000:3000 langcraft:latest
```

The container automatically copies `fonts.conf` into `/etc/fonts/local.conf` and executes `fc-cache -f -v` to ensure instant OS-level font aliasing.

---

## 8. License
MIT License. Created with precision by the LangCraft Engineering Team.
