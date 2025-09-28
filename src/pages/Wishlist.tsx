import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Recipe } from "../types/db";
import Thumb from "../components/Thumb";
import { ALL_TAG_SLUGS } from "../data/tags";
import { useWishlist } from "../store/useWishlist";

export default function Wishlist() {
  const { ids } = useWishlist();
  const [drinks, setDrinks] = useState<Recipe[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showTagPopup, setShowTagPopup] = useState(false);

  useEffect(() => {
    (async () => {
      if (!ids.length) return setDrinks([]);
      const { data } = await supabase
        .from("recipes")
        .select("*")
        .in("uuid", ids);
      setDrinks(data ?? []);
    })();
  }, [ids]);

  const filteredDrinks =
    selectedTags.length > 0
      ? drinks.filter((d) =>
          selectedTags.every((t) => d.tags?.includes(t))
        )
      : drinks;

  return (
    <div className="px-4 pb-24 relative">
      {/* search bar */}
<div className="flex items-center gap-2">
  <input
    placeholder="Search through my wishlist…"
    className="w-full bg-bevy-chip border border-[color:theme(colors.bevy.stroke)] rounded-2xl px-4 py-3 text-sm placeholder:text-zinc-500 focus:outline-none"
  />
  <button
    className={`p-3 rounded-xl 
      ${showTagPopup 
        ? "bg-white text-black" // active state 
        : "bg-brown-500 hover:bg-brown-500 text-white"} 
      border border-[color:theme(colors.bevy.stroke)]`}
    onClick={() => setShowTagPopup((prev) => !prev)}
  >
    ⚙️
  </button>
</div>

      {/* selected tag chips */}
      <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
        {selectedTags.map((t) => (
          <div
            key={t}
            className="flex items-center bg-bevy-chip border border-[color:theme(colors.bevy.stroke)] rounded-full px-3 py-1 text-sm text-white gap-1"
          >
            {t}
            <button
              className="ml-1 text-zinc-400 hover:text-white"
              onClick={() =>
                setSelectedTags(selectedTags.filter((tag) => tag !== t))
              }
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* top three */}
      <div className="mt-4 text-[10px] text-zinc-400">Top three</div>
      <div className="grid grid-cols-3 gap-3 mt-2">
        {filteredDrinks.slice(0, 3).map((d) => (
          <Thumb key={d.uuid} image={d.image_url} title={d.drink_name} />
        ))}
      </div>

      {/* full wishlist */}
      <div className="mt-4 text-[10px] text-zinc-400">My wishlist</div>
      <div className="grid grid-cols-3 gap-3 mt-2">
        {filteredDrinks.map((d) => (
          <Thumb key={d.uuid} image={d.image_url} title={d.drink_name} />
        ))}
      </div>

      {!filteredDrinks.length && (
        <div className="text-center text-zinc-400 text-sm mt-10">
          Nothing here yet. Go to{" "}
          <a href="/" className="text-white underline">
            Explore
          </a>{" "}
          and swipe right!
        </div>
      )}

      {/* tag selection modal */}
      {showTagPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowTagPopup(false)}
          />
          {/* modal content */}
          <div className="relative bg-zinc-900 rounded-2xl p-4 w-80 max-h-[80vh] overflow-y-auto">
            <h3 className="text-white mb-3">Select tags</h3>
            <div className="flex flex-wrap gap-2">
              {ALL_TAG_SLUGS.map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    if (selectedTags.includes(t)) {
                      setSelectedTags(selectedTags.filter((tag) => tag !== t));
                    } else {
                      setSelectedTags([...selectedTags, t]);
                    }
                  }}
                  className={`px-3 py-1 rounded-full border ${
                    selectedTags.includes(t)
                      ? "bg-white text-black"
                      : "bg-bevy-chip text-white border-[color:theme(colors.bevy.stroke)]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
