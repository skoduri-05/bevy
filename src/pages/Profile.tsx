import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Profile as ProfileT, Recipe } from "../types/db";
import Thumb from "../components/Thumb";
import { TAG_FACETS, type TagSlug } from "../data/tags";


const tagLabel = (slug: TagSlug) => TAG_FACETS.flatMap(f => f.options).find(o => o.value === slug)?.label ?? slug;


export default function Profile() {
    const [profile, setProfile] = useState<ProfileT | null>(null);
    const [recipes, setRecipes] = useState<Recipe[]>([]);


    useEffect(() => {
        (async () => {
            // TODO: use auth user id; for preview, grab first profile
            const { data: p } = await supabase.from("profiles").select("*").limit(1).maybeSingle();
            if (p) setProfile(p as ProfileT);
            if (p?.id) {
                const { data: r } = await supabase.from("recipes").select("*").eq("poster_id", p.id).order("rating", { ascending: false });
                setRecipes(r ?? []);
            }
        })();
    }, []);


    if (!profile) return <div className="px-4 pb-24">Loading…</div>;


    return (
        <div className="px-4 pb-24">
            <div className="flex items-center gap-3">
                {profile.avatar_url && <img src={profile.avatar_url} className="h-16 w-16 rounded-full" />}
                <div>
                    <div className="text-lg font-semibold leading-tight">{profile.name ?? "Unnamed"}</div>
                    <div className="text-zinc-400 text-xs leading-tight">{profile.handle ?? ""}</div>
                    <div className="text-[11px] text-zinc-400 leading-tight mt-1">Joined {new Date(profile.created_at ?? Date.now()).toLocaleString([], { month: "short", year: "numeric" })}</div>
                </div>
            </div>


            <div className="mt-3 flex gap-4 text-sm">
                <div><span className="font-semibold text-white">{profile.followers?.length ?? 0}</span> <span className="text-zinc-400">Followers</span></div>
                <div><span className="font-semibold text-white">{profile.following?.length ?? 0}</span> <span className="text-zinc-400">Following</span></div>
            </div>


            {profile.bio && <div className="mt-3 text-sm text-zinc-300">{profile.bio}</div>}


            <div className="mt-4">
                <div className="text-[10px] text-zinc-400 mb-2">Preferred tags</div>
                <div className="flex flex-wrap gap-2 text-[10px]">
                    {(profile.preferred_tags ?? []).map((t) => (
                        <span key={t} className="px-2 py-1 rounded-full bg-bevy-chip border border-[color:theme(colors.bevy.stroke)]">{tagLabel(t)}</span>
                    ))}
                </div>
            </div>


            <div className="mt-5 text-[10px] text-zinc-400">My recipes</div>
            <div className="grid grid-cols-3 gap-3 mt-2">
                {recipes.map((d) => (
                    <Thumb key={d.uuid} image={d.image_url} title={d.drink_name} />
                ))}
            </div>
        </div>
    );
}