# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Solo software engineers, full-stack developers, and technical leads who need a fast, low-friction personal workspace to manage daily tasks, technical bugs (with stack traces and reproduction steps), and durable knowledge retention without the overhead of enterprise issue trackers.

## Product Purpose
DevLoom unifies task tracking, software defect triage, and developer knowledge retention into a single developer-first system. Success is measured by sub-second quick capture, intuitive Gantt/SDLC timelines, and high knowledge retention through spaced repetition.

## Positioning
Unlike generic task managers (Todoist, Trello) or bloated enterprise trackers (Jira), DevLoom natively understands software engineering: stack traces, git commit/PR context, SDLC phases, dependency constraints, and Leitner spaced-repetition quizzes.

## Operating Context
Modern web desktop/mobile viewports, dark-mode IDE & terminal environments, GitHub workflows, and serverless Postgres infrastructure.

## Capabilities and Constraints
- Unified Tasks, Bugs, and Learnings tracking with start dates, deadlines, and overdue detection.
- Visual Gantt timeline with dependency cycle detection and drag-to-reschedule support.
- Leitner 5-box spaced repetition review system with AI recall quizzes.
- Intelligent AI agent for multi-entity smart capture, duplicate detection, and standup summaries.
- Polymorphic GitHub link integration (issues, PRs, commits).
- Multi-tenant data isolation with RLS and AES-256-GCM encrypted tokens.

## Brand Commitments
- Name: DevLoom
- Aesthetic: Technical, confident, refined dark interface with Google-inspired design tokens.
- Color Palette:
  - Canvas: `#090D16` / `#0F172A`
  - Primary Action / Brand: `#4285F4` (Hover: `#3367D6`, Subtle: `rgba(66, 133, 244, 0.15)`)
  - Warning / Due Soon: `#FBBC04` (Hover: `#F29900`, Subtle: `rgba(251, 188, 4, 0.15)`)
  - Danger / Overdue / High Bug: `#EA4335` (Hover: `#D93025`, Subtle: `rgba(234, 67, 53, 0.15)`)
  - Success / Done / Resolved: `#34A853` (Hover: `#1E8E3E`, Subtle: `rgba(52, 168, 83, 0.15)`)
- Typography: Clean sans-serif system stack with high legibility and tabular numbers.

## Product Principles
1. **Scannability Over Decoration:** Information hierarchy is communicated through weight, size, and semantic token colors—never through random visual noise.
2. **Speed & Flow:** Instant feedback, modal capture with keyboard shortcuts (⌘K), and zero full-page flushes.
3. **No Raw Hex Values:** All UI components strictly consume semantic CSS variables and design tokens.
4. **Resilient Feedback:** Every interactive element provides distinct hover, active, focus-visible, loading, empty, and error states.
