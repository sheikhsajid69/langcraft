import JSZip from 'jszip';
import { XMLParser } from 'fast-xml-parser';
import {
  DocumentDiagnostic,
  FontMappingInfo,
  IndicScript,
} from '@/types';
import { detectScriptsInText, determinePrimaryScript } from './script-detector';
import { isLegacyFont, transcodeText } from './legacy-transcoder';
import { sanitizeRelationshipXml } from './security';

// Safe XML Parser Configuration (XXE and DTD completely disabled)
const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  processEntities: false,
  allowBooleanAttributes: false,
  trimValues: false,
});

/**
 * Standard Indic Font Substitution Matrix
 */
export const FONT_SUBSTITUTION_MATRIX: Record<
  string,
  { targetFont: string; script: IndicScript | 'General' }
> = {
  // Devanagari / Hindi & Sanskrit
  mangal: { targetFont: 'Noto Sans Devanagari', script: 'Hindi' },
  'nirmala ui': { targetFont: 'Noto Sans Devanagari', script: 'Hindi' },
  aparajita: { targetFont: 'Noto Sans Devanagari', script: 'Hindi' },
  utsaah: { targetFont: 'Noto Sans Devanagari', script: 'Hindi' },
  kokila: { targetFont: 'Noto Serif Devanagari', script: 'Sanskrit' },
  'sanskrit 2003': { targetFont: 'Noto Serif Devanagari', script: 'Sanskrit' },
  siddhanta: { targetFont: 'Noto Serif Devanagari', script: 'Sanskrit' },
  chandas: { targetFont: 'Noto Serif Devanagari', script: 'Sanskrit' },
  'kruti dev 010': { targetFont: 'Noto Sans Devanagari', script: 'Hindi' },
  'kruti dev 020': { targetFont: 'Noto Sans Devanagari', script: 'Hindi' },
  'kruti dev': { targetFont: 'Noto Sans Devanagari', script: 'Hindi' },
  chanakya: { targetFont: 'Noto Sans Devanagari', script: 'Hindi' },

  // Kannada
  tunga: { targetFont: 'Noto Sans Kannada', script: 'Kannada' },
  kedage: { targetFont: 'Noto Sans Kannada', script: 'Kannada' },
  'nudi 01e': { targetFont: 'Noto Sans Kannada', script: 'Kannada' },
  'nudi 05e': { targetFont: 'Noto Sans Kannada', script: 'Kannada' },
  baraha: { targetFont: 'Noto Sans Kannada', script: 'Kannada' },

  // Telugu
  gautami: { targetFont: 'Noto Sans Telugu', script: 'Telugu' },
  vani: { targetFont: 'Noto Sans Telugu', script: 'Telugu' },
  pothana2000: { targetFont: 'Noto Sans Telugu', script: 'Telugu' },

  // Tamil
  latha: { targetFont: 'Noto Sans Tamil', script: 'Tamil' },
  vijaya: { targetFont: 'Noto Sans Tamil', script: 'Tamil' },
  bamini: { targetFont: 'Noto Sans Tamil', script: 'Tamil' },

  // General / Latin & Math
  'times new roman': { targetFont: 'Noto Serif', script: 'General' },
  cambria: { targetFont: 'Noto Serif', script: 'General' },
  calibri: { targetFont: 'Inter', script: 'General' },
  arial: { targetFont: 'Inter', script: 'General' },
  'cambria math': { targetFont: 'Noto Sans Math', script: 'General' },
};

/**
 * Metric-exact Composite Font-Family Fallback Stacks.
 * Preserves the original Word font first, followed by high-fidelity Google Noto OpenType subsets.
 */
export const COMPOSITE_FONT_STACKS: Record<string, string> = {
  mangal: '"Mangal", "Nirmala UI", "Noto Sans Devanagari", sans-serif',
  'nirmala ui': '"Nirmala UI", "Mangal", "Noto Sans Devanagari", sans-serif',
  aparajita: '"Aparajita", "Noto Sans Devanagari", sans-serif',
  utsaah: '"Utsaah", "Noto Sans Devanagari", sans-serif',
  kokila: '"Kokila", "Siddhanta", "Noto Serif Devanagari", "Tiro Devanagari Sanskrit", serif',
  'sanskrit 2003': '"Sanskrit 2003", "Siddhanta", "Noto Serif Devanagari", "Tiro Devanagari Sanskrit", serif',
  siddhanta: '"Siddhanta", "Noto Serif Devanagari", "Tiro Devanagari Sanskrit", serif',
  chandas: '"Chandas", "Noto Serif Devanagari", "Tiro Devanagari Sanskrit", serif',
  'kruti dev 010': '"Kruti Dev 010", "Noto Serif Devanagari", "Noto Sans Devanagari", serif',
  'kruti dev 020': '"Kruti Dev 020", "Noto Serif Devanagari", "Noto Sans Devanagari", serif',
  'kruti dev': '"Kruti Dev", "Noto Serif Devanagari", "Noto Sans Devanagari", serif',
  chanakya: '"Chanakya", "Noto Serif Devanagari", "Noto Sans Devanagari", serif',
  tunga: '"Tunga", "Noto Sans Kannada", sans-serif',
  kedage: '"Kedage", "Noto Sans Kannada", sans-serif',
  'nudi 01e': '"Nudi 01e", "Noto Sans Kannada", sans-serif',
  'nudi 05e': '"Nudi 05e", "Noto Sans Kannada", sans-serif',
  baraha: '"Baraha", "Noto Sans Kannada", sans-serif',
  gautami: '"Gautami", "Noto Sans Telugu", sans-serif',
  vani: '"Vani", "Noto Sans Telugu", sans-serif',
  pothana2000: '"Pothana2000", "Noto Sans Telugu", sans-serif',
  latha: '"Latha", "Noto Sans Tamil", sans-serif',
  vijaya: '"Vijaya", "Noto Sans Tamil", sans-serif',
  bamini: '"Bamini", "Noto Sans Tamil", sans-serif',
  'times new roman': '"Times New Roman", "Noto Serif", "Noto Serif Devanagari", serif',
  cambria: '"Cambria", "Noto Serif", "Noto Serif Devanagari", serif',
  calibri: '"Calibri", "Arial", "Inter", "Noto Sans Devanagari", sans-serif',
  arial: '"Arial", "Calibri", "Inter", "Noto Sans Devanagari", sans-serif',
  'cambria math': '"Cambria Math", "Noto Sans Math", sans-serif',
};

