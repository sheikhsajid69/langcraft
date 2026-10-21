import JSZip from 'jszip';

export class SecurityError extends Error {
  public statusCode: number;
  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.name = 'SecurityError';
    this.statusCode = statusCode;
  }
}

export interface SecurityInspectionResult {
  passed: boolean;
  fileCount: number;
  uncompressedSize: number;
  compressionRatio: number;
  sha256?: string;
}

// Strict Security Limits
export const SECURITY_LIMITS = {
  MAX_FILE_SIZE_BYTES: 25 * 1024 * 1024, // 25 MB
  MAX_UNCOMPRESSED_PAYLOAD_BYTES: 100 * 1024 * 1024, // 100 MB
  MAX_COMPRESSION_RATIO: 100, // 100:1 â€” real DOCX files with verbose OOXML text tables can exceed 40:1
  MAX_ZIP_ENTRIES: 1000,
};

/**
 * 1. Magic-Byte Verification:
 * Validates PKZIP signature bytes (0x50 0x4B 0x03 0x04) and required OOXML parts.
 */
export function verifyZipMagicBytes(buffer: Buffer | Uint8Array): void {
  const bytes = buffer instanceof Buffer ? buffer : Buffer.from(buffer);

  if (bytes.length < 4) {
    throw new SecurityError('Uploaded payload too small to be a valid file.');
  }

  // DOCX packages must begin with a local-file header; empty ZIP signatures are not accepted.
  const isZip =
    bytes[0] === 0x50 &&
    bytes[1] === 0x4b &&
    bytes[2] === 0x03 &&
    bytes[3] === 0x04;

  if (!isZip) {
    throw new SecurityError(
      'Security violation: Invalid magic bytes. Upload must be a valid PKZIP/OOXML archive.',
      400
    );
  }
}

/**
 * 2. Zip-Slip Directory Traversal & 3. XXE/SSRF Prevention:
 * Validates internal entry paths and content.
 */
export function validateEntryPath(entryPath: string): void {
  // Reject path traversal tokens, absolute paths, or Windows drive prefixes
  if (
    entryPath.includes('..') ||
    entryPath.startsWith('/') ||
    entryPath.startsWith('\\') ||
    /^[a-zA-Z]:/.test(entryPath)
  ) {
    throw new SecurityError(
      `Security violation: Zip-Slip directory traversal attempt detected in entry: ${entryPath}`,
      400
    );
  }
}

/**
 * Validates XML string for XXE (external entity, DTD expansion, SYSTEM, PUBLIC).
 * Only matches actual XML DTD/entity constructs — NOT bare occurrences of the words
 * "SYSTEM" or "PUBLIC" in document text, font names, or namespace URIs.
 * Real XXE requires <!DOCTYPE or <!ENTITY followed by those keywords.
 */
export function validateXmlSafety(xmlString: string, filename: string = 'document.xml'): void {
  // <!DOCTYPE and <!ENTITY are never valid in OOXML — reject unconditionally
  if (/<!DOCTYPE[\s>]/i.test(xmlString) || /<!ENTITY[\s%]/i.test(xmlString)) {
    throw new SecurityError(
      `Security violation: XXE payload detected with <!DOCTYPE or <!ENTITY in ${filename}`,
      400
    );
  }

  // SYSTEM/PUBLIC are only dangerous inside a DTD declaration.
  // Match them only when preceded by <!DOCTYPE or <!ENTITY context markers.
  if (/<!(?:DOCTYPE|ENTITY)[^>]*\bSYSTEM\b/i.test(xmlString)) {
    throw new SecurityError(
      `Security violation: XXE SYSTEM entity attempt detected in ${filename}`,
      400
    );
  }

  if (/<!(?:DOCTYPE|ENTITY)[^>]*\bPUBLIC\b/i.test(xmlString)) {
    throw new SecurityError(
      `Security violation: XXE PUBLIC entity attempt detected in ${filename}`,
      400
    );
  }
}

