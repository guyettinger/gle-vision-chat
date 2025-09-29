import { AnalysisRequest, AnalysisResponseSchema } from '@/app/api/analyses/route';
import { useMutation } from '@tanstack/react-query';

export const useAnalysis = () => {
  return useMutation({
    mutationFn: async (params: AnalysisRequest) => {
      const res = await fetch('/api/analyses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data?.error || `Request failed with status ${res.status}`;
        throw new Error(msg);
      }
      return AnalysisResponseSchema.parse(data);
    },
  });
};