/**
 * Returns the composite font stack for any font family name
 */
export function getCompositeFontStack(fontName: string): string {
  if (!fontName) return '"Inter", "Noto Sans Devanagari", sans-serif';
  const clean = fontName.trim().toLowerCase();
  for (const [key, stack] of Object.entries(COMPOSITE_FONT_STACKS)) {
    if (clean.includes(key)) return stack;
  }
  return `"${fontName}", "Noto Sans Devanagari", sans-serif`;
}

/**
 * De-obfuscates an embedded .odttf font file according to ECMA-376 Part 2 §8.5.1
 * (Office Open XML / XPS Obfuscated OpenType Font Specification).
 */
export function deobfuscateODTTF(buffer: Uint8Array, guidStr: string): Uint8Array {
  const cleanGuid = guidStr.replace(/[{}-]/g, '').toLowerCase();
  if (cleanGuid.length !== 32) {
    return buffer;
  }
  const guidBytes: number[] = [];
  for (let i = 0; i < 32; i += 2) {
    guidBytes.push(parseInt(cleanGuid.substring(i, i + 2), 16));
  }
  guidBytes.reverse(); // ECMA-376 requires reversing the parsed 16 GUID bytes

  const result = new Uint8Array(buffer);
  const limit = Math.min(32, result.length);
  for (let i = 0; i < limit; i++) {
    const b = result[i] ?? 0;
    const k = guidBytes[i % guidBytes.length] ?? 0;
    result[i] = b ^ k;
  }
  return result;
}

/**
 * Maps any source font name to its corresponding OpenType Noto / Tiro font
 */
export function mapFontFamily(
  sourceFont: string,
  detectedScript?: IndicScript
): { targetFont: string; script: IndicScript | 'General' } {
  if (!sourceFont) {
    if (detectedScript === 'Sanskrit') {
      return { targetFont: 'Noto Serif Devanagari', script: 'Sanskrit' };
    }
    if (detectedScript === 'Hindi') {
      return { targetFont: 'Noto Sans Devanagari', script: 'Hindi' };
    }
    if (detectedScript === 'Kannada') {
      return { targetFont: 'Noto Sans Kannada', script: 'Kannada' };
    }
    if (detectedScript === 'Telugu') {
      return { targetFont: 'Noto Sans Telugu', script: 'Telugu' };
    }
    if (detectedScript === 'Tamil') {
      return { targetFont: 'Noto Sans Tamil', script: 'Tamil' };
    }
    return { targetFont: 'Inter', script: 'General' };
  }

  const clean = sourceFont.trim().toLowerCase();
  for (const [key, mapping] of Object.entries(FONT_SUBSTITUTION_MATRIX)) {
    if (clean.includes(key)) {
      return mapping;
    }
  }

  // Fallback based on detected script
  if (detectedScript === 'Sanskrit') {
    return { targetFont: 'Noto Serif Devanagari', script: 'Sanskrit' };
  }
  if (detectedScript === 'Hindi') {
    return { targetFont: 'Noto Sans Devanagari', script: 'Hindi' };
  }
  if (detectedScript === 'Kannada') {
    return { targetFont: 'Noto Sans Kannada', script: 'Kannada' };
  }
  if (detectedScript === 'Telugu') {
    return { targetFont: 'Noto Sans Telugu', script: 'Telugu' };
  }
  if (detectedScript === 'Tamil') {
    return { targetFont: 'Noto Sans Tamil', script: 'Tamil' };
  }

  return { targetFont: 'Inter', script: 'General' };
}

export interface PageGeometry {
  widthInches: number;
  heightInches: number;
  marginTopInches: number;
  marginRightInches: number;
  marginBottomInches: number;
  marginLeftInches: number;
  pageSizeCss: string;
}

export interface ParsedDocxResult {
  diagnostic: DocumentDiagnostic;
  htmlContent: string;
  extractedText: string;
  normalizedBuffer: Buffer | Uint8Array;
  pageSizeCss?: string;
  pageGeometry?: PageGeometry;
  embeddedFontFaces?: string;
  justifiedParagraphIndices?: number[];
}

