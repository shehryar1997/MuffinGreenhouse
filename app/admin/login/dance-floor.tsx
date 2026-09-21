import type { CSSProperties } from "react"

/**
 * Purely decorative: dancing cats and twerking hamsters under the sign-in card.
 * All motion is CSS (see .dance-* in ../admin.css) and switches off under prefers-reduced-motion.
 */

type CatColors = { fur: string; stripe: string; belly: string }
type HamsterColors = { fur: string; dark: string; belly: string }

const ORANGE_CAT: CatColors = { fur: "#E8934A", stripe: "#C46F2B", belly: "#FBE3C4" }
const GREY_CAT: CatColors = { fur: "#8E9AA8", stripe: "#67727F", belly: "#E4E8EC" }
const TAN_HAMSTER: HamsterColors = { fur: "#E7C08C", dark: "#C99A62", belly: "#FBEFD9" }
const CREAM_HAMSTER: HamsterColors = { fur: "#E9E2D6", dark: "#B9AE9C", belly: "#FFFFFF" }

const INK = "#2B2118"
const PINK = "#F3A6A6"

function delay(seconds: number): CSSProperties {
  return { ["--d" as string]: `${seconds}s` }
}

function Cat({ colors, offset = 0 }: { colors: CatColors; offset?: number }) {
  const { fur, stripe, belly } = colors
  return (
    <svg viewBox="0 0 90 100" className="dance-cat h-auto min-w-0 flex-1" style={delay(offset)} aria-hidden="true" focusable="false">
      <g className="dance-cat-hop">
        <path className="dance-cat-tail" d="M58 80 C78 80 82 60 71 52" fill="none" stroke={fur} strokeWidth="7" strokeLinecap="round" />
        <ellipse className="dance-cat-foot dance-cat-foot-l" cx="37" cy="92" rx="9" ry="5" fill={stripe} />
        <ellipse className="dance-cat-foot dance-cat-foot-r" cx="55" cy="92" rx="9" ry="5" fill={stripe} />
        <ellipse cx="46" cy="72" rx="17" ry="20" fill={fur} />
        <ellipse cx="46" cy="76" rx="10" ry="13" fill={belly} />
        <path className="dance-cat-arm dance-cat-arm-l" d="M32 62 C22 60 17 50 19 41" fill="none" stroke={fur} strokeWidth="7" strokeLinecap="round" />
        <path className="dance-cat-arm dance-cat-arm-r" d="M60 62 C70 60 75 50 73 41" fill="none" stroke={fur} strokeWidth="7" strokeLinecap="round" />
        <g className="dance-cat-head">
          <path d="M29 36 L31 14 L45 27 Z" fill={fur} />
          <path d="M63 36 L61 14 L47 27 Z" fill={fur} />
          <path d="M33 30 L34 21 L40 27 Z" fill={PINK} />
          <path d="M59 30 L58 21 L52 27 Z" fill={PINK} />
          <ellipse cx="46" cy="39" rx="19" ry="16" fill={fur} />
          <path d="M46 24 V29 M40 25 L41 29 M52 25 L51 29" stroke={stripe} strokeWidth="2" strokeLinecap="round" />
          <path d="M35 39 q3.5 -5 7 0 M50 39 q3.5 -5 7 0" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" />
          <path d="M43.5 43 h5 l-2.5 3 Z" fill={PINK} />
          <path d="M40 48 q6 5 12 0" fill="none" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M26 42 h9 M26 46 l9 -2 M66 42 h-9 M66 46 l-9 -2" stroke={INK} strokeWidth="1" strokeLinecap="round" opacity="0.55" />
        </g>
      </g>
    </svg>
  )
}

function Hamster({ colors, offset = 0 }: { colors: HamsterColors; offset?: number }) {
  const { fur, dark, belly } = colors
  return (
    <svg viewBox="0 0 110 90" className="dance-hamster h-auto min-w-0 flex-1" style={delay(offset)} aria-hidden="true" focusable="false">
      <g className="dance-ham-bob">
        <ellipse cx="44" cy="82" rx="8" ry="4.5" fill={PINK} />
        <ellipse cx="72" cy="82" rx="9" ry="4.5" fill={PINK} />

        <ellipse cx="52" cy="58" rx="25" ry="17" fill={fur} transform="rotate(-8 52 58)" />
        <ellipse cx="48" cy="64" rx="14" ry="9" fill={belly} transform="rotate(-8 48 64)" />

        <g className="dance-ham-rear">
          <ellipse cx="76" cy="55" rx="17" ry="17" fill={fur} />
          <path d="M70 45 Q78 55 70 66" fill="none" stroke={dark} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
          <circle cx="92" cy="50" r="3" fill={PINK} />
        </g>

        <g className="dance-ham-fx" fill="none" stroke={dark} strokeWidth="2" strokeLinecap="round">
          <path d="M98 38 q5 8 0 16" />
          <path d="M103 34 q7 12 0 24" />
        </g>

        <path d="M38 62 L42 76" stroke={dark} strokeWidth="5" strokeLinecap="round" />
        <path d="M30 60 L34 75" stroke={fur} strokeWidth="5" strokeLinecap="round" />

        <g className="dance-ham-head">
          <circle cx="24" cy="26" r="6.5" fill={fur} />
          <circle cx="24" cy="26" r="3.5" fill={PINK} />
          <circle cx="38" cy="22" r="6.5" fill={fur} />
          <circle cx="38" cy="22" r="3.5" fill={PINK} />
          <ellipse cx="30" cy="42" rx="20" ry="17" fill={fur} />
          <ellipse cx="24" cy="49" rx="10" ry="8" fill={belly} />
          <circle cx="26" cy="38" r="2.8" fill={INK} />
          <circle cx="27" cy="37" r="0.9" fill="#fff" />
          <circle cx="11" cy="43" r="2.6" fill={PINK} />
          <path d="M14 50 q4 3 8 0" fill="none" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  )
}

export function DanceFloor() {
  return (
    <div className="dance-floor" aria-hidden="true">
      <span className="dance-note dance-note-1">♪</span>
      <span className="dance-note dance-note-2">♫</span>
      <span className="dance-note dance-note-3">♪</span>
      <div className="flex items-end justify-center gap-1">
        <Cat colors={ORANGE_CAT} />
        <Hamster colors={TAN_HAMSTER} offset={0.05} />
        <Hamster colors={CREAM_HAMSTER} offset={0.15} />
        <Cat colors={GREY_CAT} offset={0.4} />
      </div>
      <div className="dance-tiles" />
    </div>
  )
}
