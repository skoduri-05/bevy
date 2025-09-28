import { useNavigate, useLocation } from "react-router-dom";
import TintedSvg from "./TintedSvg";

// import raw SVG markup
import exploreRaw from "../assets/nav-bar-icons/explore-icon.svg?raw";
import wishlistRaw from "../assets/nav-bar-icons/wishlist-icon.svg?raw";
import searchRaw from "../assets/nav-bar-icons/search-icon.svg?raw";
import bevinRaw from "../assets/nav-bar-icons/bevin-icon.svg?raw";
import profileRaw from "../assets/nav-bar-icons/profile-icon.svg?raw";

export default function BottomNav() {
    const navigate = useNavigate();
    const { pathname } = useLocation();

    const nav = [
        { path: "/", label: "Explore", svg: exploreRaw },
        { path: "/wishlist", label: "Wishlist", svg: wishlistRaw },
        { path: "/search", label: "Search", svg: searchRaw },
        { path: "/bevin", label: "Bevin", svg: bevinRaw },
        { path: "/profile", label: "Profile", svg: profileRaw },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-black h-16 flex justify-around items-center">
            {nav.map(({ path, label, svg }) => {
                const active = pathname === path;
                return (
                    <button
                        key={path}
                        onClick={() => navigate(path)}
                        className="flex flex-col items-center gap-1"
                        aria-label={label}
                    >
                        <TintedSvg svg={svg} active={active} label={label} />
                        <span className="text-[10px] text-white">{label}</span>
                    </button>
                );
            })}
        </nav>
    );
}
