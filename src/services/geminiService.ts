import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Word } from "../types";
import { v4 as uuidv4 } from 'uuid';

function getAI() {
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

export async function generateSceneImage(prompt: string, style: string): Promise<string> {
  const ai = getAI();
  const fullPrompt = `${prompt}, ${style} style, high quality, detailed, clear objects`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { text: fullPrompt }
      ]
    },
    config: {
      imageConfig: {
        aspectRatio: "9:16",
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }
  
  throw new Error("Failed to generate image");
}

export async function analyzeScene(base64Image: string, language: string): Promise<Omit<Word, 'id' | 'scene_id'>[]> {
  const ai = getAI();
  // Extract base64 data without prefix
  const base64Data = base64Image.split(',')[1];
  const mimeType = base64Image.split(';')[0].split(':')[1];

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          }
        },
        {
          text: `Analyze this image and identify 5-8 distinct, common objects. For each object, provide:
          1. The word in ${language}.
          2. The translation in the user's native language (assume English if unspecified, but if the prompt was in Chinese, use Chinese).
          3. The pronunciation (romaji/pinyin/phonetic).
          4. The x and y coordinates of the center of the object in the image, as a percentage from 0 to 100 (e.g., x: 50, y: 50 is the center).
          Ensure the objects are spread out and clearly visible.`
        }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            word: { type: Type.STRING, description: `The word in ${language}` },
            translation: { type: Type.STRING, description: "Translation of the word" },
            pronunciation: { type: Type.STRING, description: "Pronunciation/phonetic spelling" },
            x: { type: Type.NUMBER, description: "X coordinate percentage (0-100)" },
            y: { type: Type.NUMBER, description: "Y coordinate percentage (0-100)" }
          },
          required: ["word", "translation", "pronunciation", "x", "y"]
        }
      }
    }
  });

  const jsonStr = response.text?.trim() || "[]";
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to parse JSON", jsonStr);
    return [];
  }
}

export async function generateTTS(text: string, language: string): Promise<string> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Say clearly in ${language}: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (base64Audio) {
    return base64Audio;
  }
  throw new Error("Failed to generate TTS");
}
