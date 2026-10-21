import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import {
  inspectZipArchive,
  verifyZipMagicBytes,
  validateEntryPath,
  validateXmlSafety,
  SecurityError,
  checkRateLimit,
  sanitizeRelationshipXml,
} from '@/lib/security';

describe('LangCraft Security Architecture & Defenses', () => {
  // TC-07: XXE Injection Defense
  it('TC-07 (XXE Injection Defense): rejects XML containing DOCTYPE or ENTITY definitions with SecurityError (400)', async () => {
    const maliciousXml = `<?xml version="1.0"?>
    <!DOCTYPE foo [
      <!ELEMENT foo ANY >
      <!ENTITY xxe SYSTEM "file:///etc/passwd" >
    ]>
    <foo>&xxe;</foo>`;

    // Direct XML validator assertion
    expect(() => validateXmlSafety(maliciousXml, 'word/document.xml')).toThrowError(
      SecurityError
    );

    // Archive level assertion
    const zip = new JSZip();
    zip.file('[Content_Types].xml', '<Types></Types>');
    zip.file('word/document.xml', maliciousXml);

    const badZipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    await expect(inspectZipArchive(badZipBuffer)).rejects.toThrowError(SecurityError);
  });

  // TC-08: Zip-Bomb & Compression Ratio Defense
  it('TC-08 (Zip-Bomb & Ratio Defense): rejects archives with excessive file count or exceeding compression limits', async () => {
    const zip = new JSZip();
    // Simulate exceeding max entries
    for (let i = 0; i <= 1005; i++) {
      zip.file(`dummy_file_${i}.txt`, '0');
    }

    const bombBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    await expect(inspectZipArchive(bombBuffer)).rejects.toThrowError(
      /Zip entry count .* exceeds limit/
    );
  });

  // TC-09: Magic-Byte Spoofing & Zip-Slip Defense
  it('TC-09 (Magic-Byte Spoofing & Zip-Slip Defense): rejects disguised executables and directory traversal paths', async () => {
    // 1. Executable PE header disguised as .docx
    const fakeExeBuffer = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]);
    expect(() => verifyZipMagicBytes(fakeExeBuffer)).toThrowError(SecurityError);

    // 2. Shell script disguised as .docx
    const fakeScriptBuffer = Buffer.from('#!/bin/bash\necho pwned\n');
    expect(() => verifyZipMagicBytes(fakeScriptBuffer)).toThrowError(SecurityError);

    // 3. Zip-Slip directory traversal entry check
    expect(() => validateEntryPath('../../etc/cron.d/pwn')).toThrowError(
      /Zip-Slip directory traversal/
    );
    expect(() => validateEntryPath('/etc/shadow')).toThrowError(
      /Zip-Slip directory traversal/
    );
    expect(() => validateEntryPath('C:\\Windows\\System32\\calc.exe')).toThrowError(
      /Zip-Slip directory traversal/
    );
  });

  it('strips external OOXML relationships before the renderer can request them', () => {
    const rels =
      '<Relationships><Relationship Id="rId1" Target="https://evil.example/a.png" TargetMode="External"/></Relationships>';
    expect(sanitizeRelationshipXml(rels)).not.toContain('evil.example');
  });

  // Rate Limiting Assertion
  it('Rate Limiting: enforces token-bucket limits for repeated calls from same IP', () => {
    const testIp = '192.168.1.100';
    let allowedCount = 0;
    for (let i = 0; i < 70; i++) {
      if (checkRateLimit(testIp)) {
        allowedCount++;
      }
    }
    // Should cap at MAX_TOKENS (60)
    expect(allowedCount).toBeLessThanOrEqual(60);
  });

  // TC-07b: False-Positive Regression  -  plain "PUBLIC"/"SYSTEM" in document text must NOT be rejected
  it('TC-07b (False-Positive Regression): allows XML containing "PUBLIC" or "SYSTEM" as plain text (not XXE)', () => {
    const legitimateXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Public Health System Report 2026</w:t></w:r></w:p></w:body></w:document>`;
    // Must NOT throw  -  "public"/"system" are plain text, not XXE constructs
    expect(() => validateXmlSafety(legitimateXml, 'word/document.xml')).not.toThrow();
    });
});

