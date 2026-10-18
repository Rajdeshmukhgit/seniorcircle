/**
 * Decorative: a floating glass staircase. Each step is a senior batch one year
 * ahead; a line of light climbs it, and an experience card hovers at the top.
 * Drawn in isometric projection as plain SVG, so it needs no image files and
 * stays sharp at any size.
 */

type P3 = [number, number, number];

const STEPS = 5;
const WIDTH = 2.3; // along x
const DEPTH = 1; // along y, per step
const RISE = 0.52; // height added per step
const SCALE = 56;

/** Isometric projection: x runs down-right, -y runs up-right, z runs up. */
function project([x, y, z]: P3): [number, number] {
  return [(x - y) * SCALE * 0.866, (x + y) * SCALE * 0.5 - z * SCALE];
}

interface Block {
  top: P3[];
  riser: P3[];
  side: P3[];
}

const blocks: Block[] = Array.from({ length: STEPS }, (_, i) => {
  const y0 = -(i + 1) * DEPTH;
  const y1 = -i * DEPTH;
  const h = (i + 1) * RISE;
  return {
    top: [
      [0, y0, h],
      [WIDTH, y0, h],
      [WIDTH, y1, h],
      [0, y1, h],
    ],
    riser: [
      [0, y1, 0],
      [WIDTH, y1, 0],
      [WIDTH, y1, h],
      [0, y1, h],
    ],
    side: [
      [WIDTH, y0, 0],
      [WIDTH, y1, 0],
      [WIDTH, y1, h],
      [WIDTH, y0, h],
    ],
  };
});

/** The route of the light: up each riser and across each tread, along the middle. */
const route: P3[] = [];
for (let i = 0; i < STEPS; i++) {
  const y = -i * DEPTH;
  route.push([WIDTH * 0.5, y, i * RISE], [WIDTH * 0.5, y, (i + 1) * RISE], [WIDTH * 0.5, y - DEPTH * 0.82, (i + 1) * RISE]);
}

/** The card floating above the top step. */
const TOP_H = STEPS * RISE;
const CARD_Z = TOP_H + 0.62;
const cardY0 = -STEPS * DEPTH + 0.12;
const card: P3[] = [
  [0.28, cardY0, CARD_Z],
  [WIDTH - 0.28, cardY0, CARD_Z],
  [WIDTH - 0.28, cardY0 + 0.78, CARD_Z],
  [0.28, cardY0 + 0.78, CARD_Z],
];
const cardShadow: P3[] = card.map(([x, y]) => [x + 0.08, y + 0.08, TOP_H]);
const cardLine = (t: number, len: number): P3[] => [
  [0.5, cardY0 + t, CARD_Z],
  [0.5 + (WIDTH - 1) * len, cardY0 + t, CARD_Z],
];

// Fit everything into the viewBox with even padding.
const allPoints = [...blocks.flatMap((b) => [...b.top, ...b.riser, ...b.side]), ...card].map(project);
const PAD = 40;
const minX = Math.min(...allPoints.map((p) => p[0])) - PAD;
const minY = Math.min(...allPoints.map((p) => p[1])) - PAD;
const VIEW_W = Math.max(...allPoints.map((p) => p[0])) + PAD - minX;
const VIEW_H = Math.max(...allPoints.map((p) => p[1])) + PAD * 1.6 - minY;

const pts = (poly: P3[]) =>
  poly
    .map(project)
    .map(([x, y]) => `${(x - minX).toFixed(1)},${(y - minY).toFixed(1)}`)
    .join(" ");

const routeD = `M${pts(route).split(" ").join(" L")}`;

