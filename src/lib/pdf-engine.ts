import { chromium, Browser } from 'playwright';
import path from 'path';
import fs from 'fs';
import { IndicScript } from '@/types';
import { COMPOSITE_FONT_STACKS } from './docx-processor';

export const runtime = 'nodejs';
export const maxDuration = 120;

export interface RenderPdfOptions {
  normalizedDocxBuffer: Buffer | Uint8Array;
  filename: string;
  pageSizeCss?: string;
  expectedScripts?: IndicScript[];
  embeddedFontFaces?: string;
}

export interface TofuValidationResult {
  valid: boolean;
  tofuCount: number;
  replacementCharCount: number;
  hasValidPdfHeader: boolean;
  hasValidFontStreams: boolean;
  errors: string[];
}

/**
 * Validates a generated PDF buffer against the Zero-Tofu invariant
 */
export function tofuValidator(
  pdfBuffer: Buffer | Uint8Array,
  expectedScripts: string[] = []
): TofuValidationResult {
  const bytes = pdfBuffer instanceof Buffer ? pdfBuffer : Buffer.from(pdfBuffer);
  const errors: string[] = [];

  // 1. Verify PDF Magic Header (%PDF-1.)
  const header = bytes.subarray(0, 8).toString('ascii');
  const hasValidPdfHeader = header.startsWith('%PDF-1.');
  if (!hasValidPdfHeader) {
    errors.push(`Invalid PDF header: "${header}". Must start with %PDF-1.`);
  }

  // 2. Scan for Unicode Replacement Character \uFFFD (0xEF 0xBF 0xBD in UTF-8)
  let replacementCharCount = 0;
  for (let i = 0; i < bytes.length - 2; i++) {
    if (bytes[i] === 0xef && bytes[i + 1] === 0xbf && bytes[i + 2] === 0xbd) {
      replacementCharCount++;
    }
  }
  if (replacementCharCount > 0) {
    errors.push(
      `Detected ${replacementCharCount} Unicode replacement characters (\\uFFFD) in PDF stream.`
    );
  }

  // 3. Scan for explicit .notdef references in text or cmap streams
  const pdfString = bytes.toString('latin1');
  const notdefMatches = pdfString.match(/\/\.notdef(?!\s*def)/g) || [];
  const tofuCount = notdefMatches.length;
  if (tofuCount > 0) {
    errors.push(`Detected ${tofuCount} unmapped /.notdef glyph references in PDF stream.`);
  }

  // 4. Verify presence of valid Font and Object streams
  const hasFontDictionary = pdfString.includes('/Type /Font') || pdfString.includes('/Font');
  const hasEOF = pdfString.includes('%%EOF');

  if (!hasEOF) {
    errors.push('PDF stream is truncated (missing %%EOF trailer).');
  }

  const valid = errors.length === 0 && hasValidPdfHeader && hasEOF;

  return {
    valid,
    tofuCount,
    replacementCharCount,
    hasValidPdfHeader,
    hasValidFontStreams: hasFontDictionary,
    errors,
  };
}

/**
 * Stage B: True 1:1 WYSIWYG Document Rendering via Headless Chromium & HarfBuzz.
 * Renders the normalized OOXML document with exact page layout, tables, margins,
 * alignments, superscripts, and embedded images.
 * ZERO DIAGNOSTIC WATERMARKS OR METADATA ARE INJECTED INTO THE PDF.
 */
