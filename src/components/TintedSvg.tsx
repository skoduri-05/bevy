import React from "react";

type Props = {
    svg: string;            // imported with ?raw
    active?: boolean;
    label: string;
    className?: string;
    size?: number;          // px
};

export default function TintedSvg({
    svg,
    active = false,
    label,
    className = "",
    size = 20,
}: Props) {
    // Remove hardcoded width/height so CSS sizing works
    const sanitized = React.useMemo(
        () => svg.replace(/(width|height)="[^"]*"/g, ""),
        [svg]
    );

    return (
        <span
            role="img"
            aria-label={label}
            className={`tint-icon ${active ? "text-[#9F90FF]" : "text-zinc-500"} ${className}`}
            style={{ width: size, height: size }}
            dangerouslySetInnerHTML={{ __html: sanitized }}
        />
    );
}
