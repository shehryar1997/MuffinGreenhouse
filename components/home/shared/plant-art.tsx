import * as React from "react"

// Flat botanical illustrations in the same style as the Ask Muffin logo (thick green outline, flat fills).
// They stand in wherever a photo isn't available (category tiles, plants that don't have a photo yet), and they use
// fixed brand colours so they read the same in light and dark mode. Put them on a light tile.

const LINE = "#1E4D2B"
const LEAF = "#5E8B3A"
const OLIVE = "#8AA84F"
const LIGHT = "#C6DC8B"
const POT = "#C76B33"
const POT_DARK = "#A9551F"
const CREAM = "#F6EBCB"
const GOLD = "#E9BC5C"
const PINK = "#EE93AE"
const PETAL = "#FBE7EE"

type ArtProps = { className?: string }

function Svg({ className, children }: ArtProps & { children: React.ReactNode }) {
  return (
    <svg viewBox="-4 -4 128 128" className={className} fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {children}
    </svg>
  )
}

/** A thick outlined stroke: a wide dark line with a narrower coloured line on top. */
function Tube({ d, width, color = LEAF }: { d: string; width: number; color?: string }) {
  return (
    <>
      <path d={d} stroke={LINE} strokeWidth={width} />
      <path d={d} stroke={color} strokeWidth={width - 6} />
    </>
  )
}

function Pot({ y = 92 }: { y?: number }) {
  return (
    <g stroke={LINE} strokeWidth="3">
      <path d={`M40 ${y + 6} h40 l-5 ${22 - (y - 92)} h-30 z`} fill={POT} />
      <rect x="36" y={y} width="48" height="9" rx="3" fill={POT_DARK} />
    </g>
  )
}

export function AroidArt({ className }: ArtProps) {
  return (
    <Svg className={className}>
      <path d="M60 96 V66" stroke={LINE} strokeWidth="9" />
      <path d="M60 96 V66" stroke={LEAF} strokeWidth="3" />
      <path d="M60 84 C22 82 10 48 30 28 C45 14 60 26 60 40 C60 26 75 14 90 28 C110 48 98 82 60 84 Z" fill={LEAF} stroke={LINE} strokeWidth="3" />
      <path d="M60 84 V38 M60 68 L38 54 M60 68 L82 54 M60 56 L46 42 M60 56 L74 42" stroke={LIGHT} strokeWidth="2.5" />
      <ellipse cx="34" cy="50" rx="5" ry="2.6" transform="rotate(30 34 50)" fill={CREAM} stroke={LINE} strokeWidth="2" />
      <ellipse cx="86" cy="50" rx="5" ry="2.6" transform="rotate(-30 86 50)" fill={CREAM} stroke={LINE} strokeWidth="2" />
      <Pot y={94} />
    </Svg>
  )
}

const BLADE = "M60 96 C49 70 51 34 60 10 C69 34 71 70 60 96 Z"

export function SansevieriaArt({ className }: ArtProps) {
  return (
    <Svg className={className}>
      <g stroke={LINE} strokeWidth="3">
        <path d={BLADE} transform="rotate(-34 60 96) scale(.8) translate(15 24)" fill={OLIVE} />
        <path d={BLADE} transform="rotate(34 60 96) scale(.8) translate(15 24)" fill={OLIVE} />
        <path d={BLADE} transform="rotate(-15 60 96) scale(.92) translate(5 8)" fill={LEAF} />
        <path d={BLADE} transform="rotate(15 60 96) scale(.92) translate(5 8)" fill={LEAF} />
        <path d={BLADE} fill={LEAF} />
      </g>
      <path d="M52 34 h16 M50 48 h20 M50 62 h20 M51 76 h18" stroke={LIGHT} strokeWidth="2.5" />
      <Pot />
    </Svg>
  )
}

function Rosette({ spots = false }: { spots?: boolean }) {
  const leaf = "M60 96 C48 78 48 46 60 20 C72 46 72 78 60 96 Z"
  return (
    <g stroke={LINE} strokeWidth="3">
      <path d={leaf} transform="rotate(-72 60 96) scale(.72) translate(23 38)" fill={OLIVE} />
      <path d={leaf} transform="rotate(72 60 96) scale(.72) translate(23 38)" fill={OLIVE} />
      <path d={leaf} transform="rotate(-46 60 96) scale(.86) translate(9.6 13)" fill={LEAF} />
      <path d={leaf} transform="rotate(46 60 96) scale(.86) translate(9.6 13)" fill={LEAF} />
      <path d={leaf} transform="rotate(-20 60 96)" fill={OLIVE} />
      <path d={leaf} transform="rotate(20 60 96)" fill={OLIVE} />
      <path d={leaf} fill={LEAF} />
      <path d="M60 90 V32" stroke={LIGHT} strokeWidth="2.5" />
      {spots && (
        <g fill={POT} strokeWidth="0">
          <circle cx="52" cy="52" r="2.6" />
          <circle cx="68" cy="58" r="2.6" />
          <circle cx="56" cy="70" r="2.6" />
          <circle cx="66" cy="76" r="2.4" />
          <circle cx="60" cy="42" r="2.4" />
        </g>
      )}
    </g>
  )
}