export async function renderDocxToPdf(options: RenderPdfOptions): Promise<Buffer> {
  const { normalizedDocxBuffer, pageSizeCss, embeddedFontFaces } = options;

  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--font-render-hinting=medium',
      ],
    });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 1800 },
    });

    await context.route('**/*', async (route) => {
      const url = new URL(route.request().url());
      const isFontHost =
        url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';

      if (url.protocol === 'http:' || url.protocol === 'https:') {
        await (isFontHost ? route.continue() : route.abort());
        return;
      }

      await route.continue();
    });

    const page = await context.newPage();

    // Prepare HTML shell with Google Fonts, embedded @font-face rules, and exact page CSS
    const htmlShell = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+Devanagari:wght@400;500;600;700&family=Noto+Serif+Devanagari:wght@400;600;700&family=Tiro+Devanagari+Sanskrit:ital@0;1&family=Noto+Sans+Kannada:wght@400;500;600;700&family=Noto+Serif+Kannada:wght@400;700&family=Noto+Sans+Telugu:wght@400;500;600;700&family=Noto+Serif+Telugu:wght@400;700&family=Noto+Sans+Tamil:wght@400;500;600;700&family=Noto+Serif+Tamil:wght@400;700&family=Noto+Sans+Math&family=Noto+Serif:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
  <style>
    ${embeddedFontFaces || ''}
    ${pageSizeCss || '@page { size: 8.268in 11.693in; margin: 1in; }'}
    * {
      box-sizing: border-box;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      font-kerning: normal;
      font-feature-settings: "kern" 1, "liga" 1, "clig" 1, "calt" 1, "abvs" 1, "blws" 1, "pres" 1, "psts" 1, "haln" 1;
      text-rendering: optimizeLegibility;
      -webkit-font-smoothing: antialiased;
      direction: ltr !important;
      unicode-bidi: normal !important;
    }
    #document-container, .docx-wrapper, .docx {
      direction: ltr !important;
      unicode-bidi: normal !important;
    }
    /* Section & Wrapper overrides: eliminate fixed-height boxes and shadows */
    .docx-wrapper, section.docx {
      background: transparent !important;
      box-shadow: none !important;
      border: none !important;
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      min-height: auto !important;
      height: auto !important;
      overflow: visible !important;
    }
    /* Prevent horizontal line slicing across page breaks */
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
    /* Anti-orphan headings and subheadings (FIX-04) */
    [data-keep-next="true"],
    .docx-keep-next,
    .keep-next {
      page-break-after: avoid !important;
      break-after: avoid-page !important;
    }
    /* Fix Superscripts & Footnote References ("6, "7) */
    sup, sub, span[style*="superscript"], a[id^="footnote"], .docx-footnote-ref, .docx-footnote-reference {
      vertical-align: super !important;
      font-size: 0.68em !important;
      line-height: 0 !important;
    }
    span[style*="subscript"] {
      vertical-align: sub !important;
      font-size: 0.68em !important;
      line-height: 0 !important;
    }
    /* Fix Justified Alignment & Devanagari Matra Line-Height */
    p[style*="justify"], .docx p[style*="justify"], p.docx-p-justify {
      text-align: justify !important;
      text-justify: inter-word !important;
    }
    .docx p {
      overflow-wrap: break-word;
    }
    @media print {
      body {
        margin: 0 !important;
        padding: 0 !important;
      }
      .docx-wrapper {
        background: transparent !important;
        padding: 0 !important;
      }
      .docx-wrapper > section.docx {
        box-shadow: none !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: visible !important;
      }
    }
  </style>
</head>
<body>
  <div id="document-container"></div>
