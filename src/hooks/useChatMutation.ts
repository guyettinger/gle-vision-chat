// Mutation using fetch to the API (already set up server-side)
import { useMutation } from '@tanstack/react-query';

export type ChatMutationResult = {
  results: { index: number; ok: boolean; text?: string; error?: string }[];
};
export const useChatMutation = () => {
  // Mutation using fetch to the API (already set up server-side)
  return useMutation({
    mutationFn: async (payload: {
      question: string;
      images: string[];
    }): Promise<ChatMutationResult> => {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      let data: any = undefined;
      try {
        data = await res.json();
      } catch {
        // ignore json parse error; will be handled by !res.ok branch
      }
      if (!res.ok) {
        const msg = data?.error || `Request failed with status ${res.status}`;
        throw new Error(msg);
      }
      return data as ChatMutationResult;
    },
  });
};
