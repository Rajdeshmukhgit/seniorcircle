import { cn, initials } from "@/lib/utils";

const sizes = {
  xs: "h-6 w-6 text-[10.5px]",
  sm: "h-[30px] w-[30px] text-[12px]",
  md: "h-10 w-10 text-[14px]",
  lg: "h-[72px] w-[72px] text-[26px]",
} as const;

// A fixed set of calm colours; the same name always gets the same one.
const palette = ["#0A6FD6", "#0E7C86", "#4B57D1", "#2F6690", "#56677D", "#1E8BC3"];

function colourFor(name: string): string {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return palette[hash % palette.length];
}

interface AvatarProps {
  name: string;
  size?: keyof typeof sizes;
  /** Neutral avatars sit quietly in card footers; coloured ones identify people. */
  tone?: "neutral" | "colour";
  className?: string;
}

export function Avatar({ name, size = "sm", tone = "colour", className }: AvatarProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 select-none items-center justify-center rounded-full font-bold",
        sizes[size],
        tone === "neutral" ? "bg-tint text-strong" : "text-white",
        className,
      )}
      style={tone === "colour" ? { backgroundColor: colourFor(name) } : undefined}
    >
      {initials(name)}
    </span>
  );
}
