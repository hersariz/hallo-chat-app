// Tipe untuk konfigurasi AI
export type AIConfig = {
  defaultLanguage: string;
  customInstructions: string;
  model: string;
  translateLanguage?: string;
  autoTranslate?: boolean;
};

// Tipe untuk pesan AI
export type AIMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
  replyTo?: {
    index: number;
    content: string;
  };
};

// Tipe untuk hasil terjemahan
export type TranslationResult = {
  originalText: string;
  translatedText: string;
  detectedLanguage: string;
  sourceLang: string;
  targetLang: string;
  error?: string | null;
}; 