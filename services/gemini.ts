
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { DesignStyle, AspectRatio } from "../types";

/**
 * Redesigns the room while strictly enforcing structural preservation using Gemini 2.5 Flash.
 */
export const redesignRoom = async (
  originalImageBase64: string,
  style: DesignStyle,
  aspectRatio: AspectRatio,
  wallpaperBase64: string | null = null,
  floorBase64: string | null = null
): Promise<string | undefined> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let prompt = `ACT AS A PRECISION ARCHITECTURAL RENDERER. 
  TASK: Redesign the provided room in "${style}" style.
  
  STRICT GEOMETRY PRESERVATION (MANDATORY):
  1. DO NOT CHANGE THE CAMERA ANGLE: The perspective, horizon line, and lens focal length must be identical to the original image.
  2. PRESERVE WALLS: The boundaries where walls meet the floor and ceiling must remain in exactly the same pixel coordinates.
  3. ARCHITECTURAL SKELETON: Treat the original image as a rigid fixed frame. Only update materials, furniture, and lighting.
  4. ALIGNMENT: The edges of windows and doors must not move.`;

  const parts: any[] = [
    {
      inlineData: {
        mimeType: 'image/jpeg',
        data: originalImageBase64.split(',')[1],
      },
    }
  ];

  if (wallpaperBase64) {
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: wallpaperBase64.split(',')[1],
      },
    });
    prompt += `\n\nMATERIAL OVERLAY (WALLS): Apply the pattern from the second image to the walls while maintaining wall position.`;
  }

  if (floorBase64) {
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: floorBase64.split(',')[1],
      },
    });
    prompt += `\n\nMATERIAL OVERLAY (FLOOR): Apply the material from the ${wallpaperBase64 ? 'third' : 'second'} image to the floor.`;
  }

  prompt += `\n\nFINAL OUTPUT: A photorealistic redesign that matches the exact dimensions of the input.`;
  
  parts.push({ text: prompt });

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return undefined;
};

/**
 * Edits the room with specific user instructions using Gemini 2.5 Flash.
 */
export const editRoomWithPrompt = async (
  currentImageBase64: string,
  instruction: string,
  aspectRatio: AspectRatio,
  wallpaperBase64: string | null = null,
  floorBase64: string | null = null
): Promise<string | undefined> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  let fullInstruction = `STRICT ARCHITECTURAL EDIT: "${instruction}". 
  
  RULES:
  - KEEP THE LAYOUT: Do not shift walls, windows, or floor lines.
  - PERSPECTIVE: Maintain the original camera view exactly.
  - MODIFICATION: Only change the items requested.`;
  
  const parts: any[] = [
    {
      inlineData: {
        mimeType: 'image/jpeg',
        data: currentImageBase64.split(',')[1],
      },
    }
  ];

  if (wallpaperBase64) {
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: wallpaperBase64.split(',')[1],
      },
    });
  }

  if (floorBase64) {
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: floorBase64.split(',')[1],
      },
    });
  }

  parts.push({ text: fullInstruction });

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return undefined;
};

export const getChatResponse = async (
  message: string,
  history: { role: string; parts: { text: string }[] }[]
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    history: history,
    config: {
      systemInstruction: 'You are a professional interior design consultant. Help the user with advice. Be concise.',
    }
  });

  const result = await chat.sendMessage({ message });
  return result.text || "I'm sorry, I couldn't process that.";
};
