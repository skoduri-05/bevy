import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Recipe } from "../types/db";
import { TAG_FACETS, ALL_TAG_SLUGS, type TagSlug } from "../data/tags";
import TagChip from "../components/TagChip";


export default function Search() {
    const [query, setQuery] = useState("");
    const [selected, setSelected] = useState<TagSlug[]>([]);
    const [results, setResults] = useState<Recipe[]>([]);


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
                    <div key={d.uuid} className="rounded-2xl overflow-hidden bg-bevy-chip border border-[color:theme(colors.bevy.stroke)]">
                        {d.image_url && <img src={d.image_url} className="h-28 w-full object-cover" />}
                        <div className="p-2">
                            <div className="text-sm font-medium leading-tight">{d.drink_name}</div>
                            <div className="text-[10px] text-zinc-400">{d.location_purchased ?? ""}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}