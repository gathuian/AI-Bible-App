import { GoogleGenAI, Modality, Type } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY!;
const ai = new GoogleGenAI({ apiKey });

export async function generateSermon(topic: string, version: string = "KJV") {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Generate a detailed sermon based on the topic: "${topic}". Use the ${version} Bible version for references. Include an introduction, three main points with scripture, and a conclusion.`,
  });
  return response.text;
}

export async function generateSong(theme: string, version: string = "KJV") {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Create lyrics for a praise and worship song about: "${theme}". Use the ${version} Bible version for references. Include verses, a chorus, and a bridge.`,
  });
  return response.text;
}

export async function generateStory(topic: string, version: string = "KJV") {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Write a children's Bible story about: "${topic}". Use the ${version} Bible version for references. Make it engaging, simple, and include a moral lesson.`,
  });
  return response.text;
}

export async function generateMnemonics(verse: string, version: string = "KJV") {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Create a mnemonic aid or a simple way to memorize this Bible verse: "${verse}". Use the ${version} version.`,
  });
  return response.text;
}

export async function queryBible(query: string, version: string = "KJV") {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Using the ${version} Bible version context, answer this query: "${query}"`,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });
  return response.text;
}

export async function textToSpeech(text: string, voice: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr' = 'Kore') {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voice },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (base64Audio) {
    const binary = atob(base64Audio);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'audio/pcm;rate=24000' });
    return URL.createObjectURL(blob);
  }
  return null;
}
