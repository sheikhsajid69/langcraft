import { NextRequest, NextResponse } from 'next/server';
import { inspectZipArchive, SecurityError, checkRateLimit } from '@/lib/security';
import { processDocxBuffer, createSampleDocx } from '@/lib/docx-processor';
import { createPdfDocument, tofuValidator } from '@/lib/pdf-engine';
import { ConversionResponse } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // 1. IP Rate Limiting
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1';

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { success: false, error: 'Rate limit exceeded. Please wait a minute.' },
      { status: 429 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { success: false, error: 'No valid file uploaded.' },
        { status: 400 }
      );
    }

    const filename = (file as any).name || 'document.docx';
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 2. Strict Security Defense (Magic Bytes, Zip Bomb, Zip Slip, XXE)
    await inspectZipArchive(buffer);

    // 3. Process OOXML, rewrite fonts, transcode legacy encodings
    const parsed = await processDocxBuffer(buffer, filename);

    // 4. Generate PDF with HarfBuzz/OpenType vector layout
    const pdfBuffer = await createPdfDocument({
      diagnostic: parsed.diagnostic,
      htmlContent: parsed.htmlContent,
      extractedText: parsed.extractedText,
    });

    // 5. Zero-Tofu Invariant Validation
    const tofuCheck = tofuValidator(pdfBuffer, [parsed.diagnostic.primaryScript]);
    parsed.diagnostic.zeroTofuVerified = tofuCheck.valid;

    if (!tofuCheck.valid) {
      console.warn('Tofu validator warnings:', tofuCheck.errors);
    }

    const pdfBase64 = pdfBuffer.toString('base64');
    const pdfFilename = `${filename.replace(/\.docx$/i, '')}-langcraft.pdf`;

    const responseData: ConversionResponse = {
      success: true,
      diagnostic: parsed.diagnostic,
      htmlContent: parsed.htmlContent,
      pdfBase64,
      pdfFilename,
    };

    return NextResponse.json(responseData, { status: 200 });
  } catch (err: unknown) {
    if (err instanceof SecurityError) {
      return NextResponse.json(
        { success: false, error: err.message },
        { status: err.statusCode }
      );
    }

    const message = err instanceof Error ? err.message : 'Conversion engine error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sampleParam = searchParams.get('sample')?.toLowerCase() || 'hindi';

  let script: 'Hindi' | 'Sanskrit' | 'Kannada' | 'Telugu' | 'Tamil' | 'Mixed' = 'Hindi';
  if (sampleParam === 'sanskrit') script = 'Sanskrit';
  else if (sampleParam === 'kannada') script = 'Kannada';
  else if (sampleParam === 'telugu') script = 'Telugu';
  else if (sampleParam === 'tamil') script = 'Tamil';
  else if (sampleParam === 'mixed') script = 'Mixed';

  try {
    const { buffer, filename } = await createSampleDocx(script);

    // Security check
    await inspectZipArchive(buffer);

    // Process OOXML
    const parsed = await processDocxBuffer(buffer, filename);

    // Render PDF
    const pdfBuffer = await createPdfDocument({
      diagnostic: parsed.diagnostic,
      htmlContent: parsed.htmlContent,
      extractedText: parsed.extractedText,
    });

    // Validate Zero-Tofu
    const tofuCheck = tofuValidator(pdfBuffer, [parsed.diagnostic.primaryScript]);
    parsed.diagnostic.zeroTofuVerified = tofuCheck.valid;

    const pdfBase64 = pdfBuffer.toString('base64');
    const pdfFilename = `${filename.replace(/\.docx$/i, '')}-langcraft.pdf`;

    const responseData: ConversionResponse = {
      success: true,
      diagnostic: parsed.diagnostic,
      htmlContent: parsed.htmlContent,
      pdfBase64,
      pdfFilename,
    };

    return NextResponse.json(responseData, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Sample generation error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
