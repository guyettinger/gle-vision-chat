import { OPENAI_API_KEY } from '@/services/config/config';
import { createOpenAI } from '@ai-sdk/openai';

/**
 * Preconfigured OpenAI client used across the server for model calls.
 *
 * The client uses the OPENAI_API_KEY sourced from environment configuration.
 */
export const openai = createOpenAI({
  apiKey: OPENAI_API_KEY,
});
