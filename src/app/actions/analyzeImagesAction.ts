'use server';

import {
  analyzeImages,
  ImageAnalysisRequest,
  ImageAnalysisResponse,
} from '@/services/openai/analyzeImages';

/**
 * Server Action to analyze images using OpenAI
 */
export const analyzeImagesAction = async (
  imageAnalysisRequest: ImageAnalysisRequest
): Promise<ImageAnalysisResponse> => {
  return await analyzeImages(imageAnalysisRequest);
};
