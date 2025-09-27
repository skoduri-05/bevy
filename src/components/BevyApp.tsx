import React, { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import ExplorePage from "../pages/ExplorePage";
import BevinPage from "../pages/BevinPage";
import SearchPage from "../pages/SearchPage";
import NetworkPage from "../pages/NetworkPage";
import ProfilePage from "../pages/ProfilePage";
import { supabase } from "../lib/supabase";

/* -------------------- nav + prefs -------------------- */
const Tab = { Explore: "Explore", Bevin: "Bevin", Search: "Search", Network: "Network", Profile: "Profile" } as const;
type ThemePref = "light" | "dark" | "system";
type Density = "cozy" | "compact";
type Screen = "home" | "settings" | "auth";
const PREFS_KEY = "bevy:prefs";

export default function BevyApp() {
    const [screen, setScreen] = useState<Screen>("home");
    const [tab, setTab] = useState<typeof Tab[keyof typeof Tab]>(Tab.Explore);
    const [menuOpen, setMenuOpen] = useState(false);

    // auth state
    const [user, setUser] = useState<User | null>(null);
    useEffect(() => {
        if (!supabase) return;
        supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
        const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
        return () => sub?.subscription.unsubscribe();
    }, []);

    // preferences
    const [theme, setTheme] = useState<ThemePref>("system");
    const [density, setDensity] = useState<Density>("cozy");
    const [reduceMotion, setReduceMotion] = useState(false);

    useEffect(() => {
        try {
            const saved = localStorage.getItem(PREFS_KEY);
            if (saved) {
                const p = JSON.parse(saved);
                if (p.theme) setTheme(p.theme);
                if (p.density) setDensity(p.density);
                if (typeof p.reduceMotion === "boolean") setReduceMotion(p.reduceMotion);
            }
        } catch { }
    }, []);
    useEffect(() => {
        localStorage.setItem(PREFS_KEY, JSON.stringify({ theme, density, reduceMotion }));
    }, [theme, density, reduceMotion]);

    useEffect(() => {
        const root = document.documentElement;
        const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
        const sync = () => {
            const wantsDark = theme === "dark" || (theme === "system" && mq?.matches);
            root.classList.toggle("dark", !!wantsDark);
            root.style.colorScheme = wantsDark ? "dark" : "light";
        };
        sync();
        if (theme === "system" && mq?.addEventListener) {
            mq.addEventListener("change", sync);
            return () => mq.removeEventListener("change", sync);
        }
    }, [theme]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
        window.addEventListener("keydown", onKey);
        document.documentElement.style.overflow = menuOpen ? "hidden" : "";
        return () => {
            window.removeEventListener("keydown", onKey);
            document.documentElement.style.overflow = "";
        };
    }, [menuOpen]);

    const compactCards = useMemo(() => density === "compact", [density]);

    return (
        <div className="min-h-[100dvh] bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50 flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-white/80 dark:bg-neutral-900/80 backdrop-blur border-b border-neutral-200 dark:border-neutral-800" style={{ paddingTop: "env(safe-area-inset-top)" }}>
                <div className="mx-auto w-full max-w-md px-4 py-3 flex items-center justify-between">
                    {screen !== "home" ? (
                        <>
                            <button className="w-11 h-11 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 grid place-items-center active:scale-95 transition" onClick={() => setScreen("home")} aria-label="Back">
                                <ArrowLeftIcon className="w-5 h-5" />
                            </button>
                            <span className="font-semibold tracking-tight">
                                {screen === "settings" ? "Settings" : screen === "auth" ? "Log in / Sign up" : ""}
                            </span>
                            <span className="w-11" />
                        </>
                    ) : (
                        <>
                            <span className="font-bold text-lg tracking-tight">bevy</span>
                            <HamburgerButton open={menuOpen} onClick={() => setMenuOpen((v) => !v)} ariaControls="bevy-menu" ariaLabel="Open menu" />
                        </>
                    )}
                </div>
            </header>

            {/* Content */}
            <main className="flex-1">
                <div className="mx-auto w-full max-w-md p-4 pb-28">
                    {screen === "home" && (
                        <>
                            {tab === Tab.Explore && <ExplorePage compact={compactCards} />}
                            {tab === Tab.Bevin && <BevinPage />}
                            {tab === Tab.Search && <SearchPage />}
                            {tab === Tab.Network && <NetworkPage />}
                            {tab === Tab.Profile && (
                                <ProfilePage
                                    user={user}
                                    onRequestAuth={() => setScreen("auth")}
                                />
                            )}                        </>
                    )}

                    {screen === "settings" && (
                        <SettingsPage
                            theme={theme}
                            setTheme={setTheme}
                            density={density}
                            setDensity={setDensity}
                            reduceMotion={reduceMotion}
                            setReduceMotion={setReduceMotion}
                        />
                    )}

                    {screen === "auth" && <AuthPage onDone={() => setScreen("home")} user={user} />}
                </div>
            </main>

            {/* Bottom Nav */}
            {screen === "home" && (
                <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/90 backdrop-blur" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 8px)" }} aria-label="Primary">
                    <div className="mx-auto w-full max-w-md grid grid-cols-5">
                        <TabButton label={Tab.Explore} icon={<CompassIcon className="w-6 h-6" />} active={tab === Tab.Explore} onClick={() => setTab(Tab.Explore)} />
                        <TabButton label={Tab.Bevin} icon={<SparklesIcon className="w-6 h-6" />} active={tab === Tab.Bevin} onClick={() => setTab(Tab.Bevin)} />
                        <TabButton label={Tab.Search} icon={<SearchIcon className="w-6 h-6" />} active={tab === Tab.Search} onClick={() => setTab(Tab.Search)} />
                        <TabButton label={Tab.Network} icon={<UsersIcon className="w-6 h-6" />} active={tab === Tab.Network} onClick={() => setTab(Tab.Network)} />
                        <TabButton label={Tab.Profile} icon={<UserIcon className="w-6 h-6" />} active={tab === Tab.Profile} onClick={() => setTab(Tab.Profile)} />
                    </div>
                </nav>
            )}

            {/* Slide-over Menu */}
            <MenuSheet
                id="bevy-menu"
                open={screen === "home" && menuOpen}
                onClose={() => setMenuOpen(false)}
                onGoSettings={() => { setMenuOpen(false); setScreen("settings"); }}
                onGoAuth={() => { setMenuOpen(false); setScreen("auth"); }}
                user={user}
            />
        </div>
    );
}

