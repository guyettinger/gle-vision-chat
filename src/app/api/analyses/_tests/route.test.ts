import { POST } from '../route';

// Mock the analyzeImages service
jest.mock('@/services/openai/analyzeImages', () => ({
  analyzeImages: jest.fn(),
}));

import { analyzeImages } from '@/services/openai/analyzeImages';

const makeRequest = (body: unknown) =>
  new Request('http://localhost/api/analyses', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('POST /api/analyses', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 200 and results for a valid request', async () => {
    const mockResults = [
      { index: 0, ok: true, text: 'A cat on a table' },
      { index: 1, ok: false, error: 'No response received for this image.' },
    ];
    (analyzeImages as jest.Mock).mockResolvedValue(mockResults);

    const req = makeRequest({
      question: 'What do you see?',
      images: ['data:image/png;base64,AAA', 'data:image/png;base64,BBB'],
    });

    const res = await POST(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ results: mockResults });
    expect(analyzeImages).toHaveBeenCalledWith('What do you see?', [
      'data:image/png;base64,AAA',
      'data:image/png;base64,BBB',
    ]);
  });

  it('returns 400 when validation fails (missing question)', async () => {
    const req = makeRequest({ question: '', images: ['img'] });

    const res = await POST(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    // Zod error message should include our custom message
    expect(typeof json.error).toBe('string');
    expect(json.error).toContain('Please provide a question');
    expect(analyzeImages).not.toHaveBeenCalled();
  });

  it('returns 500 when analyzeImages throws', async () => {
    (analyzeImages as jest.Mock).mockRejectedValue(new Error('boom'));

    const req = makeRequest({ question: 'Q', images: ['img'] });

    const res = await POST(req);

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json).toEqual({ error: 'boom' });
  });
});
