import { NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not set');
      return NextResponse.json(
        { error: 'Server configuration error: missing OpenAI API key' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const question = (body?.question ?? '').toString().trim();
    const images: string[] = Array.isArray(body?.images) ? body.images : [];

    if (!question) {
      console.warn('Bad request: missing question');
      return NextResponse.json(
        { error: 'Please provide a question.' },
        { status: 400 }
      );
    }

    if (!images.length) {
      console.warn('Bad request: no images provided');
      return NextResponse.json(
        { error: 'Please upload at least one image.' },
        { status: 400 }
      );
    }

    if (images.length > 4) {
      console.warn('Bad request: more than 4 images provided');
      return NextResponse.json(
        { error: 'You can upload up to 4 images.' },
        { status: 400 }
      );
    }

    const model = openai('gpt-4o-mini');

    // Define the schema for the structured output
    const responseSchema = z.object({
      results: z.array(
        z.object({
          index: z.number(),
          text: z.string(),
        })
      ),
    });

    // Create content array with text and all images
    const content = [
      {
        type: 'text' as const,
        text: `${question}\n\nI'm providing you with ${images.length} image(s). Please analyze each image and provide a succinct answer for each one. If counting or listing, be specific. Return the results as an array where each result has an "index" (starting from 0) and "text" with your analysis.`,
      },
      ...images.map(image => ({
        type: 'image' as const,
        image,
      })),
    ];

    try {
      const { object } = await generateObject({
        model,
        schema: responseSchema,
        messages: [
          {
            role: 'user',
            content,
          },
        ],
      });

      // Transform the results to match the original format
      const results = images.map((_, index) => {
        const result = object.results.find(r => r.index === index);
        if (result) {
          return { index, ok: true, text: result.text };
        } else {
          return {
            index,
            ok: false,
            error: 'No response received for this image.',
          };
        }
      });

      return NextResponse.json({ results });
    } catch (error: any) {
      console.error('OpenAI error:', error);

      // Fallback to individual results with error for all images
      const results = images.map((_, index) => ({
        index,
        ok: false,
        error: error?.message || 'Failed to analyze images. Please try again.',
      }));

      return NextResponse.json({ results });
    }
  } catch (err: any) {
    console.error('Unexpected server error:', err);
    return NextResponse.json(
      { error: 'Unexpected server error' },
      { status: 500 }
    );
  }
}
