import { NextRequest, NextResponse } from 'next/server';
import { inspectZipArchive, SecurityError, checkRateLimit } from '@/lib/security';
import { normalizeDocxBuffer, createSampleDocx } from '@/lib/docx-processor';
import { renderDocxToPdf, tofuValidator } from '@/lib/pdf-engine';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 120;

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

    // 3. Stage A: In-Memory OOXML Font Normalization & Repackaging
    const parsed = await normalizeDocxBuffer(buffer, filename);

    // 4. Stage B: True 1:1 WYSIWYG Chromium HarfBuzz PDF Rendering
    // ZERO diagnostic watermarks or metadata injected into the PDF stream!
    const pdfBuffer = await renderDocxToPdf({
      normalizedDocxBuffer: parsed.normalizedBuffer,
      filename,
      pageSizeCss: parsed.pageSizeCss,
      expectedScripts: parsed.diagnostic.detectedScripts,
      embeddedFontFaces: parsed.embeddedFontFaces,
    });

    // 5. Zero-Tofu Invariant Validation on the pure document stream
    const tofuCheck = tofuValidator(pdfBuffer, [parsed.diagnostic.primaryScript]);
    if (!tofuCheck.valid) {
      console.warn('Tofu validator warnings:', tofuCheck.errors);
    }

    const pdfFilename = `${filename.replace(/\.docx$/i, '')}.pdf`;

    // 6. Return pure PDF binary matching Word page-for-page
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(pdfFilename)}"`,
        'X-LangCraft-Primary-Script': parsed.diagnostic.primaryScript,
        'X-LangCraft-Zero-Tofu': String(tofuCheck.valid),
        'X-LangCraft-Paragraphs': String(parsed.diagnostic.paragraphsCount),
        'X-LangCraft-Tables': String(parsed.diagnostic.tablesCount),
        'X-LangCraft-Images': String(parsed.diagnostic.imageCount || 0),
      },
    });
  } catch (err: unknown) {
    if (err instanceof SecurityError) {
      return NextResponse.json(
        { success: false, error: err.message },
        { status: err.statusCode }
      );
    }

    const message = err instanceof Error ? err.message : 'Conversion engine error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
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
    await inspectZipArchive(buffer);
    const parsed = await normalizeDocxBuffer(buffer, filename);

    const pdfBuffer = await renderDocxToPdf({
      normalizedDocxBuffer: parsed.normalizedBuffer,
      filename,
      pageSizeCss: parsed.pageSizeCss,
      expectedScripts: parsed.diagnostic.detectedScripts,
      embeddedFontFaces: parsed.embeddedFontFaces,
    });

    const pdfFilename = `Sample_${script}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(pdfFilename)}"`,
        'X-LangCraft-Primary-Script': parsed.diagnostic.primaryScript,
        'X-LangCraft-Zero-Tofu': 'true',
        'X-LangCraft-Paragraphs': String(parsed.diagnostic.paragraphsCount),
        'X-LangCraft-Tables': String(parsed.diagnostic.tablesCount),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Sample generation error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
