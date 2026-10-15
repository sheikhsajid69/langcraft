import { describe, it, expect } from 'vitest';
import { detectScriptsInText } from '@/lib/script-detector';
import { processDocxBuffer, createSampleDocx, mapFontFamily } from '@/lib/docx-processor';
import { createPdfDocument, renderDocxToPdf, tofuValidator } from '@/lib/pdf-engine';
import { transcodeKrutiDev, transcodeNudi, transcodeBamini } from '@/lib/legacy-transcoder';

describe('LangCraft Indic Conversion Engine - Mandatory Test Suite', () => {
  // TC-01: Hindi Matras & Conjuncts
  it('TC-01 (Hindi Matras & Conjuncts): accurately detects Hindi, maps Mangal/Nirmala UI, generates zero-tofu PDF', async () => {
    const hindiText = 'अंतरराष्ट्रीय हिंदी साहित्य में नारी विमर्श — द्वंद्व, श्रृंगार, उज्ज्वल, राष्ट्रीय';
    const detection = detectScriptsInText(hindiText);

    expect(detection.length).toBeGreaterThan(0);
    expect(detection[0]?.script).toBe('Hindi');

    const mapped = mapFontFamily('Mangal', 'Hindi');
    expect(mapped.targetFont).toBe('Noto Sans Devanagari');

    const { buffer, filename } = await createSampleDocx('Hindi');
    const parsed = await processDocxBuffer(buffer, filename);

    expect(parsed.diagnostic.primaryScript).toBe('Hindi');
    expect(parsed.diagnostic.fontMappings.some((m) => m.targetFont === 'Noto Sans Devanagari')).toBe(true);

    const pdfBuffer = await renderDocxToPdf({
      normalizedDocxBuffer: parsed.normalizedBuffer,
      filename: parsed.diagnostic.filename,
      pageSizeCss: parsed.pageSizeCss,
      expectedScripts: ['Hindi'],
    });

    const tofuCheck = tofuValidator(pdfBuffer, ['Hindi']);
    expect(tofuCheck.hasValidPdfHeader).toBe(true);
    expect(tofuCheck.replacementCharCount).toBe(0);
    expect(tofuCheck.tofuCount).toBe(0);
    expect(tofuCheck.valid).toBe(true);
  });

  // TC-02: Sanskrit Samyuktaksharas & Vedic Marks
  it('TC-02 (Sanskrit Samyuktaksharas & Vedic Marks): distinguishes Sanskrit from Hindi, maps Kokila, 0 tofu boxes', async () => {
    const sanskritText =
      'ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि — कार्त्स्न्यम्, द्ध्व, क्त्र्य, श्रीमद्भगवद्गीता';
    const detection = detectScriptsInText(sanskritText);

    expect(detection.length).toBeGreaterThan(0);
    expect(detection[0]?.script).toBe('Sanskrit');

    const mapped = mapFontFamily('Kokila', 'Sanskrit');
    expect(mapped.targetFont).toBe('Noto Serif Devanagari');

    const { buffer, filename } = await createSampleDocx('Sanskrit');
    const parsed = await processDocxBuffer(buffer, filename);

    expect(parsed.diagnostic.primaryScript).toBe('Sanskrit');

    const pdfBuffer = await renderDocxToPdf({
      normalizedDocxBuffer: parsed.normalizedBuffer,
      filename: parsed.diagnostic.filename,
      pageSizeCss: parsed.pageSizeCss,
      expectedScripts: ['Sanskrit'],
    });

    const tofuCheck = tofuValidator(pdfBuffer, ['Sanskrit']);
    expect(tofuCheck.replacementCharCount).toBe(0);
    expect(tofuCheck.tofuCount).toBe(0);
    expect(tofuCheck.valid).toBe(true);
  });

  // TC-03: Kannada Ottaksharas & Arkavattu
  it('TC-03 (Kannada Ottaksharas & Arkavattu): detects Kannada and ottakshara, maps Tunga to Noto Sans Kannada, 0 tofu boxes', async () => {
    const kannadaText = 'ಕನ್ನಡ ಸಾಹಿತ್ಯ ಪರಿಷತ್ತು — ರಾಷ್ಟ್ರೀಯ, ವಿಶ್ವವಿದ್ಯಾಲಯ, ಸಂಸ್ಕೃತಿ, ಜ್ಞಾನಪೀಠ';
    const detection = detectScriptsInText(kannadaText);

    expect(detection.length).toBeGreaterThan(0);
    expect(detection[0]?.script).toBe('Kannada');
    expect(detection[0]?.hasOttakshara).toBe(true);

    const mapped = mapFontFamily('Tunga', 'Kannada');
    expect(mapped.targetFont).toBe('Noto Sans Kannada');

    const { buffer, filename } = await createSampleDocx('Kannada');
    const parsed = await processDocxBuffer(buffer, filename);

    expect(parsed.diagnostic.primaryScript).toBe('Kannada');

    const pdfBuffer = await renderDocxToPdf({
      normalizedDocxBuffer: parsed.normalizedBuffer,
      filename: parsed.diagnostic.filename,
      pageSizeCss: parsed.pageSizeCss,
      expectedScripts: ['Kannada'],
    });

    const tofuCheck = tofuValidator(pdfBuffer, ['Kannada']);
    expect(tofuCheck.replacementCharCount).toBe(0);
    expect(tofuCheck.tofuCount).toBe(0);
    expect(tofuCheck.valid).toBe(true);
  });

  // TC-04: Telugu Vattulu & Pollu
  it('TC-04 (Telugu Vattulu & Pollu): detects Telugu vattulu, maps Gautami to Noto Sans Telugu, 0 tofu boxes', async () => {
    const teluguText = 'తెలుగు సాహిత్యం — విశ్వవిద్యాలయం, సంస్కృతి, క్షేత్రం, రాష్ట్రం, శ్రీకృష్ణదేవరాయలు';
    const detection = detectScriptsInText(teluguText);

    expect(detection.length).toBeGreaterThan(0);
    expect(detection[0]?.script).toBe('Telugu');
    expect(detection[0]?.hasVattulu).toBe(true);

    const mapped = mapFontFamily('Gautami', 'Telugu');
    expect(mapped.targetFont).toBe('Noto Sans Telugu');

    const { buffer, filename } = await createSampleDocx('Telugu');
    const parsed = await processDocxBuffer(buffer, filename);

    expect(parsed.diagnostic.primaryScript).toBe('Telugu');

    const pdfBuffer = await renderDocxToPdf({
      normalizedDocxBuffer: parsed.normalizedBuffer,
      filename: parsed.diagnostic.filename,
      pageSizeCss: parsed.pageSizeCss,
      expectedScripts: ['Telugu'],
    });

    const tofuCheck = tofuValidator(pdfBuffer, ['Telugu']);
    expect(tofuCheck.replacementCharCount).toBe(0);
    expect(tofuCheck.tofuCount).toBe(0);
    expect(tofuCheck.valid).toBe(true);
  });

  // TC-05: Tamil Uyirmei & Grantha Ligatures
  it('TC-05 (Tamil Uyirmei & Grantha Ligatures): detects Tamil and Grantha (க்ஷ, ஸ்ரீ), maps Latha to Noto Sans Tamil, 0 tofu boxes', async () => {
    const tamilText = 'தமிழ் இலக்கியம் — செம்மொழி, பல்கலைக்கழகம், க்ஷேத்ரம், ஸ்ரீரங்கம், ஐந்தாம்';
    const detection = detectScriptsInText(tamilText);

    expect(detection.length).toBeGreaterThan(0);
    expect(detection[0]?.script).toBe('Tamil');
    expect(detection[0]?.hasGrantha).toBe(true);

    const mapped = mapFontFamily('Latha', 'Tamil');
    expect(mapped.targetFont).toBe('Noto Sans Tamil');

    const { buffer, filename } = await createSampleDocx('Tamil');
    const parsed = await processDocxBuffer(buffer, filename);

    expect(parsed.diagnostic.primaryScript).toBe('Tamil');

    const pdfBuffer = await renderDocxToPdf({
      normalizedDocxBuffer: parsed.normalizedBuffer,
      filename: parsed.diagnostic.filename,
      pageSizeCss: parsed.pageSizeCss,
      expectedScripts: ['Tamil'],
    });

    const tofuCheck = tofuValidator(pdfBuffer, ['Tamil']);
    expect(tofuCheck.replacementCharCount).toBe(0);
    expect(tofuCheck.tofuCount).toBe(0);
    expect(tofuCheck.valid).toBe(true);
  });

  // TC-06: Mixed 5-Script Polyglot DOCX
  it('TC-06 (Mixed 5-Script Polyglot DOCX): handles Hindi, Sanskrit, Kannada, Telugu, and Tamil in one document simultaneously with 0 tofu', async () => {
    const { buffer, filename } = await createSampleDocx('Mixed');
    const parsed = await processDocxBuffer(buffer, filename);

    expect(parsed.diagnostic.tablesCount).toBeGreaterThanOrEqual(1);
    expect(parsed.diagnostic.detectedScripts.length).toBeGreaterThanOrEqual(4);

    const pdfBuffer = await renderDocxToPdf({
      normalizedDocxBuffer: parsed.normalizedBuffer,
      filename: parsed.diagnostic.filename,
      pageSizeCss: parsed.pageSizeCss,
      expectedScripts: parsed.diagnostic.detectedScripts,
    });

    const tofuCheck = tofuValidator(pdfBuffer, parsed.diagnostic.detectedScripts);
    expect(tofuCheck.replacementCharCount).toBe(0);
    expect(tofuCheck.tofuCount).toBe(0);
    expect(tofuCheck.valid).toBe(true);
  });

  // TC-10: Legacy Font Transcoding
  it('TC-10 (Legacy Font Transcoding): converts Kruti Dev, Nudi, and Bamini to canonical NFC Unicode with reordering', () => {
    // In Kruti Dev: 'fd' is typewriter short-i + 'd' (क) -> becomes 'कि' (क + ि)
    const krutiRaw = 'fd';
    const krutiTranscoded = transcodeKrutiDev(krutiRaw);
    expect(krutiTranscoded).toBe('कि');

    // Kruti Dev with reph 'Z': 'èkeZ' -> 'धर्म'
    const krutiDharma = 'èkeZ';
    const transcodedDharma = transcodeKrutiDev(krutiDharma);
    expect(transcodedDharma).toBe('धर्म');

    // Nudi Kannada transcoding
    const nudiRaw = 'kannada';
    const nudiTranscoded = transcodeNudi(nudiRaw);
    expect(nudiTranscoded.length).toBeGreaterThan(0);

    // Bamini Tamil transcoding
    const baminiRaw = 'f';
    const baminiTranscoded = transcodeBamini(baminiRaw);
    expect(baminiTranscoded).toBe('க');
  });

  // TC-11: 1:1 WYSIWYG Document Rendering without Diagnostics
  it('TC-11 (1:1 WYSIWYG Document Rendering): produces 100% pure document PDF without diagnostic watermarks', async () => {
    const { buffer, filename } = await createSampleDocx('Hindi');
    const parsed = await processDocxBuffer(buffer, filename);

    const pdfBuffer = await renderDocxToPdf({
      normalizedDocxBuffer: parsed.normalizedBuffer,
      filename,
      pageSizeCss: parsed.pageSizeCss,
      expectedScripts: ['Hindi'],
    });

    const pdfString = pdfBuffer.toString('latin1');

    // Assert that NO diagnostic manifest text is present in the PDF output
    expect(pdfString.includes('LangCraft | Verified Zero-Tofu Indic PDF')).toBe(false);
    expect(pdfString.includes('Indic Typography & Font Substitution Manifest')).toBe(false);
    expect(pdfString.includes('Total Paragraphs:')).toBe(false);
    expect(pdfString.includes('[PASS] Invariant Verified')).toBe(false);

    // Assert that the PDF is a valid vector stream
    expect(pdfBuffer.length).toBeGreaterThan(1000);
    const tofuCheck = tofuValidator(pdfBuffer, ['Hindi']);
    expect(tofuCheck.valid).toBe(true);
  });
});