/* -------------------- Auth Page (Email only) -------------------- */
function AuthPage({ onDone, user }: { onDone: () => void; user: User | null }) {
    const [email, setEmail] = useState("");
    const [emailSent, setEmailSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const hasSupabase = !!supabase;

    useEffect(() => { if (user) onDone(); }, [user, onDone]);

    async function sendMagicLink() {
        if (!supabase) return alert("Supabase not configured.");
        if (!email) return alert("Enter your email.");
        setLoading(true);
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: { emailRedirectTo: window.location.origin, shouldCreateUser: true },
        });
        setLoading(false);
        if (error) return alert(error.message);
        setEmailSent(true);
    }

    return (
        <section className="space-y-4">
            {!hasSupabase && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 text-amber-900 p-3 text-sm">
                    Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in <code>.env.local</code> to enable auth.
                </div>
            )}

            <Card>
                <h3 className="text-sm font-semibold mb-3">Email</h3>
                <div className="flex gap-2">
                    <input
                        type="email"
                        placeholder="you@example.com"
                        className="flex-1 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2 text-sm outline-none"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <button
                        onClick={sendMagicLink}
                        disabled={!hasSupabase || loading}
                        className="rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-3 text-sm"
                    >
                        Send link
                    </button>
                </div>
                {emailSent && <div className="mt-2 text-xs text-neutral-500">Check your inbox for a magic link.</div>}
            </Card>

            <Card>
                <h3 className="text-sm font-semibold mb-2">Why email links?</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">No passwords to remember. Click the link we send to sign in securely.</p>
            </Card>
        </section>
    );
}

/* -------------------- Settings Page -------------------- */
function SettingsPage({ theme, setTheme, density, setDensity, reduceMotion, setReduceMotion, }: { theme: ThemePref; setTheme: (t: ThemePref) => void; density: Density; setDensity: (d: Density) => void; reduceMotion: boolean; setReduceMotion: (v: boolean) => void; }) {
    return (
        <section className="space-y-4">
            <Card>
                <h3 className="text-sm font-semibold mb-2">Appearance</h3>
                <Label>Theme</Label>
                <Segmented
                    value={theme}
                    onChange={(v) => setTheme(v as ThemePref)}
                    options={[
                        { value: "light", label: "Light", icon: <SunIcon className="w-4 h-4" /> },
                        { value: "dark", label: "Dark", icon: <MoonIcon className="w-4 h-4" /> },
                        { value: "system", label: "System", icon: <LaptopIcon className="w-4 h-4" /> },
                    ]}
                />
                <div className="h-3" />
                <Label>Card density</Label>
                <Segmented value={density} onChange={(v) => setDensity(v as Density)} options={[{ value: "cozy", label: "Cozy" }, { value: "compact", label: "Compact" }]} />
            </Card>

            <Card>
                <h3 className="text-sm font-semibold mb-2">Accessibility</h3>
                <Switch checked={reduceMotion} onChange={setReduceMotion} label="Reduce motion" hint="Minimize animations and transitions." />
            </Card>
        </section>
    );
}

