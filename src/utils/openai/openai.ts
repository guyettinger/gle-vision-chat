import { createOpenAI } from '@ai-sdk/openai';
import { OPENAI_API_KEY } from '@/lib/config';

export const openai = createOpenAI({
  apiKey: OPENAI_API_KEY,
});
