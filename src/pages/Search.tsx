import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Recipe } from "../types/db";
import { TAG_FACETS, type TagSlug } from "../data/tags";
import TagChip from "../components/TagChip";
import RecipeModal from "../components/RecipeModal";
import { Heart } from "lucide-react";
import { useWishlist } from "../store/useWishlist";
import { motion } from "framer-motion";


export default function Search() {
    const [query, setQuery] = useState("");
    const [selected, setSelected] = useState<TagSlug[]>([]);
    const [results, setResults] = useState<Recipe[]>([]);
    const [openUuid, setOpenUuid] = useState<string | null>(null);
    const wishlist = useWishlist();


    const allOptions = useMemo(() => TAG_FACETS.flatMap(f => f.options), []);


    useEffect(() => {
        (async () => {
            const { data } = await supabase.from("recipes").select("*").limit(30);
            setResults(data ?? []);
        })();
    }, []);


    const filtered = useMemo(() => results.filter((r) =>
        (query ? r.drink_name.toLowerCase().includes(query.toLowerCase()) : true) &&
        (selected.length ? selected.every((t) => (r.tags ?? []).includes(t)) : true)
    ), [query, selected, results]);


    return (
        <div className="px-4 pb-24">
            <div className="flex items-center gap-2">
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search…" className="w-full bg-bevy-chip border border-[color:theme(colors.bevy.stroke)] rounded-2xl px-4 py-3 text-sm placeholder:text-zinc-500 focus:outline-none" />
                <button className="p-3 rounded-xl bg-bevy-chip border border-[color:theme(colors.bevy.stroke)]">⋮</button>
            </div>


            <div className="mt-4 text-[10px] text-zinc-400">Categories</div>
            <div className="mt-2 flex flex-wrap gap-2">
                {allOptions.slice(0, 12).map((opt) => {
                    const on = selected.includes(opt.value);
                    return (
                        <TagChip
                            key={opt.value}
                            label={opt.label}
                            on={on}
                            onClick={() => setSelected(on ? selected.filter((x) => x !== opt.value) : [...selected, opt.value])}
                        />
                    );
                })}
            </div>


            <div className="mt-4 text-[10px] text-zinc-400">Recent searches</div>
            <div className="mt-2 space-y-1 text-xs">
                {["Strawberry Matcha Near", "Vegan Smoothies with Collagen", "Atlanta Events"].map((s, i) => (
                    <div key={i} className="flex items-center justify-between bg-bevy-chip border border-[color:theme(colors.bevy.stroke)] rounded-xl px-3 py-2">
                        <span>{s}</span>
                        <button className="text-zinc-400">⋮</button>
                    </div>
                ))}
            </div>


            <div className="mt-5 text-[10px] text-zinc-400">Results</div>
            <div className="grid grid-cols-2 gap-3 mt-2">
                {filtered.map((d) => (
                    <motion.div
                        key={d.uuid}
                        whileHover={{ scale: 1.02 }}
                        className="relative rounded-2xl overflow-hidden bg-bevy-chip border border-[color:theme(colors.bevy.stroke)]"
                    >
                        {d.image_url && (
                            <img src={d.image_url} className="h-28 w-full object-cover cursor-pointer" onClick={() => setOpenUuid(d.uuid)} />
                        )}
                        <div className="p-2" onClick={() => setOpenUuid(d.uuid)}>
                            <div className="text-sm font-medium leading-tight">{d.drink_name}</div>
                            <div className="text-[10px] text-zinc-400">{d.location_purchased ?? ""}</div>
                        </div>

                        {/* heart overlay with motion */}
                        <motion.button
                            onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                    const {
                                        data: { user },
                                        error: userErr,
                                    } = await supabase.auth.getUser();
                                    if (userErr || !user) return;

                                    const { data: profile } = await supabase.from("profiles").select("wishlist").eq("id", user.id).single();
                                    const current: string[] = (profile?.wishlist as string[]) ?? [];
                                    const present = current.includes(d.uuid);
                                    const newWishlist = present ? current.filter((x) => x !== d.uuid) : [...current, d.uuid];
                                    const { error: updateErr } = await supabase.from("profiles").update({ wishlist: newWishlist }).eq("id", user.id);
                                    if (!updateErr) {
                                        if (present) wishlist.remove(d.uuid);
                                        else wishlist.add(d.uuid);
                                    }
                                } catch (err) {
                                    console.error(err);
                                }
                            }}
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.96 }}
                            className={`absolute top-3 right-3 h-11 w-11 rounded-full grid place-items-center border border-[color:theme(colors.bevy.stroke)] ${wishlist.has(d.uuid) ? "bg-red-600 text-white shadow-[0_10px_30px_rgba(239,68,68,0.20)]" : "bg-bevy-chip text-zinc-300"}`}
                            aria-pressed={wishlist.has(d.uuid)}
                        >
                            <Heart className="h-5 w-5" />
                        </motion.button>
                    </motion.div>
                ))}
            </div>
            {openUuid && <RecipeModal uuid={openUuid} onClose={() => setOpenUuid(null)} />}
        </div>
    );
}