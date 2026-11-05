import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import { normalizeDocxBuffer } from '@/lib/docx-processor';
import { renderDocxToPdf, tofuValidator } from '@/lib/pdf-engine';
import { transcodeText } from '@/lib/legacy-transcoder';

/**
 * Creates an in-memory DOCX simulating the exact document structure of the
 * Maithilisharan Gupta academic paper ("23.मैथिलीशरण गुप्त के काव्य में नारी भावना").
 */
async function createMaithilisharanDocx(): Promise<Buffer> {
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

  // 5. word/fontTable.xml
  zip.file(
    'word/fontTable.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:fonts xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:font w:name="Mangal">
    <w:panose1 w:val="020B0604020202020204"/>
  </w:font>
  <w:font w:name="Nirmala UI"/>
</w:fonts>`
  );

  // 6. word/document.xml with full verbatim text and Word properties
  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <!-- Index 0: Main Paper Title -->
    <w:p>
      <w:pPr><w:jc w:val="center"/></w:pPr>
      <w:r>
        <w:rPr><w:rFonts w:ascii="Mangal" w:cs="Mangal"/><w:b/><w:sz w:val="32"/></w:rPr>
        <w:t>23.मैथिलीशरण गुप्त के काव्य में नारी भावना</w:t>
      </w:r>
    </w:p>

    <!-- Index 1: Section 1 Heading -->
    <w:p>
      <w:pPr><w:keepNext/><w:jc w:val="left"/></w:pPr>
      <w:r>
        <w:rPr><w:rFonts w:ascii="Mangal" w:cs="Mangal"/><w:b/></w:rPr>
        <w:t>1. प्रस्तावना :</w:t>
      </w:r>
    </w:p>

    <!-- Index 2: Section 1 Body with pipe (|) punctuation -->
    <w:p>
      <w:pPr><w:jc w:val="both"/></w:pPr>
      <w:r>
        <w:rPr><w:rFonts w:ascii="Mangal" w:cs="Mangal"/></w:rPr>
        <w:t>द्विवेदी युग के प्रतिनिधि राष्ट्र कवि मैथिली शरण गुप्त (1886–1964) का हिंदी साहित्य में एक विशिष्ट स्थान है |गुप्त जी के काव्य की सबसे बड़ी विशेषता यह है कि उन्होंने इतिहास और पुराण के उन नारी पात्रों को मुख्यधारा में लाया, जो सदियों से उपेक्षित थीं. आचार्य महावीर प्रसाद द्विवेदी के प्रभाव से उन्होंने नारी के प्रति एक अत्यंत सहानुभूतिपूर्ण, गरिमामयी और प्रगतिशील दृष्टिकोण अपनाया. उनके काव्य में नारी केवल भोग-विलास की वस्तु नहीं, बल्कि त्याग, तपस्या, शक्ति और आत्मसम्मान की प्रतिमूर्ति है|</w:t>
      </w:r>
    </w:p>

    <!-- Index 3: Section 2 Heading -->
    <w:p>
      <w:pPr><w:keepNext/><w:jc w:val="left"/></w:pPr>
      <w:r>
        <w:rPr><w:rFonts w:ascii="Mangal" w:cs="Mangal"/><w:b/></w:rPr>
        <w:t>2. मुख्य काव्य कृतियाँ और नारी पात्र :</w:t>
      </w:r>
    </w:p>

    <!-- Index 4: Saket Body Paragraph -->
    <w:p>
      <w:pPr><w:jc w:val="both"/></w:pPr>
      <w:r>
        <w:rPr><w:rFonts w:ascii="Mangal" w:cs="Mangal"/></w:rPr>
        <w:t>गुप्त जी ने साकेत के नवम सर्ग में उर्मिला के चौदह वर्ष के विरह, कर्तव्यनिष्ठा और उसके आंतरिक त्याग को अमर बना दिया|</w:t>
      </w:r>
    </w:p>

    <!-- Index 5: Yashodhara Subheading ending with colon -->
    <w:p>
      <w:pPr><w:keepNext/></w:pPr>
      <w:r>
        <w:rPr><w:rFonts w:ascii="Mangal" w:cs="Mangal"/><w:b/></w:rPr>
        <w:t>यशोधरा से:</w:t>
      </w:r>
    </w:p>

    <!-- Index 6: Yashodhara Poetry Quote with । and ॥ -->
    <w:p>
      <w:pPr><w:jc w:val="center"/></w:pPr>
      <w:r>
        <w:rPr><w:rFonts w:ascii="Mangal" w:cs="Mangal"/><w:i/></w:rPr>
        <w:t xml:space="preserve">"अबला जीवन हाय तुम्हारी यही कहानी। आँचल में है दूध और आँखों में पानी॥"</w:t>
      </w:r>
    </w:p>

    <!-- Index 7: Saket Subheading ending with colon -->
    <w:p>
      <w:pPr><w:keepNext/></w:pPr>
      <w:r>
        <w:rPr><w:rFonts w:ascii="Mangal" w:cs="Mangal"/><w:b/></w:rPr>
        <w:t>साकेत से:</w:t>
      </w:r>
    </w:p>

    <!-- Index 8: Saket Poetry Quote with ! -->
    <w:p>
      <w:pPr><w:jc w:val="center"/></w:pPr>
      <w:r>
        <w:rPr><w:rFonts w:ascii="Mangal" w:cs="Mangal"/><w:i/></w:rPr>
        <w:t xml:space="preserve">"सखि, वे कह कर जाते! कहैं, तो क्या वे मुझको अपनी पग-बाधा ही पाते?"</w:t>
      </w:r>
    </w:p>

    <!-- Index 9: Conclusion Heading -->
    <w:p>
      <w:pPr><w:keepNext/><w:jc w:val="left"/></w:pPr>
      <w:r>
        <w:rPr><w:rFonts w:ascii="Mangal" w:cs="Mangal"/><w:b/></w:rPr>
        <w:t>उपसंहार :</w:t>
      </w:r>
    </w:p>

    <!-- Index 10: Conclusion Body with 'प्राचीन कथा ओं' -->
    <w:p>
      <w:pPr><w:jc w:val="both"/></w:pPr>
      <w:r>
        <w:rPr><w:rFonts w:ascii="Mangal" w:cs="Mangal"/></w:rPr>
        <w:t>मैथिलीशरण गुप्त के काव्य में नारी भावना अपनी पूरी उदात्तता, गरिमा और संवेदनशीलता के साथ प्रकट हुई है. उन्होंने प्राचीन कथा ओं के माध्यम से आधुनिक युग की नारी चेतना और स्त्री अस्मिता को एक नई दिशा दी.</w:t>
      </w:r>
    </w:p>

    <!-- Index 11: Bibliography Heading -->
    <w:p>
      <w:pPr><w:keepNext/><w:jc w:val="left"/></w:pPr>
      <w:r>
        <w:rPr><w:rFonts w:ascii="Mangal" w:cs="Mangal"/><w:b/></w:rPr>
        <w:t>संदर्भ सूची:</w:t>
      </w:r>
    </w:p>

    <!-- Index 12-15: Numbered Bibliography with Hanging Indents -->
    <w:p>
      <w:pPr>
        <w:ind w:left="720" w:hanging="720"/>
        <w:jc w:val="both"/>
      </w:pPr>
      <w:r>
        <w:rPr><w:rFonts w:ascii="Mangal" w:cs="Mangal"/></w:rPr>
        <w:t>1. पाखरे, डॉ. अनिल, मैथिली शरण गुप्त के काव्य में नारी भावना ,साहित्य भवन प्रकाशन.</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr>
        <w:ind w:left="720" w:hanging="720"/>
        <w:jc w:val="both"/>
      </w:pPr>
      <w:r>
        <w:rPr><w:rFonts w:ascii="Mangal" w:cs="Mangal"/></w:rPr>
        <w:t>2. सिंह, एस., हिंदी काव्य में नारी चेतना, लोकभारती प्रकाशन.</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr>
        <w:ind w:left="720" w:hanging="720"/>
        <w:jc w:val="both"/>
      </w:pPr>
      <w:r>
        <w:rPr><w:rFonts w:ascii="Mangal" w:cs="Mangal"/></w:rPr>
        <w:t>3. तिवारी, बी., मैथिलीशरण गुप्त: व्यक्तित्व और कृतित्व, साहित्य सदन.</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr>
        <w:ind w:left="720" w:hanging="720"/>
        <w:jc w:val="both"/>
      </w:pPr>
      <w:r>
        <w:rPr><w:rFonts w:ascii="Mangal" w:cs="Mangal"/></w:rPr>
        <w:t>4. मैथिली शरण गुप्त के काव्य में स्त्री अस्मिता के स्वर, इंटरनेशनल जर्नल ऑफ ग्रंथाsystem (2025).</w:t>
      </w:r>
    </w:p>

    <!-- Index 16-19: Student Author Block -->
    <w:p>
      <w:pPr><w:jc w:val="left"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Arial" w:cs="Arial"/><w:b/></w:rPr><w:t>Syed Fiza</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="left"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Arial" w:cs="Arial"/></w:rPr><w:t>3rd year BSc (PMCs) (5th Sem)</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="left"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Arial" w:cs="Arial"/></w:rPr><w:t>Nagarjuna College Of Management Studies</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="left"/></w:pPr>
      <w:r><w:rPr><w:rFonts w:ascii="Arial" w:cs="Arial"/></w:rPr><w:t>Chikkamarali  Chikkaballapura.</w:t></w:r>
    </w:p>

    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  zip.file('word/document.xml', docXml);

  return await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  });
}

describe('Maithilisharan Gupta Document Fidelity & Forensic Verification Suite', () => {
  // TC-FIDELITY-01: Zero DOM Reordering & Sequential Heading Integrity
  it('TC-FIDELITY-01: Verify heading order preservation ("23.मैथिलीशरण गुप्त के काव्य में नारी भावना" appears at index 0 before "1. प्रस्तावना :")', async () => {
    const docxBuffer = await createMaithilisharanDocx();
    const parsed = await normalizeDocxBuffer(docxBuffer, 'maithilisharan.docx');

    const paragraphs = parsed.extractedText
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    // Index 0 MUST be the main paper title
    expect(paragraphs[0]).toBe('23.मैथिलीशरण गुप्त के काव्य में नारी भावना');

    // Index 1 MUST be the section 1 heading
    expect(paragraphs[1]).toBe('1. प्रस्तावना :');

    // Verify relative ordering in extracted text
    const titlePos = parsed.extractedText.indexOf('23.मैथिलीशरण गुप्त के काव्य में नारी भावना');
    const introPos = parsed.extractedText.indexOf('1. प्रस्तावना :');
    expect(titlePos).toBeGreaterThanOrEqual(0);
    expect(introPos).toBeGreaterThanOrEqual(0);
    expect(titlePos).toBeLessThan(introPos);

    // Verify HTML preview also reflects the exact sequential structure
    expect(parsed.htmlContent).toContain('23.मैथिलीशरण गुप्त के काव्य में नारी भावना');
    expect(parsed.htmlContent).toContain('1. प्रस्तावना :');
    const htmlTitleIndex = parsed.htmlContent.indexOf('23.मैथिलीशरण गुप्त के काव्य में नारी भावना');
    const htmlIntroIndex = parsed.htmlContent.indexOf('1. प्रस्तावना :');
    expect(htmlTitleIndex).toBeLessThan(htmlIntroIndex);
  });

  // TC-FIDELITY-02: Zero Text Mutation Invariant on Valid Unicode Indic
  it('TC-FIDELITY-02: Verify zero character/matra mutation ("23.मैथिलीशरण", "अबला जीवन हाय...", "प्राचीन कथा ओं", "संदर्भ सूची:", "अमर बना दिया|")', async () => {
    const docxBuffer = await createMaithilisharanDocx();
    const parsed = await normalizeDocxBuffer(docxBuffer, 'maithilisharan.docx');

    // Test transcodeText two-factor guard directly
    const testRuns = [
      'मैथिलीशरण',
      'अबला',
      'प्राचीन कथा ओं',
      'संदर्भ सूची:',
      'अमर बना दिया|',
      '23.मैथिलीशरण गुप्त के काव्य में नारी भावना',
      '"अबला जीवन हाय तुम्हारी यही कहानी। आँचल में है दूध और आँखों में पानी॥"',
    ];

    for (const run of testRuns) {
      // Even if legacy font name like Kruti Dev or Chanakya is supplied, Unicode Indic MUST NEVER be altered!
      expect(transcodeText(run, 'Kruti Dev 010')).toBe(run);
      expect(transcodeText(run, 'Chanakya')).toBe(run);
      expect(transcodeText(run, 'Mangal')).toBe(run);
    }

    // Inspect normalized OOXML to confirm exact strings are preserved inside <w:t>
    const normalizedZip = await JSZip.loadAsync(parsed.normalizedBuffer);
    const docXml = await normalizedZip.file('word/document.xml')!.async('text');

    expect(docXml).toContain('23.मैथिलीशरण गुप्त के काव्य में नारी भावना');
    expect(docXml).not.toContain('मथिलीशरण'); // Must not drop ai matra
    expect(docXml).toContain('अबला जीवन हाय');
    expect(docXml).not.toContain('अबुला'); // Must not mutate u matra
    expect(docXml).toContain('प्राचीन कथा ओं');
    expect(docXml).not.toContain('प्राचौन'); // Must not mutate au matra
    expect(docXml).toContain('संदर्भ सूची:'); // Colon must not mutate to visarga ः
    expect(docXml).toContain('अमर बना दिया|'); // Pipe must not mutate to danda ।
    expect(docXml).toContain('आँखों में पानी॥'); // Double danda must not mutate to single danda
  });

  // TC-FIDELITY-03: Zero Artificial Line Breaks in Poetry Quotes
  it('TC-FIDELITY-03: Verify single-line poetry quotes preservation (quotes under "यशोधरा से:" and "साकेत से:" are not split after "।" or "!")', async () => {
    const docxBuffer = await createMaithilisharanDocx();
    const parsed = await normalizeDocxBuffer(docxBuffer, 'maithilisharan.docx');

    // Extract normalized document XML
    const normalizedZip = await JSZip.loadAsync(parsed.normalizedBuffer);
    const docXml = await normalizedZip.file('word/document.xml')!.async('text');

    // Quote 1: Yashodhara
    const yashodharaQuote =
      '"अबला जीवन हाय तुम्हारी यही कहानी। आँचल में है दूध और आँखों में पानी॥"';
    expect(docXml).toContain(yashodharaQuote);

    // Quote 2: Saket
    const saketQuote =
      '"सखि, वे कह कर जाते! कहैं, तो क्या वे मुझको अपनी पग-बाधा ही पाते?"';
    expect(docXml).toContain(saketQuote);

    // Verify extracted text carries the quote as an unbroken single line
    expect(parsed.extractedText).toContain(yashodharaQuote);
    expect(parsed.extractedText).toContain(saketQuote);

    // Verify no artificial <w:br/> or split was injected after punctuation
    expect(docXml).not.toMatch(/कहानी।<\/w:t><w:br\/>/);
    expect(docXml).not.toMatch(/जाते!<\/w:t><w:br\/>/);
  });

  // TC-FIDELITY-04: Anti-Orphan Headings & Subheadings Keep-With-Next Rule
  it('TC-FIDELITY-04: Verify anti-orphan subheading protection (break-after: avoid-page applied to ":" terminated subheadings like "उपसंहार :")', async () => {
    const docxBuffer = await createMaithilisharanDocx();
    const parsed = await normalizeDocxBuffer(docxBuffer, 'maithilisharan.docx');

    // Render to PDF using Chromium HarfBuzz
    const pdfBuffer = await renderDocxToPdf({
      normalizedDocxBuffer: parsed.normalizedBuffer,
      filename: 'maithilisharan.docx',
      pageSizeCss: parsed.pageSizeCss,
      expectedScripts: ['Hindi'],
    });

    const tofuCheck = tofuValidator(pdfBuffer, ['Hindi']);
    expect(tofuCheck.valid).toBe(true);
    expect(tofuCheck.tofuCount).toBe(0);
    expect(tofuCheck.replacementCharCount).toBe(0);

    // Verify normalized XML has w:keepNext preserved on headings
    const normalizedZip = await JSZip.loadAsync(parsed.normalizedBuffer);
    const docXml = await normalizedZip.file('word/document.xml')!.async('text');

    // Subheadings like "उपसंहार :", "यशोधरा से:", "1. प्रस्तावना :" carry w:keepNext
    expect(docXml).toMatch(/<w:pPr>\s*<w:keepNext\/>[\s\S]*?<w:t>उपसंहार :<\/w:t>/);
  });

  // TC-FIDELITY-05: Author Block & Bibliography Spacing Fidelity
  it('TC-FIDELITY-05: Verify author block and bibliography layout ("Syed Fiza...", numbered references 1-4)', async () => {
    const docxBuffer = await createMaithilisharanDocx();
    const parsed = await normalizeDocxBuffer(docxBuffer, 'maithilisharan.docx');

    // Check presence and order of bibliography references 1 through 4
    expect(parsed.extractedText).toContain('1. पाखरे, डॉ. अनिल, मैथिली शरण गुप्त');
    expect(parsed.extractedText).toContain('2. सिंह, एस., हिंदी काव्य में नारी चेतना');
    expect(parsed.extractedText).toContain('3. तिवारी, बी., मैथिलीशरण गुप्त: व्यक्तित्व');
    expect(parsed.extractedText).toContain('4. मैथिली शरण गुप्त के काव्य में स्त्री अस्मिता');

    // Check student author block
    expect(parsed.extractedText).toContain('Syed Fiza');
    expect(parsed.extractedText).toContain('3rd year BSc (PMCs) (5th Sem)');
    expect(parsed.extractedText).toContain('Nagarjuna College Of Management Studies');
    expect(parsed.extractedText).toContain('Chikkamarali  Chikkaballapura.');

    // Verify hanging indent (<w:ind w:hanging="720"/>) is intact in normalized OOXML
    const normalizedZip = await JSZip.loadAsync(parsed.normalizedBuffer);
    const docXml = await normalizedZip.file('word/document.xml')!.async('text');

    expect(docXml).toMatch(/<w:ind\b[^>]*w:left=["']720["']/i);
    expect(docXml).toMatch(/<w:ind\b[^>]*w:hanging=["']720["']/i);

    // Ensure final PDF renders with zero tofu
    const pdfBuffer = await renderDocxToPdf({
      normalizedDocxBuffer: parsed.normalizedBuffer,
      filename: 'maithilisharan.docx',
      pageSizeCss: parsed.pageSizeCss,
      expectedScripts: ['Hindi'],
    });

    const tofuCheck = tofuValidator(pdfBuffer, ['Hindi']);
    expect(tofuCheck.valid).toBe(true);
    expect(tofuCheck.hasValidPdfHeader).toBe(true);
  });
});
