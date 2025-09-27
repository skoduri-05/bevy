import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Recipe } from "../types/db";
import Thumb from "../components/Thumb";
import { ALL_TAG_SLUGS } from "../data/tags";


import TagChip from "../components/TagChip";
import { useWishlist } from "../store/useWishlist";


export default function Wishlist() {
    const { ids } = useWishlist();
    const [drinks, setDrinks] = useState<Recipe[]>([]);


    useEffect(() => {
        (async () => {
            if (!ids.length) return setDrinks([]);
            const { data } = await supabase.from("recipes").select("*").in("uuid", ids);
            setDrinks(data ?? []);
        })();
    }, [ids]);


    return (
        <div className="px-4 pb-24">
            <div className="flex items-center gap-2">
                <input placeholder="Search through my wishlist…" className="w-full bg-bevy-chip border border-[color:theme(colors.bevy.stroke)] rounded-2xl px-4 py-3 text-sm placeholder:text-zinc-500 focus:outline-none" />
                <button className="p-3 rounded-xl bg-bevy-chip border border-[color:theme(colors.bevy.stroke)]">⋮</button>
            </div>


            <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
                {ALL_TAG_SLUGS.slice(0, 6).map((t) => (
                    <TagChip key={t} label={t} />
                ))}
            </div>


            <div className="mt-4 text-[10px] text-zinc-400">Top three</div>
            <div className="grid grid-cols-3 gap-3 mt-2">
                {drinks.slice(0, 3).map((d) => (
                    <Thumb key={d.uuid} image={d.image_url} title={d.drink_name} />
                ))}
            </div>


            <div className="mt-4 text-[10px] text-zinc-400">My wishlist</div>
            <div className="grid grid-cols-3 gap-3 mt-2">
                {drinks.map((d) => (
                    <Thumb key={d.uuid} image={d.image_url} title={d.drink_name} />
                ))}
            </div>


            {!drinks.length && (
                <div className="text-center text-zinc-400 text-sm mt-10">Nothing here yet. Go to <a href="/" className="text-white underline">Explore</a> and swipe right!</div>
            )}
        </div>
    );
}