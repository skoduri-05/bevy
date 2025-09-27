import { motion, AnimatePresence, useMotionValue } from "framer-motion";
import { Star, Heart, X } from "lucide-react";
import type { Recipe } from "../types/db";


export default function SwipeCard({
    card,
    onSwipeLeft,
    onSwipeRight,
}: {
    card: Recipe & { user?: { name?: string | null; handle?: string | null; avatar_url?: string | null } };
    onSwipeLeft: () => void;
    onSwipeRight: () => void;
}) {
    const x = useMotionValue(0);
    const threshold = 120;


    return (
        <motion.div className="absolute inset-0 origin-bottom" initial={{ y: 20, scale: 0.98, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ opacity: 0, y: -100 }} transition={{ type: "spring", stiffness: 120, damping: 16 }}>
            <motion.div
                drag="x"
                style={{ x }}
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={() => {
                    const dx = x.get();
                    if (dx > threshold) onSwipeRight();
                    else if (dx < -threshold) onSwipeLeft();
                }}
                className="bg-bevy-surface rounded-[28px] shadow-xl overflow-hidden border border-[color:theme(colors.bevy.stroke)] h-full"
            >
                <div className="relative h-[58%]">
                    {card.image_url && <img src={card.image_url} alt={card.drink_name} className="h-full w-full object-cover" />}
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                        <div className="flex items-end justify-between">
                            <div>
                                <h3 className="text-lg font-semibold">{card.drink_name}</h3>
                                <div className="text-[10px] text-zinc-300">{card.location_purchased ?? ""}</div>
                                <div className="mt-1 flex items-center text-[#FBBF24] text-xs">
                                    <Star className="h-3 w-3 fill-current" />
                                    <span className="ml-1">{(card.universal_rating ?? card.rating ?? 0).toFixed(1)}</span>
                                </div>
                            </div>
                            {card.price != null && <div className="text-xl font-semibold">${card.price}</div>}
                        </div>
                    </div>
                </div>


                <div className="p-4 space-y-3">
                    <div className="flex gap-2 text-[10px]">
                        {(card.tags ?? []).map((t) => (
                            <span key={t} className="px-2 py-1 rounded-full bg-bevy-chip border border-[color:theme(colors.bevy.stroke)]">
                                {t}
                            </span>
                        ))}
                    </div>


                    <div className="flex items-center gap-3">
                        {card.user?.avatar_url && <img src={card.user.avatar_url} className="h-8 w-8 rounded-full" />}
                        <div className="text-xs">
                            <div className="font-medium leading-tight">{card.user?.name}</div>
                            <div className="text-zinc-400 leading-tight">{card.user?.handle}</div>
                        </div>
                        <button className="ml-auto text-[10px] px-3 py-1 rounded-full bg-bevy-chip border border-[color:theme(colors.bevy.stroke)]">Follow</button>
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