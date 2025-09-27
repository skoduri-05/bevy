export default function Thumb({ image, title }: { image: string | null; title: string }) {
    return (
        <div className="relative aspect-square rounded-2xl overflow-hidden border border-[color:theme(colors.bevy.stroke)] bg-bevy-chip">
            {image && <img src={image} className="absolute inset-0 h-full w-full object-cover" />}
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                <div className="text-[11px] font-medium truncate">{title}</div>
            </div>
        </div>
    );
}