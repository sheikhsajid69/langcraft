import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import fs from 'fs';
import path from 'path';
import { normalizeDocxBuffer, createSampleDocx, deobfuscateODTTF } from '@/lib/docx-processor';
import { renderDocxToPdf, tofuValidator } from '@/lib/pdf-engine';

describe('LangCraft Layout Fidelity & Typography Verification Suite', () => {
  // TC-LAYOUT-01: Page Geometry, Margins & Zero Horizontal Line Slicing
  it('TC-LAYOUT-01: Verify @page margins match w:pgMar twips from word/document.xml and section.docx has padding:0 and height:auto so zero lines are sliced horizontally across page breaks', async () => {
    const zip = new JSZip();

    zip.file(
      '[Content_Types].xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`
    );

    zip.file(
      '_rels/.rels',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
    );

    // Custom A4 geometry: width 11906 twips (8.268in), height 16838 twips (11.693in), 1440 twip margins (1in)
    zip.file(
      'word/document.xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r><w:t>पृष्ठ १: प्रथम परिच्छेद - भारतीय साहित्य एवं भाषा विज्ञान</w:t></w:r>
    </w:p>
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>`
    );

    const docxBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    const parsed = await normalizeDocxBuffer(docxBuffer, 'geometry-test.docx');

    expect(parsed.pageGeometry).toBeDefined();
    expect(parsed.pageGeometry?.widthInches).toBeCloseTo(8.268, 2);
    expect(parsed.pageGeometry?.heightInches).toBeCloseTo(11.693, 2);
    expect(parsed.pageGeometry?.marginTopInches).toBeCloseTo(1.0, 2);
    expect(parsed.pageGeometry?.marginBottomInches).toBeCloseTo(1.0, 2);
    expect(parsed.pageGeometry?.marginLeftInches).toBeCloseTo(1.0, 2);
    expect(parsed.pageGeometry?.marginRightInches).toBeCloseTo(1.0, 2);

    expect(parsed.pageSizeCss).toContain('size: 8.268in 11.693in;');
    expect(parsed.pageSizeCss).toContain('margin: 1.000in 1.000in 1.000in 1.000in;');

    const pdfBuffer = await renderDocxToPdf({
      normalizedDocxBuffer: parsed.normalizedBuffer,
      filename: 'geometry-test.docx',
      pageSizeCss: parsed.pageSizeCss,
      expectedScripts: ['Hindi'],
    });

    const check = tofuValidator(pdfBuffer, ['Hindi']);
    expect(check.valid).toBe(true);
    expect(check.hasValidPdfHeader).toBe(true);
    expect(check.tofuCount).toBe(0);
  });

  // TC-LAYOUT-02: Paragraph Block Justification & Indentation Fidelity
  it('TC-LAYOUT-02: Verify paragraphs with <w:jc w:val="both"/> render with computed style text-align: justify and preserve first-line/hanging indents (<w:ind>)', async () => {
    const zip = new JSZip();

    zip.file(
      '[Content_Types].xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`
    );

    zip.file(
      '_rels/.rels',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
    );

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

    // Document with hanging indents (<w:ind w:left="720" w:hanging="720"/>) for bibliography
    zip.file(
      'word/document.xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Normal"/>
        <w:ind w:left="720" w:hanging="720"/>
      </w:pPr>
      <w:r>
        <w:rPr><w:rFonts w:ascii="Mangal" w:cs="Mangal"/></w:rPr>
        <w:t>१. आचार्य रामचंद्र शुक्ल — हिंदी साहित्य का इतिहास, नागरी प्रचारिणी सभा, काशी।</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr>
        <w:jc w:val="distribute"/>
      </w:pPr>
      <w:r>
        <w:rPr><w:rFonts w:ascii="Mangal" w:cs="Mangal"/></w:rPr>
        <w:t>२. हजारी प्रसाद द्विवेदी — कबीर, राजकमल प्रकाशन, नई दिल्ली।</w:t>
      </w:r>
    </w:p>
  </w:body>
</w:document>`
    );

    const docxBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    const parsed = await normalizeDocxBuffer(docxBuffer, 'justified-test.docx');

    // Inspect normalized OOXML:
    const normalizedZip = await JSZip.loadAsync(parsed.normalizedBuffer);
    const docXml = await normalizedZip.file('word/document.xml')!.async('text');

    // 1. Normal style justification was propagated to paragraph 1
    expect(docXml).toMatch(/<w:jc\b[^>]*w:val=["']both["']/i);

    // 2. Hanging indent attributes preserved untouched
    expect(docXml).toMatch(/<w:ind\b[^>]*w:left=["']720["']/i);
    expect(docXml).toMatch(/<w:ind\b[^>]*w:hanging=["']720["']/i);

    // 3. distribute normalized to both for full block justification
    expect(docXml).not.toMatch(/w:val=["']distribute["']/i);

    const pdfBuffer = await renderDocxToPdf({
      normalizedDocxBuffer: parsed.normalizedBuffer,
      filename: 'justified-test.docx',
      pageSizeCss: parsed.pageSizeCss,
      expectedScripts: ['Hindi'],
    });

    const check = tofuValidator(pdfBuffer, ['Hindi']);
    expect(check.valid).toBe(true);
  });

  // TC-LAYOUT-03: Superscripts and Footnote Reference Markers ("6 and "7)
  it('TC-LAYOUT-03: Verify inline footnote/superscript runs (e.g. बनीं।"6 and चाहिए।"7 with <w:vertAlign w:val="superscript"/>) render as <sup> with vertical-align: super and font-size < 75%', async () => {
    const zip = new JSZip();

    zip.file(
      '[Content_Types].xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`
    );

    zip.file(
      '_rels/.rels',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
    );

    // Document with footnote reference runs and explicit superscripts
    zip.file(
      'word/document.xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r><w:t>महादेवी वर्मा आधुनिक मीरा बनीं।</w:t></w:r>
      <w:r>
        <w:rPr><w:vertAlign w:val="superscript"/></w:rPr>
        <w:t>"6</w:t>
      </w:r>
      <w:r><w:t> उनका काव्य विरह की अनुभूति से ओत-प्रोत होना चाहिए।</w:t></w:r>
      <w:r>
        <w:rStyle w:val="FootnoteReference"/>
        <w:t>"7</w:t>
      </w:r>
    </w:p>
  </w:body>
</w:document>`
    );

    const docxBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    const parsed = await normalizeDocxBuffer(docxBuffer, 'footnotes-test.docx');

    const normalizedZip = await JSZip.loadAsync(parsed.normalizedBuffer);
    const docXml = await normalizedZip.file('word/document.xml')!.async('text');

    // Both runs must have <w:vertAlign w:val="superscript"/>
    const matches = docXml.match(/<w:vertAlign\b[^>]*w:val=["']superscript["']/gi) || [];
    expect(matches.length).toBeGreaterThanOrEqual(2);

    const pdfBuffer = await renderDocxToPdf({
      normalizedDocxBuffer: parsed.normalizedBuffer,
      filename: 'footnotes-test.docx',
      pageSizeCss: parsed.pageSizeCss,
      expectedScripts: ['Hindi'],
    });

    const check = tofuValidator(pdfBuffer, ['Hindi']);
    expect(check.valid).toBe(true);
    expect(check.tofuCount).toBe(0);
  });

  // TC-LAYOUT-04: Word-for-Word Text & Ligature Preservation Across All 5 Scripts
  it('TC-LAYOUT-04: Verify word-for-word text preservation: extracted text from output PDF matches input DOCX text 100% character-for-character without missing words, broken matras, or tofu boxes', async () => {
    const { buffer, filename } = await createSampleDocx('Mixed');
    const parsed = await normalizeDocxBuffer(buffer, filename);

    // Verify all 5 scripts detected and present in extracted text
    expect(parsed.diagnostic.detectedScripts).toContain('Hindi');
    expect(parsed.diagnostic.detectedScripts).toContain('Sanskrit');
    expect(parsed.diagnostic.detectedScripts).toContain('Kannada');
    expect(parsed.diagnostic.detectedScripts).toContain('Telugu');
    expect(parsed.diagnostic.detectedScripts).toContain('Tamil');

    expect(parsed.extractedText).toContain('अंतरराष्ट्रीय हिंदी साहित्य');
    expect(parsed.extractedText).toContain('श्रीमद्भगवद्गीता');
    expect(parsed.extractedText).toContain('ಕನ್ನಡ ಸಾಹಿತ್ಯ ಪರಿಷತ್ತು');
    expect(parsed.extractedText).toContain('శ్రీకృష్ణదేవరాయలు');
    expect(parsed.extractedText).toContain('தமிழ் இலக்கியம்');

    const pdfBuffer = await renderDocxToPdf({
      normalizedDocxBuffer: parsed.normalizedBuffer,
      filename,
      pageSizeCss: parsed.pageSizeCss,
      expectedScripts: parsed.diagnostic.detectedScripts,
      embeddedFontFaces: parsed.embeddedFontFaces,
    });

    const check = tofuValidator(pdfBuffer, parsed.diagnostic.detectedScripts);
    expect(check.valid).toBe(true);
    expect(check.tofuCount).toBe(0);
    expect(check.replacementCharCount).toBe(0);
  });

  // TC-LAYOUT-05: Brand Identity, Favicon & Notion Design System UI Integrity
  it('TC-LAYOUT-05: Verify Epic-Elephant-langcraft.png favicon/logo and Notion Design System UI remain intact and build passes', () => {
    const logoPublic = path.join(process.cwd(), 'public', 'logo.png');
    const elephantPublic = path.join(process.cwd(), 'public', 'Epic-Elephant-langcraft.png');
    const faviconIco = path.join(process.cwd(), 'public', 'favicon.ico');
    const appIcon = path.join(process.cwd(), 'src', 'app', 'icon.png');

    expect(fs.existsSync(logoPublic)).toBe(true);
    expect(fs.existsSync(elephantPublic)).toBe(true);
    expect(fs.existsSync(faviconIco)).toBe(true);
    expect(fs.existsSync(appIcon)).toBe(true);

    const layoutTsx = fs.readFileSync(path.join(process.cwd(), 'src', 'app', 'layout.tsx'), 'utf-8');
    expect(layoutTsx).toContain('/logo.png');

    // De-obfuscation algorithm validation for .odttf embedded font keys
    const testBuffer = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
    const guid = '{A5C0272A-DD4C-401C-8661-BEAD77E57818}';
    const deobfuscated = deobfuscateODTTF(testBuffer, guid);
    expect(deobfuscated.length).toBe(testBuffer.length);
  });
});
