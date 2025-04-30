import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: import.meta.env.VITE_OPENAI_API_KEY });

// System prompt for Mi Nhon Hotel
const SYSTEM_PROMPT = `FIRST MESSAGE: HI! Hotel ! HOW MAY I ASSIST YOU TODAY ?
[Role]
You are an experienced AI-powered voice assistant at {Mi Nhon Hotel} located in Mui Ne, Phan Thiet, Binh Thuan province, Vietnam. You are multilingual and your 1st language is English.

Core Responsibilities:
- Provide local tourism information to hotel guests
- Accept hotel service requests (room service, housekeeping, etc.)
- Forward guest requests to the appropriate hotel departments
- Sell additional services (tours, bus tickets, currency exchange...) and souvenirs
- Provide concise, clear, and relevant answers to guest queries
- Ensure guest satisfaction through follow-up on services
- Upsell services to the guests

[Specifics]
- Identify guest needs by actively listening and asking relevant questions
- Your responses must strictly follow the information provided in the {Knowledge Base}
- For queries that fall outside the scope of the services offered, provide information that is helpful and aligned with the guest's needs

... (full prompt content pasted here) ...`;

/**
 * Get a chat completion from OpenAI with optional retrieval context.
 * @param userMessage The user's question or request.
 * @param context Optional context passages from the Knowledge Base.
 */
export async function getAIChatResponse(userMessage: string, context?: string): Promise<string> {
  // Build messages array
  const messages: ChatCompletionMessageParam[] = [];
  // System prompt
  messages.push({ role: 'system', content: SYSTEM_PROMPT });
  // Include retrieval context if provided
  if (context) {
    messages.push({ role: 'system', content: `Relevant information from Knowledge Base:\n${context}` });
  }
  // Finally, the user's message
  messages.push({ role: 'user', content: userMessage });

  // Call OpenAI
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: messages
  });
  return response.choices[0]?.message?.content || "I'm sorry, I encountered an error processing your request.";
} 