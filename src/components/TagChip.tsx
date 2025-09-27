import { cn } from "../utils/ui";
export default function TagChip({ label, on, onClick }: { label: string; on?: boolean; onClick?: () => void }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "px-2 py-1 rounded-full border text-[10px] whitespace-nowrap",
                on ? "bg-white/10 border-white/20" : "bg-bevy-chip border-white/10 text-zinc-300"
            )}
        >
            {label}
        </button>
    );
}