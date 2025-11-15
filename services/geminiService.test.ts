import { generateCaptions } from './geminiService';

jest.mock('@google/genai', () => {
    const mockGenerateContent = jest.fn();
    return {
        GoogleGenAI: jest.fn().mockImplementation(() => ({
            models: {
                generateContent: mockGenerateContent,
            },
        })),
        mockGenerateContent,
        Type: {
            OBJECT: 'OBJECT',
            ARRAY: 'ARRAY',
            STRING: 'STRING',
        },
        Modality: {
            IMAGE: 'IMAGE',
        }
    };
});

// It's a bit of a hack to get the mock out, but it's a clean way
const { mockGenerateContent } = require('@google/genai');

describe('geminiService', () => {
    beforeEach(() => {
        mockGenerateContent.mockClear();
    });

    describe('generateCaptions', () => {
        it('should throw an error with a detailed message when JSON parsing fails', async () => {
            mockGenerateContent.mockResolvedValue({
                text: 'invalid json',
            });

            await expect(generateCaptions('dummy-base64-image-data')).rejects.toThrow(
                /Failed to parse captions JSON: SyntaxError: Unexpected token/
            );
        });
    });
});
