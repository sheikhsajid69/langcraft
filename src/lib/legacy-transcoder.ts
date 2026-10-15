/**
 * Legacy ASCII to Unicode Indic Transcoder
 * Handles legacy non-Unicode fonts (Kruti Dev, Chanakya, Nudi, Baraha, Bamini)
 * Reorders typewriter pre-base matras and reph into canonical Unicode NFC order.
 */

// Kruti Dev 010 / 020 to Unicode Devanagari Mapping
const KRUTI_DEV_MAPPING: Record<string, string> = {
  // Numbers & punctuation
  '0': '०', '1': '१', '2': '२', '3': '३', '4': '४',
  '5': '५', '6': '६', '7': '७', '8': '८', '9': '९',
  '।': '।', 'ñ': '्',

  // Vowels
  'v': 'अ', 'vk': 'आ', 'b': 'इ', 'bZ': 'ई', 'm': 'उ', 'Å': 'ऊ',
  ',': 'ए', ',s': 'ऐ', 'vks': 'ओ', 'vkS': 'औ',

  // Consonants
  'd': 'क', 'D': 'क्', '[k': 'ख', 'X': 'ख्', 'x': 'ग', 'Xk': 'ग्',
  'Ä': 'घ', '?': 'घ्', '³': 'ङ',
  'p': 'च', 'P': 'च्', 'N': 'छ', 't': 'ज', 'T': 'ज्', '¥': 'ञ',
  'V': 'ट', 'B': 'ठ', 'M': 'ड', '<': 'ढ', '.': 'ण्',
  'r': 'त', 'R': 'त्', 'Fk': 'थ', 'F': 'थ्', 'n': 'द', 'è': 'ध्', 'èk': 'ध',
  'u': 'न', 'U': 'न्',
  'i': 'प', 'I': 'प्', 'Q': 'फ', '¶': 'फ्', 'c': 'ब', 'C': 'ब्',
  'Hk': 'भ', 'H': 'भ्', 'e': 'म', 'E': 'म्',
  ';': 'य', ';k': 'या', 'j': 'र', 'y': 'ल', 'Y': 'ल्',
  'o': 'व', 'O': 'व्', 'k': 'ा',
  'kS': 'ौ', 's': 'े', 'S': 'ै', 'ks': 'ो',
  'h': 'ी', 'q': 'ु', 'w': 'ू', '`': 'ृ',
  'a': 'ं', '¡': 'ँ', '%': 'ः',
  '=': 'ृ',
  '\'': 'ऽ',
};

// Bamini (Tamil) to Unicode Mapping
const BAMINI_MAPPING: Record<string, string> = {
  'm': 'அ', 'M': 'ஆ', 'n': 'இ', 'N': 'ஈ', 'c': 'உ', 'C': 'ஊ',
  'v': 'எ', 'V': 'ஏ', 'I': 'ஐ', 'x': 'ஒ', 'X': 'ஓ', 'xs': 'ஔ',
  'f': 'க', 'F': 'க்', ';': 'ங', 'r': 'ச', 'R': 'ச்', 'Q': 'ஞ',
  'l': 'ட', 'L': 'ட்', 'z': 'ண', 'Z': 'ண்', 'j': 'த', 'J': 'த்',
  'e': 'ந', 'E': 'ந்', 'b': 'ப', 'B': 'ப்', 'k': 'ம', 'K': 'ம்',
  'a': 'ய', 'A': 'ய்', 'u': 'ர', 'U': 'ர்', 'y': 'ல', 'Y': 'ல்',
  't': 'வ', 'T': 'வ்', 'o': 'ழ', 'O': 'ழ்', 's': 'ள', 'S': 'ள்',
  'w': 'ற', 'W': 'ற்', 'd': 'ன', 'D': 'ன்',
  'h': 'ா', 'p': 'ி', 'P': 'ீ', 'q': 'ு', 'g': 'ூ',
  '[': 'ெ', '{': 'ே', 'i': 'ை',
};

// Nudi / Baraha (Kannada) Key Elements
const NUDI_MAPPING: Record<string, string> = {
  'a': 'ಅ', 'A': 'ಆ', 'i': 'ಇ', 'I': 'ಈ', 'u': 'ಉ', 'U': 'ಊ',
  'e': 'ಎ', 'E': 'ಏ', 'ai': 'ಐ', 'o': 'ಒ', 'O': 'ಓ', 'au': 'ಔ',
  'k': 'ಕ', 'K': 'ಖ', 'g': 'ಗ', 'G': 'ಘ',
  'c': 'ಚ', 'C': 'ಛ', 'j': 'ಜ', 'J': 'ಝ',
  'T': 'ಟ', 'Th': 'ಠ', 'D': 'ಡ', 'Dh': 'ಢ', 'N': 'ಣ',
  't': 'ತ', 'th': 'ಥ', 'd': 'ದ', 'dh': 'ಧ', 'n': 'ನ',
  'p': 'ಪ', 'P': 'ಫ', 'b': 'ಬ', 'B': 'ಭ', 'm': 'ಮ',
  'y': 'ಯ', 'r': 'ರ', 'l': 'ಲ', 'v': 'ವ', 's': 'ಸ', 'S': 'ಶ', 'sh': 'ಷ', 'h': 'ಹ', 'L': 'ಳ',
  'M': 'ಂ', 'H': 'ಃ',
};