export function AgaveArt({ className }: ArtProps) {
  return (
    <Svg className={className}>
      <Rosette />
      <Pot />
    </Svg>
  )
}

export function MangaveArt({ className }: ArtProps) {
  return (
    <Svg className={className}>
      <Rosette spots />
      <Pot />
    </Svg>
  )
}

function Leaf({ x, y, r, s = 1 }: { x: number; y: number; r: number; s?: number }) {
  return <ellipse cx={x} cy={y} rx={8 * s} ry={6 * s} transform={`rotate(${r} ${x} ${y})`} fill={LEAF} stroke={LINE} strokeWidth="2.5" />
}

export function HoyaArt({ className }: ArtProps) {
  return (
    <Svg className={className}>
      <Tube d="M60 96 C34 92 22 70 30 48" width={7} color={OLIVE} />
      <Tube d="M60 96 C86 90 98 66 88 44" width={7} color={OLIVE} />
      <Leaf x={26} y={70} r={-30} />
      <Leaf x={32} y={54} r={40} />
      <Leaf x={44} y={84} r={20} />
      <Leaf x={92} y={68} r={30} />
      <Leaf x={86} y={52} r={-40} />
      <Leaf x={74} y={84} r={-20} />
      <g stroke={LINE} strokeWidth="2">
        {[[60, 30], [50, 36], [70, 36], [56, 44], [66, 44]].map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="6" fill={PETAL} />
        ))}
        <circle cx="60" cy="38" r="4" fill={PINK} />
      </g>
      <Pot />
    </Svg>
  )
}

function Blossom({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} stroke={LINE} strokeWidth="2.5">
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx="0" cy="-8" rx="6.5" ry="9" transform={`rotate(${a})`} fill={PETAL} />
      ))}
      <circle r="4.5" fill={GOLD} />
    </g>
  )
}

export function OrchidArt({ className }: ArtProps) {
  return (
    <Svg className={className}>
      <path d="M58 98 C20 96 12 76 20 66 C40 74 54 84 58 98 Z" fill={LEAF} stroke={LINE} strokeWidth="3" />
      <path d="M62 98 C96 98 108 80 102 70 C82 76 66 84 62 98 Z" fill={OLIVE} stroke={LINE} strokeWidth="3" />
      <Tube d="M60 98 C58 62 50 40 78 20" width={6} color={OLIVE} />
      <Blossom x={54} y={52} s={0.9} />
      <Blossom x={60} y={30} s={1} />
      <Blossom x={84} y={20} s={0.8} />
      <Pot y={98} />
    </Svg>
  )
}

export function CactusArt({ className }: ArtProps) {
  return (
    <Svg className={className}>
      <Tube d="M60 96 V36" width={28} />
      <Tube d="M60 76 H38 V54" width={16} color={OLIVE} />
      <Tube d="M60 66 H82 V46" width={16} color={OLIVE} />
      <path d="M52 50 v10 M60 42 v10 M68 50 v10 M52 70 v8 M68 72 v8" stroke={LIGHT} strokeWidth="2.5" />
      <circle cx="60" cy="24" r="6" fill={PINK} stroke={LINE} strokeWidth="2.5" />
      <Pot y={96} />
    </Svg>
  )
}

export function PotArt({ className }: ArtProps) {
  return (
    <Svg className={className}>
      <path d="M60 60 C56 46 44 40 34 42 C36 54 46 60 60 60 Z" fill={LEAF} stroke={LINE} strokeWidth="3" />
      <path d="M60 60 C64 42 78 34 90 38 C88 52 76 60 60 60 Z" fill={OLIVE} stroke={LINE} strokeWidth="3" />
      <g stroke={LINE} strokeWidth="3">
        <path d="M32 70 h56 l-8 40 h-40 z" fill={POT} />
        <rect x="28" y="60" width="64" height="14" rx="4" fill={POT_DARK} />
      </g>
      <path d="M44 84 v14 M60 84 v18 M76 84 v14" stroke={CREAM} strokeWidth="2.5" opacity=".55" />
    </Svg>
  )
}

