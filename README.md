<div align="center">

# DevLoom

**The Personal Engineering Workspace & Native Terminal Suite**

[![Release](https://img.shields.io/badge/Release-v1.0.0-4285F4?style=for-the-badge&logo=vercel&logoColor=white)](https://dev-loom.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16.4.5-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.3.1-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.45.4-C5F74F?style=for-the-badge&logo=drizzle&logoColor=black)](https://orm.drizzle.team/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-API-8E75C4?style=for-the-badge&logo=google-gemini&logoColor=white)](https://ai.google.dev/)
[![Tests](https://img.shields.io/badge/Vitest-88%20Passed-34A853?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

**Live Production Workspace:** [https://dev-loom.vercel.app](https://dev-loom.vercel.app) • **Documentation & Guides:** [https://dev-loom.vercel.app/docs](https://dev-loom.vercel.app/docs)

</div>

---

## Overview

### What We Are Doing
Modern software engineering workflows are fragmented across disconnected tools:
- High-level tasks and milestones get isolated in cumbersome project trackers.
- Defect triage and stack traces get buried in error aggregators or bug trackers.
- Critical architectural gotchas and hard-won debugging lessons get lost in Slack threads, terminal history, and closed PRs.
- Context switching between the browser and terminal constantly breaks developer flow state.

**DevLoom** resolves this friction by providing a **personal engineering command center**. It combines:
1. **Engineering Task Tracking** with interactive Gantt timelines, SDLC phases, and optimistic reschedule conflict detection.
2. **Defect Triage System** with root-cause tracking, stack trace inspection, and direct task association.
3. **Engineering Knowledge Base** for organizing technical gotchas, design patterns, and CLI snippets with markdown and Obsidian export.
4. **AI Engineering Engine** powered by Google Gemini for smart unstructured note capture, automated daily standups, duplicate detection, and changelog drafting.
5. **Zero-Dependency Native CLI (`devloom`)** with cross-platform support for macOS, Linux, and Windows PowerShell that auto-detects Git repos and provisions projects on the fly.

### How We Are Doing It
DevLoom is engineered with a strict **security-first, zero-friction developer architecture**:
- **Next.js 16 (App Router) & React 19:** Full-stack architecture utilizing Server Components, streaming, and REST Route Handlers.
- **Strict Data Access Layer (DAL) Tenant Isolation:** Absolute security boundary where every query is programmatically scoped to the authenticated `userId`. User A can never read, write, or leak User B's tasks or code gotchas.
- **Drizzle ORM & Cloud PostgreSQL:** Relational schema with optimistic concurrency locking (`version` column), foreign keys, and PgBouncer compatibility (`prepare: false`).
- **Cryptographic Token Hashing:** Personal Access Tokens (PATs) are hashed with SHA-256 and salted, while third-party tokens are encrypted at rest with AES-256-GCM.
- **Google Gemini Structured JSON Mode:** AI outputs are constrained with strict Zod schemas, XML injection containment boundaries, and per-user daily token quotas.
- **Cross-Platform CLI Executable:** Single-file Node.js binary requiring zero external npm packages, streaming cross-platform stdio cleanly on macOS, Linux, and Windows.

---

## Core Capabilities

```
+-----------------------------------------------------------------------------------+
|                                 DEVLOOM ECOSYSTEM                                 |
+-----------------------------------------------------------------------------------+
|  WEB WORKSPACE (https://dev-loom.vercel.app)     |  TERMINAL CLI (devloom)        |
|  - Tasks & Interactive Gantt Timeline            |  - Zero-Dependency Native Node |
|  - Bug Triage & Root Cause Linking               |  - macOS, Linux & Windows      |
|  - Knowledge Base (Gotchas & Snippets)           |  - Auto-Detects Git Remotes    |
|  - AI Daily Standup & Activity Heatmaps          |  - Auto-Provisions Projects    |
|  - Personal Access Tokens & Account Export       |  - Fast Terminal Capture       |
+-----------------------------------------------------------------------------------+
|                 STRICT TENANT-ISOLATED DATA ACCESS LAYER (DAL)                     |
+-----------------------------------------------------------------------------------+
|  Drizzle ORM + PostgreSQL (Neon / PgBouncer)  |  Google Gemini AI Engine (JSON)   |
+-----------------------------------------------------------------------------------+
```

### 1. Engineering Tasks & Interactive Gantt Timeline
- **SDLC Phases:** Categorize tasks across 6 distinct lifecycle phases: `Planning`, `Design`, `Development`, `Testing`, `Release`, and `Maintenance`.
- **Interactive Timeline Rescheduling:** Visual Gantt chart with drag-and-drop date ranges, milestone markers, and dependency arrows (`blocked_by` / `blocking`).
- **Optimistic Concurrency Control:** Every task mutation verifies the record's `version` integer, preventing silent overwrites when working concurrently.
- **Critical Path Calculation:** Graph traversal algorithm identifies the sequential chain of dependent tasks directly dictating project completion.
- **Layout:** Responsive 2-column layout with instant filtering by phase, priority, and project.

### 2. Software Defect Triage & Root Cause Analysis (Bugs)
- **Severity Matrix:** Triage issues across 5 severity levels: `Low`, `Medium`, `High`, `Urgent`, and `Critical`.
- **Structured Debugging Schema:** Capture `description`, `environment` (Node.js, Browser, Docker, etc.), `suspectedCause`, `recommendedFix`, and multi-line `stackTrace`.
- **Task Association:** Bidirectionally link bugs directly to the engineering tasks that address or caused them.
- **Layout:** Responsive 3-column layout with quick status toggles (`Open`, `In Progress`, `Resolved`, `Closed`).

### 3. Engineering Knowledge Base (Gotchas, Patterns & Snippets)
- **Categorized Engineering Wisdom:** Organize knowledge entries across 3 core disciplines:
  - **Technical Gotchas:** Tricky runtime bugs, framework caveats, and edge-case fixes.
  - **Design Patterns:** Architectural structures, clean code idioms, and API design.
  - **CLI Snippets:** Terminal commands, shell scripts, and devops one-liners.
- **Markdown Solution Viewer:** Full GitHub-flavored markdown rendering for code snippets, config files, and reproduction steps with instant clipboard copy.
- **Obsidian & Markdown Vault Export:** 1-click export of your entire knowledge base into a standardized Markdown vault for local backup or Obsidian integration.
- **12-Week Activity Heatmap:** GitHub-style activity contribution calendar tracking continuous knowledge capture and engineering momentum.
- **Layout:** Responsive 3-column grid layout with instant search across titles, content, tags, and projects.

### 4. Scoped Projects & SDLC Milestones
- **Scoped Organization:** Group tasks, defects, and learnings by project.
- **GitHub Repository Linking:** Link remote GitHub repositories (`org/repo`) with direct commit and issue context.
- **Milestones:** Track delivery dates and completion ratios with progress bars.

### 5. AI Engineering Engine (Google Gemini)
- **Smart Unstructured Capture:** Paste raw error logs, Slack snippets, or URLs; the AI extracts clean titles, categories, priorities, and solutions.
- **Daily Standup Generator:** Automatically analyzes shipped tasks, resolved bugs, and active blockers to generate markdown standup summaries.
- **Automated Changelog Generator:** Generates formatted `CHANGELOG.md` release notes grouped by features, fixes, and gotchas.
- **Duplicate Detection:** Scans existing tasks and bugs to flag duplicate issues before they are created.

### 6. Settings & Developer Controls
- **Personal Access Tokens (PATs):** Generate scoped API tokens for terminal CLI access and CI/CD pipelines.
- **One-Click Account Export:** Export all user data (tasks, bugs, learnings, projects) in structured JSON format.
- **GDPR Account Deletion:** Securely delete account data and associated tenant records with cascading referential integrity.

---

## DevLoom CLI & Terminal Suite

The DevLoom CLI (`devloom`) is a native, zero-dependency Node.js executable that brings your entire DevLoom workspace directly into your terminal.

### 1. Installation

#### macOS & Linux
```bash
curl -fsSL https://dev-loom.vercel.app/install.sh | bash
```
*Reload your shell: `source ~/.zshrc` (or `source ~/.bashrc`)*

#### Windows (PowerShell / Windows Terminal)
```powershell
irm https://dev-loom.vercel.app/install.ps1 | iex
```
*Creates `devloom.cmd` and `devloom.ps1` in `%USERPROFILE%\.devloom\bin` and adds it to your user `Path`.*

#### Local Repository Contributors
If you have cloned the repository locally:
```bash
npm link
devloom --version
```

### 2. Authentication

Authenticate using your Personal Access Token generated in **Settings → Personal Access Tokens**:
```bash
devloom login
```
*Prompts for your DevLoom API URL (defaults to `https://dev-loom.vercel.app`) and your token (`devloom_pat_...`).*

Verify active session:
```bash
devloom whoami
```

You can also pass credentials via environment variables (ideal for CI/CD or Docker):
```bash
export DEVLOOM_API_URL="https://dev-loom.vercel.app"
export DEVLOOM_TOKEN="devloom_pat_xxxxxxxx..."
```

### 3. Automatic Git Remote Context & Project Auto-Provisioning

Whenever you run `devloom` commands inside **any local Git repository**:
1. **Auto-Detects Remote:** Inspects `git remote get-url origin` across macOS, Linux, and Windows.
2. **Auto-Links or Provisions (Strategy 1):**
   - If the project already exists in your DevLoom account, your tasks, bugs, or learnings are automatically linked to it.
   - If the project does not exist yet, DevLoom **automatically provisions the project on the fly** with phase `development`. You never have to leave the terminal to register projects manually in the browser.
3. **Explicit Override:** You can override project assignment anytime with `-P` or `--project`:
   ```bash
   devloom task "Refactor authentication flow" -p high -P "api-gateway"
   ```

### 4. CLI Command Reference

| Command | Description | Example |
| :--- | :--- | :--- |
| `devloom task <title>` | Create a task with priority, tags, estimate, and project | `devloom task "Migrate to Auth.js v5" -p high -e 4h -P "core-api"` |
| `devloom bug <title>` | Log a defect report with severity and suspected cause | `devloom bug "PgBouncer pool exhausted" -p urgent -s "Idle timeout too high"` |
| `devloom gotcha <title>` | Record an engineering gotcha into Knowledge Base | `devloom gotcha "Drizzle PgBouncer mode" -s "Set prepare: false in client config"` |
| `devloom capture <text>` | AI smart-capture unstructured notes or logs | `devloom capture "Investigate memory spike on large PDF exports"` |
| `devloom standup` | Generate daily AI standup summary & focus items | `devloom standup` |
| `devloom list [sub]` | View recent tasks, bugs, or gotchas in terminal | `devloom list tasks` / `devloom list bugs` / `devloom list gotchas` |
| `devloom status` | Display Git repository link and workspace status | `devloom status` |
| `devloom version` | Output current CLI version (`v1.0.0`) | `devloom --version` / `devloom -v` |
| `devloom help` | Show terminal command usage and options | `devloom help` |

---

## Tech Stack & Architecture

| Tier | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | [Next.js 16.4.5](https://nextjs.org/) | App Router, React Server Components, Route Handlers, Turbopack |
| **Frontend** | [React 19.3.1](https://react.dev/) | Modern hooks, transitions, and component architecture |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Custom dark-mode engineering palette (`#121316`, `#1a1b1f`, `#4285F4`) |
| **Icons** | [Lucide React](https://lucide.dev/) | Crisp, developer-focused icon set |
| **Database** | [PostgreSQL](https://www.postgresql.org/) / [Neon](https://neon.tech/) | Serverless Postgres with PgBouncer connection pooling |
| **ORM** | [Drizzle ORM 0.45.4](https://orm.drizzle.team/) | Type-safe SQL schema definitions, migrations (`drizzle-kit`) |
| **Authentication** | [Auth.js (NextAuth v5)](https://authjs.dev/) | GitHub OAuth login + SHA-256 hashed Personal Access Tokens |
| **AI Engine** | [Google Gemini API](https://ai.google.dev/) | `gemini-2.5-flash` with structured JSON schema extraction |
| **Security** | Node.js `crypto` | AES-256-GCM token encryption at rest, scrypt / SHA-256 PAT hashing |
| **Testing** | [Vitest 5.1.0](https://vitest.dev/) | 88 unit tests covering isolation, crypto, timeline, and scheduling |

---

## Project Structure

```
devloom/
├── bin/
│   └── devloom                     # Native, zero-dependency Node.js CLI executable
├── public/
│   ├── devloom                     # Public CLI binary mirror for 1-line curl installer
│   ├── install.sh                  # macOS & Linux automated 1-line installer script
│   ├── install.ps1                 # Windows PowerShell automated 1-line installer script
│   └── devloom.sh                  # Shell aliases and function helpers
├── src/
│   ├── app/
│   │   ├── (auth)/login/           # GitHub OAuth sign-in & workspace onboarding
│   │   ├── (app)/                  # Protected application pages
│   │   │   ├── dashboard/          # Metrics, activity heatmaps, daily standup
│   │   │   ├── tasks/              # Task board, interactive Gantt timeline, SDLC phases
│   │   │   ├── bugs/               # Defect triage matrix, stack traces, task linking
│   │   │   ├── learnings/          # Knowledge Base for gotchas, design patterns & snippets
│   │   │   ├── projects/           # Scoped project organization & milestones
│   │   │   ├── docs/               # Multi-platform interactive documentation
│   │   │   └── settings/           # Personal Access Tokens, data export, account deletion
│   │   ├── api/                    # REST Route Handlers (thin controllers)
│   │   │   ├── account/            # Profile, backup export, account deletion, PATs
│   │   │   ├── agent/              # Smart capture, duplicate detection, standup, changelog
│   │   │   ├── bugs/               # Bug CRUD & task association
│   │   │   ├── cli/                # CLI 1-line token installer endpoint
│   │   │   ├── learnings/          # Learning CRUD & Obsidian vault export
│   │   │   ├── projects/           # Project CRUD, milestones, dependencies, critical path
│   │   │   ├── tasks/              # Task CRUD & optimistic concurrency reschedule
│   │   │   └── search/             # Global cross-entity search (⌘K)
│   │   ├── layout.tsx              # Root application layout with fonts and metadata
│   │   └── page.tsx                # High-fidelity public landing page (v1.0)
│   ├── components/                 # Reusable UI component modules
│   │   ├── dashboard/              # Heatmaps, activity charts, release notes modal
│   │   ├── layout/                 # Sidebar, header, quick capture triggers
│   │   ├── project/                # Gantt timeline, milestone cards, SDLC phase selectors
│   │   ├── settings/               # Developer Personal Access Tokens management card
│   │   └── ui/                     # Markdown preview, mini text editor, modals
│   └── lib/
│       ├── agent/                  # Gemini AI client, quotas, prompts, structured extractors
│       ├── auth/                   # NextAuth v5 configuration & session handlers
│       ├── dal/                    # Strict Data Access Layer (mandatory user tenant scoping)
│       ├── db/                     # Drizzle client, migrations, schema definitions
│       │   └── schema/             # tasks, bugs, learnings, organization, tokens, auth
│       ├── security/               # AES-256-GCM token encryption & PAT hashing
│       └── validators/             # Zod validation schemas
├── tests/
│   └── unit/                       # 20 Vitest test suites (88 tests passing)
├── drizzle.config.ts               # Drizzle ORM migration configuration
└── package.json                    # Project dependencies & scripts (v1.0.0)
```

---

## Local Development Setup

### 1. Prerequisites
- **Node.js:** $\ge$ 18.0.0 (Node 20+ recommended)
- **PostgreSQL Database:** Local instance or cloud database ([Neon](https://neon.tech/), [Supabase](https://supabase.com/))
- **GitHub OAuth App:** Registered at [GitHub Developer Settings](https://github.com/settings/developers)
- **Google Gemini API Key:** From [Google AI Studio](https://aistudio.google.com/)

### 2. Clone and Install Dependencies
```bash
git clone https://github.com/your-username/devloom.git
cd devloom
npm install
```

### 3. Configure Environment Variables
Create `.env.local` based on `.env.example`:
```bash
cp .env.example .env.local
```

Configure your credentials:
```env
# Database (PostgreSQL with PgBouncer compatibility)
DATABASE_URL="postgresql://user:password@host.neon.tech/devloom?sslmode=require"

# Auth.js (NextAuth v5)
AUTH_SECRET="your-32-byte-hex-or-base64-secret" # Generate with: openssl rand -base64 32
AUTH_GITHUB_ID="your-github-oauth-client-id"
AUTH_GITHUB_SECRET="your-github-oauth-client-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Token Encryption at Rest (AES-256-GCM: 32 bytes as 64 hex characters)
ENCRYPTION_SECRET_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef" # Generate with: openssl rand -hex 32

# Google Gemini API (AI Agent Engine)
GEMINI_API_KEY="your-gemini-api-key"
GEMINI_MODEL="gemini-2.5-flash"

# Agent Safety Limits & Daily Quotas
AGENT_DAILY_REQUEST_LIMIT="50"
AGENT_DAILY_TOKEN_LIMIT="100000"
MAX_DAILY_GLOBAL_AGENT_BUDGET_CENTS="500"
```

### 4. Push Database Schema
Push the Drizzle ORM schema to your PostgreSQL database:
```bash
npm run db:push
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Testing & Quality Assurance

DevLoom maintains comprehensive unit tests verifying data isolation, cryptographic integrity, algorithmic scheduling, and AI prompt validation.

```bash
# Run all unit tests with Vitest
npm test

# Run tests in watch mode
npm run test:watch

# Run TypeScript compilation check
npx tsc --noEmit

# Build production bundle
npm run build
```

### Test Suite Breakdown (88 Tests / 20 Suites)

| Category | Test Suite | What Is Verified |
| :--- | :--- | :--- |
| **Security & Isolation** | `cross-user-isolation.test.ts`<br>`dal-isolation.test.ts` | Proves User A cannot read, query, mutate, or delete User B's records across all DAL entities. |
| **Cryptography** | `crypto.test.ts`<br>`tokens.test.ts`<br>`api-tokens.test.ts` | AES-256-GCM encryption/decryption at rest, scrypt key derivation, SHA-256 token hashing, prefix validation (`devloom_pat_`). |
| **Timeline Scheduling** | `gantt-reschedule.test.ts`<br>`project-timeline.test.ts`<br>`dependencies.test.ts`<br>`critical-path.test.ts` | Date delta shifts, dependency boundary validation, topological sorting, critical path duration calculations, and optimistic `version` conflict detection. |
| **Defect Association** | `task-bug-association.test.ts` | Relational integrity between bugs and resolving tasks, status synchronization. |
| **AI Agent Engine** | `agent-prompt.test.ts`<br>`agent-duplicates.test.ts`<br>`agent-quota.test.ts`<br>`agent-summary.test.ts` | XML prompt injection containment, structured JSON mode parsing, duplicate similarity matching, token rate-limiting. |
| **Analytics & Parsing** | `heatmap.test.ts`<br>`analytics.test.ts`<br>`github-parser.test.ts`<br>`validators.test.ts` | Activity contribution matrix calculations, GitHub remote URL parsing (`git@github.com:...` vs `https://...`), Zod input schema enforcement. |

---

## Production Deployment

DevLoom is designed for serverless cloud deployment on **Vercel** connected to **Neon** or any managed PostgreSQL instance.

### 1. Cloud Database (Neon / PostgreSQL)
1. Create a PostgreSQL project on [Neon](https://neon.tech/) or [Supabase](https://supabase.com/).
2. Copy the pooled connection string (`pooled: true` / PgBouncer port `6432`).
3. Ensure SSL mode is enabled (`?sslmode=require`).
4. In `src/lib/db/index.ts`, `prepare: false` is enabled by default to ensure transaction pooling works seamlessly without prepared statement conflicts.

### 2. Deploy to Vercel
1. Push your repository to GitHub.
2. Import the repository into [Vercel](https://vercel.com/).
3. Set the following Environment Variables in the Vercel Project Settings:
   - `DATABASE_URL`
   - `AUTH_SECRET`
   - `AUTH_GITHUB_ID`
   - `AUTH_GITHUB_SECRET`
   - `ENCRYPTION_SECRET_KEY`
   - `GEMINI_API_KEY`
   - `NEXT_PUBLIC_APP_URL` (e.g. `https://dev-loom.vercel.app`)
4. In your GitHub OAuth Application settings, set:
   - **Homepage URL:** `https://dev-loom.vercel.app`
   - **Authorization Callback URL:** `https://dev-loom.vercel.app/api/auth/callback/github`
5. Click **Deploy**. Vercel will build and launch your production workspace.

---

## License

DevLoom is open-source software licensed under the **[MIT License](LICENSE)**.
Distributed freely for personal and commercial engineering workflows.
