'use server';

import {
  analyzeImages,
  ImageAnalysisRequest,
  ImageAnalysisResponse,
} from '@/services/openai/analyzeImages';

/**
 * Server Action to analyze images using OpenAI
 */
export async function analyzeImagesAction(
  imageAnalysisRequest: ImageAnalysisRequest
): Promise<ImageAnalysisResponse> {
  return await analyzeImages(imageAnalysisRequest);
}
