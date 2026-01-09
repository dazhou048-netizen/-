
import { GoogleGenAI } from "@google/genai";

const MODEL_NAME = 'gemini-2.5-flash-image';

/**
 * Helper to wrap API calls with exponential backoff retry logic.
 * Primarily addresses "429 Too Many Requests" (Quota Exceeded) errors.
 */
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let delay = 2000;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      const errorMsg = error.message?.toLowerCase() || "";
      const isRetryable = errorMsg.includes('429') || 
                          errorMsg.includes('quota') || 
                          errorMsg.includes('too many requests') ||
                          errorMsg.includes('exhausted');
      
      if (isRetryable && i < maxRetries - 1) {
        console.warn(`Quota reached, retrying in ${delay}ms (Attempt ${i + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential increase
        continue;
      }
      throw error;
    }
  }
  throw new Error('达到请求限制，请稍后再试。');
}

export const generateClothingImage = async (prompt: string): Promise<string | null> => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          { text: `生成一张高质量的单件衣服展示图，背景干净。衣服描述：${prompt}。这张图片应该只包含一件平铺或挂着的衣服，没有人物穿着。` }
        ]
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  });
};

export const tryOnClothing = async (personBase64: string, clothesBase64: string): Promise<string | null> => {
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

    const cleanPerson = personBase64.split(',')[1];
    const cleanClothes = clothesBase64.split(',')[1];

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanPerson,
              mimeType: 'image/png'
            }
          },
          {
            inlineData: {
              data: cleanClothes,
              mimeType: 'image/png'
            }
          },
          {
            text: "请将第二张图片中的衣服完美地‘穿’在第一张图片中的人物身上。生成一张自然、真实的全身照。保持人物的面部特征不变，根据第一张图的人物姿势调整衣服。背景应保持简约或自然环境。"
          }
        ]
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  });
};
