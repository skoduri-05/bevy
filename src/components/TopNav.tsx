import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase";

export default function TopNav() {
    const [location, setLocation] = useState<string>("Locating…");
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [isSignedIn, setIsSignedIn] = useState<boolean>(false);
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const btnRef = useRef<HTMLButtonElement | null>(null);
    const navigate = useNavigate();

    // Auth: session check + listener
    useEffect(() => {
        let mounted = true;
        const init = async () => {
            const { data } = await supabase.auth.getSession();
            if (!mounted) return;
            setIsSignedIn(!!data.session);
        };
        init();

        const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
            setIsSignedIn(!!session);
        });

        return () => {
            mounted = false;
            sub.subscription.unsubscribe();
        };
    }, []);

    const handleSignIn = async () => {
        setLoading(true);
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: { emailRedirectTo: window.location.origin },
        });
        setLoading(false);
        if (error) {
            alert(error.message);
        } else {
            alert("Check your email for a login link ✉️");
        }
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        navigate("/");
    };

    // Geolocation (city only)
    useEffect(() => {
        if (!navigator.geolocation) {
            setLocation("Location unavailable");
            return;
        }
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                try {
                    const res = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
                    );
                    const data = await res.json();
                    const city =
                        data.address?.city ||
                        data.address?.town ||
                        data.address?.village ||
                        data.address?.county;
                    setLocation(city || "Unknown");
                } catch {
                    setLocation(`${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
                }
            },
            () => setLocation("Location blocked")
        );
    }, []);

    // ESC close drawer
    useEffect(() => {
        const onEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") setDrawerOpen(false);
        };
        document.addEventListener("keydown", onEsc);
        return () => document.removeEventListener("keydown", onEsc);
    }, []);

    return (
        <>
            <nav className="w-full flex items-center justify-between px-4 py-3">
                {/* Left: Logo */}
                <Link to="/" className="flex items-center gap-2">
                    <img src="/bevy-icon.svg" alt="Bevy Logo" className="h-8 w-8" />
                    <span
                        className="text-lg"
                        style={{ fontFamily: "'Libre Bodoni', serif", fontWeight: 600, fontStyle: "italic" }}
                    >
                        Bevy
                    </span>
                </Link>

                {/* Center: City */}
                <div className="text-sm sm:text-base flex items-center gap-2 min-w-0 max-w-xs truncate">
                    <img src="src/assets/location.svg" alt="Location" className="h-5 w-5" />
                    <span className="truncate">{location}</span>
                </div>

                {/* Right: Settings (drawer) */}
                <button
                    ref={btnRef}
                    className="p-2 rounded-full hover:bg-gray-100 transition focus:outline-none focus:ring-2 focus:ring-gray-300"
                    onClick={() => setDrawerOpen(true)}
                >
                    <img src="src/assets/settings.svg" alt="Settings" className="h-6 w-6" />
                </button>
            </nav>

            {/* Drawer */}
            <AnimatePresence>
                {drawerOpen && (
                    <>
                        <motion.div
                            className="fixed inset-0 bg-black/40 z-40"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setDrawerOpen(false)}
                        />
                        <motion.aside
                            className="fixed right-0 top-0 h-full w-[280px] shadow-xl z-50 flex flex-col"
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "tween", duration: 0.25 }}
                        >
                            <header className="flex items-center justify-between px-4 py-3 border-b">
                                <h2 className="text-base font-semibold">Menu</h2>
                                <button
                                    className="p-2 rounded-full hover:bg-gray-100"
                                    onClick={() => setDrawerOpen(false)}
                                >
                                    ✕
                                </button>
                            </header>

                            <div className="flex-1 p-4 space-y-4">
                                <Link
                                    to="/about"
                                    className="block px-3 py-2 rounded-lg border hover:bg-gray-50"
                                    onClick={() => setDrawerOpen(false)}
                                >
                                    About Us
                                </Link>

                                {isSignedIn ? (
                                    <button
                                        className="w-full text-left px-3 py-2 rounded-lg border hover:bg-red-50 text-red-600"
                                        onClick={async () => {
                                            await handleSignOut();
                                            setDrawerOpen(false);
                                        }}
                                    >
                                        Sign Out
                                    </button>
                                ) : (
                                    <div className="space-y-2">
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="Enter your email"
                                            className="w-full px-3 py-2 rounded-lg border"
                                        />
                                        <button
                                            className="w-full text-left px-3 py-2 rounded-lg border hover:bg-green-50 text-green-600 disabled:opacity-50"
                                            onClick={handleSignIn}
                                            disabled={loading || !email}
                                        >
                                            {loading ? "Sending link…" : "Sign In with Email"}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
