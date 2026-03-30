export const config = { runtime: "edge" };

const GROQ_TOKEN = process.env.GROQ_TOKEN ?? "";

const SYSTEM_PROMPT = `You are a street cross-section designer. Given a description, output ONLY valid JSON — no explanation, no markdown, no code block.

Available element types and typical widths (in meters):
- BUILDING_LEFT: 6 (left building facade — always include first if present)
- SIDEWALK: 2–5
- PLANTING_STRIP: 1–3 (trees, greenery)
- CYCLE_LANE: 1.5–2.5 (bike lane at sidewalk level)
- BUFFER: 0.5–1 (separation strip)
- CYCLE_LANE_ROAD: 1.5–2 (bike lane at road level)
- PARKING_LANE: 2.4–4.8
- TRAFFIC_LANE: 3–3.5 (one car lane)
- BUS_LANE: 3–3.5
- MEDIAN: 0.5–3 (central island)
- BUILDING_RIGHT: 6 (right building facade — always include last if present)

Output format — a JSON object with "name" (short street name from description) and "elements" array:
{"name":"Example Street","elements":[{"type":"BUILDING_LEFT","width_m":6},{"type":"SIDEWALK","width_m":3},{"type":"TRAFFIC_LANE","width_m":3.25},{"type":"TRAFFIC_LANE","width_m":3.25},{"type":"SIDEWALK","width_m":3},{"type":"BUILDING_RIGHT","width_m":6}]}

Rules:
- Always use symmetric layout unless description says otherwise
- BUILDING_LEFT must be first element if included, BUILDING_RIGHT must be last
- Use only the exact type strings listed above
- width_m must be a number`;

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
