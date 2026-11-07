---
name: DevLoom
description: Developer-first personal tracking workspace with Google-inspired action & status tokens
colors:
  canvas: "#090D16"
  surface: "#0F172A"
  surface-hover: "#1E293B"
  border: "#1E293B"
  border-subtle: "#334155"
  text-primary: "#F8FAFC"
  text-secondary: "#94A3B8"
  primary: "#4285F4"
  primary-hover: "#3367D6"
  primary-subtle: "rgba(66, 133, 244, 0.15)"
  warning: "#FBBC04"
  warning-hover: "#F29900"
  warning-subtle: "rgba(251, 188, 4, 0.15)"
  danger: "#EA4335"
  danger-hover: "#D93025"
  danger-subtle: "rgba(234, 67, 53, 0.15)"
  danger-strong: "#C5221F"
  success: "#34A853"
  success-hover: "#1E8E3E"
  success-subtle: "rgba(52, 168, 83, 0.15)"
  phase-planning: "#A855F7"
  phase-design: "#EC4899"
  phase-development: "#4285F4"
  phase-testing: "#FBBC04"
  phase-release: "#34A853"
  phase-maintenance: "#64748B"
typography:
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  full: "9999px"
---

# Design System

## 1. Visual Theme & Philosophy
DevLoom uses a high-contrast, technical dark canvas (`#090D16`) paired with deep slate cards (`#0F172A`), calibrated borders (`#1E293B`), and crisp Google-inspired status tokens.

## 2. Core Color Tokens
* **Primary (Action / Brand):** `#4285F4` (`var(--primary)`) with hover `#3367D6` and subtle fill `rgba(66, 133, 244, 0.15)`.
* **Warning (Due Soon / Milestone):** `#FBBC04` (`var(--warning)`) with subtle fill `rgba(251, 188, 4, 0.15)`.
* **Danger (Overdue / Critical Bug / Blocked):** `#EA4335` (`var(--danger)`) with subtle fill `rgba(234, 67, 53, 0.15)`.
* **Success (Done / Resolved):** `#34A853` (`var(--success)`) with subtle fill `rgba(52, 168, 83, 0.15)`.

## 3. Component Conventions
* **Interactive Buttons:** `px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-medium shadow-sm shadow-primary/20 transition cursor-pointer`.
* **Input Fields:** `rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-primary`.
* **Status Badges:** `text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded border`.
* **Modals & Overlays:** `fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs`.
