import { SYSTEM_PROMPT } from "./_prompt";

export const config = { runtime: "edge" };

const GROQ_TOKEN = process.env.VITE_GROQ_TOKEN ?? process.env.GROQ_TOKEN ?? "";

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let prompt: string;
  try {
    const body = await req.json() as { prompt?: unknown };
    if (typeof body.prompt !== "string" || !body.prompt.trim()) {
      return new Response(JSON.stringify({ error: "Missing prompt" }), { status: 400 });
    }
    prompt = body.prompt.trim().slice(0, 1000);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), { status: 400 });
  }

  if (!GROQ_TOKEN) {
    return new Response(JSON.stringify({ error: "Service not configured" }), { status: 503 });
  }

  const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROQ_TOKEN}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user",   content: prompt },
      ],
      max_tokens: 800,
      temperature: 0.3,
    }),
  });

  if (!groqRes.ok) {
    return new Response(JSON.stringify({ error: `Upstream error ${groqRes.status}` }), { status: groqRes.status });
  }

  const data = await groqRes.json();
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
}
