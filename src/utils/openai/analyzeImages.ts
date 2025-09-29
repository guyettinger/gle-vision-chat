import { generateObject } from 'ai';
import { openai } from '@/utils/openai/openai';
import { isErrorWithMessage } from '@/lib/errors';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const ImageAnalysisSchema = z.object({
  index: z.number(),
  text: z.string(),
});

export const ImageAnalysisResultsSchema = z.object({
  results: z.array(ImageAnalysisSchema),
});

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
    // OpenAI error
    const message = isErrorWithMessage(error)
      ? error.message
      : 'Failed to analyze images. Please try again.';
    console.error('OpenAI error:', error);
    // Map input images to images analyses by index
    const results = images.map((_, index) => ({
      index,
      ok: false,
      error: message,
    }));
    return NextResponse.json({ results });
  }
};
