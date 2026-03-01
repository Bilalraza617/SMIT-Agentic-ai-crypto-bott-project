import { GoogleGenAI } from '@google/genai';
import { getCryptoPrice } from './crypto-api.js';

// Initialization relies on process.env.GEMINI_API_KEY being present
// Next.js handles `.env.local` automatically. We can use standard env logic.
const MODEL_NAME = 'gemini-2.5-flash';

const systemInstruction = `You are a highly knowledgeable and professional cryptocurrency expert and analyst.
Your goal is to provide accurate, insightful, and helpful information about any cryptocurrency.
You have access to real-time market data via function calls. 
When a user asks for the price or details of a coin, ALWAYS use the provided function calls to fetch the latest data before answering.
Respond in a friendly, conversational manner, but keep your financial analysis objective and emphasize that you are not providing financial advice.
Format your responses beautifully using Markdown.`;

const tools = [{
  functionDeclarations: [
    {
      name: 'getCryptoPrice',
      description: 'Get the current price and 24h change of a specific cryptocurrency by its ID or common name (e.g., "bitcoin", "ethereum", "solana").',
      parameters: {
        type: 'OBJECT',
        properties: {
          coinId: {
            type: 'STRING',
            description: 'The CoinGecko ID or name of the coin, e.g., bitcoin, myro, dogecoin',
          },
        },
        required: ['coinId'],
      },
    }
  ],
}];

export async function handleChat(userMessage, history) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const contents = history.map(msg => ({
      role: msg.role === 'ai' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));
    
    contents.push({
      role: 'user',
      parts: [{ text: userMessage }]
    });

    while (true) {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents,
            config: {
                systemInstruction,
                tools,
                temperature: 0.7
            }
        });

        const call = response.functionCalls?.[0];
        if (call) {
            let apiResult;
            if (call.name === 'getCryptoPrice') {
                const args = call.args;
                apiResult = await getCryptoPrice(args.coinId);
            }

            contents.push({
                role: 'model',
                parts: [{
                    functionCall: {
                        name: call.name,
                        args: call.args
                    }
                }]
            });

            contents.push({
                role: 'user',
                parts: [{
                    functionResponse: {
                        name: call.name,
                        response: { result: apiResult }
                    }
                }]
            });
        } else {
            return response.text;
        }
    }
  } catch (error) {
    console.error('Gemini API Error:', error);
    return "I'm sorry, I encountered an error while analyzing the crypto markets right now. Please try again later.";
  }
}
