import { useEffect, useState, type FormEvent, useRef } from "react";
import cubeGif from "../assets/bevin-cube.gif";
import "./bevin.css";
import { supabase } from "../lib/supabase";

/* ---------- Types ---------- */
type ChatPick = {
  i: number;
  uuid: string;
  name: string;
  price: number;
  rating: number;
  rating_count: number;
  tags: string[] | null;
  location: string | null;
  thoughts: string | null;
  recipe: string | null;
  image_url: string | null;
};

type ChatResponse = {
  message: string;
  picks: ChatPick[];
  raw?: { count: number };
  error?: string;
  detail?: string;
};

/* ---------- Helpers ---------- */
function stripMarkdown(text: string) {
  return (text || "")
    .replace(/\*\*(.*?)\*\*/g, "$1")     // bold
    .replace(/\*(.*?)\*/g, "$1")         // italic
    .replace(/`(.*?)`/g, "$1")           // inline code
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")  // links
    .replace(/[#>*_~]/g, "")             // leftover symbols
    .replace(/\s+\n/g, "\n")
    .trim();
}

/** In serverless on Vercel, just call /api directly (no CORS needed) */
const API_BASE = "/api";

export default function Bevin() {
  const [firstName, setFirstName] = useState<string>("there");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "bot"; text: string }[]>([]);
  const [introVisible, setIntroVisible] = useState(true);
  const [loading, setLoading] = useState(false);
  const [picks, setPicks] = useState<ChatPick[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  /* Auto-scroll */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, picks, loading]);

  /* Optional: greet by first name if logged in */
  useEffect(() => {
    (async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        const id = auth?.user?.id;
        if (!id) return;
        const { data } = await supabase.from("profiles").select("name").eq("id", id).maybeSingle();
        if (data?.name) setFirstName(data.name.split(" ")[0]);
      } catch {
        /* ignore profile errors for chat UX */
      }
    })();
  }, []);

  /* Submit → call /api/chat */
  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    const question = input.trim();
    if (!question) return;

    // optimistic UI
    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setIntroVisible(false);
    setLoading(true);
    setErr(null);
    setInput("");

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question }),
      });

      const data: ChatResponse = await res.json();

      setMessages((prev) => [
        ...prev,
        { role: "bot", text: stripMarkdown(data.message || "Hmm, no reply.") },
      ]);
      setPicks(Array.isArray(data.picks) ? data.picks : []);
      if (data.error) setErr(data.detail || data.error);
    } catch (e: any) {
      setErr(e?.message || "Network error");
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "Whoops—I hit a snag. Try again in a moment." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bevin-screen">
      <div className="bevin-chat-area">
        {messages.length === 0 && (
          <div className={`bevin-intro ${introVisible ? "" : "hide"}`}>
            <img src={cubeGif} alt="Bevin cube" className="bevin-cube" />
            <h1 className="bevin-title">
              Bevin here,
              <br />
              how can I help, {firstName}?
            </h1>
            <div className="bevin-subtitle" />
          </div>
        )}

        {messages.length > 0 && (
          <div className="bevin-history-inner">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[80%] px-3 py-2 rounded-xl ${
                  m.role === "user" ? "ml-auto bg-[#9F90FF] text-white" : "mr-auto bg-white/10 text-white"
                }`}
              >
                {m.text}
              </div>
            ))}

            {loading && (
              <div className="mr-auto bg-white/10 text-white px-3 py-2 rounded-xl">
                Thinking…
              </div>
            )}

            {/* Picks (cards) */}
            {picks.length > 0 && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {picks.map((p) => (
                  <div key={p.uuid} className="rounded-xl bg-white/5 p-3 text-white">
                    <div className="flex gap-3">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className="h-16 w-16 rounded-lg object-cover" />
                      ) : (
                        <div className="h-16 w-16 rounded-lg bg-white/10" />
                      )}
                      <div className="flex-1">
                        <div className="font-semibold">{p.name}</div>
                        <div className="text-sm opacity-80">
                          ${p.price?.toFixed?.(2) ?? p.price} · ★{p.rating} ({p.rating_count})
                        </div>
                        {p.location && <div className="text-xs opacity-70">{p.location}</div>}
                      </div>
                    </div>

                    {/* In case recipe/thoughts contain markdown from DB, strip it too */}
                    {p.recipe && (
                      <div className="mt-2 text-sm opacity-90">
                        <span className="opacity-70">Recipe: </span>
                        {stripMarkdown(p.recipe)}
                      </div>
                    )}
                    {p.thoughts && (
                      <div className="mt-1 text-xs opacity-70">{stripMarkdown(p.thoughts)}</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {err && <div className="mt-3 text-xs text-red-300">{err}</div>}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Composer */}
      <form className="bevin-composer" onSubmit={sendMessage}>
        <div className="bevin-inputwrap">
          <input
            className="bevin-input"
            placeholder="Ask me anything… try 'citrus under $10'"
            aria-label="Ask Bevin anything"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>

        <button type="submit" className="bevin-send" aria-label="Send" disabled={loading}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M3.4 20.6 22 12 3.4 3.4l2.8 7.2L16 12l-9.8 1.4-2.8 7.2Z" />
          </svg>
        </button>
      </form>
    </div>
  );
}