</body>
</html>`;

    await page.setContent(htmlShell, { waitUntil: 'domcontentloaded' });

    // Resolve JSZip and docx-preview scripts
    function getVendorScript(vendorRelative: string, nodeModulesRelative: string): string {
      const candidates = [
        path.join(process.cwd(), vendorRelative),
        path.join(process.cwd(), nodeModulesRelative),
        path.join(__dirname, '..', '..', vendorRelative),
        path.join(__dirname, '..', '..', nodeModulesRelative),
      ];
      for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
          return fs.readFileSync(candidate, 'utf-8');
        }
      }
      throw new Error(`Required vendor script could not be located in ${candidates.join(', ')}`);
    }

    const jszipJs = getVendorScript('public/vendor/jszip.min.js', 'node_modules/jszip/dist/jszip.min.js');
    const docxPreviewJs = getVendorScript('public/vendor/docx-preview.min.js', 'node_modules/docx-preview/dist/docx-preview.min.js');

    await page.addScriptTag({ content: jszipJs });
    await page.addScriptTag({ content: docxPreviewJs });

    // Step 1: Preload web fonts with Indic glyph triggers so unicode-range slices are downloaded
    await page.evaluate(async () => {
      try {
        await Promise.allSettled([
          document.fonts.load('16px "Noto Sans Devanagari"', 'मैथिलीशरण गुप्त'),
          document.fonts.load('bold 16px "Noto Sans Devanagari"', 'मैथिलीशरण गुप्त'),
          document.fonts.load('16px "Noto Serif Devanagari"', 'संस्कृतम्'),
          document.fonts.load('16px "Noto Sans Kannada"', 'ಕನ್ನಡ'),
          document.fonts.load('16px "Noto Sans Telugu"', 'తెలుగు'),
          document.fonts.load('16px "Noto Sans Tamil"', 'தமிழ்'),
          document.fonts.load('16px "Inter"', 'LangCraft'),
        ]);
        await document.fonts.ready;
      } catch {
        // Non-blocking fallback
      }
    });

    // Step 2: Render normalized DOCX unclipped
    const base64Data =
      normalizedDocxBuffer instanceof Buffer
        ? normalizedDocxBuffer.toString('base64')
        : Buffer.from(normalizedDocxBuffer).toString('base64');

    await page.evaluate(async (b64) => {
      const bin = atob(b64);
      const len = bin.length;
      const u8 = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        u8[i] = bin.charCodeAt(i);
      }

      const container = document.getElementById('document-container');
      if (!container || !(window as any).docx) {
        throw new Error('Container or docx-preview library not available in page');
      }

      await (window as any).docx.renderAsync(u8, container, null, {
        inWrapper: false,
        ignoreWidth: false,
        ignoreHeight: true,
        ignoreFonts: false,
        breakPages: false,
        useBase64URL: true,
        renderHeaders: true,
        renderFooters: true,
        renderFootnotes: true,
        renderEndnotes: true,
        experimental: true,
      });
    }, base64Data);

    // Step 4: Post-Render DOM Alignment, Superscript, and Font Stack Enforcer
    await page.evaluate((compositeMap) => {
      // Strip rogue direction overrides
      document.querySelectorAll('[dir], [style*="direction"]').forEach((el: any) => {
        el.removeAttribute('dir');
        if (el.style) el.style.direction = 'ltr';
      });

      // Enforce block justification
      const paragraphs = document.querySelectorAll('p');
      paragraphs.forEach((p) => {
        const align = p.style.textAlign;
        const inlineStyle = p.getAttribute('style') || '';
        if (
          align === 'justify' ||
          p.getAttribute('align') === 'justify' ||
          inlineStyle.includes('justify')
        ) {
          p.style.textAlign = 'justify';
          (p.style as any).textJustify = 'inter-word';
        }
      });

      // Enforce true superscripts & footnote references
      const sups = document.querySelectorAll(
        'sup, .docx-footnote-ref, a[id^="footnote"], span[style*="superscript"]'
      );
      sups.forEach((s: any) => {
        s.style.verticalAlign = 'super';
        s.style.fontSize = '0.68em';
        s.style.lineHeight = '0';
      });

      // Expand font-family to metric-matched composite stacks or detect Indic text
      const styledElements = document.querySelectorAll('[style*="font-family"], p, span');
      styledElements.forEach((el: any) => {
        const text = el.textContent || '';
        const ff = el.style.fontFamily;
        let matched = false;
        if (ff) {
          const clean = ff.toLowerCase().replace(/['"]/g, '').trim();
          for (const [key, stack] of Object.entries(compositeMap)) {
            if (clean.includes(key)) {
              el.style.fontFamily = stack as string;
              matched = true;
              break;
            }
          }
        }
        // If element contains Indic text and either had no font or general font, ensure Noto Sans/Serif Devanagari is included
        if (/[\u0900-\u0D7F]/.test(text)) {
          if (!matched || !el.style.fontFamily || el.style.fontFamily.includes('Inter') || el.style.fontFamily.includes('Arial') || el.style.fontFamily.includes('Calibri')) {
            el.style.fontFamily = '"Noto Sans Devanagari", "Noto Serif Devanagari", "Inter", sans-serif';
          }
        }
      });

      // Ensure explicit page breaks break cleanly
      const pageBreaks = document.querySelectorAll('.docx-page-break, [style*="page-break-before"]');
      pageBreaks.forEach((pb: any) => {
        pb.style.pageBreakBefore = 'always';
        pb.style.breakBefore = 'page';
      });

      // Anti-orphan headings and subheadings enforcer (FIX-04)
      const allParagraphs = document.querySelectorAll(
        'p, h1, h2, h3, h4, h5, h6, [class*="heading"], .docx-keep-next'
      );
      allParagraphs.forEach((el) => {
        const text = (el.textContent || '').trim();
        const tagName = el.tagName.toLowerCase();
        const isHeadingTag = /^h[1-6]$/.test(tagName);
        const endsWithColon = /[:ः]\s*$/.test(text);
        const isShortColonLabel = endsWithColon && text.length < 120;
        const hasKeepNext =
          el.classList.contains('docx-keep-next') ||
          el.hasAttribute('data-keep-next') ||
          (el.getAttribute('style') || '').includes('page-break-after: avoid') ||
          (el.getAttribute('style') || '').includes('break-after: avoid');
        const isNumberedSubhead = /^[0-9]+[\.\)]\s+/.test(text) && text.length < 80;
        const isLetterSubhead = /^\([क-हa-z0-9]\)/i.test(text) && text.length < 80;
        const isBoldSubhead = el.querySelector('b, strong') !== null && text.length < 80;

        if (
          isHeadingTag ||
          isShortColonLabel ||
          hasKeepNext ||
          isNumberedSubhead ||
          isLetterSubhead ||
          isBoldSubhead
        ) {
          (el as HTMLElement).style.pageBreakAfter = 'avoid';
          (el as HTMLElement).style.breakAfter = 'avoid-page';
          (el as HTMLElement).setAttribute('data-keep-next', 'true');
        }
      });
    }, COMPOSITE_FONT_STACKS);

    // Step 5: Wait for all fonts and images to complete decoding
    await page.evaluate(async () => {
      await document.fonts.ready;
      const imgs = Array.from(document.querySelectorAll('img'));
      await Promise.all(
        imgs.map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise((res) => {
                img.onload = res;
                img.onerror = res;
              })
        )
      );
    });

    // Step 6: Export pure vector PDF matching Word pages exactly
    const pdfUint8 = await page.pdf({
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: false,
    });

    return Buffer.from(pdfUint8);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
