/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { GoogleGenAI } from "@google/genai";
import type { GenerateContentResponse } from "@google/genai";

const API_KEY = (import.meta.env.VITE_GEMINI_API_KEY as string) || "";

if (!API_KEY) {
  throw new Error(
    "GEMINI_API_KEY environment variable is not set. Please set VITE_GEMINI_API_KEY in your environment or Vercel dashboard.",
  );
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// --- Helper Functions ---

export async function analyzeCharacterFeatures(
  imageDataUrl: string,
): Promise<string> {
  try {
    const match = imageDataUrl.match(/^data:(image\/\w+);base64,(.*)$/);
    if (!match) return "A person.";
    const [, mimeType, base64Data] = match;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType, data: base64Data } },
            {
              text: "Describe the person in this photo in extreme detail. Focus strictly on their facial identity: bone structure, face shape, eye shape and color, nose shape, lip shape, jawline, skin tone, prominent distinguishing features (freckles, moles, wrinkles), and natural hair color/type. Output only the description, ignoring any modern clothing or background.",
            },
          ],
        },
      ],
    });

    return response.text || "A person.";
  } catch (error) {
    console.error("Error analyzing character:", error);
    return "A person.";
  }
}

/**
 * Creates a fallback prompt to use when the primary one is blocked.
 * @param decade The decade string (e.g., "1950s").
 * @returns The fallback prompt string.
 */
function getFallbackPrompt(
  decade: string,
  characterDescription: string = "",
): string {
  return `Create a photograph of the EXACT SAME person in this image as if they were living in the ${decade}. Maintain their facial identity perfectly. 
    Character details: ${characterDescription}
    The photograph should capture the distinct fashion, hairstyles, and overall atmosphere of that time period. Ensure the final image is a clear photograph that looks authentic to the era.`;
}

/**
 * Extracts the decade (e.g., "1950s") from a prompt string.
 * @param prompt The original prompt.
 * @returns The decade string or null if not found.
 */
function extractDecade(prompt: string): string | null {
  const match = prompt.match(/(\d{4}s)/);
  return match ? match[1] : null;
}

/**
 * Processes the Gemini API response, extracting the image or throwing an error if none is found.
 * @param response The response from the generateContent call.
 * @returns A data URL string for the generated image.
 */
function processGeminiResponse(response: GenerateContentResponse): string {
  const imagePartFromResponse = response.candidates?.[0]?.content?.parts?.find(
    (part) => part.inlineData,
  );

  if (imagePartFromResponse?.inlineData) {
    const { mimeType, data } = imagePartFromResponse.inlineData;
    return `data:${mimeType};base64,${data}`;
  }

  const textResponse = response.text;
  console.error("API did not return an image. Response:", textResponse);
  throw new Error(
    `The AI model responded with text instead of an image: "${textResponse || "No text response received."}"`,
  );
}

/**
 * A wrapper for the Gemini API call that includes a retry mechanism for internal server errors.
 * @param imagePart The image part of the request payload.
 * @param textPart The text part of the request payload.
 * @returns The GenerateContentResponse from the API.
 */
async function callGeminiWithRetry(
  imagePart: object,
  textPart: object,
): Promise<GenerateContentResponse> {
  const maxRetries = 3;
  const initialDelay = 1000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: { parts: [imagePart, textPart] },
      });
    } catch (error) {
      console.error(
        `Error calling Gemini API (Attempt ${attempt}/${maxRetries}):`,
        error,
      );
      const errorMessage =
        error instanceof Error ? error.message : JSON.stringify(error);
      const isRetryableError =
        errorMessage.includes('"code":500') ||
        errorMessage.includes("INTERNAL") ||
        errorMessage.includes("429") ||
        errorMessage.includes("RESOURCE_EXHAUSTED");

      if (isRetryableError && attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt); // Slightly longer exponential backoff
        console.log(`Retryable error detected. Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw error; // Re-throw if not a retriable error or if max retries are reached.
    }
  }
  // This should be unreachable due to the loop and throw logic above.
  throw new Error("Gemini API call failed after all retries.");
}

/**
 * Generates a decade-styled image from a source image and a prompt.
 * It includes a fallback mechanism for prompts that might be blocked in certain regions.
 * @param imageDataUrl A data URL string of the source image (e.g., 'data:image/png;base64,...').
 * @param prompt The prompt to guide the image generation.
 * @returns A promise that resolves to a base64-encoded image data URL of the generated image.
 */
export async function generateDecadeImage(
  imageDataUrl: string,
  prompt: string,
  characterDescription: string = "",
): Promise<string> {
  const match = imageDataUrl.match(/^data:(image\/\w+);base64,(.*)$/);
  if (!match) {
    throw new Error(
      "Invalid image data URL format. Expected 'data:image/...;base64,...'",
    );
  }
  const [, mimeType, base64Data] = match;

  const imagePart = {
    inlineData: { mimeType, data: base64Data },
  };

  // --- First attempt with the original prompt ---
  try {
    console.log("Attempting generation with original prompt...");
    const textPart = { text: prompt };
    const response = await callGeminiWithRetry(imagePart, textPart);
    return processGeminiResponse(response);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : JSON.stringify(error);
    const isNoImageError = errorMessage.includes(
      "The AI model responded with text instead of an image",
    );

    if (isNoImageError) {
      console.warn(
        "Original prompt was likely blocked. Trying a fallback prompt.",
      );
      const decade = extractDecade(prompt);
      if (!decade) {
        console.error(
          "Could not extract decade from prompt, cannot use fallback.",
        );
        throw error; // Re-throw the original "no image" error.
      }

      // --- Second attempt with the fallback prompt ---
      try {
        const fallbackPrompt = getFallbackPrompt(decade, characterDescription);
        console.log(
          `Attempting generation with fallback prompt for ${decade}...`,
        );
        const fallbackTextPart = { text: fallbackPrompt };
        const fallbackResponse = await callGeminiWithRetry(
          imagePart,
          fallbackTextPart,
        );
        return processGeminiResponse(fallbackResponse);
      } catch (fallbackError) {
        console.error("Fallback prompt also failed.", fallbackError);
        const finalErrorMessage =
          fallbackError instanceof Error
            ? fallbackError.message
            : String(fallbackError);
        throw new Error(
          `The AI model failed with both original and fallback prompts. Last error: ${finalErrorMessage}`,
        );
      }
    } else {
      // This is for other errors, like a final internal server error after retries.
      console.error(
        "An unrecoverable error occurred during image generation.",
        error,
      );

      let specificReason = errorMessage;
      try {
        // Clean up 429 errors
        if (
          errorMessage.includes("429") ||
          errorMessage.includes("RESOURCE_EXHAUSTED")
        ) {
          specificReason =
            "API quota exceeded/Rate limited. Please wait a moment and try again.";
        } else {
          // The google genai SDK often exposes details on the target or error payload.
          const errorObj = error as any;
          if (errorObj?.statusText) {
            specificReason = errorObj.statusText;
          }
          if (errorObj?.details) {
            specificReason = JSON.stringify(errorObj.details);
          }
          if (errorMessage.includes("{")) {
            const match = errorMessage.match(/\{.*\}/s);
            if (match) {
              const parsed = JSON.parse(match[0]);
              if (parsed?.error?.message) {
                specificReason = parsed.error.message;
              }
            }
          }
        }
      } catch (e) {}

      throw new Error(specificReason);
    }
  }
}
