
import { GoogleGenAI, LiveServerMessage, Modality, Type } from "@google/genai";
import { GlossaryTerm, SUPPORTED_LANGUAGES, StyleguideRule, StyleguideReport } from "../types";

export class GeminiService {
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

  // Standard Text Translation with Brand Awareness
  async translateText(text: string, sourceLang: string, targetLang: string, glossary?: GlossaryTerm[], styleguideRules?: StyleguideRule[]) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    let instruction = "";
    
    if (glossary && glossary.length > 0) {
      const glossaryList = glossary.map(g => `"${g.source}" -> "${g.target}"`).join(", ");
      instruction += `\n\nGLOSSARY: ${glossaryList}. Always use these exact translations.`;
    }

    if (styleguideRules && styleguideRules.length > 0) {
      const rules = styleguideRules.map(r => `- ${r.type.toUpperCase()}: "${r.pattern}" -> ${r.description}`).join("\n");
      instruction += `\n\nBRAND STYLEGUIDE RULES:\n${rules}\nEnsure the translation adheres strictly to these brand guidelines.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Translate from ${sourceLang} to ${targetLang}. Preserve formatting and tone: \n\n${text}${instruction}`,
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

  // Automated Consistency Analysis
  async resolveInconsistency(source: string, variations: string[], targetLang: string, glossary: GlossaryTerm[]) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const glossaryText = glossary.map(g => `${g.source}: ${g.target}`).join(', ');
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `The source text segment "${source}" has been translated inconsistently in these ways for ${targetLang}: [${variations.join(', ')}].
      Considering standard localization practices and this glossary: [${glossaryText}], which translation is the most accurate and consistent? 
      Provide a clear recommendation and a brief linguistic analysis.
      Return ONLY a JSON object with this structure: { "recommendation": "...", "reasoning": "..." }`,
      config: {
        responseMimeType: "application/json",
        temperature: 0.1,
      }
    });
    return JSON.parse(response.text || '{}');
  }

  // Cultural Nuance Analysis
  async analyzeNuance(text: string, targetCulture: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze this localized text for cultural suitability in ${targetCulture}. 
      Identify:
      1. Taboos or offensive phrases.
      2. Idioms that don't translate well.
      3. Tone appropriateness.
      4. A "Nuance Score" from 0 to 100.
      Text: "${text}"`,
      config: {
        responseMimeType: "application/json",
      }
    });
    return response.text;
  }

  // Multimodal Voice Analysis for Cloning
  async analyzeVoice(base64Audio: string, mimeType: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Audio, mimeType } },
          { text: "Analyze the vocal characteristics of this sample. Identify pitch (low/high), timbre (warm/bright), speed, and gender. Suggest which of these prebuilt voices is the best match: Kore, Puck, Charon, Fenrir, Zephyr. Return the results as a JSON object with 'pitch', 'timbre', 'pace', 'match', and 'cloning_prompt' (a brief style instruction)." }
        ]
      },
      config: {
        responseMimeType: "application/json"
      }
    });
    return JSON.parse(response.text || '{}');
  }

  // Generate Speech using Gemini TTS
  async generateSpeech(text: string, voiceName: 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr' = 'Kore', emotion: string = 'Neutral', cloningPrompt?: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // If we have a cloning prompt, we prepend it to guide the TTS generation style
    const instruction = cloningPrompt ? `[STYLE: ${cloningPrompt}] ` : "";
    const prompt = emotion === 'Neutral' ? `${instruction}${text}` : `${instruction}Say ${emotion.toLowerCase()}: ${text}`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  }

  // Connect to Live API for Interpreting
  connectLiveInterpreter(callbacks: {
    onopen: () => void;
    onmessage: (msg: LiveServerMessage) => void;
    onerror: (e: any) => void;
    onclose: (e: any) => void;
  }, systemInstruction: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    return ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      callbacks,
      config: {
        responseModalalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
        },
        systemInstruction,
      },
    });
  }

  // Dictation using Live API transcription
  connectVoiceDictation(callbacks: {
    onopen: () => void;
    onmessage: (msg: LiveServerMessage) => void;
    onerror: (e: any) => void;
    onclose: (e: any) => void;
  }) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    return ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      callbacks,
      config: {
        responseModalalities: [Modality.AUDIO],
        inputAudioTranscription: {},
        systemInstruction: 'You are a professional transcription assistant. Transcribe the user audio input accurately.',
      }
    });
  }
}

export const geminiService = new GeminiService();
