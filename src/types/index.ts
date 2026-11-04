export type IndicScript = 'Hindi' | 'Sanskrit' | 'Kannada' | 'Telugu' | 'Tamil';

export interface ScriptDetectionResult {
  script: IndicScript | 'Latin' | 'Mixed';
  confidence: number;
  unicodeBlocks: string[];
  charCount: number;
  hasVedicAccents?: boolean;
  hasOttakshara?: boolean;
  hasVattulu?: boolean;
  hasGrantha?: boolean;
  isLegacyEncoded?: boolean;
  legacyFontName?: string;
}

export interface FontMappingInfo {
  sourceFont: string;
  targetFont: string;
  script: IndicScript | 'General';
  status: 'Ready' | 'Normalized' | 'Transcoded';
  harfbuzzReady: boolean;
}

export interface DocumentDiagnostic {
  filename: string;
  filesize: number;
  detectedScripts: IndicScript[];
  primaryScript: IndicScript | 'Mixed' | 'Latin';
  originalFonts: string[];
  fontMappings: FontMappingInfo[];
  paragraphsCount: number;
  tablesCount: number;
  imageCount?: number;
  legacyFontsDetected: string[];
  harfbuzzCtlStatus: 'Active' | 'Optimized';
  zeroTofuVerified: boolean;
}
