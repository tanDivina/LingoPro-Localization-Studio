
import { GoogleGenAI, LiveServerMessage, Modality, Type } from "@google/genai";
import { GlossaryTerm, SUPPORTED_LANGUAGES, StyleguideRule, StyleguideReport } from "../types";

export class GeminiService {
  // Simulate an Agency-Scale Translation Memory Lookup (Vector DB)
  async lookupTranslationMemory(source: string, targetLang: string): Promise<string | null> {
    return null; // Local TM handled in component
  }

  // Detect language of the provided text
  async detectLanguage(text: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const validLanguages = SUPPORTED_LANGUAGES.filter(l => l !== 'Auto-Detect').join(", ");
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Identify the language of the following text. 
      Return ONLY the name of the language from this list: [${validLanguages}].
      If not sure, return "English".
      Text: "${text.substring(0, 500)}"`,
      config: {
        temperature: 0,
      }
    });
    const detected = response.text?.trim() || "English";
    return SUPPORTED_LANGUAGES.includes(detected) ? detected : "English";
  }

  // Standard Text Translation with Expert Brand Awareness
  async translateText(text: string, sourceLang: string, targetLang: string, glossary?: GlossaryTerm[], styleguideRules?: StyleguideRule[]) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    let instruction = `Act as an expert technical translator. Translate from ${sourceLang} to ${targetLang}. 
    Preserve structural tags and formatting. Maintain a professional brand tone.`;
    
    if (glossary && glossary.length > 0) {
      const glossaryList = glossary.map(g => `- "${g.source}" MUST be translated as "${g.target}"`).join("\n");
      instruction += `\n\nEXPERT GLOSSARY (Strict Enforcement):\n${glossaryList}`;
    }

    if (styleguideRules && styleguideRules.length > 0) {
      const rules = styleguideRules.map(r => `- ${r.type.toUpperCase()}: Pattern "${r.pattern}" requires: ${r.description}`).join("\n");
      instruction += `\n\nBRAND STYLEGUIDE RULES:\n${rules}`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `${instruction}\n\nTEXT TO TRANSLATE:\n${text}`,
      config: {
        temperature: 0.1,
      }
    });
    return response.text;
  }

  // AI-Powered Styleguide & Brand Compliance Check
  async checkStyleguideCompliance(text: string, targetLang: string, rules: StyleguideRule[]): Promise<StyleguideReport> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const rulesPrompt = rules.map(r => `Rule [${r.id}]: ${r.type} for "${r.pattern}" - ${r.description}`).join("\n");
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Act as a strict Brand Compliance Officer. Check the following ${targetLang} text against our Corporate Styleguide.
      
      STYLEGUIDE RULES:
      ${rulesPrompt}

      TEXT TO SCAN:
      "${text}"

      Identify every single violation. Be pedantic. 
      If a prohibited word is found, flag it. If the tone is wrong, flag it.
      Return a JSON report with the score (0-100) and a list of violations.`,
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
                  ruleId: { type: Type.STRING },
                  foundText: { type: Type.STRING },
                  suggestion: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  severity: { type: Type.STRING, description: "High, Medium, or Low" }
                },
                required: ["foundText", "suggestion", "explanation", "severity"]
              }
            }
          },
          required: ["score", "violations"]
        },
        temperature: 0.1,
      }
    });

    try {
      return JSON.parse(response.text || '{"score": 100, "violations": []}');
    } catch (e) {
      return { score: 100, violations: [] };
    }
  }

  // Extract rules from an existing style guide document
  async parseStyleguideContent(content: string): Promise<StyleguideRule[]> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Analyze the following brand style guide content and extract specific rules for localization.
      
      Classify each rule into one of these categories:
      - prohibited_word: Words or phrases that must NOT be used.
      - mandatory_term: Specific terms that MUST be used.
      - tone_rule: Rules about the voice, persona, or emotional quality of text.
      - formatting_rule: Rules about casing, punctuation, or structure.

      Style Guide Content:
      "${content}"

      Return a JSON array of rules.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, description: "prohibited_word, mandatory_term, tone_rule, or formatting_rule" },
              pattern: { type: Type.STRING, description: "The term or pattern to watch for" },
              description: { type: Type.STRING, description: "A brief explanation of the rule" },
              severity: { type: Type.STRING, description: "High, Medium, or Low" }
            },
            required: ["type", "pattern", "description", "severity"]
          }
        },
        temperature: 0.2,
      }
    });

    try {
      const parsed = JSON.parse(response.text || "[]") as any[];
      return parsed.map((p, i) => ({
        id: `ext-${Date.now()}-${i}`,
        ...p
      }));
    } catch (e) {
      return [];
    }
  }

  // AI-Powered Source Quality Check
  async checkSourceQuality(text: string, sourceLang: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze the following ${sourceLang} text for quality issues including ambiguity, grammatical errors, and awkward phrasing. 
      Provide a list of issues and suggested improvements to make the text easier to translate.
      Return ONLY a JSON object with this structure: { "issues": [{ "type": "Grammar|Ambiguity|Phrasing", "original": "...", "suggestion": "...", "explanation": "..." }], "overall_score": 0-100 }
      Text: "${text}"`,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      }
    });
    return JSON.parse(response.text || '{"issues": [], "overall_score": 100}');
  }

  // Establish a live session for audio-to-audio interpretation
  async connectLiveInterpreter(callbacks: any, systemInstruction: string) {
    // Create a new instance right before making an API call to ensure it always uses the most up-to-date API key.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    return ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      callbacks,
      config: {
        responseModalities: [Modality.AUDIO],
        systemInstruction,
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
        },
      },
    });
  }

  // Analyze text for cultural nuances and return a JSON report
  async analyzeNuance(text: string, culture: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze the following text for cultural suitability in the ${culture} context.
      Identify potential taboos, idioms that don't translate well, tone issues, or grammatical nuances.
      Return a JSON object with a 'nuance_score' (0-100) and an 'insights' array of objects each with 'category', 'message', 'severity', and 'suggestion'.
      
      Text: "${text}"`,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      }
    });
    return response.text || "{}";
  }

  // Generate speech from text using the TTS model
  async generateSpeech(text: string, voiceName: string, emotion?: string, cloningPrompt?: string): Promise<string | undefined> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Construct instructions for emotion or style
    let prompt = text;
    if (emotion && emotion !== 'Neutral') {
      prompt = `Deliver the following text with a ${emotion} emotion: ${text}`;
    }
    if (cloningPrompt) {
      prompt = `Clone the speaking style described as "${cloningPrompt}" and say: ${prompt}`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName as any },
          },
        },
      },
    });
    
    // The audio bytes are in candidates[0].content.parts[0].inlineData.data as base64
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  }

  // Generate Subtitles from Video Metadata or Sample
  async generateSubtitles(fileName: string, targetLang: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a sample set of subtitles for a video titled "${fileName}". 
      The content should be professional and localized into ${targetLang}. 
      Return at least 5 subtitles with start and end times in SRT format style (HH:MM:SS,mmm).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              start: { type: Type.STRING, description: "Start time in HH:MM:SS,mmm format" },
              end: { type: Type.STRING, description: "End time in HH:MM:SS,mmm format" },
              text: { type: Type.STRING, description: "The localized subtitle text" }
            },
            required: ["start", "end", "text"]
          }
        },
        temperature: 0.7,
      }
    });

    try {
      return JSON.parse(response.text || '[]');
    } catch (e) {
      console.error("Failed to parse subtitles:", e);
      return [];
    }
  }
}

export const geminiService = new GeminiService();
