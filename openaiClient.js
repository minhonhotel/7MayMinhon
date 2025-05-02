export async function askGPT(prompt) {
  const apiKey = import.meta.env.OPENAI_API_KEY;
  const projectId = import.meta.env.OPENAI_PROJECT_ID;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "OpenAI-Project": projectId  // BẮT BUỘC với sk-proj
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }]
    })
  });

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "No response";
} 