/* Explore page moved to src/pages/ExplorePage.tsx */

/* -------------------- UI primitives -------------------- */
function Card({ children }: { children: React.ReactNode }) { return <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 shadow-sm">{children}</div>; }
function Label({ children }: { children: React.ReactNode }) { return <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{children}</div>; }
function Segmented({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string; icon?: React.ReactNode }[]; }) {
    return (
        <div className="grid grid-cols-3 gap-2">
            {options.map((opt) => {
                const active = opt.value === value;
                return (
                    <button key={opt.value} onClick={() => onChange(opt.value)} className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm active:scale-[0.99] transition ${active ? "bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-neutral-900 dark:border-white" : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-200"}`}>
                        {opt.icon}{opt.label}
                    </button>
                );
            })}
        </div>
    );
}
function Switch({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string; }) {
    return (
        <button role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="w-full flex items-center justify-between rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-3" style={{ minHeight: 48 }}>
            <span><span className="text-sm font-medium">{label}</span>{hint && <div className="text-xs text-neutral-500 dark:text-neutral-400">{hint}</div>}</span>
            <span className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${checked ? "bg-neutral-900 dark:bg-white" : "bg-neutral-200 dark:bg-neutral-700"}`}><span className={`inline-block h-5 w-5 transform rounded-full bg-white dark:bg-neutral-900 transition ${checked ? "translate-x-5" : "translate-x-1"}`} /></span>
        </button>
    );
}

/* -------------------- components -------------------- */
/* DrinkCard moved to src/shared/DrinkCard.tsx */
function TabButton({ label, icon, active, onClick }: { label: string; icon: React.ReactNode; active?: boolean; onClick?: () => void; }) {
    return (
        <button onClick={onClick} aria-current={active ? "page" : undefined} className={`flex flex-col items-center justify-center gap-1 py-2 ${active ? "text-neutral-900 dark:text-white" : "text-neutral-400 dark:text-neutral-500"}`} style={{ minHeight: 54 }}>
            <div className={`rounded-2xl p-1.5 ${active ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900" : "bg-neutral-100 dark:bg-neutral-800"}`}>{icon}</div>
            <span className="text-[10px] font-medium">{label}</span>
        </button>
    );
}

/* -------------------- header: hamburger + menu -------------------- */
function HamburgerButton({ open, onClick, ariaControls, ariaLabel }: { open: boolean; onClick: () => void; ariaControls?: string; ariaLabel?: string; }) {
    return (
        <button onClick={onClick} aria-label={ariaLabel} aria-controls={ariaControls} aria-expanded={open} className="relative w-11 h-11 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/90 grid place-items-center active:scale-95 transition">
            <span className={`absolute block h-[2px] w-5 bg-neutral-900 dark:bg-white transition-transform duration-300 ${open ? "translate-y-0 rotate-45" : "-translate-y-2"}`} />
            <span className={`absolute block h-[2px] w-5 bg-neutral-900 dark:bg-white transition-opacity duration-300 ${open ? "opacity-0" : "opacity-100"}`} />
            <span className={`absolute block h-[2px] w-5 bg-neutral-900 dark:bg-white transition-transform duration-300 ${open ? "translate-y-0 -rotate-45" : "translate-y-2"}`} />
        </button>
    );
}
function MenuSheet({ id, open, onClose, onGoSettings, onGoAuth, user }: { id?: string; open: boolean; onClose: () => void; onGoSettings: () => void; onGoAuth: () => void; user: User | null; }) {
    async function logOut() {
        if (!supabase) return alert("Supabase not configured.");
        const { error } = await supabase.auth.signOut();
        if (error) alert(error.message);
        onClose();
    }
    return (
        <div id={id} aria-hidden={!open} className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`}>
            <div className={`absolute inset-0 bg-black/30 transition-opacity ${open ? "opacity-100" : "opacity-0"}`} onClick={onClose} />
            <aside className={`absolute right-0 top-0 h-full w-[80%] max-w-xs bg-white dark:bg-neutral-900 shadow-xl border-l border-neutral-200 dark:border-neutral-800 transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`} style={{ paddingBottom: "env(safe-area-inset-bottom)" }} role="dialog" aria-modal="true">
                <div className="px-4 pt-4 pb-2 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                    <span className="font-semibold">Menu</span>
                    <button className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800" onClick={onClose} aria-label="Close menu"><XIcon className="w-5 h-5" /></button>
                </div>
                <nav className="p-2">
                    <MenuItem icon={<GearIcon className="w-5 h-5" />} label="Settings" onClick={() => { onClose(); onGoSettings(); }} />
                    <MenuItem icon={<InfoIcon className="w-5 h-5" />} label="About Us" onClick={() => alert("(demo) About Us")} />
                    {user ? (
                        <MenuItem icon={<LogOutIcon className="w-5 h-5" />} label="Log out" destructive onClick={logOut} />
                    ) : (
                        <MenuItem icon={<UserIcon className="w-5 h-5" />} label="Log in / Sign up" onClick={() => { onClose(); onGoAuth(); }} />
                    )}
                </nav>
            </aside>
        </div>
    );
}
function MenuItem({ icon, label, onClick, destructive }: { icon: React.ReactNode; label: string; onClick?: () => void; destructive?: boolean; }) {
    return (
        <button onClick={onClick} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left active:scale-[0.99] transition ${destructive ? "text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40" : "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-current"}`} style={{ minHeight: 48 }}>
            <span className={`grid place-items-center rounded-lg border w-9 h-9 ${destructive ? "border-red-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950/30" : "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"}`}>{icon}</span>
            <span className="text-sm font-medium">{label}</span>
        </button>
    );
}
/* Profile page moved to src/pages/ProfilePage.tsx */

/* small helpers */
/* Helpers moved to ProfilePage and shared modules */

/* -------------------- icons -------------------- */
function CompassIcon({ className = "w-5 h-5" }) { return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><circle cx="12" cy="12" r="10" /><path d="M16 8l-4 8-4-4 8-4z" /></svg>); }
function SparklesIcon({ className = "w-5 h-5" }) { return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><path d="M5 3l2 4 4 2-4 2-2 4-2-4-4-2 4-2 2-4z" transform="translate(5 2) scale(0.6)" /><path d="M12 2l1.5 3 3 1.5-3 1.5L12 11l-1.5-3L7 6.5 10.5 5 12 2z" /></svg>); }
function SearchIcon({ className = "w-5 h-5" }) { return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>); }
function UsersIcon({ className = "w-5 h-5" }) { return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>); }
function UserIcon({ className = "w-5 h-5" }) { return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>); }
function XIcon({ className = "w-5 h-5" }) { return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><path d="M18 6L6 18M6 6l12 12" /></svg>); }
function GearIcon({ className = "w-5 h-5" }) { return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 .6 1.65 1.65 0 0 0-.33 1.82 2 2 0 1 1-3.34 0 1.65 1.65 0 0 0-1-.6 1.65 1.65 0 0 0-1.82.33l-.06.06A2 2 0 1 1 6.83 3.6l.06.06A1.65 1.65 0 0 0 8 4.6a1.65 1.65 0 0 0 1-.6 1.65 1.65 0 0 0 .33-1.82 2 2 0 1 1 3.34 0 1.65 1.65 0 0 0 .33 1.82 1.65 1.65 0 0 0 1 .6 1.65 1.65 0 0 0 1.82-.33l.06-.06A2 2 0 1 1 20.4 6.83l-.06.06A1.65 1.65 0 0 0 19.4 9c0 .37.13.73.33 1.02.2.29.47.52.78.68a2 2 0 1 1 0 3.34 1.99 1.99 0 0 0-1.11.96z" /></svg>); }
function InfoIcon({ className = "w-5 h-5" }) { return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>); }
function LogOutIcon({ className = "w-5 h-5" }) { return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></svg>); }
function ArrowLeftIcon({ className = "w-5 h-5" }) { return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>); }
function SunIcon({ className = "w-5 h-5" }) { return (<svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" className={className}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></svg>); }
function MoonIcon({ className = "w-5 h-5" }) { return (<svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" className={className}><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>); }
function LaptopIcon({ className = "w-5 h-5" }) { return (<svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" className={className}><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M2 20h20" /></svg>); }
/* Placeholder moved to pages where needed; removed unused local Placeholder component */
