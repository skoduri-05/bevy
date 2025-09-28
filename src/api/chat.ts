import type { VercelRequest, VercelResponse } from "@vercel/node";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

/** ===== Env & Clients ===== */
const TABLE = process.env.TABLE_NAME || "recipes";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE!;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { persistSession: false },
});
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

/** ===== Utils & Constants ===== */
const clip = (s?: string, n = 200) => (s || "").toString().slice(0, n);

const DEFAULT_NO_RESULT =
  "I couldn't find a great match for that. Try tweaking it—set a budget (e.g., under $8), name a vibe (tropical/citrus/creamy), or a base (coffee/tea/fruit).";

const DEFAULT_ERROR =
  "Whoops—something glitched on my end. I can still suggest a few popular picks if you tell me a vibe (e.g., tropical, citrus, or creamy) and a budget.";

/** ----- Small-talk helpers ----- */
function isSmallTalk(msg = "") {
  const m = msg.toLowerCase().trim();
  if (!m) return true;
  const patterns = [
    /\b(hi|hey|hello|yo|sup|howdy)\b/,
    /\b(how are you|how's it going|hows it going|what's up|whats up)\b/,
    /\b(thank(s| you)|thanks a lot|appreciate it)\b/,
    /\b(who are you|what are you|what can you do)\b/,
    /\b(help|instructions|how do i use|what can i ask)\b/,
    /\b(joke|fun fact|tell me something)\b/,
    /\b(good (morning|afternoon|evening|night))\b/,
  ];
  return patterns.some((re) => re.test(m));
}

async function smallTalkReply(userMessage?: string) {
  const persona =
    "You are Bevin, a friendly barista-buddy chatbot that can also recommend drinks. " +
    "For casual greetings and small talk: keep replies warm, concise (max 60 words), " +
    "and mention that the user can ask for drink ideas anytime. Avoid making up facts.";
  const prompt =
    userMessage?.trim() ||
    "Say hello to the user and mention you can suggest drinks.";

  try {
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      temperature: 0.6,
      messages: [
        { role: "system", content: persona },
        { role: "user", content: prompt },
      ],
    });
    return (
      completion.choices?.[0]?.message?.content?.trim() ||
      "Hey! I’m Bevin. I can chat and suggest great drinks—what are you in the mood for?"
    );
  } catch {
    return "Hey! I’m Bevin. I can chat and suggest great drinks—what are you in the mood for?";
  }
}

/** ----- Tag synonyms + helpers ----- */
const TAG_SYNONYMS: Record<string, string[]> = {
  tropical: [
    "tropical",
    "mango",
    "pineapple",
    "coconut",
    "lychee",
    "passionfruit",
    "guava",
    "peach",
  ],
  citrus: ["citrus", "lemon", "lime", "orange", "grapefruit", "yuzu"],
  creamy: ["creamy", "milk-tea", "latte", "milk", "foam", "cold-foam"],
};
function tagExpansion(tag?: string | null) {
  if (!tag) return null;
  const t = tag.toLowerCase();
  return TAG_SYNONYMS[t] || [t];
}

/** ----- Distance sorter for "near me" ----- */
function extractMiles(locStr = "") {
  const m = /([\d.]+)\s*mi\b/i.exec(locStr);
  return m ? parseFloat(m[1]) : Number.POSITIVE_INFINITY;
}

