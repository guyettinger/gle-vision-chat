import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';

interface ChatParams {
  question: string;
  images: string[];
}

const ChatResponseSchema = z.object({
  results: z.array(
    z.object({
      index: z.number(),
      ok: z.boolean(),
      text: z.string().optional(),
      error: z.string().optional(),
    })
  ),
});

type ChatResponse = z.infer<typeof ChatResponseSchema>;

export const useChat = () => {
  return useMutation({
    mutationFn: async (params: ChatParams): Promise<ChatResponse> => {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data?.error || `Request failed with status ${res.status}`;
        throw new Error(msg);
      }
      return ChatResponseSchema.parse(data);
    },
  });
};
