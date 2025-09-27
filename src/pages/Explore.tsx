import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Recipe } from "../types/db";
import SwipeCard from "../components/SwipeCard";
import { useWishlist } from "../store/useWishlist";
import { Heart, X } from "lucide-react";


export default function Explore() {
    const [cards, setCards] = useState<Recipe[]>([]);
    const wishlist = useWishlist();


    useEffect(() => {
        (async () => {
            const { data } = await supabase
                .from("recipes")
                .select("*")
                .order("rating", { ascending: false })
                .limit(20);
            setCards(data ?? []);
        })();
    }, []);


    const [stack, setStack] = useState<string[]>([]);
    useEffect(() => setStack(cards.map((c) => c.uuid)), [cards]);


    const active = useMemo(() => stack.map((id) => cards.find((c) => c.uuid === id)!).slice(0, 3), [stack, cards]);


    const swipe = (id?: string, dir?: "left" | "right") => {
        if (!id) return;
        setStack((s) => s.filter((x) => x !== id));
        if (dir === "right") wishlist.add(id);
    };


    return (
        <div className="px-3 pb-24">
            <div className="relative h-[70vh] mt-1">
                {active.map((card, i) => (
                    <SwipeCard key={card.uuid} card={card} onSwipeLeft={() => swipe(card.uuid, "left")} onSwipeRight={() => swipe(card.uuid, "right")} />
                ))}
            </div>


            <div className="mt-4 flex items-center justify-center gap-8">
                <RoundBtn onClick={() => swipe(active[0]?.uuid, "left")}> <X className="h-5 w-5" /> </RoundBtn>
                <RoundBtn glow onClick={() => swipe(active[0]?.uuid, "right")}> <Heart className="h-5 w-5" /> </RoundBtn>
            </div>
        </div>
    );
}


function RoundBtn({ children, glow, onClick }: { children: React.ReactNode; glow?: boolean; onClick?: () => void }) {
    return (
        <button onClick={onClick} className={`h-14 w-14 rounded-full grid place-items-center border border-[color:theme(colors.bevy.stroke)] bg-bevy-chip backdrop-blur ${glow ? "shadow-glow" : ""}`}>
            {children}
        </button>
    );
}