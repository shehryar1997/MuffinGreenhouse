// The small "002 / OUR METHOD" marker that opens every homepage section. `tone` is for sections that sit on a
// dark or coloured background where the theme colours would disappear.
export function SectionLabel({ n, label, tone = "default" }: { n: string; label: string; tone?: "default" | "light" | "dark" }) {
  const colors =
    tone === "light"
      ? { n: "text-paper/60", slash: "text-paper/30", label: "text-paper/70" }
      : tone === "dark"
        ? { n: "text-ink/60", slash: "text-ink/30", label: "text-ink/70" }
        : { n: "text-forest-500", slash: "text-forest-300", label: "text-forest-600" }
  return (
    <div className="mb-10 lg:mb-14">
      <span className={`font-mono text-xs ${colors.n}`}>{n}</span>
      <span className={`mx-3 ${colors.slash}`}>/</span>
      <span className={`font-mono text-xs uppercase tracking-widest ${colors.label}`}>{label}</span>
    </div>
  )
}