/** `uid` keeps the SVG gradient ids unique when the art appears twice on a page. */
export function HeroArt({ className = "", uid = "hero" }: { className?: string; uid?: string }) {
  const id = (name: string) => `${uid}-${name}`;
  const url = (name: string) => `url(#${id(name)})`;

  return (
    <div aria-hidden className={`pointer-events-none select-none ${className}`}>
      <svg viewBox={`0 0 ${VIEW_W.toFixed(0)} ${VIEW_H.toFixed(0)}`} className="h-full w-full overflow-visible">
        <defs>
          <linearGradient id={id("top")} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.97" />
            <stop offset="1" stopColor="#e4f3ff" stopOpacity="0.82" />
          </linearGradient>
          <linearGradient id={id("riser")} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f4faff" stopOpacity="0.9" />
            <stop offset="1" stopColor="#a9d6f6" stopOpacity="0.62" />
          </linearGradient>
          <linearGradient id={id("side")} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#6ab8ef" stopOpacity="0.88" />
            <stop offset="1" stopColor="#1366b8" stopOpacity="0.7" />
          </linearGradient>
          <linearGradient id={id("card")} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="1" stopColor="#e6f4ff" stopOpacity="0.7" />
          </linearGradient>
          <linearGradient id={id("beam")} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#0a84ff" stopOpacity="0" />
            <stop offset="0.4" stopColor="#0a84ff" stopOpacity="0.9" />
            <stop offset="1" stopColor="#38b6ff" />
          </linearGradient>
          <filter id={id("soft")} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="16" />
          </filter>
          <filter id={id("glow")} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" />
          </filter>
        </defs>

        {/* Contact shadow on the panel below the staircase */}
        <polygon
          points={pts([
            [0, 0.3, 0],
            [WIDTH + 0.4, 0.3, 0],
            [WIDTH + 0.4, -STEPS * DEPTH, 0],
            [0, -STEPS * DEPTH, 0],
          ])}
          transform="translate(0 26)"
          fill="#062f57"
          opacity="0.28"
          filter={url("soft")}
        />

        <g className="art-float">
          {/* Back to front: the highest step is farthest from the viewer. */}
          {[...blocks].reverse().map((block, index) => (
            <g key={index} strokeLinejoin="round">
              <polygon points={pts(block.side)} fill={url("side")} stroke="#ffffff" strokeOpacity="0.45" strokeWidth="1" />
              <polygon points={pts(block.riser)} fill={url("riser")} stroke="#ffffff" strokeOpacity="0.8" strokeWidth="1" />
              <polygon points={pts(block.top)} fill={url("top")} stroke="#ffffff" strokeOpacity="0.95" strokeWidth="1.3" />
            </g>
          ))}

          {/* The climbing line of light */}
          <path d={routeD} fill="none" stroke="#2a8ae0" strokeOpacity="0.28" strokeWidth="1.6" strokeDasharray="3 5" strokeLinejoin="round" />
          <path
            d={routeD}
            fill="none"
            stroke={url("beam")}
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={100}
            className="art-beam"
            filter={url("glow")}
          />
          <path
            d={routeD}
            fill="none"
            stroke="#0a7cf0"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={100}
            className="art-beam"
          />

          {/* An experience card hovering over the top step */}
          <polygon points={pts(cardShadow)} fill="#0a4a86" opacity="0.18" filter={url("glow")} />
          <g className="art-card">
            <polygon points={pts(card)} fill={url("card")} stroke="#ffffff" strokeWidth="1.3" strokeLinejoin="round" />
            <polyline points={pts(cardLine(0.24, 1))} stroke="#2a8ae0" strokeOpacity="0.75" strokeWidth="4" strokeLinecap="round" fill="none" />
            <polyline points={pts(cardLine(0.42, 0.72))} stroke="#2a8ae0" strokeOpacity="0.4" strokeWidth="4" strokeLinecap="round" fill="none" />
            <polyline points={pts(cardLine(0.6, 0.5))} stroke="#2a8ae0" strokeOpacity="0.4" strokeWidth="4" strokeLinecap="round" fill="none" />
          </g>
        </g>
      </svg>
    </div>
  );
}
