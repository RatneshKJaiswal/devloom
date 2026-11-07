# DevLoom

A lightweight, developer-first personal workspace for tracking **tasks, technical bugs, and learnings** in one place, supported by an **AI agent (Google Gemini API)** that eliminates capture friction and resurfaces engineering knowledge.

---

## Architecture & Tech Stack

- **Framework:** Next.js (TypeScript, App Router, Server Actions, Route Handlers)
- **Database:** Azure Database for PostgreSQL (Flexible Server), with PgBouncer connection pooling (`max: 1` per serverless container)
- **ORM & Migrations:** Drizzle ORM (`drizzle-kit`)
- **Authentication:** Auth.js v5 with GitHub OAuth login (read-only scopes for issues and PRs)
- **Security:** AES-256-GCM token encryption at rest for third-party tokens, strict tenant-isolated Data Access Layer (DAL), and Postgres Row-Level Security (RLS)
- **AI Agent:** Google Gemini API with native structured JSON mode, XML prompt injection containment, per-user daily quotas, and global spending safety limits
- **Styling:** Tailwind CSS

---

## Project Structure

```
devloom/
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── (auth)/login/            # GitHub OAuth sign-in
│   │   ├── (app)/                   # Protected application pages
│   │   │   ├── dashboard/           # Active metrics, standup generator, daily planner
│   │   │   ├── tasks/               # Priority task board with status workflows
│   │   │   ├── bugs/                # Defect tracker with stack traces & repro steps
│   │   │   ├── learnings/           # 5-box Leitner spaced-repetition review engine
│   │   │   ├── projects/            # Scoped project organization
│   │   │   └── settings/            # JSON data export & account deletion
│   │   ├── api/                     # REST Route Handlers (thin controllers)
│   │   │   ├── tasks/
│   │   │   ├── bugs/
│   │   │   ├── learnings/ (CRUD & Leitner review endpoints)
│   │   │   ├── projects/
│   │   │   ├── tags/
│   │   │   ├── links/github/        # GitHub linking & metadata sync
│   │   │   ├── agent/               # Smart capture, duplicate detection, quiz, summary
│   │   │   └── account/             # Backup export & deletion
│   │   ├── layout.tsx
│   │   └── privacy/                 # Transparent LLM disclosure & privacy policy
│   ├── components/                  # UI Components
│   │   ├── agent/ai-planner-modal   # Daily planner & weekly standup dialog
│   │   ├── github/                  # Link badges & input forms
│   │   ├── layout/                  # Sidebar, header, quick capture triggers
│   │   ├── quick-capture-dialog     # Global manual quick add
│   │   ├── smart-capture-dialog     # AI paste parser & GitHub import modal
│   │   └── search-modal             # Fast cross-entity search (⌘K)
│   ├── lib/
│   │   ├── agent/                   # Agent engine (Gemini client, quota, prompts)
│   │   ├── auth/                    # Auth.js configuration (Edge & Server decoupled)
│   │   ├── dal/                     # Data Access Layer — mandatory user-scoped queries
│   │   ├── db/                      # Drizzle client & schema definitions
│   │   ├── github/                  # URL parser & REST API client
│   │   ├── security/                # AES-256-GCM crypto & token management
│   │   └── validators/              # Zod validation schemas
│   └── middleware.ts                # Route protection proxy
├── tests/                           # Vitest test suites
├── drizzle.config.ts
└── package.json
```

---

## Getting Started

### 1. Prerequisites
- Node.js $\ge$ 18 (Node 20+ recommended)
- PostgreSQL database (or Azure Database for PostgreSQL Flexible Server with PgBouncer)
- GitHub OAuth Application
- Google Gemini API Key

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Configure the following:
```env
DATABASE_URL="postgresql://user:password@host:6432/devloom?sslmode=require"
AUTH_SECRET="your-32-byte-hex-or-base64-secret"
AUTH_GITHUB_ID="github-oauth-client-id"
AUTH_GITHUB_SECRET="github-oauth-client-secret"
ENCRYPTION_SECRET_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
GEMINI_API_KEY="your-gemini-api-key"
```

### 3. Run Database Migrations
```bash
npm run db:push
# or run generated SQL migrations in src/lib/db/migrations/
```

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Testing & Quality Verification

Run the test suite:
```bash
npm test
```

Run TypeScript compilation check:
```bash
npx tsc --noEmit
```

Build production bundle:
```bash
npm run build
```