export function MediaArt({ className }: ArtProps) {
  return (
    <Svg className={className}>
      <path d="M34 34 h52 l5 10 v56 a7 7 0 0 1 -7 7 H36 a7 7 0 0 1 -7 -7 V44 z" fill={CREAM} stroke={LINE} strokeWidth="3" />
      <path d="M29 44 h62" stroke={LINE} strokeWidth="3" />
      <path d="M30 100 c8 -14 20 -14 30 -6 c8 -10 20 -10 30 6 v7 a7 7 0 0 1 -7 7 H37 a7 7 0 0 1 -7 -7 z" fill={POT_DARK} stroke={LINE} strokeWidth="3" />
      <g transform="translate(60 72)">
        <path d="M0 10 V-2" stroke={LINE} strokeWidth="3" />
        <path d="M0 2 C-12 4 -14 -8 -12 -12 C-4 -12 0 -6 0 2 Z" fill={LEAF} stroke={LINE} strokeWidth="2.5" />
        <path d="M0 -2 C12 0 14 -12 12 -16 C4 -16 0 -10 0 -2 Z" fill={OLIVE} stroke={LINE} strokeWidth="2.5" />
      </g>
    </Svg>
  )
}

export function FertilizerArt({ className }: ArtProps) {
  return (
    <Svg className={className}>
      <rect x="42" y="16" width="36" height="14" rx="4" fill={POT_DARK} stroke={LINE} strokeWidth="3" />
      <path d="M48 30 h24 v8 c10 4 14 10 14 20 v40 a8 8 0 0 1 -8 8 H42 a8 8 0 0 1 -8 -8 V58 c0 -10 4 -16 14 -20 z" fill={LEAF} stroke={LINE} strokeWidth="3" />
      <rect x="38" y="62" width="44" height="30" rx="4" fill={CREAM} stroke={LINE} strokeWidth="2.5" />
      <path d="M60 86 c-8 0 -10 -8 -6 -14 c3 -4 6 -8 6 -8 c0 0 3 4 6 8 c4 6 2 14 -6 14 z" fill={GOLD} stroke={LINE} strokeWidth="2.5" />
    </Svg>
  )
}

export function EquipmentArt({ className }: ArtProps) {
  return (
    <Svg className={className}>
      <path d="M88 76 L106 42" stroke={LINE} strokeWidth="9" />
      <path d="M88 76 L106 42" stroke={OLIVE} strokeWidth="3" />
      <path d="M99 34 l16 6 l-4 12 l-16 -6 z" fill={GOLD} stroke={LINE} strokeWidth="3" />
      <path d="M32 58 C14 54 12 90 32 88" stroke={LINE} strokeWidth="9" />
      <path d="M32 58 C14 54 12 90 32 88" stroke={OLIVE} strokeWidth="3" />
      <path d="M30 52 h56 v42 a8 8 0 0 1 -8 8 H38 a8 8 0 0 1 -8 -8 z" fill={LEAF} stroke={LINE} strokeWidth="3" />
      <ellipse cx="58" cy="52" rx="28" ry="6" fill={OLIVE} stroke={LINE} strokeWidth="3" />
      <path d="M42 68 v20 M58 68 v20" stroke={LIGHT} strokeWidth="2.5" />
    </Svg>
  )
}

const ART: Record<string, (props: ArtProps) => React.ReactElement> = {
  aroids: AroidArt,
  sansevierias: SansevieriaArt,
  agaves: AgaveArt,
  mangaves: MangaveArt,
  hoyas: HoyaArt,
  orchids: OrchidArt,
  "cacti-succulents": CactusArt,
  pots: PotArt,
  "planting-media": MediaArt,
  fertilizer: FertilizerArt,
  "other-equipment": EquipmentArt,
  "tools-equipment": EquipmentArt,
}

/** The illustration for a shop category slug (falls back to the aroid leaf). */
export function CategoryArt({ slug, className }: { slug: string; className?: string }) {
  const Art = ART[slug] ?? AroidArt
  return <Art className={className} />
}

/** Stands in for a product photo that hasn't been uploaded yet. */
export function PhotoFallback({ slug, label, className }: { slug: string; label?: string; className?: string }) {
  return (
    <div className={`relative flex h-full w-full items-center justify-center bg-gradient-to-b from-[#EEF3DC] to-[#DDE8C4] ${label ? "pb-6" : ""} ${className ?? ""}`}>
      <CategoryArt slug={slug} className="h-3/4 w-3/4" />
      {label && (
        <span className="absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-xs lg:text-[10px] uppercase tracking-widest text-[#3F5A34]">{label}</span>
      )}
    </div>
  )
}
