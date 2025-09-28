import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Recipe } from "../types/db";
import SwipeCard from "../components/SwipeCard";
import { useWishlist } from "../store/useWishlist";
import { useExploreProgress } from "../store/useExploreProgress";
import { loadRecipes } from "../data/loadRecipes";


export default function Explore() {
    const [cards, setCards] = useState<Recipe[]>([]);
    const wishlist = useWishlist();
    const { stack, setStack, removeFromStack } = useExploreProgress();

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

            const fetched = (data as Recipe[]) ?? [];
            setCards(fetched);

            // only initialize stack if it’s empty
            if (stack.length === 0) {
                setStack(fetched.map((c) => c.uuid));
            }
        })();
    }, [setStack, stack.length]);

    useEffect(() => {
        loadRecipes().then(setCards).catch(console.error);
    }, []);

    // get top card
    const topCard = cards.find((c) => c.uuid === stack[0]);

    // swipe handler
    const swipe = useCallback(
        async (id?: string, dir?: "left" | "right") => {
            if (!id) {
                console.warn("swipe called without id");
                return;
            }

            // remove from stack immediately for snappy UI
            removeFromStack(id);

            if (dir === "right") {
                try {
                    const {
                        data: { user },
                        error: userErr,
                    } = await supabase.auth.getUser();

                    if (userErr || !user) {
                        console.error("No authenticated user:", userErr);
                        return;
                    }

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

                    if (currentWishlist.includes(id)) {
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
                        wishlist.add(id);
                    }
                } catch (err) {
                    console.error("Unexpected swipe error:", err);
                }
            }
        },
        [wishlist, removeFromStack]
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

            {/* action buttons near the bottom nav; mask ensures equal visual size */}
            {topCard && (
                <div className="fixed bottom-24 left-0 right-0 flex justify-center gap-50 z-20">
                    {/* Dislike */}
                    <button
                        onClick={() => swipe(topCard.uuid, "left")}
                        aria-label="Dislike"
                        className="h-20 w-20 rounded-full bg-white flex items-center justify-center shadow-md"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                            className="h-8 w-8 text-red-500"
                        >
                            <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" />
                            <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" />
                        </svg>
                    </button>

                    {/* Like */}
                    <button
                        onClick={() => swipe(topCard.uuid, "right")}
                        aria-label="Like"
                        className="h-20 w-20 rounded-full bg-red-500 flex items-center justify-center shadow-md"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="white"
                            strokeWidth={2}
                            className="h-8 w-8"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 21l-1.45-1.318C5.4 15.36 2 12.278 2 8.5 2 5.462 4.462 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.538 3 22 5.462 22 8.5c0 3.778-3.4 6.86-8.55 11.182L12 21z"
                            />
                        </svg>
                    </button>
                </div>
            )}


        </div>
    );
}