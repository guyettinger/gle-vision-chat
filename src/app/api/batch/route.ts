import { NextResponse } from "next/server";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not set");
      return NextResponse.json(
        { error: "Server configuration error: missing OpenAI API key" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const question = (body?.question ?? "").toString().trim();
    const images: string[] = Array.isArray(body?.images) ? body.images : [];

    if (!question) {
      console.warn("Bad request: missing question");
      return NextResponse.json(
        { error: "Please provide a question." },
        { status: 400 }
      );
    }

    if (!images.length) {
      console.warn("Bad request: no images provided");
      return NextResponse.json(
        { error: "Please upload at least one image." },
        { status: 400 }
      );
    }

    if (images.length > 4) {
      console.warn("Bad request: more than 4 images provided");
      return NextResponse.json(
        { error: "You can upload up to 4 images." },
        { status: 400 }
      );
    }

    const model = openai("gpt-4o-mini");

    const results = await Promise.all(
      images.map(async (image, index) => {
        try {
          const { text } = await generateText({
            model,
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text:
                      question +
                      "\n\nAnswer succinctly for this single image. If counting or listing, be specific.",
                  },
                  { type: "image", image },
                ],
              },
            ],
          });

          return { index, ok: true, text } as const;
        } catch (error: any) {
          console.error(`OpenAI error for image ${index}:`, error);
          return {
            index,
            ok: false,
            error:
              error?.message ||
              "Failed to analyze this image. Please try again.",
          } as const;
        }
      })
    );

    return NextResponse.json({ results });
  } catch (err: any) {
    console.error("Unexpected server error:", err);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}