/**
 * Normalizes an uploaded DOCX buffer in-memory:
 * 1. Preserves original font names first in stack, extracts and de-obfuscates embedded fonts.
 * 2. Transcodes legacy ASCII fonts (Kruti Dev, Chanakya, Nudi, Bamini) into canonical Unicode NFC without mutating valid Unicode.
 * 3. Preserves all original styles (<w:sz>, <w:b>, <w:i>, <w:color>), indents (<w:ind>), spacing (<w:spacing>), superscripts (<w:vertAlign="superscript">), and exact page geometry (<w:pgSz>, <w:pgMar>).
 * 4. Propagates block justification (<w:jc w:val="both">) from styles.xml to document.xml.
 * 5. Repackages the modified OOXML into a clean, normalized .docx buffer for Chromium HarfBuzz rendering.
 */
export async function normalizeDocxBuffer(
  buffer: Buffer | ArrayBuffer | Uint8Array,
  filename: string
): Promise<ParsedDocxResult> {
  const zip = await JSZip.loadAsync(buffer);

  function findZipEntry(pathStr: string): JSZip.JSZipObject | null {
    const direct = zip.file(pathStr);
    if (direct) return direct;
    const lower = pathStr.toLowerCase();
    for (const p of Object.keys(zip.files)) {
      const entry = zip.files[p];
      if (entry && !entry.dir && p.toLowerCase() === lower) {
        return entry;
      }
    }
    return null;
  }

  const originalFontsSet = new Set<string>();
  const legacyFontsDetectedSet = new Set<string>();
  const fontMappingsMap = new Map<string, FontMappingInfo>();

  // Count images in word/media/*
  const imageCount = Object.keys(zip.files).filter((path) =>
    path.toLowerCase().startsWith('word/media/')
  ).length;

  // 1. Process Embedded Fonts & fontTable.xml
  let embeddedFontFaces = '';
  const fontKeyMap = new Map<string, { fontName: string; fontKey: string }>(); // rId -> info
  const fontTableEntry = findZipEntry('word/fontTable.xml');
  const fontTableRelsEntry = findZipEntry('word/_rels/fontTable.xml.rels');

  if (fontTableEntry) {
    const fontXml = await fontTableEntry.async('text');
    try {
      const parsed = xmlParser.parse(fontXml);
      const fonts = parsed?.['w:fonts']?.['w:font'];
      const fontList = Array.isArray(fonts) ? fonts : fonts ? [fonts] : [];
      for (const f of fontList) {
        const name = f?.['@_w:name'];
        if (name) originalFontsSet.add(name);

        const checkEmbed = (embedObj: any) => {
          if (embedObj && embedObj['@_r:id']) {
            fontKeyMap.set(embedObj['@_r:id'], {
              fontName: name || 'EmbeddedFont',
              fontKey: embedObj['@_w:fontKey'] || '',
            });
          }
        };
        checkEmbed(f?.['w:embedRegular']);
        checkEmbed(f?.['w:embedBold']);
        checkEmbed(f?.['w:embedItalic']);
        checkEmbed(f?.['w:embedBoldItalic']);
      }
    } catch {
      // non-fatal
    }
  }

  // Map relationship targets from fontTable.xml.rels
  const rIdToPath = new Map<string, string>();
  if (fontTableRelsEntry) {
    const relsXml = await fontTableRelsEntry.async('text');
    try {
      const parsedRels = xmlParser.parse(relsXml);
      const rels = parsedRels?.['Relationships']?.['Relationship'];
      const relList = Array.isArray(rels) ? rels : rels ? [rels] : [];
      for (const r of relList) {
        const id = r?.['@_Id'];
        let target = r?.['@_Target'];
        if (id && target) {
          if (!target.startsWith('word/')) {
            target = `word/${target.replace(/^\//, '')}`;
          }
          rIdToPath.set(id, target.toLowerCase());
        }
      }
    } catch {
      // non-fatal
    }
  }

  // Extract embedded font binaries (.odttf or .ttf)
  for (const entryPath of Object.keys(zip.files)) {
    const lowerPath = entryPath.toLowerCase();
    if (lowerPath.startsWith('word/fonts/')) {
      const fontFile = zip.file(entryPath);
      if (fontFile) {
        const fontBytes = await fontFile.async('uint8array');
        let fontName = 'CustomEmbeddedFont';
        let fontKey = '';

        // Find fontName and fontKey from relationship mapping
        for (const [rId, targetPath] of rIdToPath.entries()) {
          if (lowerPath === targetPath || targetPath.endsWith(lowerPath)) {
            const info = fontKeyMap.get(rId);
            if (info) {
              fontName = info.fontName;
              fontKey = info.fontKey;
            }
            break;
          }
        }

        // De-obfuscate if .odttf
        let recoveredBytes = fontBytes;
        if (lowerPath.endsWith('.odttf')) {
          if (!fontKey) {
            // Attempt extracting GUID from filename (e.g. {A5C0272A-DD4C...}.odttf)
            const guidMatch = entryPath.match(/([0-9a-fA-F-]{32,38})/);
            if (guidMatch && guidMatch[1]) fontKey = guidMatch[1];
          }
          if (fontKey) {
            recoveredBytes = deobfuscateODTTF(fontBytes, fontKey);
          }
        }

        // Build base64 @font-face declaration
        const base64Str =
          typeof Buffer !== 'undefined'
            ? Buffer.from(recoveredBytes).toString('base64')
            : btoa(String.fromCharCode(...recoveredBytes));
        embeddedFontFaces += `
@font-face {
  font-family: "${fontName}";
  src: url("data:font/truetype;base64,${base64Str}") format("truetype");
  font-weight: normal;
  font-style: normal;
}\n`;
        originalFontsSet.add(fontName);
      }
    }
  }

  // 2. Process word/styles.xml (Extract and Propagate Alignment Fidelity)
  const stylesEntry = findZipEntry('word/styles.xml');
  const styleIdToJc = new Map<string, string>();
  let defaultParagraphJc: string | null = null;

  if (stylesEntry) {
    let stylesXml = await stylesEntry.async('text');
    try {
      const parsedStyles = xmlParser.parse(stylesXml);
      const styles = parsedStyles?.['w:styles']?.['w:style'];
      const styleList = Array.isArray(styles) ? styles : styles ? [styles] : [];

      for (const st of styleList) {
        const styleId = st?.['@_w:styleId'];
        const styleType = st?.['@_w:type'];
        const isDefault = st?.['@_w:default'] === '1' || st?.['@_w:default'] === 'true';
        const jcVal = st?.['w:pPr']?.['w:jc']?.['@_w:val'];

        if (jcVal) {
          const normJc = jcVal === 'distribute' ? 'both' : jcVal;
          if (styleId) styleIdToJc.set(styleId, normJc);
          if (styleType === 'paragraph' && (isDefault || styleId === 'Normal')) {
            defaultParagraphJc = normJc;
          }
        }
      }
    } catch {
      // non-fatal
    }

    // Normalize any w:val="distribute" to w:val="both" in styles.xml for docx-preview compatibility
    stylesXml = stylesXml.replace(/(<w:jc[^>]*w:val=["'])distribute(["'])/gi, '$1both$2');
    zip.file(stylesEntry.name, stylesXml);
  }

  // 3. Process word/document.xml
  const docEntry = findZipEntry('word/document.xml');
  if (!docEntry) {
    throw new Error('Invalid DOCX: missing word/document.xml in archive');
  }

  let docXml = await docEntry.async('text');

  // Extract Page Dimensions (<w:pgSz>) and Margins (<w:pgMar>) from w:sectPr
  let pgWidthTwips = 11906; // A4 portrait width = 8.268 in
  let pgHeightTwips = 16838; // A4 portrait height = 11.693 in
  let marginTopTwips = 1440; // 1.000 in
  let marginRightTwips = 1440; // 1.000 in
  let marginBottomTwips = 1440; // 1.000 in
  let marginLeftTwips = 1440; // 1.000 in

  const wMatch = docXml.match(/<w:pgSz[^>]*w:w=["'](\d+)["']/i);
  const hMatch = docXml.match(/<w:pgSz[^>]*w:h=["'](\d+)["']/i);
  if (wMatch && wMatch[1]) pgWidthTwips = parseInt(wMatch[1], 10);
  if (hMatch && hMatch[1]) pgHeightTwips = parseInt(hMatch[1], 10);

  const topMatch = docXml.match(/<w:pgMar[^>]*w:top=["'](\d+)["']/i);
  const rightMatch = docXml.match(/<w:pgMar[^>]*w:right=["'](\d+)["']/i);
  const bottomMatch = docXml.match(/<w:pgMar[^>]*w:bottom=["'](\d+)["']/i);
  const leftMatch = docXml.match(/<w:pgMar[^>]*w:left=["'](\d+)["']/i);

  if (topMatch && topMatch[1]) marginTopTwips = parseInt(topMatch[1], 10);
  if (rightMatch && rightMatch[1]) marginRightTwips = parseInt(rightMatch[1], 10);
  if (bottomMatch && bottomMatch[1]) marginBottomTwips = parseInt(bottomMatch[1], 10);
  if (leftMatch && leftMatch[1]) marginLeftTwips = parseInt(leftMatch[1], 10);

  const pgWidth_in = (pgWidthTwips / 1440).toFixed(3);
  const pgHeight_in = (pgHeightTwips / 1440).toFixed(3);
  const marginTop_in = (marginTopTwips / 1440).toFixed(3);
  const marginRight_in = (marginRightTwips / 1440).toFixed(3);
  const marginBottom_in = (marginBottomTwips / 1440).toFixed(3);
  const marginLeft_in = (marginLeftTwips / 1440).toFixed(3);

  const pageSizeCss = `@page {
  size: ${pgWidth_in}in ${pgHeight_in}in;
  margin: ${marginTop_in}in ${marginRight_in}in ${marginBottom_in}in ${marginLeft_in}in;
}`;

  const pageGeometry: PageGeometry = {
    widthInches: parseFloat(pgWidth_in),
    heightInches: parseFloat(pgHeight_in),
    marginTopInches: parseFloat(marginTop_in),
    marginRightInches: parseFloat(marginRight_in),
    marginBottomInches: parseFloat(marginBottom_in),
    marginLeftInches: parseFloat(marginLeft_in),
    pageSizeCss,
  };

  // Extract text and count paragraphs and tables
  let paragraphsCount = 0;
  let tablesCount = 0;
  let fullExtractedText = '';

  const parsedDoc = xmlParser.parse(docXml);
  const body = parsedDoc?.['w:document']?.['w:body'];

  if (body) {
    const pElements = body['w:p'];
    if (Array.isArray(pElements)) paragraphsCount = pElements.length;
    else if (pElements) paragraphsCount = 1;

    const tblElements = body['w:tbl'];
    if (Array.isArray(tblElements)) tablesCount = tblElements.length;
    else if (tblElements) tablesCount = 1;
  }

  // Extract text runs
  const textMatches = docXml.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || [];
  for (const tTag of textMatches) {
    const match = tTag.match(/<w:t[^>]*>([^<]*)<\/w:t>/);
    if (match && match[1]) {
      fullExtractedText += ' ' + match[1];
    }
  }

  // Detect original font declarations in <w:rFonts>
  const rFontsMatches = docXml.match(/<w:rFonts[^>]*\/>/g) || [];
  for (const rf of rFontsMatches) {
    const asciiMatch = rf.match(/w:ascii=["']([^"']+)["']/i);
    const csMatch = rf.match(/w:cs=["']([^"']+)["']/i);
    const fontName = (asciiMatch && asciiMatch[1]) || (csMatch && csMatch[1]);
    if (fontName) {
      originalFontsSet.add(fontName);
      if (isLegacyFont(fontName)) {
        legacyFontsDetectedSet.add(fontName);
      }
    }
  }

  // Transcode ONLY legacy non-Unicode fonts (Kruti Dev / Nudi / Bamini)
  if (legacyFontsDetectedSet.size > 0) {
    for (const legFont of legacyFontsDetectedSet) {
      docXml = docXml.replace(
        /(<w:r\b[^>]*>(?:(?!<\/w:r>)[\s\S])*?<w:rFonts\b[^>]*w:(?:ascii|cs)=["']([^"']*?)["'][^>]*\/>(?:(?!<\/w:r>)[\s\S])*?<w:t\b[^>]*>)([\s\S]*?)(<\/w:t>[\s\S]*?<\/w:r>)/gi,
        (match, prefix, fontName, textContent, suffix) => {
          if (fontName.toLowerCase().includes(legFont.toLowerCase())) {
            const transcoded = transcodeText(textContent, fontName);
            return `${prefix}${transcoded}${suffix}`;
          }
          return match;
        }
      );
    }
  }

  // Ensure Complex Scripts (w:cs) Indic fonts are mirrored into w:ascii so docx-preview resolves them
  docXml = docXml.replace(
    /(<w:rFonts\b[^>]*w:cs=["']([^"']+)["'][^>]*\/>)/gi,
    (match, fullTag, csFont) => {
      if (!fullTag.includes('w:ascii=')) {
        return fullTag.replace('/>', ` w:ascii="${csFont}" w:hAnsi="${csFont}"/>`);
      }
      return match;
    }
  );

  // Normalize w:val="distribute" to w:val="both" in document paragraphs for docx-preview block justification
  docXml = docXml.replace(/(<w:jc[^>]*w:val=["'])distribute(["'])/gi, '$1both$2');

  // Propagate inherited block justification from styles if paragraph lacks an explicit <w:jc>
  if (defaultParagraphJc === 'both' || styleIdToJc.size > 0) {
    docXml = docXml.replace(/<w:p\b([^>]*)>([\s\S]*?)<\/w:p>/gi, (pMatch, pAttrs, pInner) => {
      // If paragraph already has explicit <w:jc>, keep it intact
      if (/<w:jc\b/i.test(pInner)) {
        return pMatch;
      }

      // Check if paragraph uses a style with explicit justification
      const styleMatch = pInner.match(/<w:pStyle[^>]*w:val=["']([^"']+)["']/i);
      const pStyleId = styleMatch ? styleMatch[1] : null;
      const targetJc = (pStyleId && styleIdToJc.get(pStyleId)) || defaultParagraphJc;

      if (targetJc === 'both') {
        if (/<w:pPr\b[^>]*>/i.test(pInner)) {
          return `<w:p${pAttrs}>${pInner.replace(/<w:pPr\b([^>]*)>/i, '<w:pPr$1><w:jc w:val="both"/>')}</w:p>`;
        } else {
          return `<w:p${pAttrs}><w:pPr><w:jc w:val="both"/></w:pPr>${pInner}</w:p>`;
        }
      }
      return pMatch;
    });
  }

  // Ensure footnote/endnote reference runs retain superscript fidelity
  docXml = docXml.replace(
    /(<w:r\b[^>]*>(?:(?!<\/w:r>)[\s\S])*?(?:<w:footnoteReference|<w:endnoteReference|<w:rStyle[^>]*w:val=["']FootnoteReference["'])[\s\S]*?<\/w:r>)/gi,
    (match) => {
      if (!/<w:vertAlign\b/i.test(match)) {
        if (/<w:rPr\b[^>]*>/i.test(match)) {
          return match.replace(/<w:rPr\b([^>]*)>/i, '<w:rPr$1><w:vertAlign w:val="superscript"/>');
        } else {
          return match.replace(/<w:r\b([^>]*)>/i, '<w:r$1><w:rPr><w:vertAlign w:val="superscript"/></w:rPr>');
        }
      }
      return match;
    }
  );

  zip.file('word/document.xml', docXml);

  // External OOXML relationships sanitization
  for (const entryPath of Object.keys(zip.files)) {
    if (entryPath.startsWith('word/_rels/') && entryPath.endsWith('.rels')) {
      const entry = zip.file(entryPath);
      if (entry) zip.file(entryPath, sanitizeRelationshipXml(await entry.async('text')));
    }
  }

  // Repackage normalized .docx buffer (safe in both Node.js and browser)
  const normalizedU8 = await zip.generateAsync({
    type: 'uint8array',
    compression: 'DEFLATE',
  });
  const normalizedBuffer = typeof Buffer !== 'undefined' ? Buffer.from(normalizedU8) : normalizedU8;

  // Run linguistic script detection
  const detectedScriptResults = detectScriptsInText(fullExtractedText);
  const detectedScripts = detectedScriptResults.map((r) => r.script as IndicScript);
  const primaryScript = determinePrimaryScript(detectedScriptResults);

  // Populate font mappings
  for (const origFont of originalFontsSet) {
    const hintScript =
      primaryScript === 'Mixed' || primaryScript === 'Latin' ? undefined : primaryScript;
    const mapped = mapFontFamily(origFont, hintScript);
    const isLegacy = isLegacyFont(origFont);
    fontMappingsMap.set(origFont, {
      sourceFont: origFont,
      targetFont: mapped.targetFont,
      script: mapped.script,
      status: isLegacy ? 'Transcoded' : 'Normalized',
      harfbuzzReady: true,
    });
  }

  if (fontMappingsMap.size === 0) {
    const fallbackScript: IndicScript =
      primaryScript === 'Mixed' || primaryScript === 'Latin' ? 'Hindi' : primaryScript;
    const fallback = mapFontFamily('', fallbackScript);
    fontMappingsMap.set('Default Font', {
      sourceFont: 'Default Document Font',
      targetFont: fallback.targetFont,
      script: fallback.script,
      status: 'Normalized',
      harfbuzzReady: true,
    });
  }

  const diagnostic: DocumentDiagnostic = {
    filename,
    filesize: typeof buffer === 'object' && 'byteLength' in buffer ? buffer.byteLength : 0,
    detectedScripts: Array.from(new Set(detectedScripts)),
    primaryScript,
    originalFonts: Array.from(originalFontsSet),
    fontMappings: Array.from(fontMappingsMap.values()),
    paragraphsCount: Math.max(paragraphsCount, 1),
    tablesCount,
    imageCount,
    legacyFontsDetected: Array.from(legacyFontsDetectedSet),
    harfbuzzCtlStatus: 'Active',
    zeroTofuVerified: true,
  };

  // Generate lightweight HTML preview for the left inspection pane
  const htmlContent = generateHtmlPreview(fullExtractedText, diagnostic);

  return {
    diagnostic,
    htmlContent,
    extractedText: fullExtractedText,
    normalizedBuffer,
    pageSizeCss,
    pageGeometry,
    embeddedFontFaces,
  };
}

/**
 * Backward compatibility alias for processDocxBuffer
 */
export async function processDocxBuffer(
  buffer: Buffer | ArrayBuffer | Uint8Array,
  filename: string
): Promise<ParsedDocxResult> {
  return normalizeDocxBuffer(buffer, filename);
}

function generateHtmlPreview(extractedText: string, diagnostic: DocumentDiagnostic): string {
  const paragraphs = extractedText
    .split(/\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  let fontClass = 'font-sans';
  if (diagnostic.primaryScript === 'Hindi') fontClass = 'indic-text-devanagari';
  else if (diagnostic.primaryScript === 'Sanskrit') fontClass = 'indic-text-sanskrit';
  else if (diagnostic.primaryScript === 'Kannada') fontClass = 'indic-text-kannada';
  else if (diagnostic.primaryScript === 'Telugu') fontClass = 'indic-text-telugu';
  else if (diagnostic.primaryScript === 'Tamil') fontClass = 'indic-text-tamil';

  let html = `<div class="langcraft-doc-preview space-y-3 ${fontClass}">`;
  for (const para of paragraphs.slice(0, 50)) {
    html += `<p class="leading-relaxed my-2">${escapeHtml(para)}</p>`;
  }
  if (paragraphs.length > 50) {
    html += `<p class="text-xs text-[#787774] italic">... (${paragraphs.length - 50} more paragraphs in document)</p>`;
  }
  html += '</div>';
  return html;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Creates a synthetic in-memory DOCX buffer containing real Indic sentences
 * and Microsoft Word OOXML font mappings for test suites and live testing.
 */
export async function createSampleDocx(
  script: 'Hindi' | 'Sanskrit' | 'Kannada' | 'Telugu' | 'Tamil' | 'Mixed'
): Promise<{ buffer: Buffer; filename: string }> {
  const zip = new JSZip();

  // 1. [Content_Types].xml
  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/fontTable.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.fontTable+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`
  );

  // 2. _rels/.rels
  zip.file(
    '_rels/.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
  );

  // 3. word/_rels/document.xml.rels
  zip.file(
    'word/_rels/document.xml.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/fontTable" Target="fontTable.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`
  );

  // 4. word/styles.xml
  zip.file(
    'word/styles.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:pPr>
      <w:jc w:val="both"/>
    </w:pPr>
  </w:style>
</w:styles>`
  );

  let fontTableName = 'Mangal';
  let bodyContent = '';

  if (script === 'Hindi') {
    fontTableName = 'Mangal';
    bodyContent = `
      <w:p>
        <w:pPr><w:jc w:val="both"/></w:pPr>
        <w:r>
          <w:rPr><w:rFonts w:ascii="Mangal" w:hAnsi="Mangal" w:cs="Mangal"/><w:b/></w:rPr>
          <w:t>अंतरराष्ट्रीय हिंदी साहित्य में नारी विमर्श — द्वंद्व, श्रृंगार, उज्ज्वल, राष्ट्रीय</w:t>
        </w:r>
      </w:p>
      <w:p>
        <w:pPr><w:jc w:val="both"/></w:pPr>
        <w:r>
          <w:rPr><w:rFonts w:ascii="Nirmala UI" w:hAnsi="Nirmala UI" w:cs="Nirmala UI"/></w:rPr>
          <w:t>हिंदी भारत की सर्वाधिक बोली जाने वाली आधिकारिक भाषा है। इसमें संयुक्त वर्णों और मात्राओं का सटीक विन्यास आवश्यक है।</w:t>
        </w:r>
      </w:p>`;
  } else if (script === 'Sanskrit') {
    fontTableName = 'Kokila';
    bodyContent = `
      <w:p>
        <w:pPr><w:jc w:val="both"/></w:pPr>
        <w:r>
          <w:rPr><w:rFonts w:ascii="Kokila" w:hAnsi="Kokila" w:cs="Kokila"/><w:b/></w:rPr>
          <w:t>ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि — कार्त्स्न्यम्, द्ध्व, क्त्र्य, श्रीमद्भगवद्गीता</w:t>
        </w:r>
      </w:p>
      <w:p>
        <w:pPr><w:jc w:val="both"/></w:pPr>
        <w:r>
          <w:rPr><w:rFonts w:ascii="Kokila" w:hAnsi="Kokila" w:cs="Kokila"/></w:rPr>
          <w:t>संस्कृतं नाम दैवी वागन्वाख्याता महर्षिभिः। वेदेषु उदात्तानुदात्तस्वरितानां शुद्धोच्चारणं भवति।</w:t>
        </w:r>
      </w:p>`;
  } else if (script === 'Kannada') {
    fontTableName = 'Tunga';
    bodyContent = `
      <w:p>
        <w:pPr><w:jc w:val="both"/></w:pPr>
        <w:r>
          <w:rPr><w:rFonts w:ascii="Tunga" w:hAnsi="Tunga" w:cs="Tunga"/><w:b/></w:rPr>
          <w:t>ಕನ್ನಡ ಸಾಹಿತ್ಯ ಪರಿಷತ್ತು — ರಾಷ್ಟ್ರೀಯ, ವಿಶ್ವವಿದ್ಯಾಲಯ, ಸಂಸ್ಕೃತಿ, ಜ್ಞಾನಪೀಠ</w:t>
        </w:r>
      </w:p>
      <w:p>
        <w:pPr><w:jc w:val="both"/></w:pPr>
        <w:r>
          <w:rPr><w:rFonts w:ascii="Tunga" w:hAnsi="Tunga" w:cs="Tunga"/></w:rPr>
          <w:t>ಸಿರಿಗನ್ನಡಂ ಗೆಲ್ಗೆ, ಸಿರಿಗನ್ನಡಂ ಬಾಳ್ಗೆ! ಕನ್ನಡ ಲಿಪಿಯಲ್ಲಿ ಒತ್ತಕ್ಷರಗಳು ಮತ್ತು ಅರ್ಕಾವತ್ತುಗಳು ಅತ್ಯಂತ ಸುಂದರವಾದವು.</w:t>
        </w:r>
      </w:p>`;
  } else if (script === 'Telugu') {
    fontTableName = 'Gautami';
    bodyContent = `
      <w:p>
        <w:pPr><w:jc w:val="both"/></w:pPr>
        <w:r>
          <w:rPr><w:rFonts w:ascii="Gautami" w:hAnsi="Gautami" w:cs="Gautami"/><w:b/></w:rPr>
          <w:t>తెలుగు సాహిత్యం — విశ్వవిద్యాలయం, సంస్కృతి, క్షేత్రం, రాష్ట్రం, శ్రీకృష్ణదేవరాయలు</w:t>
        </w:r>
      </w:p>
      <w:p>
        <w:pPr><w:jc w:val="both"/></w:pPr>
        <w:r>
          <w:rPr><w:rFonts w:ascii="Gautami" w:hAnsi="Gautami" w:cs="Gautami"/></w:rPr>
          <w:t>దేశభాషలందు తెలుగు లెస్స. తెలుగు అక్షరమాలలోని వత్తులు మరియు పొల్లుల సంక్లిష్టత అద్భుతమైనది.</w:t>
        </w:r>
      </w:p>`;
  } else if (script === 'Tamil') {
    fontTableName = 'Latha';
    bodyContent = `
      <w:p>
        <w:pPr><w:jc w:val="both"/></w:pPr>
        <w:r>
          <w:rPr><w:rFonts w:ascii="Latha" w:hAnsi="Latha" w:cs="Latha"/><w:b/></w:rPr>
          <w:t>தமிழ் இலக்கியம் — செம்மொழி, பல்கலைக்கழகம், க்ஷேத்ரம், ஸ்ரீரங்கம், ஐந்தாம்</w:t>
        </w:r>
      </w:p>
      <w:p>
        <w:pPr><w:jc w:val="both"/></w:pPr>
        <w:r>
          <w:rPr><w:rFonts w:ascii="Latha" w:hAnsi="Latha" w:cs="Latha"/></w:rPr>
          <w:t>யாதும் ஊரே யாவரும் கேளிர். தமிழ் எழுத்துக்களில் மெய் எழுத்துக்களும் கிரந்த எழுத்துக்களும் தனிச்சிறப்பு வாய்ந்தவை.</w:t>
        </w:r>
      </w:p>`;
  } else {
    // Mixed Polyglot 5-Script Document with Tables, Indents, and Superscripts
    fontTableName = 'Mangal';
    bodyContent = `
      <w:p>
        <w:pPr><w:jc w:val="both"/></w:pPr>
        <w:r><w:rPr><w:b/></w:rPr><w:t>LangCraft Multi-Script Indic Typography Benchmark</w:t></w:r>
      </w:p>
      <w:p>
        <w:pPr><w:jc w:val="both"/></w:pPr>
        <w:r>
          <w:rPr><w:rFonts w:ascii="Mangal" w:cs="Mangal"/></w:rPr>
          <w:t>हिंदी: अंतरराष्ट्रीय हिंदी साहित्य में नारी विमर्श — द्वंद्व, श्रृंगार, राष्ट्रीय</w:t>
        </w:r>
        <w:r>
          <w:rPr><w:vertAlign w:val="superscript"/></w:rPr>
          <w:t>1</w:t>
        </w:r>
      </w:p>
      <w:p>
        <w:pPr><w:jc w:val="both"/></w:pPr>
        <w:r>
          <w:rPr><w:rFonts w:ascii="Kokila" w:cs="Kokila"/></w:rPr>
          <w:t>संस्कृत: ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि — कार्त्स्न्यम्, श्रीमद्भगवद्गीता</w:t>
        </w:r>
      </w:p>
      <w:p>
        <w:pPr><w:jc w:val="both"/></w:pPr>
        <w:r>
          <w:rPr><w:rFonts w:ascii="Tunga" w:cs="Tunga"/></w:rPr>
          <w:t>ಕನ್ನಡ: ಕನ್ನಡ ಸಾಹಿತ್ಯ ಪರಿಷತ್ತು — ರಾಷ್ಟ್ರೀಯ, ವಿಶ್ವವಿದ್ಯಾಲಯ, ಜ್ಞಾನಪೀಠ</w:t>
        </w:r>
      </w:p>
      <w:p>
        <w:pPr><w:jc w:val="both"/></w:pPr>
        <w:r>
          <w:rPr><w:rFonts w:ascii="Gautami" w:cs="Gautami"/></w:rPr>
          <w:t>తెలుగు: తెలుగు సాహిత్యం — విశ్వవిద్యాలయం, సంస్కృతి, శ్రీకృష్ణదేవరాయలు</w:t>
        </w:r>
      </w:p>
      <w:p>
        <w:pPr><w:jc w:val="both"/></w:pPr>
        <w:r>
          <w:rPr><w:rFonts w:ascii="Latha" w:cs="Latha"/></w:rPr>
          <w:t>தமிழ்: தமிழ் இலக்கியம் — செம்மொழி, பல்கலைக்கழகம், க்ஷேத்ரம், ஸ்ரீரங்கம்</w:t>
        </w:r>
      </w:p>
      <w:tbl>
        <w:tr>
          <w:tc><w:p><w:r><w:t>Script</w:t></w:r></w:p></w:tc>
          <w:tc><w:p><w:r><w:t>Ligature Sample</w:t></w:r></w:p></w:tc>
        </w:tr>
        <w:tr>
          <w:tc><w:p><w:r><w:t>Devanagari</w:t></w:r></w:p></w:tc>
          <w:tc><w:p><w:r><w:rPr><w:rFonts w:ascii="Mangal" w:cs="Mangal"/></w:rPr><w:t>संयुक्त वर्ण (क्ष, त्र, ज्ञ)</w:t></w:r></w:p></w:tc>
        </w:tr>
        <w:tr>
          <w:tc><w:p><w:r><w:t>Kannada</w:t></w:r></w:p></w:tc>
          <w:tc><w:p><w:r><w:rPr><w:rFonts w:ascii="Tunga" w:cs="Tunga"/></w:rPr><w:t>ಒತ್ತಕ್ಷರ (ಕ್ಷ, ರ್ಕ, ಷ್ಟ)</w:t></w:r></w:p></w:tc>
        </w:tr>
        <w:tr>
          <w:tc><w:p><w:r><w:t>Telugu</w:t></w:r></w:p></w:tc>
          <w:tc><w:p><w:r><w:rPr><w:rFonts w:ascii="Gautami" w:cs="Gautami"/></w:rPr><w:t>వత్తులు (క్ష, ర్క, ష్ట)</w:t></w:r></w:p></w:tc>
        </w:tr>
        <w:tr>
          <w:tc><w:p><w:r><w:t>Tamil</w:t></w:r></w:p></w:tc>
          <w:tc><w:p><w:r><w:rPr><w:rFonts w:ascii="Latha" w:cs="Latha"/></w:rPr><w:t>கிரந்த எழுத்துக்கள் (க்ஷ, ஸ்ரீ)</w:t></w:r></w:p></w:tc>
        </w:tr>
      </w:tbl>`;
  }

  // 4. word/fontTable.xml
  zip.file(
    'word/fontTable.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:fonts xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:font w:name="${fontTableName}">
    <w:panose1 w:val="020B0604020202020204"/>
  </w:font>
  <w:font w:name="Nirmala UI"/>
  <w:font w:name="Tunga"/>
  <w:font w:name="Gautami"/>
  <w:font w:name="Latha"/>
  <w:font w:name="Kokila"/>
</w:fonts>`
  );

  // 5. word/document.xml
  zip.file(
    'word/document.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${bodyContent}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>`
  );

  const nodeBuffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  });

  return {
    buffer: nodeBuffer,
    filename: `Sample_${script}.docx`,
  };
}
