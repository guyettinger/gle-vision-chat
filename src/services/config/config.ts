/**
 * OpenAI API key sourced from the environment at build/runtime.
 *
 * Note: This value may be undefined if the environment variable is not set.
 * Prefer validating its presence on the server boundary before use.
 */
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
