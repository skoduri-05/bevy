import { motion } from "framer-motion";
export default function Bevin() {
    return (
        <div className="pb-24">
            <div className="h-72 bg-gradient-to-b from-bevy-gradientTop to-bevy-gradientBottom flex flex-col items-center justify-center">
                <div className="h-28 w-28 rounded-full bg-white/10 backdrop-blur border border-white/20 grid place-items-center overflow-hidden">
                    <motion.div className="h-24 w-24 rounded-full" animate={{ boxShadow: ["0 0 40px rgba(99,102,241,0.45)", "0 0 40px rgba(236,72,153,0.45)", "0 0 40px rgba(99,102,241,0.45)"] }} transition={{ duration: 4, repeat: Infinity }} style={{ background: "radial-gradient(60% 60% at 50% 50%, #CAE 0%, #89F 70%, transparent 100%)" }} />
                </div>
                <div className="mt-4 text-center text-sm text-zinc-300">Hey Irene,<br />how can I help you?</div>
            </div>
            <div className="px-3 mt-4">
                <div className="flex items-center gap-2 bg-bevy-chip border border-[color:theme(colors.bevy.stroke)] rounded-2xl px-3 py-2">
                    <input className="bg-transparent outline-none flex-1 text-sm" placeholder="Ask me anything…" />
                    <button className="px-3 py-1 rounded-xl bg-white/10 text-xs">Send</button>
                </div>
                <div className="text-[10px] text-zinc-500 mt-2 px-1">Powered by CedarOS</div>
            </div>
        </div>
    );
}