export enum AppView {
  DASHBOARD = 'DASHBOARD',
  FILE_TRANSLATOR = 'FILE_TRANSLATOR',
  LIVE_INTERPRETER = 'LIVE_INTERPRETER',
  TRANSCRIPTION = 'TRANSCRIPTION',
  SUBTITLING = 'SUBTITLING',
  AD_LOCALIZATION = 'AD_LOCALIZATION',
  NUANCE_GUARD = 'NUANCE_GUARD',
  VOICEOVER_STUDIO = 'VOICEOVER_STUDIO',
  PROJECT_VIEW = 'PROJECT_VIEW',
  DOCUMENTATION = 'DOCUMENTATION'
}

export interface StyleguideRule {
  id: string;
  type: 'prohibited_word' | 'mandatory_term' | 'tone_rule' | 'formatting_rule';
  pattern: string;
  replacement?: string;
  description: string;
  severity: 'High' | 'Medium' | 'Low';
  sourceDocId?: string;
}

export interface StyleguideDocument {
  id: string;
  name: string;
  uploadedAt: string;
  size: number;
}

export interface StyleguideReport {
  score: number;
  violations: {
    ruleId?: string;
    foundText: string;
    suggestion: string;
    explanation: string;
    severity: 'High' | 'Medium' | 'Low';
  }[];
}

export interface LocalizationAsset {
  id: string;
  name: string;
  type: string;
  content: string;
  size: number;
  status: 'pending' | 'translating' | 'completed';
  verificationProgress?: number; // % of segments verified by human
  translatedContent?: string;
}

export interface TranslationProject {
  id: string;
  name: string;
  sourceLang: string;
  targetLang: string;
  status: 'In Progress' | 'Completed' | 'Pending';
  progress: number;
  verificationProgress: number; // Human-in-the-loop metric
  lastModified: string;
}

export interface XliffSegment {
  id: string;
  source: string;
  target: string;
  status: 'untranslated' | 'machine_translated' | 'human_verified' | 'low_confidence';
  internalState?: string;
  fileName?: string;
  matchScore?: number; 
  confidenceScore?: number; // AI-assigned confidence 0-100
  matchType?: 'TM' | 'MT' | 'Manual';
  isTranslatable?: boolean;
}

export interface GlossaryTerm {
  source: string;
  target: string;
  description?: string;
}

export const SUPPORTED_LANGUAGES = [
  "Auto-Detect", "Arabic", "Chinese (Simplified)", "Chinese (Traditional)", "Czech", "Danish", "Dutch", "Dutch (Belgium)", "English", "Finnish", "French", "German", "Greek", "Hindi", "Hungarian", "Indonesian", "Italian", "Japanese", "Korean", "Norwegian", "Polish", "Portuguese", "Romanian", "Russian", "Spanish", "Swedish", "Thai", "Turkish", "Ukrainian", "Vietnamese"
];