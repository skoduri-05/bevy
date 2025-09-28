import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../lib/supabase";
import type { Recipe } from "../types/db";
import { Heart, Star } from "lucide-react";
import { useWishlist } from "../store/useWishlist";

type ProfileMini = { id: string; name?: string | null; handle?: string | null; avatar_url?: string | null };

export default function RecipeModal({
  uuid,
  onClose,
}: {
  uuid: string;
  onClose: () => void;
}) {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [poster, setPoster] = useState<ProfileMini | null>(null);
  const wishlist = useWishlist();
  const [pulse, setPulse] = useState(false);
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("recipes").select("*").eq("uuid", uuid).maybeSingle();
      if (error) {
        console.error("Error loading recipe:", error);
        return;
      }
      setRecipe(data ?? null);
      if (data?.poster_id) {
        const { data: p } = await supabase.from("profiles").select("id, name, handle, avatar_url").eq("id", data.poster_id).maybeSingle();
        setPoster(p ?? null);
        // check whether current user follows poster
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (user) {
            const { data: mine } = await supabase.from("profiles").select("following").eq("id", user.id).maybeSingle();
            const myFollowing: string[] = (mine?.following as string[]) ?? [];
            setFollowing(myFollowing.includes(data.poster_id));
          }
        } catch (err) {
          // ignore
        }
      }
    })();
  }, [uuid]);

  const toggleWishlist = async () => {
    if (!recipe) return;
    try {
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();
      if (userErr || !user) {
        console.error("Not signed in:", userErr);
        return;
      }

      const { data: profile } = await supabase.from("profiles").select("wishlist").eq("id", user.id).single();
      const current: string[] = (profile?.wishlist as string[]) ?? [];
      const present = current.includes(uuid);
      const newWishlist = present ? current.filter((x) => x !== uuid) : [...current, uuid];

      const { error: updateErr } = await supabase.from("profiles").update({ wishlist: newWishlist }).eq("id", user.id);
      if (updateErr) {
        console.error("Error updating wishlist:", updateErr);
      } else {
        if (present) wishlist.remove(uuid);
        else wishlist.add(uuid);
        // trigger a single pulse animation to show feedback
        setPulse(true);
        setTimeout(() => setPulse(false), 360);
      }
    } catch (err) {
      console.error(err);
    } finally {
    }
  };

  const toggleFollow = async () => {
    if (!poster) return;
    try {
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();
      if (userErr || !user) return;

      const { data: me } = await supabase.from("profiles").select("following").eq("id", user.id).maybeSingle();
      const current: string[] = (me?.following as string[]) ?? [];
      const now = current.includes(poster.id) ? current.filter((x) => x !== poster.id) : [...current, poster.id];
      const { error } = await supabase.from("profiles").update({ following: now }).eq("id", user.id);
      if (!error) setFollowing(!following);
    } catch (err) {
      console.error(err);
    }
  };

  if (!recipe) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-zinc-900 text-white rounded-2xl p-4 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <button className="absolute right-4 top-4 text-zinc-300" onClick={onClose}>✕</button>
        {recipe.image_url && <img src={recipe.image_url} alt={recipe.drink_name} className="w-full h-56 object-cover rounded-lg mb-4" />}
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <h2 className="text-2xl font-semibold">{recipe.drink_name}</h2>
            <div className="text-sm text-zinc-400">{recipe.location_purchased}</div>
            <div className="mt-2 text-sm">{recipe.thoughts}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(recipe.tags ?? []).map((t) => (
                <div key={t} className="px-2 py-1 rounded-full bg-bevy-chip border border-[color:theme(colors.bevy.stroke)] text-xs">
                  {t}
                </div>
              ))}
            </div>
          </div>

          <div className="ml-4 flex flex-col items-end gap-3">
            {/* Price */}
            {recipe.price != null && (
              <div className="text-3xl font-bold text-white">${recipe.price}</div>
            )}

            {/* Rating */}
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => {
                const val = Math.round((recipe.universal_rating ?? recipe.rating ?? 0));
                return (
                  <Star key={i} className={`h-4 w-4 ${i < val ? "text-yellow-400" : "text-zinc-600"}`} />
                );
              })}
              <div className="text-xs text-zinc-400 ml-2">{((recipe.universal_rating ?? recipe.rating) || 0).toFixed(1)}</div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
              animate={pulse ? { scale: [1, 1.14, 1] } : { scale: 1 }}
              transition={{ type: "spring", stiffness: 520, damping: 20 }}
              className={`h-16 w-16 rounded-full grid place-items-center border border-[color:theme(colors.bevy.stroke)] ${wishlist.has(uuid) ? "bg-red-600 text-white shadow-[0_10px_30px_rgba(239,68,68,0.22)]" : "bg-bevy-chip text-zinc-300"}`}
              onClick={toggleWishlist}
              aria-pressed={wishlist.has(uuid)}
            >
              <Heart className="h-7 w-7" />
            </motion.button>

            {/* Poster info + follow button */}
            {poster && (
              <div className="flex items-center gap-3 mt-2">
                {poster.avatar_url && <img src={poster.avatar_url} className="h-10 w-10 rounded-full object-cover" />}
                <div className="text-sm">
                  <div className="font-medium">{poster.name ?? "Unnamed"}</div>
                  <div className="text-xs text-zinc-400">{poster.handle ?? ""}</div>
                </div>
                <button onClick={toggleFollow} className={`ml-3 px-3 py-1 rounded-lg text-sm ${following ? "bg-zinc-700 text-white" : "bg-purple-600 text-white"}`}>
                  {following ? "Following" : "Follow"}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4">
          <h3 className="text-sm text-zinc-400 mb-2">Recipe</h3>
          <pre className="whitespace-pre-wrap text-sm text-zinc-200">{recipe.recipe}</pre>
        </div>
      </div>
    </div>
  );
}
