import { analyzeImagesAction } from '../analyzeImagesAction';

// Mock the analyzeImages service
jest.mock('@/services/openai/analyzeImages', () => ({
  analyzeImages: jest.fn(),
}));

import { analyzeImages } from '@/services/openai/analyzeImages';

describe('analyzeImagesAction (server action)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns results for a valid request by delegating to the service', async () => {
    const mockResults = [
      { index: 0, ok: true, text: 'A cat on a table' },
      { index: 1, ok: false, error: 'No response received for this image.' },
    ];
    (analyzeImages as jest.Mock).mockResolvedValue(mockResults);

    const request = {
      question: 'What do you see?',
      images: ['data:image/png;base64,AAA', 'data:image/png;base64,BBB'],
    };

    const res = await analyzeImagesAction(request);

    expect(res).toEqual(mockResults);
    // The action should forward the entire request object to the service
    expect(analyzeImages).toHaveBeenCalledWith(request);
  });

  it('propagates errors when the service rejects', async () => {
    (analyzeImages as jest.Mock).mockRejectedValue(new Error('boom'));

    const request = { question: 'Q', images: ['img'] };

    await expect(analyzeImagesAction(request)).rejects.toThrow('boom');
  });
});
