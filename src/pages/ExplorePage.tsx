import type { } from "react";
import DrinkCard from "../shared/DrinkCard";
const drinksCatalog = [
    { id: "1", name: "Iced Vanilla Latte", brand: "Daily Grind", type: "coffee", tags: ["iced", "sweet", "vanilla", "espresso"], rating: 4.6, img: "https://images.unsplash.com/photo-1517705008128-361805f42e86?q=80&w=800&auto=format&fit=crop", desc: "Silky iced latte with vanilla and a double shot." },
    { id: "2", name: "Matcha Oat Latte", brand: "Leaf & Foam", type: "tea", tags: ["matcha", "oat milk", "creamy"], rating: 4.4, img: "https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=800&auto=format&fit=crop", desc: "Stone-ground matcha with smooth oat milk." },
    { id: "3", name: "Strawberry Refresher", brand: "Sips", type: "refresher", tags: ["fruit", "strawberry", "sparkling", "light"], rating: 4.1, img: "https://images.unsplash.com/photo-1541976076758-347942db1970?q=80&w=800&auto=format&fit=crop", desc: "Bubbly strawberry refresher with mint." },
    { id: "4", name: "Espresso Tonic", brand: "Volt", type: "coffee", tags: ["espresso", "citrus", "sparkling"], rating: 4.3, img: "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?q=80&w=800&auto=format&fit=crop", desc: "Bright espresso over tonic with orange twist." },
    { id: "5", name: "Hefeweizen", brand: "Bavaria Haus", type: "alcohol", tags: ["beer", "banana", "clove", "light"], rating: 4.0, img: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=800&auto=format&fit=crop", desc: "Classic wheat beer with banana-clove notes." },
    { id: "6", name: "Earl Grey Cold Brew", brand: "Citrus & Bergamot", type: "tea", tags: ["earl grey", "bergamot", "citrus"], rating: 4.2, img: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?q=80&w=800&auto=format&fit=crop", desc: "Silky cold-brewed Earl Grey over ice." },
] as const;

export default function ExplorePage({ compact }: { compact: boolean }) {
    return (
        <section>
            <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-2">
                {[{ t: "coffee", emoji: "☕️" }, { t: "tea", emoji: "🫖" }, { t: "refresher", emoji: "🧊" }, { t: "alcohol", emoji: "🍹" }].map((c) => (
                    <span key={c.t} className="shrink-0 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 px-3 py-1.5 text-xs shadow-sm">{c.emoji} {c.t}</span>
                ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
                {drinksCatalog.map((d) => (<DrinkCard key={d.id} d={d} compact={compact} />))}
            </div>
        </section>
    );
}
