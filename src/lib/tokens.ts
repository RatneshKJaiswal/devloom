/**
 * DevLoom Semantic Design Tokens & Badge Mappings
 * Strictly aligns with the CSS variables defined in src/app/globals.css
 * Ensures consistent, WCAG AA-accessible styling with zero raw hex in components.
 */

export const SDLC_PHASES = [
  "planning",
  "design",
  "development",
  "testing",
  "release",
  "maintenance",
] as const;

export type SDLCPhase = (typeof SDLC_PHASES)[number];

export const SDLC_PHASE_CONFIG: Record<
  SDLCPhase,
  { label: string; badgeClass: string; colorVar: string }
> = {
  planning: {
    label: "Planning",
    badgeClass: "bg-purple-950/60 text-purple-300 border-purple-500/30",
    colorVar: "var(--phase-planning)",
  },
  design: {
    label: "Design",
    badgeClass: "bg-pink-950/60 text-pink-300 border-pink-500/30",
    colorVar: "var(--phase-design)",
  },
  development: {
    label: "Development",
    badgeClass: "bg-primary-subtle text-primary border-primary/30",
    colorVar: "var(--phase-development)",
  },
  testing: {
    label: "Testing",
    badgeClass: "bg-warning-subtle text-amber-300 border-warning/30",
    colorVar: "var(--phase-testing)",
  },
  release: {
    label: "Release",
    badgeClass: "bg-success-subtle text-success border-success/30",
    colorVar: "var(--phase-release)",
  },
  maintenance: {
    label: "Maintenance",
    badgeClass: "bg-slate-800/80 text-slate-300 border-slate-700",
    colorVar: "var(--phase-maintenance)",
  },
};

export const TASK_STATUS_CONFIG: Record<
  string,
  { label: string; badgeClass: string; colorVar: string }
> = {
  todo: {
    label: "To Do",
    badgeClass: "bg-slate-800/80 text-slate-300 border-slate-700",
    colorVar: "var(--muted-foreground)",
  },
  in_progress: {
    label: "In Progress",
    badgeClass: "bg-primary-subtle text-primary border-primary/30",
    colorVar: "var(--primary)",
  },
  done: {
    label: "Done",
    badgeClass: "bg-success-subtle text-success border-success/30",
    colorVar: "var(--success)",
  },
  cancelled: {
    label: "Cancelled",
    badgeClass: "bg-slate-900/60 text-slate-500 border-slate-800 line-through",
    colorVar: "var(--muted)",
  },
};

export const BUG_STATUS_CONFIG: Record<
  string,
  { label: string; badgeClass: string }
> = {
  open: {
    label: "Open",
    badgeClass: "bg-danger-subtle text-red-300 border-danger/30",
  },
  confirmed: {
    label: "Confirmed",
    badgeClass: "bg-amber-950/60 text-amber-300 border-amber-500/30",
  },
  fixing: {
    label: "Fixing",
    badgeClass: "bg-primary-subtle text-primary border-primary/30",
  },
  resolved: {
    label: "Resolved",
    badgeClass: "bg-success-subtle text-success border-success/30",
  },
  closed: {
    label: "Closed",
    badgeClass: "bg-slate-800/80 text-slate-400 border-slate-700",
  },
  wont_fix: {
    label: "Won't Fix",
    badgeClass: "bg-slate-900/60 text-slate-500 border-slate-800",
  },
};

export const PRIORITY_CONFIG: Record<
  string,
  { label: string; badgeClass: string }
> = {
  low: {
    label: "Low",
    badgeClass: "bg-slate-800/80 text-slate-400 border-slate-700",
  },
  medium: {
    label: "Medium",
    badgeClass: "bg-primary-subtle text-primary border-primary/30",
  },
  high: {
    label: "High",
    badgeClass: "bg-warning-subtle text-amber-300 border-warning/30",
  },
  urgent: {
    label: "Urgent",
    badgeClass: "bg-danger-subtle text-red-300 border-danger/40 font-semibold",
  },
};
