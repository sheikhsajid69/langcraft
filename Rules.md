# LangCraft - Engineering, Typography & Security Rules

## 1. Engineering Invariants & Code Standards
1. **Strict TypeScript Standards:**
   - Compiler options must enforce `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`, and `"noUncheckedIndexedAccess": true`.
   - Never use `any` unless strictly bridging untyped 3rd-party library internals (which must immediately be cast to typed schemas).
2. **Zero Placeholder Policy:**
   - No `// TODO`, `// FIXME`, `// implement later`, or mock placeholder stubs for core conversion, parsing, or security logic.
   - All modules must be fully functional, test-covered implementations.
3. **Continuous Execution Protocol:**
   - Autonomous execution across Phases 1 to 5 without pausing for human permission.
   - Self-healing gate verification at the end of each phase.
4. **State Tracking Integrity:**
   - `Phases.md` must be updated with `[x]` upon completing every milestone.
   - `Memory.md` must record timestamped engineering rationale, architectural decisions, and verification outputs.

---

## 2. Indic Typography Invariants (The "Zero-Tofu" Rule)
1. **Embedded OpenType Font Subsets:**
   - Every converted PDF must embed OpenType CID fonts utilizing `Identity-H` encoding.
   - Fonts must contain complete GSUB (Glyph Substitution) and GPOS (Glyph Positioning) tables for the active Indic script.
2. **Zero Replacement Glyphs:**
   - The generated PDF must contain zero instances of Unicode replacement character (`\uFFFD`).
   - Zero missing glyph `.notdef` index references in the target script text streams.
3. **NFC Normalization Pre-Shaping:**
   - All extracted text runs and transcoded legacy runs must be normalized via `String.prototype.normalize('NFC')` prior to HTML injection or PDF shaping.
4. **Accurate Virama / Matra Ordering:**
   - Under no circumstances shall pre-base matras (e.g., Devanagari short-i `ि`, Tamil `ெ`) appear detached or separated from their base consonant.
   - Conjuncts (*ksha*, *shree*, *ottakshara*, *vattulu*) must be rendered as unified ligatures, not broken characters.

---

## 3. Security Invariants
1. **ZIP Magic-Byte Enforcement:**
   - Every uploaded document must begin with valid PKZIP signature bytes `0x50 0x4B 0x03 0x04`.
   - Disguised PE binaries, scripts, or non-ZIP containers must be immediately rejected with an HTTP 400 error.
2. **Zip-Bomb & Resource Quotas:**
   - Maximum upload file size: 25 MB.
   - Maximum uncompressed payload: 100 MB.
   - Maximum compression ratio: 40:1.
   - Maximum ZIP entries: 1,000 files.
3. **Zip-Slip Directory Traversal Defense:**
   - Archive entry paths must be strictly checked: any entry containing `..`, leading slashes `/` or `\`, or drive prefixes (e.g. `C:`) must cause instant rejection.
4. **XXE & SSRF Elimination:**
   - All XML parsing must disable DTD evaluation and external entity expansion (`<!DOCTYPE`, `<!ENTITY`, `SYSTEM`, `PUBLIC`).
   - Any external references in `word/_rels/*.rels` pointing outside the document package must be stripped or ignored.
5. **Ephemeral Storage & Privacy:**
   - Zero data retention. Conversion takes place in-memory or in UUID-scoped temporary workspaces that are unconditionally cleaned up in a `finally` block.
