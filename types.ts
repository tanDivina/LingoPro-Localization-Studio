
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
  translatedContent?: string;
}

export interface TranslationProject {
  id: string;
  name: string;
  sourceLang: string;
  targetLang: string;
  status: 'In Progress' | 'Completed' | 'Pending';
  progress: number;
  lastModified: string;
}

export interface TranscriptionTask {
  id: string;
  fileName: string;
  text: string;
  timestamp: string;
}

export interface XliffSegment {
  id: string;
  source: string;
  target: string;
  status: 'untranslated' | 'translated' | 'approved' | 'locked' | 'hidden';
  internalState?: string;
  fileName?: string;
  isTmMatch?: boolean;
  isTranslatable?: boolean;
}

export interface GlossaryTerm {
  source: string;
  target: string;
  description?: string;
}

export interface TranslationMemoryEntry {
  source: string;
  target: string;
  usageCount: number;
  lastUsed: string;
}

export const SUPPORTED_LANGUAGES = [
  "Auto-Detect",
  "Arabic",
  "Chinese (Simplified)",
  "Chinese (Traditional)",
  "Czech",
  "Danish",
  "Dutch",
  "English",
  "Finnish",
  "French",
  "German",
  "Greek",
  "Hindi",
  "Hungarian",
  "Indonesian",
  "Italian",
  "Japanese",
  "Korean",
  "Norwegian",
  "Polish",
  "Portuguese",
  "Romanian",
  "Russian",
  "Spanish",
  "Swedish",
  "Thai",
  "Turkish",
  "Ukrainian",
  "Vietnamese"
];
