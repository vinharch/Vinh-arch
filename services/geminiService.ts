
import { GoogleGenAI, Modality } from "@google/genai";
import type { GenerateContentResponse } from "@google/genai";
import type { SourceImage } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

/**
 * Extracts the base64 image data from a Gemini API response.
 * @param response - The response object from the API.
 * @returns The base64 encoded image string, or null if not found.
 */
const extractBase64Image = (response: GenerateContentResponse): string | null => {
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }
  return null;
};

/**
 * Generates multiple images based on a source image and a text prompt.
 * @param sourceImage - The source image object containing base64 data and mimeType.
 * @param prompt - The final, engineered text prompt to guide the image generation.
 * @param count - The number of images to generate.
 * @param referenceImage - An optional reference image for style, tone, and mood.
 * @param aspectRatio - The desired aspect ratio for text-to-image generation.
 * @returns A promise that resolves to an array of base64 image URLs.
 */
export const generateImages = async (
  sourceImage: SourceImage | null,
  prompt: string,
  count: number = 4,
  referenceImage: SourceImage | null = null,
  aspectRatio: '1:1' | '4:3' | '3:4' | '16:9' | '9:16' = '4:3'
): Promise<string[]> => {
  if (!API_KEY) {
    throw new Error("API_KEY is not configured.");
  }

  // CASE 1: Text-to-Image generation (no source image). Use Imagen model.
  if (!sourceImage) {
    try {
      const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: count,
          outputMimeType: 'image/png', // Using PNG for better quality
          aspectRatio: aspectRatio, // A common aspect ratio for architectural renders
        },
      });
      return response.generatedImages.map(img => `data:image/png;base64,${img.image.imageBytes}`);
    } catch (error) {
      console.error(`Failed to generate images from text prompt:`, error);
      return []; // Return empty array on failure
    }
  }

  // CASE 2: Image-to-Image / Multi-modal generation (source image is present). Use Gemini model.
  const results: (string | null)[] = [];
  for (let i = 0; i < count; i++) {
    let engineeredPrompt = prompt;
    const parts: any[] = [];

    // Always add the source image first
    parts.push({
      inlineData: {
        data: sourceImage.base64,
        mimeType: sourceImage.mimeType,
      },
    });

    // Add reference image if provided
    if (referenceImage) {
      parts.push({
        inlineData: {
          data: referenceImage.base64,
          mimeType: referenceImage.mimeType,
        },
      });
      // The prompt for using source + reference
      engineeredPrompt = `The user's prompt is: "${prompt}". You are creating a realistic architectural render. The first image provides the architectural sketch. You MUST use the exact structure, form, and layout from this first sketch. The second image is a reference for style, lighting, scenery, and materials. You must apply the mood, lighting, color palette, materials, and surrounding scenery from the second image to the building from the first sketch. It is forbidden to copy the main architectural building shape from the second style-reference image, but you should adopt its overall environment and textures. The final render must be an exterior shot based on the user's prompt.`;
    }
    
    parts.push({ text: engineeredPrompt });
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts },
        config: {
          responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
      });
      results.push(extractBase64Image(response));
    } catch (error) {
      console.error(`Failed to generate image ${i + 1}/${count}:`, error);
      // Continue to the next iteration even if one fails
    }
  }

  return results.filter((result): result is string => result !== null);
};

/**
 * Edits a specific region of an image using a mask and a text prompt.
 * @param sourceImage - The original image to be edited.
 * @param maskImage - An image where the white area indicates the region to edit.
 * @param prompt - The text prompt describing the desired changes.
 * @param count - The number of edited images to generate.
 * @returns A promise that resolves to an array of base64 image URLs.
 */
export const editImage = async (
  sourceImage: SourceImage,
  maskImage: SourceImage,
  prompt: string,
  count: number = 4,
): Promise<string[]> => {
  if (!API_KEY) {
    throw new Error("API_KEY is not configured.");
  }

  const results: (string | null)[] = [];

  for (let i = 0; i < count; i++) {
    const engineeredPrompt = `**CRITICAL INPAINTING DIRECTIVE**
Your task is to perform a high-fidelity inpainting operation. Adherence to the mask is the highest priority.

1.  **Primary Rule**: You are given two images: an original image and a mask image. Your modifications are **STRICTLY AND EXCLUSIVELY** confined to the **WHITE** area of the mask image.
2.  **Forbidden Zone**: The **BLACK** area of the mask is a **NO-CHANGE ZONE**. The pixels in this area on the output image **MUST BE IDENTICAL** to the pixels in the same area on the original input image. Any alteration, however minor, in the black-masked region is a failure of the task.
3.  **User's Request**: Within the white-masked area, apply the following change based on the user's prompt: "${prompt}".
4.  **Final Output**: Produce a single image where the user's request is fulfilled inside the white mask, and the black-masked area is a perfect, unaltered copy of the original. The transition must be seamless.`;

    const parts = [
        {
            inlineData: {
              data: sourceImage.base64,
              mimeType: sourceImage.mimeType,
            },
        },
        {
            inlineData: {
              data: maskImage.base64,
              mimeType: maskImage.mimeType,
            },
        },
        { text: engineeredPrompt },
    ];
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts },
            config: {
              responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
          }
        );
        results.push(extractBase64Image(response));
    } catch(error) {
        console.error(`Failed to edit image ${i + 1}/${count}:`, error);
        // Continue to the next iteration even if one fails
    }
  }
  
  return results.filter((result): result is string => result !== null);
};
