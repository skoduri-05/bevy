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

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [newPost, setNewPost] = useState({
    drink_name: "",
    location_purchased: "",
    price: 0,
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

    // Basic client-side validation (you can expand)
    if (!newPost.drink_name.trim()) {
      alert("Please enter a drink name.");
      return;
    }

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
        alert("Error creating post. See console for details.");
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
      setUploadError(null);
    } catch (err) {
      console.error("Unexpected post creation error:", err);
      alert("Unexpected error creating post. See console for details.");
    }
  };

  // Handle image upload
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploadError(null);
      const file = e.target.files?.[0];
      if (!file || !profile) return;

      // validate file type
      if (!file.type.startsWith("image/")) {
        setUploadError("Please select an image file.");
        return;
      }

      // limit size (example: 5 MB)
      const MAX_BYTES = 5 * 1024 * 1024;
      if (file.size > MAX_BYTES) {
        setUploadError("Image too large — please use a file smaller than 5 MB.");
        return;
      }

      setUploading(true);

      // create a unique path
      const ext = file.name.split(".").pop();
      const rand = Math.random().toString(36).slice(2, 9);
      const timestamp = Date.now();
      const filePath = `${profile.id}/${timestamp}_${rand}.${ext}`;

      // upload
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("recipe_images")
        .upload(filePath, file, { cacheControl: "3600", upsert: false });

      if (uploadError) {
        // handle common storage errors
        console.error("Upload error:", uploadError);
        if ((uploadError as any).status === 409) {
          // conflict: try again with a different name (rare due to rand suffix, but safe)
          const altPath = `${profile.id}/${timestamp}_${rand}_${Math.floor(
            Math.random() * 10000
          )}.${ext}`;
          const { data: altData, error: altErr } = await supabase.storage
            .from("recipe_images")
            .upload(altPath, file, { cacheControl: "3600", upsert: false });
          if (altErr) {
            console.error("Retry upload error:", altErr);
            setUploadError("Upload failed (conflict). Check bucket permissions.");
            return;
          } else {
            // use altPath below
            console.log("Upload succeeded on retry", altData);
            // proceed to get URL from altPath
            return await finalizeImageUrl(altPath);
          }
        } else {
          setUploadError(
            `Upload failed: ${uploadError.message || "see console for details"}`
          );
          return;
        }
      }

      // uploadData contains path info; finalize public/signed URL
      const finalPath = uploadData?.path ?? filePath;
      await finalizeImageUrl(finalPath);
    } catch (err) {
      console.error("Unexpected upload error:", err);
      setUploadError("Unexpected upload error — see console for details.");
    } finally {
      setUploading(false);
    }
  }

  // finalizeImageUrl: get public URL or signed URL fallback
  async function finalizeImageUrl(path: string) {
    try {
      // first try public URL
      const { data: publicData } = supabase.storage
        .from("recipe_images")
        .getPublicUrl(path);

      let finalUrl = publicData?.publicUrl ?? "";

      // quick test: try to fetch HEAD to see if accessible (may be blocked by CORS)
      let accessible = false;
      try {
        // HEAD might be blocked by CORS; do fetch and if it returns status 200-299 we assume accessible
        const res = await fetch(finalUrl, { method: "HEAD" });
        accessible = res.ok;
      } catch (fetchErr) {
        // fetch can throw due to CORS — we can't reliably detect public/private in every environment.
        console.warn("HEAD request for public URL threw (likely CORS):", fetchErr);
        // treat as inaccessible and fall back to signed URL
        accessible = false;
      }

      if (!finalUrl || !accessible) {
        // fallback to signed URL for 7 days
        const expiresIn = 60 * 60 * 24 * 7; // 7 days
        const { data: signedData, error: signedErr } = await supabase.storage
          .from("recipe_images")
          .createSignedUrl(path, expiresIn);

        if (signedErr || !signedData?.signedUrl) {
          console.error("Signed URL error:", signedErr);
          setUploadError(
            "Uploaded but could not generate public URL. Check bucket public settings or enable signed URLs."
          );
          // still set path (not URL) so dev can inspect
          setNewPost((prev) => ({ ...prev, image_url: "" }));
          return;
        }

        finalUrl = signedData.signedUrl;
      }

      setNewPost((prev) => ({ ...prev, image_url: finalUrl }));
    } catch (err) {
      console.error("finalizeImageUrl error:", err);
      setUploadError("Failed to get image URL after upload.");
    }
  }

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

      {/* Preferred Tags Editor Modal (unchanged UI from before) */}
      {showTagEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowTagEditor(false)}
          />
          <div className="relative bg-zinc-900 rounded-2xl p-4 w-[22rem] h-[28rem] flex flex-col">
            <h3 className="text-white mb-3">Edit Preferred Tags</h3>

            {/* Selected tags */}
            <div>
              <div className="text-xs text-zinc-400 mb-1">Selected</div>
              <div className="flex flex-wrap gap-2 mb-3">
                {tempTags.length > 0 ? (
                  tempTags.map((t) => (
                    <span
                      key={t}
                      className="px-3 py-1 rounded-full bg-white text-black text-xs cursor-pointer"
                      onClick={() =>
                        setTempTags(tempTags.filter((tag) => tag !== t))
                      }
                    >
                      {tagLabel(t)} ×
                    </span>
                  ))
                ) : (
                  <div className="text-zinc-500 text-xs">No tags selected</div>
                )}
              </div>
            </div>

            {/* Available tags */}
            <div className="flex-1 overflow-y-auto">
              <div className="text-xs text-zinc-400 mb-1">All Tags</div>
              <div className="flex flex-wrap gap-2">
                {TAG_FACETS.flatMap((f) => f.options).map((o) => {
                  const selected = tempTags.includes(o.value);
                  return (
                    <button
                      key={o.value}
                      onClick={() => {
                        if (selected) {
                          setTempTags(tempTags.filter((t) => t !== o.value));
                        } else {
                          setTempTags([...tempTags, o.value]);
                        }
                      }}
                      className={`px-3 py-1 rounded-full border text-xs transition ${
                        selected
                          ? "bg-white text-black border-white"
                          : "bg-bevy-chip text-white border-[color:theme(colors.bevy.stroke)]"
                      }`}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Save / Cancel */}
            <div className="mt-4 flex justify-end gap-2">
              <button
                className="px-3 py-1 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white text-sm"
                onClick={() => setShowTagEditor(false)}
              >
                Cancel
              </button>
              <button
                className="px-3 py-1 rounded-lg bg-white text-black text-sm"
                onClick={async () => {
                  if (!profile) return;
                  const { error } = await supabase
                    .from("profiles")
                    .update({ preferred_tags: tempTags })
                    .eq("id", profile.id);

                  if (error) {
                    console.error("Error updating tags:", error);
                  } else {
                    setProfile({ ...profile, preferred_tags: tempTags });
                    setShowTagEditor(false);
                  }
                }}
              >
                Save
              </button>
            </div>
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

            {/* Upload Image */}
            <div>
              <label className="text-sm font-medium">Upload Image</label>
              <input
                type="file"
                accept="image/*"
                className="mt-1 block w-full text-sm text-zinc-300
                           file:mr-4 file:py-2 file:px-4
                           file:rounded-full file:border-0
                           file:text-sm file:font-semibold
                           file:bg-zinc-700 file:text-white
                           hover:file:bg-zinc-600"
                onChange={handleImageUpload}
              />
              {uploading && (
                <p className="text-xs text-zinc-400 mt-1">Uploading...</p>
              )}
              {uploadError && (
                <p className="text-xs text-red-400 mt-1">{uploadError}</p>
              )}
              {newPost.image_url && (
                <img
                  src={newPost.image_url}
                  alt="Preview"
                  className="mt-2 h-32 w-auto rounded-lg object-cover"
                />
              )}
            </div>

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
