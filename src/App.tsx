import { Outlet } from "react-router-dom";
import BottomNav from "./components/BottomNav";


export default function App() {
    return (
        <div className="relative z-10 min-h-screen w-full flex items-stretch justify-center">
            <div className="w-full max-w-sm relative">
                <Outlet />
                <BottomNav />
            </div>
        </div>
    );
}