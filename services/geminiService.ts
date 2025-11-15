import { GoogleGenAI, Type, Modality } from "@google/genai";

const API_KEY = import.meta.env.VITE_API_KEY; 

if (!API_KEY) {
    throw new Error("API_KEY environment variable not set. Please check your .env.local file for VITE_API_KEY.");
}
const ai = new GoogleGenAI({ apiKey: API_KEY });

const imageToPart = (imageBase64: string) => {
    const pureBase64 = imageBase64.split(',')[1];
    const mimeType = imageBase64.match(/data:(.*);base64,/)?.[1] || 'image/jpeg';
    return {
        inlineData: {
            data: pureBase64,
            mimeType,
        },
    };
};

export const generateCaptions = async (imageBase64: string): Promise<string[]> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                { text: "Analyze this image and generate exactly 5 witty, funny, and contextually relevant captions suitable for a meme. The captions should be short and punchy. Return the result as a JSON object with a single key 'captions' which is an array of 5 strings." },
                imageToPart(imageBase64)
            ]
        },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    captions: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.STRING
                        }
                    }
                }
            }
        }
    });

    try {
        const jsonResponse = JSON.parse(response.text);
        if (jsonResponse.captions && Array.isArray(jsonResponse.captions)) {
            return jsonResponse.captions.slice(0, 5);
        }
    } catch (e) {
        console.error("Failed to parse captions JSON:", e);
        throw new Error(`Failed to parse captions JSON: ${e}`);
    }
    throw new Error("Could not generate or parse captions from API response.");
};


export const translateCaptions = async (captions: string[], language: string): Promise<string[]> => {
    const prompt = `Translate the following JSON array of English captions into ${language}. Maintain the tone and humor of the original captions. Return the result as a JSON object with a single key "translated_captions" which is an array of the translated strings, in the same order as the input.
Input captions: ${JSON.stringify(captions)}`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    translated_captions: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.STRING
                        }
                    }
                }
            }
        }
    });

    try {
        const jsonResponse = JSON.parse(response.text);
        if (jsonResponse.translated_captions && Array.isArray(jsonResponse.translated_captions)) {
            return jsonResponse.translated_captions;
        }
    } catch (e) {
        console.error("Failed to parse translation JSON:", e);
    }
    throw new Error("Could not generate or parse translations from API response.");
};

export const editImageWithText = async (imageBase64: string, prompt: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                imageToPart(imageBase64),
                { text: prompt }
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (imagePart?.inlineData) {
        const { data, mimeType } = imagePart.inlineData;
        return `data:${mimeType};base64,${data}`;
    }

    throw new Error("Could not edit image with the provided prompt.");
};