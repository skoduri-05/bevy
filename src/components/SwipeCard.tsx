// src/components/SwipeCard.tsx
import { useMemo } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Star } from "lucide-react";
import type { Recipe, WithUser } from "../types/db";

export default function SwipeCard({
    card,
    onSwipeLeft,
    onSwipeRight,
}: {
    card: WithUser<Recipe>;
    onSwipeLeft: (id: string) => void;
    onSwipeRight: (id: string) => void;
}) {
    const x = useMotionValue(0);

    // ~20% viewport width (min 90, max 140) for easier mobile swipes
    const threshold = useMemo(() => {
        if (typeof window === "undefined") return 120;
        const w = window.innerWidth || 375;
        return Math.max(90, Math.min(140, w * 0.2));
    }, []);

    const rotate = useTransform(x, [-200, 0, 200], [-8, 0, 8]);
    const likeOpacity = useTransform(x, [0, threshold], [0, 1]);
    const nopeOpacity = useTransform(x, [0, -threshold], [0, 1]);

    const flingOut = (dir: "left" | "right") => {
        const to = (typeof window !== "undefined" ? window.innerWidth : 500) * (dir === "right" ? 1 : -1);
        animate(x, to, { type: "spring", stiffness: 300, damping: 30 });
        setTimeout(() => {
            dir === "right" ? onSwipeRight(card.uuid) : onSwipeLeft(card.uuid);
        }, 120);
    };

    return (
        <motion.div
            className="absolute inset-0 origin-bottom"
            initial={{ y: 20, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ opacity: 0, y: -100 }}
            transition={{ type: "spring", stiffness: 120, damping: 16 }}
        >
            <motion.div
                drag="x"
                dragElastic={0.25}
                dragConstraints={{ left: 0, right: 0 }}
                style={{ x, rotate, touchAction: "pan-y" }}
                onDragEnd={(_, info) => {
                    const dx = x.get();
                    const power = Math.abs(dx) + Math.abs(info.velocity.x) * 160;
                    if (power > threshold) flingOut(dx > 0 ? "right" : "left");
                    else animate(x, 0, { type: "spring", stiffness: 500, damping: 40 });
                }}
                whileTap={{ scale: 0.995 }}
                className="bg-bevy-surface rounded-[28px] shadow-xl overflow-hidden border border-[color:theme(colors.bevy.stroke)] h-full"
            >
                <div className="relative h-[58%]">
                    {card.image_url && (
                        <img
                            src={card.image_url}
                            alt={card.drink_name}
                            className="h-full w-full object-cover"
                        />
                    )}

                    {/* Swipe hints */}
                    <div className="pointer-events-none absolute inset-0 flex items-start justify-between p-3">
                        <motion.span
                            style={{ opacity: likeOpacity }}
                            className="px-2 py-1 rounded-full text-[10px] font-semibold bg-green-100 text-green-700"
                        >
                            Save
                        </motion.span>
                        <motion.span
                            style={{ opacity: nopeOpacity }}
                            className="px-2 py-1 rounded-full text-[10px] font-semibold bg-red-100 text-red-700"
                        >
                            Pass
                        </motion.span>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                        <div className="flex items-end justify-between">
                            <div>
                                <h3 className="text-lg font-semibold">{card.drink_name}</h3>
                                <div className="text-[10px] text-zinc-300">
                                    {card.location_purchased ?? ""}
                                </div>
                                <div className="mt-1 flex items-center text-[#FBBF24] text-xs">
                                    <Star className="h-3 w-3 fill-current" />
                                    <span className="ml-1">
                                        {(card.universal_rating ?? card.rating ?? 0).toFixed(1)}
                                    </span>
                                </div>
                            </div>
                            {card.price != null && (
                                <div className="text-xl font-semibold">${card.price}</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bottom content */}
                <div className="p-4 space-y-3">
                    {/* Tags */}
                    <div className="flex gap-2 text-[10px]">
                        {(card.tags ?? []).map((t) => (
                            <span
                                key={t}
                                className="px-2 py-1 rounded-full bg-bevy-chip border border-[color:theme(colors.bevy.stroke)]"
                            >
                                {t}
                            </span>
                        ))}
                    </div>

                    {/* Poster + Follow grouped on the right */}
                    <div className="flex items-center justify-between gap-3">
                        {/* Left: Avatar + name + handle */}
                        <div className="flex items-center gap-3 min-w-0">
                            {/* Avatar (fallback initials) */}
                            {card.user?.avatar_url ? (
                                <img
                                    src={card.user.avatar_url}
                                    alt={card.user?.name ?? "User"}
                                    className="h-10 w-10 rounded-full object-cover"
                                />
                            ) : (
                                <div className="h-10 w-10 rounded-full bg-zinc-700/60 grid place-items-center text-xs">
                                    {(card.user?.name?.[0] ?? "U").toUpperCase()}
                                </div>
                            )}

                            {/* Name + handle */}
                            <div className="min-w-0">
                                <div className="flex items-center gap-1">
                                    <span className="truncate text-[17px] font-semibold text-violet-300">
                                        {card.user?.name ?? "Unknown"}
                                    </span>

                                </div>
                                <div className="truncate text-sm text-zinc-400">
                                    {card.user?.handle ? `@${card.user.handle.replace(/^@/, "")}` : "@unknown"}
                                </div>
                            </div>
                        </div>

                        {/* Right: Follow button */}
                        <button
                            className="px-4 h-10 rounded-xl bg-[#46408A] text-white text-sm font-medium shadow-sm
               hover:brightness-[1.1] active:scale-95 transition"
                            aria-label="Follow user"
                        >
                            Follow
                        </button>
                    </div>

                    {card.thoughts && (
                        <div className="text-xs text-zinc-300">
                            <div className="font-semibold text-zinc-200 mb-1">Thoughts</div>
                            {card.thoughts}
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
