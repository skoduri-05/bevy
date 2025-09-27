import { Outlet, Link, useLocation } from "react-router-dom";
import BottomNav from "./components/BottomNav";


export default function App() {
    return (
        <div className="min-h-screen w-full bg-bevy-bg text-white flex items-stretch justify-center">
            <div className="w-full max-w-sm relative">
                <header className="px-4 pt-4 pb-2 flex items-center justify-between text-xs text-zinc-400">
                    <span>📍 Atlanta</span>
                    <button className="opacity-60">⋮</button>
                </header>
                <Outlet />
                <BottomNav />
            </div>
        </div>
    );
}