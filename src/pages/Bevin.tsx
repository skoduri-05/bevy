import { useEffect, useState, type FormEvent, useRef } from "react";
import cubeGif from "../assets/bevin-cube.gif";
import "./bevin.css";
import { supabase } from "../lib/supabase";

export default function Bevin() {
    const [firstName, setFirstName] = useState<string>("there");
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<{ role: "user" | "bot"; text: string }[]>([]);
    const [introVisible, setIntroVisible] = useState(true);
    const bottomRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        (async () => {
            const { data: auth } = await supabase.auth.getUser();
            const id = auth?.user?.id;
            if (!id) return;
            const { data } = await supabase
                .from("profiles")
                .select("name")
                .eq("id", id)
                .maybeSingle();
            if (data?.name) {
                const fst = data.name.split(" ")[0];
                setFirstName(fst);
            }
        })();
    }, []);

    const sendMessage = (e: FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        // add user message
        setMessages((prev) => [...prev, { role: "user", text: input }]);
        setIntroVisible(false);

        // TODO: replace with CedarOS call
        setTimeout(() => {
            setMessages((prev) => [...prev, { role: "bot", text: "✨ Response from Bevin ✨" }]);
        }, 800);

        setInput("");
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
                            how can I help?
                        </h1>
                        <div className="bevin-subtitle">
                        </div>
                    </div>
                )}

                {messages.length > 0 && (
                    <div className="bevin-history-inner">
                        {messages.map((m, i) => (
                            <div
                                key={i}
                                className={`max-w-[80%] px-3 py-2 rounded-xl ${m.role === "user"
                                    ? "ml-auto bg-[#9F90FF] text-white"
                                    : "mr-auto bg-white/10 text-white"
                                    }`}
                            >
                                {m.text}
                            </div>
                        ))}
                        <div ref={bottomRef} />
                    </div>
                )}
            </div>

            {/* composer */}
            <form className="bevin-composer" onSubmit={sendMessage}>
                <div className="bevin-inputwrap">
                    <input
                        className="bevin-input"
                        placeholder="Ask me Anything..."
                        aria-label="Ask Bevin anything"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />
                </div>

                <button type="submit" className="bevin-send" aria-label="Send">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                        <path d="M3.4 20.6 22 12 3.4 3.4l2.8 7.2L16 12l-9.8 1.4-2.8 7.2Z" />
                    </svg>
                </button>
            </form>
        </div>
    );
}