/**
 * Strips or verifies that word/_rels/*.rels does not make outbound network requests
 */
export function sanitizeRelationshipXml(relsXml: string): string {
  validateXmlSafety(relsXml, 'relationships');
  // Remove external relationships regardless of attribute order so the renderer only sees package content.
  return relsXml.replace(/<Relationship\b(?=[^>]*\bTargetMode=["']External["'])[^>]*\/?>(?:<\/Relationship>)?/gi, '');
}

/**
 * Inspects a zip archive against Zip-Bomb, entry limits, and directory traversal
 */
export async function inspectZipArchive(
  buffer: Buffer | Uint8Array
): Promise<SecurityInspectionResult> {
  verifyZipMagicBytes(buffer);

  if (buffer.length > SECURITY_LIMITS.MAX_FILE_SIZE_BYTES) {
    throw new SecurityError(
      `File size (${(buffer.length / (1024 * 1024)).toFixed(2)} MB) exceeds limit of 25 MB.`,
      400
    );
  }

  const zip = await JSZip.loadAsync(buffer);
  const entries = Object.keys(zip.files);
  const fileCount = entries.length;

  if (fileCount > SECURITY_LIMITS.MAX_ZIP_ENTRIES) {
    throw new SecurityError(
      `Zip entry count (${fileCount}) exceeds limit of ${SECURITY_LIMITS.MAX_ZIP_ENTRIES}.`,
      400
    );
  }

  let totalUncompressedSize = 0;

  for (const entryPath of entries) {
    validateEntryPath(entryPath);

    const file = zip.files[entryPath];
    if (file && !file.dir) {
      // In JSZip internal metadata
      const uncompressedSize = (file as any)._data?.uncompressedSize || 0;
      totalUncompressedSize += uncompressedSize;

      if (totalUncompressedSize > SECURITY_LIMITS.MAX_UNCOMPRESSED_PAYLOAD_BYTES) {
        throw new SecurityError(
          `Security violation: Zip-Bomb detected! Uncompressed payload exceeds 100 MB limit.`,
          400
        );
      }

      // Check XML files for XXE
      if (entryPath.endsWith('.xml') || entryPath.endsWith('.rels')) {
        const text = await file.async('text');
        validateXmlSafety(text, entryPath);
      }
    }
  }

  const compressionRatio =
    buffer.length > 0 ? totalUncompressedSize / buffer.length : 1;

  if (compressionRatio > SECURITY_LIMITS.MAX_COMPRESSION_RATIO) {
    throw new SecurityError(
      `Security violation: Suspicious compression ratio (${compressionRatio.toFixed(1)}:1) exceeds 100:1 threshold. Possible Zip-Bomb.`,
      400
    );
  }

  // Verify mandatory OOXML files exist
  if (!zip.file('[Content_Types].xml') || !zip.file('word/document.xml')) {
    throw new SecurityError(
      'Invalid DOCX package: missing [Content_Types].xml or word/document.xml.',
      400
    );
  }

  return {
    passed: true,
    fileCount,
    uncompressedSize: totalUncompressedSize,
    compressionRatio,
  };
}

// In-Memory Token Bucket IP Rate Limiter
interface TokenBucket {
  tokens: number;
  lastRefill: number;
}
const rateLimitMap = new Map<string, TokenBucket>();
const MAX_TOKENS = 60; // 60 requests
const REFILL_INTERVAL_MS = 60 * 1000; // per minute

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  let bucket = rateLimitMap.get(ip);

  if (!bucket) {
    bucket = { tokens: MAX_TOKENS, lastRefill: now };
    rateLimitMap.set(ip, bucket);
  }

  // Refill tokens
  const elapsed = now - bucket.lastRefill;
  if (elapsed > REFILL_INTERVAL_MS) {
    bucket.tokens = MAX_TOKENS;
    bucket.lastRefill = now;
  }

  if (bucket.tokens > 0) {
    bucket.tokens--;
    return true;
  }

  return false;
}
