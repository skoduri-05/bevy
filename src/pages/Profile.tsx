import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import type { Profile as ProfileT, Recipe } from "../types/db";
import Thumb from "../components/Thumb";
import { TAG_FACETS, type TagSlug } from "../data/tags";

const tagLabel = (slug: TagSlug) =>
  TAG_FACETS.flatMap((f) => f.options).find((o) => o.value === slug)?.label ??
  slug;

const availableTags = TAG_FACETS.flatMap((f) => f.options.map((o) => o.value));

type MiniProfile = {
  id: string;
  name: string | null;
  handle: string | null;
  avatar_url: string | null;
};

export default function Profile() {
  const [profile, setProfile] = useState<ProfileT | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [posts, setPosts] = useState<Recipe[]>([]);
  const [showPopup, setShowPopup] = useState<"followers" | "following" | null>(
    null
  );
  const [popupUsers, setPopupUsers] = useState<MiniProfile[]>([]);

  const [showPostModal, setShowPostModal] = useState(false);
  const [showTagEditor, setShowTagEditor] = useState(false);
  const [tempTags, setTempTags] = useState<string[]>([]);
  const [tagSearch, setTagSearch] = useState("");

  const [newPost, setNewPost] = useState({
    drink_name: "",
    location_purchased: "",
    price: 0, // numeric
    tags: [] as string[],
    thoughts: "",
    recipe: "",
    rating: 3,
    image_url: "",
  });

  const navigate = useNavigate();

  // Fetch profile + recipes + posts
  async function fetchProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: p, error: profileErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileErr) {
      console.error("Error fetching profile:", profileErr);
      return;
    }

    if (p) {
      setProfile(p as ProfileT);

      // fetch recipes by this user
      const { data: r } = await supabase
        .from("recipes")
        .select("*")
        .eq("poster_id", p.id)
        .order("rating", { ascending: false });
      setRecipes(r ?? []);

      // fetch posts (recipes referenced in profile.posts)
      if (p.posts?.length) {
        const { data: postRecipes } = await supabase
          .from("recipes")
          .select("*")
          .in("uuid", p.posts);
        setPosts(postRecipes ?? []);
      } else {
        setPosts([]);
      }
    }
  }

  useEffect(() => {
    fetchProfile();
  }, []);

  // Followers/Following popup fetch
  useEffect(() => {
    if (!showPopup || !profile) return;

    const ids =
      showPopup === "followers" ? profile.followers ?? [] : profile.following ?? [];

    if (ids.length === 0) {
      setPopupUsers([]);
      return;
    }

    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, handle, avatar_url")
        .in("id", ids);

      if (error) {
        console.error("Error fetching popup users:", error);
        setPopupUsers([]);
      } else {
        setPopupUsers(data as MiniProfile[]);
      }
    })();
  }, [showPopup, profile]);

  // Create post handler
  const handleCreatePost = async () => {
    if (!profile) return;

    try {
      const { data: recipe, error: recipeErr } = await supabase
        .from("recipes")
        .insert([
          {
            drink_name: newPost.drink_name,
            location_purchased: newPost.location_purchased,
            price: newPost.price,
            tags: newPost.tags,
            thoughts: newPost.thoughts,
            recipe: newPost.recipe,
            rating: newPost.rating,
            image_url: newPost.image_url,
            poster_id: profile.id,
            universal_rating: newPost.rating,
            rating_count: 1,
          },
        ])
        .select()
        .single();

      if (recipeErr) {
        console.error("Error inserting recipe:", recipeErr);
        return;
      }

      // update profile.posts
      const updatedPosts = [...(profile.posts ?? []), recipe.uuid];
      const { error: profileErr } = await supabase
        .from("profiles")
        .update({ posts: updatedPosts })
        .eq("id", profile.id);

      if (profileErr) {
        console.error("Error updating profile posts:", profileErr);
      }

      await fetchProfile();

      setShowPostModal(false);
      setNewPost({
        drink_name: "",
        location_purchased: "",
        price: 0,
        tags: [],
        thoughts: "",
        recipe: "",
        rating: 3,
        image_url: "",
      });
      setTagSearch("");
    } catch (err) {
      console.error("Unexpected post creation error:", err);
    }
  };

  if (!profile) return <div className="px-4 pb-24">Loading…</div>;

  return (
    <div className="px-4 pb-24">
      {/* Avatar + name + handle */}
      <div className="flex items-center gap-3">
        {profile.avatar_url && (
          <img
            src={profile.avatar_url}
            alt="avatar"
            className="h-16 w-16 rounded-full object-cover"
          />
        )}
        <div>
          <div className="text-lg font-semibold leading-tight">
            {profile.name ?? "Unnamed"}
          </div>
          <div className="text-zinc-400 text-xs leading-tight">
            {profile.handle ?? ""}
          </div>
          <div className="text-[11px] text-zinc-400 leading-tight mt-1">
            Joined{" "}
            {new Date(profile.created_at ?? Date.now()).toLocaleString([], {
              month: "short",
              year: "numeric",
            })}
          </div>
        </div>
      </div>

      {/* Counts */}
      <div className="mt-3 flex gap-4 text-sm">
        <div>
          <span className="font-semibold text-white">
            {profile.post_counter ?? 0}
          </span>{" "}
          <span className="text-zinc-400">Posts</span>
        </div>
        <button
          className="px-3 py-1 rounded-full border border-zinc-600 text-white hover:bg-zinc-800 transition"
          onClick={() => setShowPopup("followers")}
        >
          <span className="font-semibold">{profile.followers?.length ?? 0}</span>{" "}
          <span className="text-zinc-400">Followers</span>
        </button>
        <button
          className="px-3 py-1 rounded-full border border-zinc-600 text-white hover:bg-zinc-800 transition"
          onClick={() => setShowPopup("following")}
        >
          <span className="font-semibold">{profile.following?.length ?? 0}</span>{" "}
          <span className="text-zinc-400">Following</span>
        </button>
      </div>

      {/* Bio */}
      {profile.bio && (
        <div className="mt-3 text-sm text-zinc-300">{profile.bio}</div>
      )}

      {/* Preferred tags */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] text-zinc-400">Preferred tags</div>
          <button
            className="text-xs text-white bg-zinc-800 px-2 py-1 rounded hover:bg-zinc-700 transition"
            onClick={() => {
              setTempTags(profile.preferred_tags ?? []);
              setShowTagEditor(true);
            }}
          >
            Edit
          </button>
        </div>

        <div className="flex flex-wrap gap-2 text-[10px]">
          {(profile.preferred_tags ?? []).map((t) => (
            <span
              key={t}
              className="px-2 py-1 rounded-full bg-bevy-chip border border-[color:theme(colors.bevy.stroke)]"
            >
              {tagLabel(t)}
            </span>
          ))}
        </div>
      </div>

      {/* Posts */}
      <div className="mt-5">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] text-zinc-400">My posts</div>
          <button
            className="text-xs text-white bg-zinc-800 px-2 py-1 rounded hover:bg-zinc-700 transition"
            onClick={() => setShowPostModal(true)}
          >
            Create Post
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-2">
          {posts.map((d) => (
            <Thumb key={d.uuid} image={d.image_url} title={d.drink_name} />
          ))}
        </div>
      </div>

      {/* Recipes */}
      <div className="mt-5 text-[10px] text-zinc-400">My recipes</div>
      <div className="grid grid-cols-3 gap-3 mt-2">
        {recipes.map((d) => (
          <Thumb key={d.uuid} image={d.image_url} title={d.drink_name} />
        ))}
      </div>

      {/* Followers/Following popup */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowPopup(null)}
          />
          <div className="relative bg-zinc-900 rounded-2xl p-4 w-80 max-h-[70vh] overflow-y-auto">
            <h3 className="text-white mb-3">
              {showPopup === "followers" ? "Followers" : "Following"}
            </h3>
            {popupUsers.length > 0 ? (
              <ul className="space-y-2">
                {popupUsers.map((u) => (
                  <li
                    key={u.id}
                    className="flex items-center gap-2 text-sm text-white cursor-pointer hover:bg-zinc-800 p-2 rounded-lg"
                    onClick={() => {
                      setShowPopup(null);
                      navigate(`/profile/${u.id}`);
                    }}
                  >
                    {u.avatar_url && (
                      <img
                        src={u.avatar_url}
                        alt="avatar"
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    )}
                    <div>
                      <div className="font-medium">{u.name ?? "Unnamed"}</div>
                      <div className="text-xs text-zinc-400">
                        {u.handle ?? ""}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-zinc-400 text-sm">No users found</div>
            )}
          </div>
        </div>
      )}

      {/* Create Post Modal */}
      {showPostModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-zinc-800 text-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col gap-4">
            <h2 className="text-lg font-semibold">Create a Post</h2>

            {/* Inputs */}
            <input
              className="w-full p-2 rounded bg-zinc-700 text-sm"
              placeholder="Drink Name"
              value={newPost.drink_name}
              onChange={(e) =>
                setNewPost({ ...newPost, drink_name: e.target.value })
              }
            />
            <input
              className="w-full p-2 rounded bg-zinc-700 text-sm"
              placeholder="Location Purchased"
              value={newPost.location_purchased}
              onChange={(e) =>
                setNewPost({ ...newPost, location_purchased: e.target.value })
              }
            />
            <input
              className="w-full p-2 rounded bg-zinc-700 text-sm"
              type="number"
              min="0"
              step="0.01"
              placeholder="Price"
              value={newPost.price}
              onChange={(e) =>
                setNewPost({ ...newPost, price: Number(e.target.value) })
              }
            />
            <textarea
              className="w-full p-2 rounded bg-zinc-700 text-sm"
              placeholder="Your thoughts"
              value={newPost.thoughts}
              onChange={(e) =>
                setNewPost({ ...newPost, thoughts: e.target.value })
              }
            />
            <textarea
              className="w-full p-2 rounded bg-zinc-700 text-sm"
              placeholder="Recipe"
              value={newPost.recipe}
              onChange={(e) =>
                setNewPost({ ...newPost, recipe: e.target.value })
              }
            />
            <input
              className="w-full p-2 rounded bg-zinc-700 text-sm"
              placeholder="Image URL"
              value={newPost.image_url}
              onChange={(e) =>
                setNewPost({ ...newPost, image_url: e.target.value })
              }
            />

            {/* Tag Search */}
            <div>
              <label className="text-sm font-medium">Tags</label>
              <input
                className="w-full p-2 rounded bg-zinc-700 text-sm mt-1"
                placeholder="Search tags..."
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value)}
              />
              <div className="flex flex-wrap gap-2 mt-2 max-h-32 overflow-y-auto">
                {availableTags
                  .filter((t) =>
                    t.toLowerCase().includes(tagSearch.toLowerCase())
                  )
                  .map((tag) => (
                    <button
                      key={tag}
                      className={`px-2 py-1 rounded-lg text-xs ${
                        newPost.tags.includes(tag)
                          ? "bg-white text-black"
                          : "bg-zinc-600"
                      }`}
                      onClick={() => {
                        if (newPost.tags.includes(tag)) {
                          setNewPost({
                            ...newPost,
                            tags: newPost.tags.filter((x) => x !== tag),
                          });
                        } else {
                          setNewPost({
                            ...newPost,
                            tags: [...newPost.tags, tag],
                          });
                        }
                      }}
                    >
                      {tagLabel(tag)}
                    </button>
                  ))}
              </div>
            </div>

            {/* Star Rating */}
            <div>
              <label className="text-sm font-medium">Rating</label>
              <div className="flex gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setNewPost({ ...newPost, rating: star })}
                    className="text-yellow-400 text-xl"
                  >
                    {star <= newPost.rating ? "★" : "☆"}
                  </button>
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-auto flex justify-end gap-2">
              <button
                className="px-3 py-1 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white text-sm"
                onClick={() => setShowPostModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-3 py-1 rounded-lg bg-white text-black text-sm"
                onClick={handleCreatePost}
              >
                Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
