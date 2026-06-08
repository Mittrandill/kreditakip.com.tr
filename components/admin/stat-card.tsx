import { cn } from "@/lib/utils"

type Accent = "emerald" | "teal" | "blue" | "purple" | "amber" | "rose" | "slate"

const ACCENTS: Record<Accent, { icon: string; glow: string; ring: string }> = {
  emerald: { icon: "text-emerald-400 bg-emerald-500/10", glow: "from-emerald-500/[0.08]", ring: "group-hover:ring-emerald-500/20" },
  teal:    { icon: "text-teal-400 bg-teal-500/10",       glow: "from-teal-500/[0.08]",    ring: "group-hover:ring-teal-500/20" },
  blue:    { icon: "text-blue-400 bg-blue-500/10",       glow: "from-blue-500/[0.08]",    ring: "group-hover:ring-blue-500/20" },
  purple:  { icon: "text-purple-400 bg-purple-500/10",   glow: "from-purple-500/[0.08]",  ring: "group-hover:ring-purple-500/20" },
  amber:   { icon: "text-amber-400 bg-amber-500/10",     glow: "from-amber-500/[0.08]",   ring: "group-hover:ring-amber-500/20" },
  rose:    { icon: "text-rose-400 bg-rose-500/10",       glow: "from-rose-500/[0.08]",    ring: "group-hover:ring-rose-500/20" },
  slate:   { icon: "text-slate-300 bg-slate-500/10",     glow: "from-slate-500/[0.08]",   ring: "group-hover:ring-slate-500/20" },
}

interface StatCardProps {
  label: string
  value: string | number
  hint?: string
  icon: React.ElementType
  accent?: Accent
  className?: string
}

export function StatCard({ label, value, hint, icon: Icon, accent = "emerald", className }: StatCardProps) {
  const a = ACCENTS[accent]
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 ring-1 ring-transparent transition-all duration-300 hover:bg-white/[0.035] hover:-translate-y-0.5",
        a.ring,
        className,
      )}
    >
      <div className={cn("pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br to-transparent blur-2xl transition-opacity duration-300 opacity-60 group-hover:opacity-100", a.glow)} />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-white/55">{label}</p>
          <p className="mt-2 text-[28px] font-bold leading-none tracking-tight text-white tabular-nums">{value}</p>
          {hint && <p className="mt-2 text-xs text-white/40">{hint}</p>}
        </div>
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", a.icon)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

/** Section heading used across admin pages */
export function SectionTitle({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-4 flex items-baseline gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-white/70">{children}</h2>
      {hint && <span className="text-xs text-white/35">{hint}</span>}
      <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
    </div>
  )
}
