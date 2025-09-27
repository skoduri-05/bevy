import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Card, LabeledInput } from "../components/ui/Primitives";
import { supabase } from "../lib/supabase";

export default function ProfilePage({ user, onRequestAuth }: { user: User | null; onRequestAuth: () => void; }) {
    const [loading, setLoading] = useState(false);
    const [supported, setSupported] = useState(true);
    const [handle, setHandle] = useState("");
    const [bio, setBio] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [saving, setSaving] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!user || !supabase) return;
        (async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from("profiles")
                    .select("handle,bio,avatar_url")
                    .eq("id", user.id)
                    .single();

                if (error) {
                    setSupported(false);
                } else if (data) {
                    setHandle(data.handle ?? "");
                    setBio(data.bio ?? "");
                    setAvatarUrl(data.avatar_url ?? "");
                }
            } catch {
                setSupported(false);
            } finally {
                setLoading(false);
            }
        })();
    }, [user]);

    if (!user) {
        return (
            <Card>
                <h3 className="text-sm font-semibold mb-1">You’re not signed in</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Sign in to view your profile and preferences.</p>
                <div className="mt-3">
                    <button onClick={onRequestAuth} className="rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-3 py-2 text-sm">Log in / Sign up</button>
                </div>
            </Card>
        );
    }

    const initials = (user.user_metadata?.full_name as string | undefined)?.trim()?.slice(0, 1)?.toUpperCase() || (user.email?.slice(0, 1).toUpperCase() ?? "U");

    async function copyId() {
        if (!user) return;
        try {
            await navigator.clipboard.writeText(user.id);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
        } catch { }
    }

    async function saveProfile() {
        if (!supabase || !user) return;
        setSaving(true);
        try {
            const { error } = await supabase.from("profiles").upsert({
                id: user.id,
                handle: handle || null,
                bio: bio || null,
                avatar_url: avatarUrl || null,
            });
            if (error) alert(error.message);
        } finally {
            setSaving(false);
        }
    }

    async function signOut() {
        if (!supabase) return;
        const { error } = await supabase.auth.signOut();
        if (error) alert(error.message);
    }

    return (
        <section className="space-y-4">
            <Card>
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-neutral-100 dark:bg-neutral-800 grid place-items-center">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-sm font-semibold">{initials}</span>
                        )}
                    </div>
                    <div className="min-w-0">
                        <div className="text-sm font-semibold leading-tight truncate">{user.email ?? "User"}</div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400">{formatIsoDate(user.created_at)} · joined</div>
                    </div>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2">
                    <div className="flex items-center justify-between rounded-xl border border-neutral-200 dark:border-neutral-800 px-3 py-2">
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">User ID</span>
                        <button onClick={copyId} className="text-xs font-mono truncate max-w-[60%]" title={user.id}>{shorten(user.id)}</button>
                    </div>
                    {copied && (<div className="text-xs text-emerald-600 dark:text-emerald-400">Copied ID</div>)}
                </div>
            </Card>

            <Card>
                <h3 className="text-sm font-semibold mb-2">Profile</h3>
                {!supported ? (
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Profiles table not found. (Optional) Create it in Supabase to store a handle, bio, and avatar URL.</p>
                ) : loading ? (
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Loading…</p>
                ) : (
                    <div className="grid gap-2">
                        <LabeledInput label="Handle">
                            <input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="@yourname" className="w-full rounded-lg bg-transparent outline-none" />
                        </LabeledInput>
                        <LabeledInput label="Bio">
                            <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell people what you like to drink…" rows={3} className="w-full resize-none rounded-lg bg-transparent outline-none" />
                        </LabeledInput>
                        <LabeledInput label="Avatar URL">
                            <input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://…" className="w-full rounded-lg bg-transparent outline-none" />
                        </LabeledInput>
                        <div className="pt-1">
                            <button onClick={saveProfile} disabled={saving} className="rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-3 py-2 text-sm disabled:opacity-60">{saving ? "Saving…" : "Save profile"}</button>
                        </div>
                    </div>
                )}
            </Card>

            <Card>
                <h3 className="text-sm font-semibold mb-2">Account</h3>
                <button onClick={signOut} className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 px-3 py-3 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 active:scale-[0.99]">Sign out</button>
            </Card>
        </section>
    );
}

function shorten(id: string) { return id.length > 14 ? `${id.slice(0, 6)}…${id.slice(-6)}` : id; }
function formatIsoDate(iso?: string) { if (!iso) return "—"; try { const d = new Date(iso); return d.toLocaleDateString(); } catch { return iso; } }
