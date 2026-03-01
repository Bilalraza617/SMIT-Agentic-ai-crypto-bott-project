import { handleChat } from '@/lib/bot';

export async function POST(req) {
  try {
    const { message, history } = await req.json();
    
    if (!message) {
      return Response.json({ error: 'Message is required' }, { status: 400 });
    }

    const response = await handleChat(message, history || []);
    
    return Response.json({ response });
  } catch (error) {
    console.error('API Error:', error);
    return Response.json({ error: 'Failed to process chat' }, { status: 500 });
  }
}
