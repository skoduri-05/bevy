// /api/bevin-chat.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE!;
const TABLE = process.env.TABLE_NAME || "recipes";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { persistSession: false },
});

const clip = (s: unknown, n = 200) => (s ?? "").toString().slice(0, n);
const TAG_SYNONYMS: Record<string, string[]> = {
  tropical: ["tropical","mango","pineapple","coconut","lychee","passionfruit","guava","peach"],
  citrus: ["citrus","lemon","lime","orange","grapefruit","yuzu"],
  creamy: ["creamy","milk-tea","latte","milk","foam","cold-foam"],
};
const expand = (t?: string|null) => (t ? (TAG_SYNONYMS[t] ?? [t]) : null);
const miles = (s?: string|null) => {
  const m = /([\d.]+)\s*mi\b/i.exec(s || "");
  return m ? parseFloat(m[1]) : Number.POSITIVE_INFINITY;
};

function parseIntent(message: string) {
  const lower = (message || "").toLowerCase();
  const term = (message || "").replace(/[^\w\s]/g, " ").trim();

  let maxPrice: number | undefined;
  const m = /(under|below|<=)?\s*\$?\s*(\d+(?:\.\d{1,2})?)/i.exec(lower);
  if (m) maxPrice = Number(m[2]);

  let minRating: number | undefined;
  const r = /(rating|star|stars)\s*(?:>=?|at least)?\s*(\d(?:\.\d)?)/i.exec(lower);
  if (r) minRating = Number(r[2]);

  let tag: string | undefined;
  for (const w of Object.values(TAG_SYNONYMS).flat()) {
    if (lower.includes(w)) {
      tag = Object.entries(TAG_SYNONYMS).find(([, list]) => list.includes(w))?.[0] || w;
      break;
    }
  }

  const nearMe = /\bnear me\b/i.test(lower);
  return { maxPrice, minRating, tag, term, nearMe };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { message, limit: _limit } = (req.body || {}) as { message?: string; limit?: number };
    const userMessage = clip(message, 400) as string;
    const limit = Math.min(Number(_limit || 10), 20);

    const intent = parseIntent(userMessage);
    const columns =
      "uuid, drink_name, price, rating, rating_count, tags, thoughts, recipe, location_purchased, image_url";

    const base = () => {
      let q = supabase.from(TABLE).select(columns);
      if (intent.maxPrice != null) q = q.lte("price", intent.maxPrice);
      if (intent.minRating != null) q = q.gte("rating", intent.minRating);
      return q;
    };
    const withTags = (q: any) => {
      const expanded = expand(intent.tag);
      return expanded?.length ? q.overlaps("tags", expanded) : q;
    };

    let candidates: any[] = [];
    if (intent.term) {
      const { data, error } = await withTags(base())
        .or(`drink_name.ilike.%${intent.term}%,thoughts.ilike.%${intent.term}%,recipe.ilike.%${intent.term}%`)
        .order("rating", { ascending: false })
        .order("rating_count", { ascending: false })
        .limit(limit);
      if (error) throw error;
      candidates = data || [];
    }
    if (!candidates.length) {
      const { data, error } = await withTags(base())
        .order("rating", { ascending: false })
        .order("rating_count", { ascending: false })
        .limit(limit);
      if (error) throw error;
      candidates = data || [];
    }
    if (!candidates.length) {
      const { data, error } = await base()
        .order("rating", { ascending: false })
        .order("rating_count", { ascending: false })
        .limit(limit);
      if (error) throw error;
      candidates = data || [];
    }
    if (!candidates.length) {
      const { data, error } = await supabase
        .from(TABLE)
        .select(columns)
        .order("rating", { ascending: false })
        .order("rating_count", { ascending: false })
        .limit(limit);
      if (error) throw error;
      candidates = data || [];
    }

    if (intent.nearMe && candidates.length) {
      candidates = [...candidates].sort(
        (a, b) => miles(a.location_purchased) - miles(b.location_purchased)
      );
    }

    const rowsForAI = candidates.map((r: any, i: number) => ({
      i,
      uuid: r.uuid,
      name: r.drink_name,
      price: r.price,
      rating: r.rating,
      rating_count: r.rating_count,
      tags: r.tags,
      location: r.location_purchased,
      thoughts: clip(r.thoughts, 120),
      recipe: clip(r.recipe, 120),
      image_url: r.image_url,
    }));

    // Compose with OpenAI (server-side; key is in env)
    const oa = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature: 0.4,
        messages: [
          {
            role: "system",
            content:
              "You recommend drinks using the provided 'database rows'. " +
              "Always: 1) pick 1–3 best fits, 2) say why, 3) include price & rating, " +
              "4) if over budget, suggest cheaper similar options, 5) keep it under 120 words.",
          },
          {
            role: "user",
            content: `User message: ${userMessage || "(none)"}\nCandidates (JSON): ${JSON.stringify(rowsForAI.slice(0, 8))}`,
          },
        ],
      }),
    }).then((r) => r.json());

    const aiText =
      oa?.choices?.[0]?.message?.content?.trim() ||
      (rowsForAI.length
        ? `Here are strong picks: ${rowsForAI
            .slice(0, 3)
            .map((r) => `${r.name} ($${Number(r.price).toFixed(2)}, ★${r.rating})`)
            .join(", ")
          }.`
        : "I couldn't find a match. Try adding a budget and a vibe (tropical/citrus/creamy)."
      );

    res.status(200).json({
      message: aiText,
      picks: rowsForAI.slice(0, 3),
      raw: { count: rowsForAI.length },
    });
  } catch (err: any) {
    res.status(200).json({
      message:
        "Whoops—something glitched. Try a vibe (tropical/citrus/creamy) and a budget (e.g., under $8).",
      picks: [],
      error: "internal_error",
      detail: err?.message || String(err),
    });
  }
}
