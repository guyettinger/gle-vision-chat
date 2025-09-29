import { NextResponse } from 'next/server';
import { isErrorWithMessage } from '@/lib/errors';
import { analyzeImages } from '@/utils/openai/analyzeImages';
import { z } from 'zod';

export const AnalysisRequestSchema = z.object({
  question: z.string().min(1, 'Please provide a question.'),
  images: z
    .array(z.string())
    .min(1, 'Please upload at least one image.')
    .max(4, 'You can upload up to 4 images.'),
});

export type AnalysisRequest = z.infer<typeof AnalysisRequestSchema>;

export const AnalysisResultSchema = z.object({
  index: z.number(),
  ok: z.boolean(),
  text: z.string().optional(),
  error: z.string().optional(),
});

export const AnalysisResponseSchema = z.object({
  results: z.array(AnalysisResultSchema),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const analysisRequest = AnalysisRequestSchema.safeParse(body);
    if (!analysisRequest.success) {
      const error = analysisRequest.error;
      const message = error?.message || 'Invalid request.';
      console.warn('Bad request:', message);
      return NextResponse.json({ error: message }, { status: 400 });
    }
    const { question, images } = analysisRequest.data;

    const results = await analyzeImages(question, images);

    return NextResponse.json({ results });
  } catch (err: unknown) {
    const message = isErrorWithMessage(err)
      ? err.message
      : 'Unexpected server error';
    console.error('Unexpected server error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