/** ===== Handler ===== */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const userMessage = clip((req.body?.message as string) || "", 400);
  const limit = Math.min(Number(req.body?.limit || 10), 20);

  // Small talk path
  if (isSmallTalk(userMessage)) {
    const text = await smallTalkReply(userMessage);
    return res.status(200).json({ message: text, picks: [] });
  }

  // Auto intent parse
  const incoming = (req.body?.filters as any) || {};
  const auto: { maxPrice?: number; minRating?: number; tag?: string } = {
    ...incoming,
  };

  if (auto.maxPrice == null) {
    const m = /(under|below)?\s*\$?\s*(\d+(?:\.\d{1,2})?)/i.exec(userMessage);
    if (m) auto.maxPrice = Number(m[2]);
  }

  const msgLower = userMessage.toLowerCase();
  const tagWords = [
    "tropical",
    "citrus",
    "mango",
    "peach",
    "lychee",
    "pineapple",
    "coconut",
    "lime",
    "lemon",
    "orange",
    "passionfruit",
  ];
  for (const t of tagWords) {
    if (msgLower.includes(t)) {
      auto.tag = auto.tag || t;
      break;
    }
  }
  const expandedTags = tagExpansion(auto.tag);
  const wantNearMe = /\bnear me\b/i.test(userMessage);

  try {
    const columns =
      "uuid, drink_name, price, rating, rating_count, tags, thoughts, recipe, location_purchased, image_url";

    const buildBase = () => {
      let q = supabase.from(TABLE).select(columns);
      if (auto.maxPrice != null) q = q.lte("price", auto.maxPrice);
      if (auto.minRating != null) q = q.gte("rating", auto.minRating);
      return q;
    };

    const applyTags = (q: any) => {
      if (expandedTags && expandedTags.length)
        return q.overlaps("tags", expandedTags);
      return q;
    };

    let candidates: any[] = [];
    const term = userMessage.replace(/[^\w\s]/g, " ").trim();

    // Try 1: term + expandedTags + price/rating
    if (term) {
      const { data: d1, error: e1 } = await applyTags(buildBase())
        .or(
          `drink_name.ilike.%${term}%,thoughts.ilike.%${term}%,recipe.ilike.%${term}%`
        )
        .order("rating", { ascending: false })
        .order("rating_count", { ascending: false })
        .limit(limit);
      if (e1) throw e1;
      candidates = d1 || [];
    }

    // Try 2: tags + filters
    if (!candidates.length) {
      const { data: d2, error: e2 } = await applyTags(buildBase())
        .order("rating", { ascending: false })
        .order("rating_count", { ascending: false })
        .limit(limit);
      if (e2) throw e2;
      candidates = d2 || [];
    }

    // Try 3: filters only
    if (!candidates.length) {
      const { data: d3, error: e3 } = await buildBase()
        .order("rating", { ascending: false })
        .order("rating_count", { ascending: false })
        .limit(limit);
      if (e3) throw e3;
      candidates = d3 || [];
    }

    // Try 4: top overall
    if (!candidates.length) {
      const { data: d4, error: e4 } = await supabase
        .from(TABLE)
        .select(columns)
        .order("rating", { ascending: false })
        .order("rating_count", { ascending: false })
        .limit(limit);
      if (e4) throw e4;
      candidates = d4 || [];
    }

    if (candidates.length && wantNearMe) {
      candidates = [...candidates].sort(
        (a, b) =>
          extractMiles(a.location_purchased) - extractMiles(b.location_purchased)
      );
    }

    if (!candidates.length) {
      const text = await smallTalkReply(
        "No matches found for the user's last request. Suggest how they can refine it (budget, flavors like citrus/tropical, or a base like coffee/tea/fruit). Keep it under 60 words."
      );
      return res
        .status(200)
        .json({ message: text || DEFAULT_NO_RESULT, picks: [] });
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

    // Compose friendly answer (Markdown is okay; you strip in UI)
    let aiText = "";
    try {
      const completion = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        temperature: 0.4,
        messages: [
          {
            role: "system",
            content:
              "You recommend drinks using the provided 'database rows'. " +
              "Always: 1) pick 1-3 best fits, 2) say why, 3) include price & rating, " +
              "4) if over budget, suggest cheaper similar options, 5) keep it under 120 words.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: `User message: ${userMessage || "(none)"}` },
              {
                type: "text",
                text: `Candidates (JSON): ${JSON.stringify(rowsForAI)}`,
              },
            ],
          },
        ],
      });
      aiText = completion.choices?.[0]?.message?.content?.trim() || "";
    } catch {
      aiText =
        "Here are strong picks by rating and price: " +
        rowsForAI
          .slice(0, 3)
          .map((r) => `${r.name} ($${r.price}, ★${r.rating})`)
          .join(", ") +
        ".";
    }

    const topPicks = rowsForAI.slice(0, 3);
    return res
      .status(200)
      .json({ message: aiText, picks: topPicks, raw: { count: rowsForAI.length } });
  } catch (err: any) {
    console.error("[ERR]", err?.message || err);
    return res.status(200).json({
      message: DEFAULT_ERROR,
      picks: [],
      error: "internal_error",
      detail: err?.message || String(err),
    });
  }
}