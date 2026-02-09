
import { GoogleGenAI, Type } from "@google/genai";
import { GlossaryTerm, SUPPORTED_LANGUAGES, StyleguideRule, StyleguideReport } from "../types";

export class GeminiService {
  async lookupTranslationMemory(source: string, targetLang: string): Promise<string | null> {
    return null; 
  }

  async detectLanguage(text: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const validLanguages = SUPPORTED_LANGUAGES.filter(l => l !== 'Auto-Detect').join(", ");
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Identify the language of the following text. Return ONLY the name from: [${validLanguages}]. Text: "${text.substring(0, 500)}"`,
      config: { temperature: 0 }
    });
    const detected = response.text?.trim() || "English";
    return SUPPORTED_LANGUAGES.includes(detected) ? detected : "English";
  }

  async translateWithConfidence(text: string, sourceLang: string, targetLang: string, glossary?: GlossaryTerm[], styleguideRules?: StyleguideRule[]) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    let instruction = `Act as an expert technical translator. Translate from ${sourceLang} to ${targetLang}. 
    Return a JSON object containing the 'translation' and a 'confidence' score (0-100) based on your linguistic certainty.`;
    
    if (glossary && glossary.length > 0) {
      const list = glossary.map(g => `- "${g.source}" -> "${g.target}"`).join("\n");
      instruction += `\n\nGLOSSARY CONSTRAINTS (Strictly use these targets):\n${list}`;
    }

    if (styleguideRules && styleguideRules.length > 0) {
      const rules = styleguideRules.map(r => `- ${r.type.toUpperCase()}: Pattern "${r.pattern}". ${r.description} ${r.replacement ? `(Suggested replacement: ${r.replacement})` : ''}`).join("\n");
      instruction += `\n\nSTYLEGUIDE COMPLIANCE RULES (Strictly adhere to these):\n${rules}`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `${instruction}\n\nTEXT TO TRANSLATE:\n${text}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            translation: { type: Type.STRING },
            confidence: { type: Type.NUMBER }
          },
          required: ["translation", "confidence"]
        }
      }
    });

    try {
      return JSON.parse(response.text || '{"translation": "", "confidence": 0}');
    } catch (e) {
      return { translation: text, confidence: 0 };
    }
  }

  async translateText(text: string, sourceLang: string, targetLang: string, glossary?: GlossaryTerm[], styleguideRules?: StyleguideRule[]) {
    const result = await this.translateWithConfidence(text, sourceLang, targetLang, glossary, styleguideRules);
    return result.translation;
  }

  async analyzeTranscreation(sourceImageBase64: string, sourceLang: string, targetLang: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { inlineData: { data: sourceImageBase64, mimeType: 'image/jpeg' } },
          { text: `Analyze this ad for STRATEGIC MARKETING TRANSCREATION from ${sourceLang} to ${targetLang}.` }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            brand_essence: { type: Type.STRING },
            source_context: { type: Type.STRING },
            pivot_suggestion: { type: Type.STRING },
            cultural_fit_score: { type: Type.NUMBER },
            markers: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  original: { type: Type.STRING },
                  suggested_adaptation: { type: Type.STRING },
                  rationale: { type: Type.STRING },
                  type: { type: Type.STRING }
                }
              }
            }
          },
          required: ["brand_essence", "source_context", "pivot_suggestion", "cultural_fit_score", "markers"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  }

  async generateLocalizedConcept(prompt: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: `Mockup concept: ${prompt}` }] }
    });
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    return null;
  }

  async checkStyleguideCompliance(text: string, targetLang: string, rules: StyleguideRule[]): Promise<StyleguideReport> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const rulesPrompt = rules.map(r => `Rule [${r.id}]: ${r.type} - ${r.description}`).join("\n");
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Brand Compliance Check:\n${rulesPrompt}\n\nTEXT:\n"${text}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            violations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  foundText: { type: Type.STRING },
                  suggestion: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  severity: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });
    return JSON.parse(response.text || '{"score": 100, "violations": []}');
  }

  async checkSourceQuality(text: string, sourceLang: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Quality check ${sourceLang} text: "${text}"`,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '{"issues": [], "overall_score": 100}');
  }

  async connectLiveInterpreter(callbacks: any, systemInstruction: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    return ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      callbacks,
      config: {
        responseModalities: ["AUDIO" as any],
        systemInstruction,
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } }
      }
    });
  }

  async analyzeNuance(text: string, culture: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Culture scan (${culture}): "${text}"`,
      config: { responseMimeType: "application/json" }
    });
    return response.text || "{}";
  }

  async generateSpeech(text: string, voiceName: string, emotion?: string, cloningPrompt?: string): Promise<string | undefined> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: ["AUDIO" as any],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName as any } } }
      }
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  }

  async generateSubtitles(fileName: string, targetLang: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Subtitles for "${fileName}" in ${targetLang}`,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '[]');
  }
}
export const geminiService = new GeminiService();
