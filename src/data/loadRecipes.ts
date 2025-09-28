// src/data/loadRecipes.ts
import { supabase } from "../lib/supabase";
import type { Recipe, Profile, WithUser } from "../types/db";

export type RecipeWithUser = WithUser<Recipe>;

export async function loadRecipes(): Promise<RecipeWithUser[]> {
  // 1) recipes
  const { data: recipes, error: rErr } = await supabase
    .from("recipes")
    .select(`
      uuid, drink_name, location_purchased, price, rating, tags,
      poster_id, thoughts, recipe, image_url, universal_rating, rating_count
    `)
    .order("universal_rating", { ascending: false })
    .limit(20);

  if (rErr) throw rErr;
  const rows = (recipes ?? []) as Recipe[];
  if (!rows.length) return [];

  // 2) unique poster ids
  const posterIds = Array.from(new Set(rows.map(r => r.poster_id).filter(Boolean)));

  // 3) profiles (id, name, handle, avatar_url)
  const profileMap = new Map<
    string,
    Pick<Profile, "name" | "handle" | "avatar_url">
  >();

  if (posterIds.length) {
    const { data: profs, error: pErr } = await supabase
      .from("profiles")
      .select("id, name, handle, avatar_url")
      .in("id", posterIds as string[]);

    if (pErr) throw pErr;
    for (const p of profs ?? []) {
      profileMap.set(p.id, {
        name: p.name ?? null,
        handle: p.handle ?? null,
        avatar_url: p.avatar_url ?? null,
      });
    }
  }

  // 4) merge (attach user; never leave it undefined)
  const enriched: RecipeWithUser[] = rows.map(r => ({
    ...r,
    user: profileMap.get(r.poster_id) ?? { name: null, handle: null, avatar_url: null },
  }));

  return enriched;
}
