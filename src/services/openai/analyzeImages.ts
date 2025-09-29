import { isErrorWithMessage } from '@/lib/errors';
import { openai } from '@/services/openai/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

/**
 * Schema for a single image analysis result.
 * Contains the index of the analyzed image and the analysis text.
 */
export const ImageAnalysisSchema = z.object({
  /** The index of the image in the original array (0-based) */
  index: z.number(),
  /** The analysis text generated for the image */
  text: z.string(),
});

/**
 * Schema for the complete image analysis results.
 * Contains an array of individual image analysis results.
 */
export const ImageAnalysisResultsSchema = z.object({
  /** Array of image analysis results */
  results: z.array(ImageAnalysisSchema),
});

/**
 * Analyzes multiple images using OpenAI's GPT-4o-mini model based on a user question.
 *
 * This function sends a question along with multiple images to the OpenAI API and returns
 * analysis results for each image. The AI model provides succinct answers for each image,
 * with specific details when counting or listing items.
 *
 * @param question - The question or prompt to guide the image analysis
 * @param images - Array of base64-encoded image strings to be analyzed
 *
 * @returns Promise that resolves to an array of analysis results, where each result contains:
 *   - `index`: The 0-based index of the image in the input array
 *   - `ok`: Boolean indicating if the analysis was successful
 *   - `text`: The analysis text (only present if `ok` is true)
 *   - `error`: Error message (only present if `ok` is false)
 *
 * @example
 * ```typescript
 * const question = "How many people are in each image?";
 * const images = ["data:image/jpeg;base64,/9j/4AAQ...", "data:image/png;base64,iVBORw0KG..."];
 *
 * const results = await analyzeImages(question, images);
 * results.forEach(result => {
 *   if (result.ok) {
 *     console.log(`Image ${result.index}: ${result.text}`);
 *   } else {
 *     console.error(`Image ${result.index} failed: ${result.error}`);
 *   }
 * });
 * ```
 *
 * @throws Will not throw errors directly, but returns error results in the response array
 * when the OpenAI API call fails or when individual image analyses are missing.
 */
export const analyzeImages = async (question: string, images: string[]) => {
  try {
    // Generate image analysis results using the question and images
    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: ImageAnalysisResultsSchema,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `${question}\n\nI'm providing you with ${images.length} image(s). Please analyze each image and provide a succinct answer for each one. If counting or listing, be specific. Return the results as an array where each result has an "index" (starting from 0) and "text" with your analysis.`,
            },
            ...images.map(image => ({
              type: 'image' as const,
              image,
            })),
          ],
        },
      ],
    });

    // Map input image to analysis by index
    return images.map((_, index) => {
      const analysis = object.results.find(r => r.index === index);
      if (analysis) {
        // found analysis
        return {
          index,
          ok: true,
          text: analysis.text,
        };
      } else {
        // missing analysis
        return {
          index,
          ok: false,
          error: 'No response received for this image.',
        };
      }
    });
  } catch (error: unknown) {
    // OpenAI error — return an array of error results for each image.
    const message = isErrorWithMessage(error)
      ? error.message
      : 'Failed to analyze images. Please try again.';
    console.error('OpenAI error:', error);
    // Map input images to analysis errors by index
    return images.map((_, index) => ({
      index,
      ok: false,
      error: message,
    }));
  }
};
