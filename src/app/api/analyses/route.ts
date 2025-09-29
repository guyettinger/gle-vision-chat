import { isErrorWithMessage } from '@/lib/errors';
import { analyzeImages } from '@/services/openai/analyzeImages';
import { NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * Schema for validating analysis request data.
 * Ensures the request contains a valid question and between 1-4 images.
 */
export const AnalysisRequestSchema = z.object({
  question: z.string().min(1, 'Please provide a question.'),
  images: z
    .array(z.string())
    .min(1, 'Please upload at least one image.')
    .max(4, 'You can upload up to 4 images.'),
});

/**
 * Type representing a validated analysis request.
 * Contains a question string and an array of image strings (typically base64 encoded).
 *
 * @example
 * ```typescript
 * const request: AnalysisRequest = {
 *   question: "What do you see in these images?",
 *   images: ["data:image/jpeg;base64,...", "data:image/png;base64,..."]
 * };
 * ```
 */
export type AnalysisRequest = z.infer<typeof AnalysisRequestSchema>;

/**
 * Schema for validating individual analysis results.
 * Each result represents the outcome of analyzing a single image.
 */
export const AnalysisResultSchema = z.object({
  index: z.number(),
  ok: z.boolean(),
  text: z.string().optional(),
  error: z.string().optional(),
});

/**
 * Schema for validating the complete analysis response.
 * Contains an array of analysis results, one for each processed image.
 */
export const AnalysisResponseSchema = z.object({
  results: z.array(AnalysisResultSchema),
});

/**
 * Result of analyzing a single image.
 *
 * @property index - The index of the image in the original request array
 * @property ok - Whether the analysis was successful
 * @property text - The analysis result text (present when ok is true)
 * @property error - The error message (present when ok is false)
 */
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

/**
 * Complete response from the analysis endpoint.
 *
 * @property results - Array of analysis results, one for each input image
 */
export type AnalysisResponse = z.infer<typeof AnalysisResponseSchema>;

/**
 * POST endpoint handler for analyzing images with AI.
 *
 * Accepts a request with a question and up to 4 images, processes them using
 * OpenAI's vision capabilities, and returns the analysis results.
 *
 * @param req - The incoming HTTP request containing the analysis request body
 * @returns A JSON response containing either the analysis results or an error message
 *
 * @throws Returns 400 status for invalid request format or validation errors
 * @throws Returns 500 status for unexpected server errors during processing
 *
 * @example
 * Request body:
 * ```json
 * {
 *   "question": "What objects do you see?",
 *   "images": ["data:image/jpeg;base64,..."]
 * }
 * ```
 *
 * Success response:
 * ```json
 * {
 *   "results": [
 *     {
 *       "index": 0,
 *       "ok": true,
 *       "text": "I can see a cat sitting on a table..."
 *     }
 *   ]
 * }
 * ```
 *
 * Error response:
 * ```json
 * {
 *   "error": "Please provide a question."
 * }
 * ```
 */
export async function POST(req: Request) {
  try {
    // Parse the analysis request from the body
    const body = await req.json();
    const analysisRequest = AnalysisRequestSchema.safeParse(body);

    // If the analysis request is malformed, respond with an error
    if (!analysisRequest.success) {
      const error = analysisRequest.error;
      const message = error?.message || 'Invalid request.';
      return NextResponse.json({ error: message }, { status: 400 });
    }

    // Get the question and the images
    const { question, images } = analysisRequest.data;

    // Analyze the images
    const results = await analyzeImages(question, images);

    // Respond with the analysis
    return NextResponse.json({ results });
  } catch (err: unknown) {
    // If an error occurred, respond with the error message
    const message = isErrorWithMessage(err) ? err.message : 'Unexpected server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
