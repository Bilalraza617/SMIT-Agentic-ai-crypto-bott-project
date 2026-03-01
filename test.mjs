import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const MODEL_NAME = 'gemini-2.5-flash';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const systemInstruction = 'You are a crypto bot.';
const tools = [{
  functionDeclarations: [{
    name: 'getCryptoPrice',
    description: 'Get price of coin',
    parameters: {
      type: 'OBJECT',
      properties: {
        coinId: { type: 'STRING' }
      },
      required: ['coinId']
    }
  }]
}];

async function test() {
    const contents = [{ role: 'user', parts: [{ text: 'what is the price of bitcoin?' }] }];
    console.log('Sending...');
    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents,
            config: { tools, systemInstruction, temperature: 0.7 }
        });
        const call = response.functionCalls?.[0];
        console.log('Call:', call);
        if (call) {
            // Push the model's call
            contents.push({
                role: 'model',
                parts: [{
                    functionCall: {
                        name: call.name,
                        args: call.args
                    }
                }]
            });
            // Push the result
            contents.push({
                role: 'user',
                parts: [{
                    functionResponse: {
                        name: call.name,
                        response: { result: "100000" }
                    }
                }]
            });
            console.log('Sending follow up...', JSON.stringify(contents, null, 2));
            const response2 = await ai.models.generateContent({
                model: MODEL_NAME,
                contents,
                config: { tools, systemInstruction, temperature: 0.7 }
            });
            console.log('Final text:', response2.text);
        }
    } catch (e) {
        console.error("Error:", e);
    }
}
test();