/**
 * Checks if a given font family is a legacy ASCII-encoded Indic font
 */
export function isLegacyFont(fontFamily: string): boolean {
  if (!fontFamily) return false;
  const lower = fontFamily.toLowerCase();
  return (
    lower.includes('kruti') ||
    lower.includes('chanakya') ||
    lower.includes('walkman') ||
    lower.includes('nudi') ||
    lower.includes('baraha') ||
    lower.includes('bamini') ||
    lower.includes('kaveri')
  );
}

/**
 * Identifies the specific legacy font engine
 */
export function identifyLegacyType(
  fontFamily: string
): 'KrutiDev' | 'Chanakya' | 'Nudi' | 'Bamini' | null {
  if (!fontFamily) return null;
  const lower = fontFamily.toLowerCase();
  if (lower.includes('kruti') || lower.includes('chanakya') || lower.includes('walkman')) {
    return 'KrutiDev';
  }
  if (lower.includes('nudi') || lower.includes('baraha')) {
    return 'Nudi';
  }
  if (lower.includes('bamini') || lower.includes('kaveri')) {
    return 'Bamini';
  }
  return null;
}

/**
 * Transcodes Kruti Dev ASCII text to canonical Unicode Devanagari.
 * Handles pre-base short-i ('f') and post-positioned reph ('z') reordering.
 */
export function transcodeKrutiDev(text: string): string {
  if (!text) return '';

  let str = text;

  // Handle special compound symbols in Kruti Dev
  str = str.replace(/ç/g, 'fa'); // short-i + anusvara
  str = str.replace(/ñ/g, '्');

  // Reorder short-i: 'f' followed by consonant should become consonant + '\u093F'
  // Kruti Dev short-i is typed before the consonant (e.g., 'fd' -> 'दि')
  str = str.replace(/f([dD\[xXÄ\?pPtTH¥VBM<\.rRFkFndèèuUipQ¶cCHHkeE;;jlyYoOkSsh])/g, '$1f');

  // Map individual or multi-char ASCII tokens
  let out = '';
  let i = 0;
  while (i < str.length) {
    const three = str.substring(i, i + 3);
    const two = str.substring(i, i + 2);
    const one = str.substring(i, i + 1);

    if (KRUTI_DEV_MAPPING[three]) {
      out += KRUTI_DEV_MAPPING[three];
      i += 3;
    } else if (KRUTI_DEV_MAPPING[two]) {
      out += KRUTI_DEV_MAPPING[two];
      i += 2;
    } else if (one === 'f') {
      out += '\u093F'; // short-i matra
      i += 1;
    } else if (KRUTI_DEV_MAPPING[one]) {
      out += KRUTI_DEV_MAPPING[one];
      i += 1;
    } else {
      out += one;
      i += 1;
    }
  }

  // Reorder reph: In Kruti Dev, 'Z' or 'z' reph character appears after the syllable
  // In Unicode, reph (र + ्) precedes the syllable
  out = out.replace(/([क-ह][ा-ौ]?)[zZ]/g, 'र्$1');
  out = out.replace(/([क-ह]्[क-ह][ा-ौ]?)[zZ]/g, 'र्$1');

  return out.normalize('NFC');
}

/**
 * Transcodes Bamini ASCII text to canonical Unicode Tamil
 */
export function transcodeBamini(text: string): string {
  if (!text) return '';
  let out = '';
  let i = 0;
  while (i < text.length) {
    const two = text.substring(i, i + 2);
    const one = text.substring(i, i + 1);
    if (BAMINI_MAPPING[two]) {
      out += BAMINI_MAPPING[two];
      i += 2;
    } else if (BAMINI_MAPPING[one]) {
      out += BAMINI_MAPPING[one];
      i += 1;
    } else {
      out += one;
      i += 1;
    }
  }
  return out.normalize('NFC');
}

/**
 * Transcodes Nudi ASCII text to canonical Unicode Kannada
 */
export function transcodeNudi(text: string): string {
  if (!text) return '';
  let out = '';
  let i = 0;
  while (i < text.length) {
    const two = text.substring(i, i + 2);
    const one = text.substring(i, i + 1);
    if (NUDI_MAPPING[two]) {
      out += NUDI_MAPPING[two];
      i += 2;
    } else if (NUDI_MAPPING[one]) {
      out += NUDI_MAPPING[one];
      i += 1;
    } else {
      out += one;
      i += 1;
    }
  }
  return out.normalize('NFC');
}

/**
 * Universal transcode entry point: checks font and transcodes accordingly
 */
export function transcodeText(text: string, fontFamily: string): string {
  const legacyType = identifyLegacyType(fontFamily);
  if (!legacyType) return text.normalize('NFC');

  switch (legacyType) {
    case 'KrutiDev':
    case 'Chanakya':
      return transcodeKrutiDev(text);
    case 'Bamini':
      return transcodeBamini(text);
    case 'Nudi':
      return transcodeNudi(text);
    default:
      return text.normalize('NFC');
  }
}
