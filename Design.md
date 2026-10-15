# LangCraft - Notion Design System Specification

## 1. Design Philosophy
The LangCraft interface embodies the clean, minimalist, information-dense aesthetic of **Notion**. The workspace prioritizes readability, typographic precision, and subtle micro-interactions while processing complex Indic documents.

---

## 2. Color Palette & Tokens

### Light Theme (Default Notion Canvas)
- **Canvas / Background:** `#FFFFFF`
- **Sidebar Background:** `#F7F6F3`
- **Active / Hover State:** `#EFEFED` / `rgba(55, 53, 47, 0.06)`
- **Primary Ink (Text):** `#37352F` (85% black equivalent)
- **Secondary Ink (Subtext):** `#787774`
- **Borders & Dividers:** `rgba(55, 53, 47, 0.09)` (1px hairline)
- **Notion Accent Blue:** `#2383E2` (link/focus states)
- **Success / Verified Green:** `#0F7B6C` (Zero-Tofu verified badge)
- **Warning / Legacy Amber:** `#D9730D` (Legacy font detected)
- **Destructive / Error Red:** `#E03E3E` (Corrupted/invalid upload)

### Dark Theme (Notion Dark Mode)
- **Canvas / Background:** `#191919`
- **Sidebar Background:** `#202020`
- **Active / Hover State:** `#2C2C2C`
- **Primary Ink (Text):** `#D4D4D4`
- **Secondary Ink (Subtext):** `#9B9B9B`
- **Borders & Dividers:** `rgba(255, 255, 255, 0.09)`
- **Success Green:** `#4DAB9A`
- **Warning Amber:** `#FFAB40`
- **Destructive Red:** `#FF6B6B`

---

## 3. Typography Hierarchy
- **System / UI Font:** Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
- **Indic Font Stack:**
  - Devanagari (Hindi): `"Noto Sans Devanagari"`, Mangal, Nirmala UI, sans-serif
  - Sanskrit: `"Tiro Devanagari Sanskrit"`, `"Noto Sans Devanagari"`, serif
  - Kannada: `"Noto Sans Kannada"`, Tunga, sans-serif
  - Telugu: `"Noto Sans Telugu"`, Gautami, sans-serif
  - Tamil: `"Noto Sans Tamil"`, Latha, sans-serif
- **Code & Diagnostic Mono:** ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace

---

## 4. UI Components

### 4.1 Collapsible Notion Sidebar
- Width: 260px (collapsible to 0px with toggle button `Ctrl+\`).
- Top: Workspace branding (`LangCraft` with icon `📜`).
- Navigation links:
  - Documents / Conversions
  - Script Registry (Hindi, Kannada, Telugu, Tamil, Sanskrit)
  - Font Mapping Matrix
  - Conversion History / Logs
- Bottom: Theme toggle, engine version (`v1.0.0-harfbuzz`), HarfBuzz status indicator (`● HarfBuzz CTL Active`).

### 4.2 Notion Breadcrumb Topbar
- Minimal header showing workspace path: `LangCraft / Converters / Indic DOCX Engine`.
- Right actions: View Font Matrix, GitHub link, Clear Workspace.

### 4.3 Notion Callout Dropzone
- Styled after Notion's callout box (`border: 1px solid rgba(55,53,47,0.09)`, background `#F7F6F3`, rounded-md).
- Visual cues: Drag-and-drop target, icon badge, file size limit indicator (25 MB max), allowed formats badge (`.docx` OOXML).
- Micro-interactions: Subtle scale on drag-over, instant pre-flight progress bar.

### 4.4 Notion Database Diagnostic View
- Rendered as an inline Notion Database / Table:
  - Columns: `Property`, `Detected Script`, `Original Font (fontTable.xml)`, `Mapped Noto Font`, `HarfBuzz CTL Status`, `Encoding Status`.
  - Badges: Script tags (`Devanagari [Hindi]`, `Kannada`, `Telugu`, `Tamil`, `Sanskrit [Vedic]`), Status tags (`Ready`, `Transcoded`, `Normalized`).

### 4.5 Split-Screen Live Preview & Export Bar
- Left Panel: Live HTML AST rendering with dynamically loaded Noto Indic web fonts, preserving document margins, headings, tables, and lists.
- Right Panel: Native PDF vector stream preview with zoom controls.
- Top Action Bar:
  - Status Badge: `🛡️ Verified Zero-Tofu (0 \uFFFD | 0 .notdef)`
  - Action Button: Notion-style primary button (`Download Verified PDF`).
