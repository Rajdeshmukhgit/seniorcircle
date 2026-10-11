/**
 * Decorative: two interlocking glass rings, the logo's "one batch handing over
 * to the next", drawn as a floating glass object in the spirit of a 3D render.
 * Pure SVG, so it needs no image files and stays sharp at any size.
 */

interface Ring {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  rotate: number;
}

const A: Ring = { cx: 250, cy: 300, rx: 158, ry: 118, rotate: -24 };
const B: Ring = { cx: 400, cy: 262, rx: 150, ry: 108, rotate: 32 };
const TUBE = 54;

/** An open arc along an ellipse, from angle a0 to a1 in degrees, as a path. */
function arc(rx: number, ry: number, a0: number, a1: number, steps = 48): string {
  const points: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = ((a0 + ((a1 - a0) * i) / steps) * Math.PI) / 180;
    points.push(`${(rx * Math.cos(t)).toFixed(1)} ${(ry * Math.sin(t)).toFixed(1)}`);
  }
  return `M${points.join(" L")}`;
}

function RingBody({ ring, segment, uid }: { ring: Ring; segment?: [number, number]; uid: string }) {
  const { rx, ry } = ring;
  const transform = `translate(${ring.cx} ${ring.cy}) rotate(${ring.rotate})`;

  // A partial ring is used to re-draw the stretch that passes in front of the other ring.
  if (segment) {
    const d = arc(rx, ry, segment[0], segment[1]);
    return (
      <g transform={transform}>
        <path d={d} fill="none" stroke={`url(#${uid}-tube)`} strokeWidth={TUBE} />
        <path d={d} fill="none" stroke={`url(#${uid}-core)`} strokeWidth={TUBE * 0.42} opacity="0.55" filter={`url(#${uid}-blur-4)`} />
        <path d={arc(rx + TUBE / 2 - 1, ry + TUBE / 2 - 1, segment[0], segment[1])} fill="none" stroke="#fff" strokeOpacity="0.85" strokeWidth="1.4" />
        <path d={arc(rx - TUBE / 2 + 1, ry - TUBE / 2 + 1, segment[0], segment[1])} fill="none" stroke="#fff" strokeOpacity="0.6" strokeWidth="1.2" />
      </g>
    );
  }

  return (
    <g transform={transform}>
      {/* Soft contact shadow */}
      <ellipse rx={rx} ry={ry} fill="none" stroke="#0a3a66" strokeOpacity="0.22" strokeWidth={TUBE + 8} transform="translate(0 22)" filter={`url(#${uid}-blur-14)`} />
      {/* Tube body */}
      <ellipse rx={rx} ry={ry} fill="none" stroke={`url(#${uid}-tube)`} strokeWidth={TUBE} />
      {/* Refracted core: the darker band through the middle of the glass */}
      <ellipse rx={rx} ry={ry} fill="none" stroke={`url(#${uid}-core)`} strokeWidth={TUBE * 0.42} opacity="0.55" filter={`url(#${uid}-blur-4)`} />
      {/* Crisp rims */}
      <ellipse rx={rx + TUBE / 2 - 1} ry={ry + TUBE / 2 - 1} fill="none" stroke="#fff" strokeOpacity="0.85" strokeWidth="1.4" />
      <ellipse rx={rx - TUBE / 2 + 1} ry={ry - TUBE / 2 + 1} fill="none" stroke="#fff" strokeOpacity="0.6" strokeWidth="1.2" />
      {/* Specular highlights */}
      <path d={arc(rx + 10, ry + 10, 196, 262)} fill="none" stroke="#fff" strokeWidth="9" strokeLinecap="round" opacity="0.85" filter={`url(#${uid}-blur-3)`} />
      <path d={arc(rx + 12, ry + 12, 206, 240)} fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
      <path d={arc(rx - 14, ry - 14, 20, 70)} fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity="0.55" filter={`url(#${uid}-blur-3)`} />
    </g>
  );
}

function Bubble({ cx, cy, r, delay, uid }: { cx: number; cy: number; r: number; delay: string; uid: string }) {
  return (
    <g className="animate-drift" style={{ animationDelay: delay, transformBox: "fill-box", transformOrigin: "center" }}>
      <circle cx={cx} cy={cy} r={r} fill={`url(#${uid}-bubble)`} />
      <circle cx={cx} cy={cy} r={r - 0.8} fill="none" stroke="#fff" strokeOpacity="0.7" strokeWidth="1.2" />
      <ellipse cx={cx - r * 0.35} cy={cy - r * 0.4} rx={r * 0.32} ry={r * 0.18} fill="#fff" opacity="0.85" transform={`rotate(-30 ${cx - r * 0.35} ${cy - r * 0.4})`} />
    </g>
  );
}

/** `uid` keeps the SVG gradient ids unique when the art appears twice on a page. */
export function HeroArt({ className = "", uid = "hero" }: { className?: string; uid?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none select-none ${className}`}>
      <svg viewBox="0 0 640 560" className="h-full w-full overflow-visible">
        <defs>
          <linearGradient id={`${uid}-tube`} gradientUnits="userSpaceOnUse" x1="-190" y1="-170" x2="190" y2="170">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.92" />
            <stop offset="0.28" stopColor="#e3f3ff" stopOpacity="0.55" />
            <stop offset="0.55" stopColor="#8cc8f0" stopOpacity="0.32" />
            <stop offset="0.8" stopColor="#d9efff" stopOpacity="0.5" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id={`${uid}-core`} gradientUnits="userSpaceOnUse" x1="-190" y1="170" x2="190" y2="-170">
            <stop offset="0" stopColor="#0b4f8c" />
            <stop offset="0.5" stopColor="#2e86c8" stopOpacity="0.5" />
            <stop offset="1" stopColor="#0b4f8c" stopOpacity="0.85" />
          </linearGradient>
          <radialGradient id={`${uid}-bubble`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0.55" stopColor="#ffffff" stopOpacity="0.04" />
            <stop offset="0.9" stopColor="#d6eeff" stopOpacity="0.4" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0.75" />
          </radialGradient>
          <radialGradient id={`${uid}-glow`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.75" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <filter id={`${uid}-blur-3`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
          <filter id={`${uid}-blur-4`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
          <filter id={`${uid}-blur-14`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="14" />
          </filter>
        </defs>

        <ellipse cx="330" cy="280" rx="260" ry="200" fill={`url(#${uid}-glow)`} opacity="0.6" />

        <g className="animate-float-slow" style={{ transformBox: "fill-box", transformOrigin: "center" }}>
          <RingBody ring={A} uid={uid} />
          <RingBody ring={B} uid={uid} />
          {/* Ring A passes in front of ring B on its right-hand side, so the two interlock. */}
          <RingBody ring={A} segment={[-38, 8]} uid={uid} />
        </g>

        <Bubble cx={548} cy={118} r={30} delay="0s" uid={uid} />
        <Bubble cx={96} cy={140} r={18} delay="-4s" uid={uid} />
        <Bubble cx={612} cy={300} r={14} delay="-7s" uid={uid} />
        <Bubble cx={150} cy={470} r={24} delay="-2s" uid={uid} />
      </svg>
    </div>
  );
}
