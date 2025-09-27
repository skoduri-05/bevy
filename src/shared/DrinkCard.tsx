// React import removed; using the automatic JSX runtime

export default function DrinkCard({ d, compact }: { d: { id: string; name: string; brand: string; type: string; tags: ReadonlyArray<string>; rating: number; img: string; desc: string }; compact?: boolean; }) {
    return (
        <div className="rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
            <div className="relative">
                <div className={`w-full ${compact ? "aspect-[4/3]" : "aspect-[3/2]"}`}>
                    <img src={d.img} alt={d.name} loading="lazy" className="w-full h-full object-cover" />
                </div>
                <div className="absolute top-2 right-2 rounded-full bg-white/90 dark:bg-neutral-900/80 px-2 py-0.5 text-[10px] font-semibold shadow">{d.rating}★</div>
            </div>
            <div className="p-3">
                <div className="text-sm font-semibold leading-tight line-clamp-1">{d.name}</div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1">{d.brand} • {d.type}</div>
                {!compact && (<p className="mt-1 text-xs text-neutral-600 dark:text-neutral-300 line-clamp-2">{d.desc}</p>)}
                <div className="mt-2 flex flex-wrap gap-1">
                    {d.tags.slice(0, 3).map((t) => (<span key={t} className="rounded-full bg-neutral-100 dark:bg-neutral-800 text-[10px] px-2 py-0.5">{t}</span>))}
                </div>
                <button className="mt-2 w-full rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs py-3 active:scale-95" style={{ minHeight: 44 }} onClick={() => alert(`(demo) Rate ${d.name}`)}>Rate this</button>
            </div>
        </div>
    );
}
