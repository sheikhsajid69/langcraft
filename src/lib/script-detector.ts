import { IndicScript, ScriptDetectionResult } from '@/types';

/**
 * Indic Unicode block ranges and regex patterns
 */
export const SCRIPT_PATTERNS = {
  devanagari: /[\u0900-\u097F]/g,
  devanagariExtended: /[\uA8E0-\uA8FF]/g,
  vedicExtensions: /[\u1CD0-\u1CFF]/g,
  kannada: /[\u0C80-\u0CFF]/g,
  telugu: /[\u0C00-\u0C7F]/g,
  tamil: /[\u0B80-\u0BFF]/g,
};

/**
 * Analyzes a text string to classify Indic scripts, identify linguistic features,
 * and differentiate Sanskrit from Hindi.
 */
export function detectScriptsInText(text: string): ScriptDetectionResult[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const results: ScriptDetectionResult[] = [];
  const normalized = text.normalize('NFC');

  // Count script occurrences
  const devanagariMatches = normalized.match(SCRIPT_PATTERNS.devanagari) || [];
  const devExtMatches = normalized.match(SCRIPT_PATTERNS.devanagariExtended) || [];
  const vedicMatches = normalized.match(SCRIPT_PATTERNS.vedicExtensions) || [];
  const kannadaMatches = normalized.match(SCRIPT_PATTERNS.kannada) || [];
  const teluguMatches = normalized.match(SCRIPT_PATTERNS.telugu) || [];
  const tamilMatches = normalized.match(SCRIPT_PATTERNS.tamil) || [];

  const totalDevanagari = devanagariMatches.length + devExtMatches.length + vedicMatches.length;

  // 1. Devanagari Analysis (Hindi vs. Sanskrit)
  if (totalDevanagari > 0) {
    const hasVedicAccents = vedicMatches.length > 0 || devExtMatches.length > 0;

    // Sanskrit linguistic markers:
    // Avagraha (ऽ), Visarga (ः), Om (ॐ), high virama density (्), halant endings
    const viramaCount = (normalized.match(/\u094D/g) || []).length;
    const avagrahaCount = (normalized.match(/\u093D/g) || []).length;
    const visargaCount = (normalized.match(/\u0903/g) || []).length;
    const omCount = (normalized.match(/\u0950/g) || []).length;
    const halantEndingCount = (normalized.match(/[\u0915-\u0939]\u094D(?=[\s\.,।॥!?\-]|$)/g) || []).length;

    const viramaDensity = devanagariMatches.length > 0 ? viramaCount / devanagariMatches.length : 0;

    // Sanskrit classification criteria:
    // - Presence of Vedic accents
    // - Visarga + Avagraha presence
    // - Or high virama density (> 10%) with halant endings common in Sanskrit inflexions
    const isSanskrit =
      hasVedicAccents ||
      (visargaCount > 0 && (avagrahaCount > 0 || omCount > 0 || halantEndingCount > 0)) ||
      (viramaDensity >= 0.10 && (visargaCount > 0 || halantEndingCount > 0 || omCount > 0));

    results.push({
      script: isSanskrit ? 'Sanskrit' : 'Hindi',
      confidence: Math.min(1.0, totalDevanagari / 10),
      unicodeBlocks: [
        'U+0900–U+097F (Devanagari)',
        ...(devExtMatches.length > 0 ? ['U+A8E0–U+A8FF (Devanagari Extended)'] : []),
        ...(vedicMatches.length > 0 ? ['U+1CD0–U+1CFF (Vedic Extensions)'] : []),
      ],
      charCount: totalDevanagari,
      hasVedicAccents,
    });
  }

  // 2. Kannada Analysis
  if (kannadaMatches.length > 0) {
    const ottaksharaMatches = normalized.match(/[\u0C95-\u0CB9]\u0CCD[\u0C95-\u0CB9]/g) || [];
    const arkavattuMatches = normalized.match(/\u0CB0\u0CCD[\u0C95-\u0CB9]/g) || [];

    results.push({
      script: 'Kannada',
      confidence: Math.min(1.0, kannadaMatches.length / 10),
      unicodeBlocks: ['U+0C80–U+0CFF (Kannada)'],
      charCount: kannadaMatches.length,
      hasOttakshara: ottaksharaMatches.length > 0 || arkavattuMatches.length > 0,
    });
  }

  // 3. Telugu Analysis
  if (teluguMatches.length > 0) {
    const vattuluMatches = normalized.match(/[\u0C15-\u0C39]\u0C4D[\u0C15-\u0C39]/g) || [];

    results.push({
      script: 'Telugu',
      confidence: Math.min(1.0, teluguMatches.length / 10),
      unicodeBlocks: ['U+0C00–U+0C7F (Telugu)'],
      charCount: teluguMatches.length,
      hasVattulu: vattuluMatches.length > 0,
    });
  }

  // 4. Tamil Analysis
  if (tamilMatches.length > 0) {
    // Grantha loan ligatures & characters: ஸ (\u0BB8), ஷ (\u0BB7), ஜ (\u0B9C), ஹ (\u0BB9), க்ஷ, ஸ்ரீ
    const granthaMatches =
      normalized.match(/[\u0BB8\u0BB7\u0B9C\u0BB9]|\u0B95\u0BCD\u0BB7|\u0BB8\u0BCD\u0BB0\u0BC0/g) || [];

    results.push({
      script: 'Tamil',
      confidence: Math.min(1.0, tamilMatches.length / 10),
      unicodeBlocks: ['U+0B80–U+0BFF (Tamil)'],
      charCount: tamilMatches.length,
      hasGrantha: granthaMatches.length > 0,
    });
  }

  return results;
}

/**
 * Returns primary script classification for a document based on character counts
 */
export function determinePrimaryScript(results: ScriptDetectionResult[]): IndicScript | 'Mixed' | 'Latin' {
  if (results.length === 0) return 'Latin';
  if (results.length === 1 && results[0]) return results[0].script as IndicScript;

  // If multiple Indic scripts exist, determine if one is dominant or if it's truly polyglot
  const sorted = [...results].sort((a, b) => b.charCount - a.charCount);
  const top = sorted[0];
  const second = sorted[1];

  if (top && second && top.charCount > second.charCount * 3) {
    return top.script as IndicScript;
  }

  return 'Mixed';
}
