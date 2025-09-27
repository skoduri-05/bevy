import { NavLink } from "react-router-dom";
import { Home, Bookmark, Search, Bot, User2 } from "lucide-react";


const tabs = [
    { to: "/", label: "Explore", Icon: Home },
    { to: "/wishlist", label: "Wishlist", Icon: Bookmark },
    { to: "/search", label: "Search", Icon: Search },
    { to: "/bevin", label: "Bevin", Icon: Bot },
    { to: "/profile", label: "Profile", Icon: User2 },
];


export default function BottomNav() {
    return (
        <div className="fixed bottom-0 left-0 right-0 w-full max-w-sm mx-auto">
            <div className="mx-3 mb-3 rounded-2xl bg-bevy-panel/95 backdrop-blur border border-[color:theme(colors.bevy.stroke)] p-2 grid grid-cols-5 gap-2">
                {tabs.map(({ to, label, Icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) =>
                            `flex flex-col items-center justify-center gap-1 py-2 rounded-xl ${isActive ? "bg-white/10" : "hover:bg-bevy-chip"
                            }`
                        }
                    >
                        <Icon className="h-5 w-5" />
                        <span className="text-[10px]">{label}</span>
                    </NavLink>
                ))}
            </div>
        </div>
    );
}