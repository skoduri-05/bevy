import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Recipe } from "../types/db";
import SwipeCard from "../components/SwipeCard";
import { useWishlist } from "../store/useWishlist";
import { Heart, X } from "lucide-react";

export default function Explore() {
  const [cards, setCards] = useState<Recipe[]>([]);
  const [stack, setStack] = useState<string[]>([]);
  const wishlist = useWishlist();

  // fetch recipes
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .order("universal_rating", { ascending: false });

      if (error) {
        console.error("Error fetching recipes:", error);
        return;
      }
      setCards((data as Recipe[]) ?? []);
    })();
  }, []);

  // keep stack in sync with cards
  useEffect(() => {
    setStack(cards.map((c) => c.uuid));
  }, [cards]);

  // get top card (only one displayed)
  const topCard = cards.find((c) => c.uuid === stack[0]);

  // swipe handler
  const swipe = useCallback(
    async (id?: string, dir?: "left" | "right") => {
      if (!id) {
        console.warn("swipe called without id");
        return;
      }

      console.log("Swiping card uuid:", id, "direction:", dir);

      // remove from stack
      setStack((s) => s.filter((x) => x !== id));

      if (dir === "right") {
        try {
          // current logged-in user
          const {
            data: { user },
            error: userErr,
          } = await supabase.auth.getUser();

          if (userErr || !user) {
            console.error("No authenticated user:", userErr);
            return;
          }

          // fetch current wishlist
          const { data: profile, error: profileErr } = await supabase
            .from("profiles")
            .select("wishlist")
            .eq("id", user.id)
            .single();

          if (profileErr) {
            console.error("Error fetching profile wishlist:", profileErr);
            return;
          }

          const currentWishlist: string[] =
            (profile?.wishlist as string[]) ?? [];

          // avoid duplicates
          if (currentWishlist.includes(id)) {
            console.log("Recipe already in wishlist:", id);
            wishlist.add(id);
            return;
          }

          const newWishlist = [...currentWishlist, id];

          const { error: updateError } = await supabase
            .from("profiles")
            .update({ wishlist: newWishlist })
            .eq("id", user.id);

          if (updateError) {
            console.error("Error updating wishlist:", updateError);
          } else {
            console.log("Wishlist updated with id:", id);
            wishlist.add(id);
          }
        } catch (err) {
          console.error("Unexpected swipe error:", err);
        }
      }
    },
    [wishlist]
  );

  return (
    <div className="px-3 pb-24">
      <div className="relative h-[70vh] mt-1 flex items-center justify-center">
        {topCard ? (
          <SwipeCard
            key={topCard.uuid}
            card={topCard}
            onSwipeLeft={(id) => swipe(id, "left")}
            onSwipeRight={(id) => swipe(id, "right")}
          />
        ) : (
          <div className="text-center text-zinc-400 text-lg">
            Gone through all drinks in database
          </div>
        )}
      </div>

      {topCard && (
        <div className="mt-4 flex items-center justify-center gap-8">
          <RoundBtn onClick={() => swipe(topCard.uuid, "left")}>
            <X className="h-5 w-5" />
          </RoundBtn>
          <RoundBtn glow onClick={() => swipe(topCard.uuid, "right")}>
            <Heart className="h-5 w-5" />
          </RoundBtn>
        </div>
      )}
    </div>
  );
}

function RoundBtn({
  children,
  glow,
  onClick,
}: {
  children: React.ReactNode;
  glow?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`h-14 w-14 rounded-full grid place-items-center border border-[color:theme(colors.bevy.stroke)] bg-bevy-chip backdrop-blur ${
        glow ? "shadow-glow" : ""
      }`}
    >
      {children}
    </button>
  );
}
