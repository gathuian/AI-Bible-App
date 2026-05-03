import { GoogleGenAI, Modality } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY!;
const ai = new GoogleGenAI({ apiKey });

const FAST_MODEL = "gemini-3-flash-preview";

export async function generateSermon(topic: string, version: string = "KJV") {
  const response = await ai.models.generateContent({
    model: FAST_MODEL,
    config: {
      systemInstruction: "You are an expert Bible scholar and preacher. Provide concise yet powerful sermons. Use Markdown. Focus on the requested Bible version."
    },
    contents: `Topic: "${topic}". Version: ${version}. Provide a 3-point sermon structure with scripture.`
  });
  return response.text;
}

export async function generateSong(theme: string, version: string = "KJV") {
  const response = await ai.models.generateContent({
    model: FAST_MODEL,
    config: {
      systemInstruction: "You are a worship leader. Create inspiring song lyrics. Use Markdown."
    },
    contents: `Theme: "${theme}". Bible Version for inspiration: ${version}. Include verse/chorus/bridge.`
  });
  return response.text;
}

export async function generateStory(topic: string, version: string = "KJV") {
  const response = await ai.models.generateContent({
    model: FAST_MODEL,
    config: {
      systemInstruction: "You are a master storyteller for children. Use simple, engaging language and Markdown."
    },
    contents: `Story about "${topic}". Version: ${version}. Include a moral.`
  });
  return response.text;
}

export async function generateMnemonics(verse: string, version: string = "KJV") {
  const response = await ai.models.generateContent({
    model: FAST_MODEL,
    config: {
      systemInstruction: "You create memory aids for Bible study. Be creative and concise."
    },
    contents: `Create a mnemonic aid for "${verse}" (${version}).`
  });
  return response.text;
}

export async function queryBible(query: string, version: string = "KJV") {
  const response = await ai.models.generateContent({
    model: FAST_MODEL,
    config: {
      systemInstruction: `You are a Bible AI developed for secure queries. Use the ${version} Bible version. Be direct and helpful. Use Markdown.`,
      tools: [{ googleSearch: {} } as any],
    },
    contents: query,
  });
  return response.text;
}

export async function textToSpeech(text: string, voice: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr' = 'Kore') {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-tts-preview",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voice },
        },
      },
    } as any,
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
