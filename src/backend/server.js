import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
  })
);
app.use(express.json());

/** ===== Env & Clients ===== */
const TABLE = process.env.TABLE_NAME || 'recipes';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE || !OPENAI_API_KEY) {
  console.error('Missing env: SUPABASE_URL / SUPABASE_SERVICE_ROLE / OPENAI_API_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { persistSession: false }
});
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

/** ===== Utils & Constants ===== */
const clip = (s, n = 200) => (s || '').toString().slice(0, n);

const DEFAULT_NO_RESULT =
  "I couldn't find a great match for that. Try tweaking it—set a budget (e.g., under $8), name a vibe (tropical/citrus/creamy), or a base (coffee/tea/fruit).";

const DEFAULT_ERROR =
  "Whoops—something glitched on my end. I can still suggest a few popular picks if you tell me a vibe (e.g., tropical, citrus, or creamy) and a budget.";

/** ----- Small-talk helpers ----- */
function isSmallTalk(msg = '') {
  const m = msg.toLowerCase().trim();
  if (!m) return true; // empty = greet
  const patterns = [
    /\b(hi|hey|hello|yo|sup|howdy)\b/,
    /\b(how are you|how's it going|hows it going|what's up|whats up)\b/,
    /\b(thank(s| you)|thanks a lot|appreciate it)\b/,
    /\b(who are you|what are you|what can you do)\b/,
    /\b(help|instructions|how do i use|what can i ask)\b/,
    /\b(joke|fun fact|tell me something)\b/,
    /\b(good (morning|afternoon|evening|night))\b/
  ];
  return patterns.some((re) => re.test(m));
}

async function smallTalkReply(openaiClient, userMessage) {
  const persona =
    "You are Bevin, a friendly barista-buddy chatbot that can also recommend drinks. " +
    "For casual greetings and small talk: keep replies warm, concise (max 60 words), " +
    "and mention that the user can ask for drink ideas anytime. Avoid making up facts.";
  const prompt = (userMessage?.trim() || "Say hello to the user and mention you can suggest drinks.");

  try {
    const completion = await openaiClient.chat.completions.create({
      model: OPENAI_MODEL,
      temperature: 0.6,
      messages: [
        { role: 'system', content: persona },
        { role: 'user', content: prompt }
      ]
    });
    return completion.choices?.[0]?.message?.content?.trim()
      || "Hey! I’m Bevin. I can chat and suggest great drinks—what are you in the mood for?";
  } catch {
    return "Hey! I’m Bevin. I can chat and suggest great drinks—what are you in the mood for?";
  }
}

/** ----- Tag synonyms + array overlap helper ----- */
const TAG_SYNONYMS = {
  tropical: ['tropical', 'mango', 'pineapple', 'coconut', 'lychee', 'passionfruit', 'guava', 'peach'],
  citrus:   ['citrus', 'lemon', 'lime', 'orange', 'grapefruit', 'yuzu'],
  creamy:   ['creamy', 'milk-tea', 'latte', 'milk', 'foam', 'cold-foam']
};
function tagExpansion(tag) {
  if (!tag) return null;
  const t = tag.toLowerCase();
  return TAG_SYNONYMS[t] || [t];
}

/** ----- Distance sorter for "near me" ----- */
function extractMiles(locStr = '') {
  // expects strings like "Midtown · 1.1 mi" or "Atlanta · 0.9 mi"
  const m = /([\d.]+)\s*mi\b/i.exec(locStr);
  return m ? parseFloat(m[1]) : Number.POSITIVE_INFINITY;
}

/** ===== Optional boot check for clearer errors if table is wrong ===== */
(async function assertTableExists() {
  try {
    const { error } = await supabase.schema('public').from(TABLE).select('uuid').limit(1);
    if (error && /schema cache|does not exist|could not find|relation .* does not exist/i.test(error.message)) {
      const msg = `[BOOT] Table "${TABLE}" not found in schema "public". Check TABLE_NAME/.env and Supabase Studio.`;
      if (process.env.NODE_ENV === 'production') {
        console.error(msg);
        process.exit(1);
      } else {
        console.warn(msg + ' (continuing in dev)');
      }
    }
  } catch (e) {
    const msg = '[BOOT] Failed probing table: ' + (e?.message || e);
    if (process.env.NODE_ENV === 'production') {
      console.error(msg);
      process.exit(1);
    } else {
      console.warn(msg + ' (continuing in dev)');
    }
  }
})(); 

/** ===== Health ===== */
app.get('/health', (_req, res) => res.json({ ok: true }));

/**
 * POST /chat
 * Body (all optional except message):
 * {
 *   "message": "tropical drink near me for under $10",
 *   "filters": { "maxPrice": 10, "minRating": 4, "tag": "tropical" },
 *   "limit": 12
 * }
 */
