import type { VercelRequest, VercelResponse } from "@vercel/node";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message } = req.body || {};
  const prompt = String(message || "").slice(0, 400);

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature: 0.6,
        messages: [
          { role: "system", content: "You are Bevin, a friendly barista who suggests drinks." },
          { role: "user", content: prompt },
        ],
      }),
    });
    const j = await r.json();

    const text = j?.choices?.[0]?.message?.content?.trim() || "Hey! I’m Bevin. What vibe are you in the mood for?";
    res.status(200).json({ message: text, picks: [] });
  } catch (err: any) {
    res.status(200).json({
      message: "Whoops—something glitched. Try again in a moment.",
      picks: [],
      error: "internal_error",
      detail: err?.message || String(err),
    });
  }
}
