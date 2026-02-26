import { GoogleGenAI } from "@google/genai";

export interface VideoGenerationOptions {
  prompt?: string;
  image?: {
    data: string;
    mimeType: string;
  };
  aspectRatio?: "16:9" | "9:16";
  resolution?: "720p" | "1080p";
}

export async function checkApiKey(): Promise<boolean> {
  // @ts-ignore
  return await window.aistudio.hasSelectedApiKey();
}

export async function openApiKeySelector(): Promise<void> {
  // @ts-ignore
  await window.aistudio.openSelectKey();
}

export async function generateVideo(options: VideoGenerationOptions) {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey });
  
  const payload: any = {
    model: 'veo-3.1-fast-generate-preview',
    config: {
      numberOfVideos: 1,
      resolution: options.resolution || '720p',
      aspectRatio: options.aspectRatio || '16:9'
    }
  };

  if (options.prompt) {
    payload.prompt = options.prompt;
  }

  if (options.image) {
    payload.image = {
      imageBytes: options.image.data,
      mimeType: options.image.mimeType
    };
  }

  let operation = await ai.models.generateVideos(payload);

  // Polling for completion
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) {
    throw new Error("Video generation failed: No download link returned.");
  }

  // To fetch the video, append the Gemini API key to the `x-goog-api-key` header.
  const response = await fetch(downloadLink, {
    method: 'GET',
    headers: {
      'x-goog-api-key': apiKey as string,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download video: ${response.statusText}`);
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}