app.post('/chat', async (req, res) => {
  const userMessage = clip(req.body?.message, 400);
  const limit = Math.min(Number(req.body?.limit || 10), 20);

  // --- Small-talk branch ---
  if (isSmallTalk(userMessage)) {
    const text = await smallTalkReply(openai, userMessage);
    return res.json({ message: text, picks: [] });
  }

  // --- Auto-intent parser (budget + tag from message) ---
  const incoming = req.body?.filters || {};
  const auto = { ...incoming };

  // infer budget like "$10", "under 10", "below 7.5"
  if (auto.maxPrice == null) {
    const m = /(under|below)?\s*\$?\s*(\d+(?:\.\d{1,2})?)/i.exec(userMessage || '');
    if (m) auto.maxPrice = Number(m[2]);
  }

  // infer tags from common words
  const msgLower = (userMessage || '').toLowerCase();
  const tagWords = [
    'tropical', 'citrus', 'mango', 'peach', 'lychee',
    'pineapple', 'coconut', 'lime', 'lemon', 'orange', 'passionfruit'
  ];
  for (const t of tagWords) {
    if (msgLower.includes(t)) { auto.tag = auto.tag || t; break; }
  }
  const expandedTags = tagExpansion(auto.tag); // e.g., ["tropical","mango","pineapple",...]

  // detect "near me"
  const wantNearMe = /\bnear me\b/i.test(userMessage || '');

  try {
    const columns =
      'uuid, drink_name, price, rating, rating_count, tags, thoughts, recipe, location_purchased, image_url';

    /** Build a fresh base query (Supabase builder is one-shot) */
    const buildBase = () => {
      let q = supabase.schema('public').from(TABLE).select(columns);
      if (auto.maxPrice != null) q = q.lte('price', auto.maxPrice);
      if (auto.minRating != null) q = q.gte('rating', auto.minRating);
      return q;
    };

    /** Apply tag overlap (any synonym match) */
    const applyTags = (q) => {
      if (expandedTags && expandedTags.length) return q.overlaps('tags', expandedTags);
      return q;
    };

    let candidates = [];
    const term = (userMessage || '').replace(/[^\w\s]/g, ' ').trim();

    // Try 1: term + expandedTags + price/rating
    if (term) {
      let q1 = applyTags(buildBase())
        .or(`drink_name.ilike.%${term}%,thoughts.ilike.%${term}%,recipe.ilike.%${term}%`)
        .order('rating', { ascending: false })
        .order('rating_count', { ascending: false })
        .limit(limit);
      const { data: d1, error: e1 } = await q1;
      if (e1) throw e1;
      candidates = d1 || [];
    }

    // Try 2: expandedTags + price/rating (drop term)
    if (!candidates.length) {
      let q2 = applyTags(buildBase())
        .order('rating', { ascending: false })
        .order('rating_count', { ascending: false })
        .limit(limit);
      const { data: d2, error: e2 } = await q2;
      if (e2) throw e2;
      candidates = d2 || [];
    }

    // Try 3: price/rating only (drop tags)
    if (!candidates.length) {
      let q3 = buildBase()
        .order('rating', { ascending: false })
        .order('rating_count', { ascending: false })
        .limit(limit);
      const { data: d3, error: e3 } = await q3;
      if (e3) throw e3;
      candidates = d3 || [];
    }

    // Try 4: top-rated overall (drop all filters)
    if (!candidates.length) {
      let q4 = supabase.schema('public').from(TABLE).select(columns)
        .order('rating', { ascending: false })
        .order('rating_count', { ascending: false })
        .limit(limit);
      const { data: d4, error: e4 } = await q4;
      if (e4) throw e4;
      candidates = d4 || [];
    }

    // Optional "near me" sort: if the string carries miles, nudge closer ones up
    if (candidates.length && wantNearMe) {
      candidates = [...candidates].sort((a, b) => {
        return extractMiles(a.location_purchased) - extractMiles(b.location_purchased);
      });
    }

    // Graceful "no result" (should be rare with progressive fallback)
    if (!candidates.length) {
      const text = await smallTalkReply(
        openai,
        "No matches found for the user's last request. Suggest how they can refine it (budget, flavors like citrus/tropical, or a base like coffee/tea/fruit). Keep it under 60 words."
      );
      return res.status(200).json({ message: text || DEFAULT_NO_RESULT, picks: [] });
    }

    // Shape for the model/UI
    const rowsForAI = candidates.map((r, i) => ({
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
      image_url: r.image_url
    }));

    // Compose friendly answer (with deterministic fallback)
    let aiText = '';
    try {
      const completion = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        temperature: 0.4,
        messages: [
          {
            role: 'system',
            content:
              "You recommend drinks using the provided 'database rows'. " +
              'Always: 1) pick 1-3 best fits, 2) say why, 3) include price & rating, ' +
              "4) if over budget, suggest cheaper similar options, 5) keep it under 120 words."
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: `User message: ${userMessage || '(none)'}` },
              { type: 'text', text: `Candidates (JSON): ${JSON.stringify(rowsForAI)}` }
            ]
          }
        ]
      });
      aiText = completion.choices?.[0]?.message?.content?.trim() || '';
    } catch {
      aiText =
        'Here are strong picks by rating and price: ' +
        rowsForAI
          .slice(0, 3)
          .map((r) => `${r.name} ($${r.price}, ★${r.rating})`)
          .join(', ') +
        '.';
    }

    const topPicks = rowsForAI.slice(0, 3);
    return res.json({ message: aiText, picks: topPicks, raw: { count: rowsForAI.length } });
  } catch (err) {
    console.error('[ERR]', err?.message || err);
    // Friendly default response on internal error (200 so the UI keeps working)
    return res.status(200).json({
      message: DEFAULT_ERROR,
      picks: [],
      error: 'internal_error',
      detail: err?.message || String(err)
    });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Drink bot API listening on http://localhost:${port}`);
});