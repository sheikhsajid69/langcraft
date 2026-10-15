import { NextRequest, NextResponse } from 'next/server';
import { inspectZipArchive, SecurityError, checkRateLimit } from '@/lib/security';
import { normalizeDocxBuffer, createSampleDocx } from '@/lib/docx-processor';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
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

    // Security Defense Verification
    await inspectZipArchive(buffer);

    // In-memory OOXML inspection and normalization
    const parsed = await normalizeDocxBuffer(buffer, filename);

    return NextResponse.json(
      {
        success: true,
        diagnostic: parsed.diagnostic,
        htmlContent: parsed.htmlContent,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    if (err instanceof SecurityError) {
      return NextResponse.json(
        { success: false, error: err.message },
        { status: err.statusCode }
      );
    }

    const message = err instanceof Error ? err.message : 'Inspection error';
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

    return NextResponse.json(
      {
        success: true,
        diagnostic: parsed.diagnostic,
        htmlContent: parsed.htmlContent,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Sample inspection error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
