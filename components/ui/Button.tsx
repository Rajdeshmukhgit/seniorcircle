import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "invert" | "solid" | "light" | "glass" | "outline" | "ghost" | "danger";
type Size = "lg" | "md" | "sm";

// Every button shares the bevelled "shape-cut" silhouette from globals.css.
const base =
  "shape-cut relative inline-flex shrink-0 items-center justify-center overflow-hidden whitespace-nowrap font-semibold tracking-[-0.01em] transition duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60";

// A slow light sweep across the gradient buttons on hover.
const sheen =
  "before:pointer-events-none before:absolute before:inset-y-0 before:left-0 before:w-1/3 before:-translate-x-[120%] before:bg-white/25 before:blur-md before:content-[''] hover:before:animate-[sheen_0.9s_ease]";

const variants: Record<Variant, string> = {
  // Blue gradient: the main call to action on a page.
  primary: `button-gradient text-white shadow-[0_10px_24px_-10px_rgba(10,118,240,0.7)] hover:shadow-[0_14px_30px_-10px_rgba(10,118,240,0.8)] ${sheen}`,
  // Deep ink, for the secondary action beside a primary one.
  invert: "bg-invert text-invert-ink hover:opacity-90",
  // The same gradient, sized for navbars, forms and toolbars.
  solid: `button-gradient font-semibold text-white shadow-[0_8px_20px_-10px_rgba(10,118,240,0.7)] ${sheen}`,
  // White, like the "Request" button in the reference: sits on glass or on the blue panels.
  light: "bg-white text-[#0b1320] shadow-[0_10px_26px_-14px_rgba(8,40,72,0.5)] hover:bg-white/90",
  // Frosted, for a second action on the blue panels.
  glass: "glass-on-panel text-white hover:bg-white/25",
  outline: "glass-strong text-strong hover:border-faint hover:text-ink",
  ghost: "text-soft hover:bg-tint hover:text-ink",
  danger: "border border-line bg-card font-semibold text-danger hover:border-danger",
};

const sizes: Record<Size, string> = {
  lg: "h-12 gap-3 px-6 text-[15px] [--cut:14px] [--r:14px]",
  md: "h-10 gap-2 px-4 text-sm [--cut:11px] [--r:11px]",
  sm: "h-8 gap-1.5 px-3 text-[13px] [--cut:8px] [--r:8px]",
};

export function buttonClass(variant: Variant = "solid", size: Size = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({ variant, size, className, type = "button", ...props }: ButtonProps) {
  return <button suppressHydrationWarning type={type} className={buttonClass(variant, size, className)} {...props} />;
}

interface ButtonLinkProps extends ComponentProps<typeof Link> {
  variant?: Variant;
  size?: Size;
}

export function ButtonLink({ variant, size, className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}
