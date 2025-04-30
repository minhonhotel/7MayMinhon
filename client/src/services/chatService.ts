import { ChatCompletionMessage } from 'openai';

// Load the system prompt from environment or inline it here
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

... (rest of the full prompt content) ...
`;

export async function fetchAIResponse(userMessage: string): Promise<string> {
  const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
  const url = 'https://api.openai.com/v1/chat/completions';
  const messages: ChatCompletionMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userMessage }
  ];

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages
    })
  });

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? "I'm sorry, I encountered an error.";
} 