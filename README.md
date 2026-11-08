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

## DevLoom CLI & Terminal Suite

DevLoom includes a zero-dependency, native Node.js CLI executable (`bin/devloom`) that lets developers manage tasks, log defects, capture knowledge, and draft AI standups directly from their terminal or any git repository.

### 1. Installation

**Option A: 1-Line Remote Installer (Vercel / Web App Users)**
Generate a Personal Access Token in **Settings** (`/settings`), then run the auto-installer:
```bash
curl -fsSL "https://your-app.vercel.app/api/cli/install?token=devloom_pat_xxxxxxxx" | bash
```
*This downloads the binary to `~/.devloom/bin`, configures your PATH, and pre-authenticates your session.*

**Option B: Local Repository Contributors**
If you cloned the DevLoom repository:
```bash
npm link
devloom login
```

### 2. Authentication & Configuration

The CLI authenticates via SHA-256 hashed Personal Access Tokens (PAT):
```bash
# Interactive setup: prompts for DevLoom URL & Personal Access Token
devloom login

# Verify active session and registered tokens
devloom whoami
```

You can also configure credentials via environment variables in `~/.zshrc` or CI/CD pipelines:
```bash
export DEVLOOM_API_URL="https://your-app.vercel.app" # Defaults to http://localhost:3000
export DEVLOOM_TOKEN="devloom_pat_xxxxxxxx..."
```

### 3. Automatic Git Context & Project Auto-Provisioning

Whenever you run `devloom` commands inside **any local Git repository**, the CLI automatically inspects `git remote get-url origin` to detect the repository name:

- **If the project already exists in DevLoom:** The task, bug, or gotcha is automatically associated with that project (`projectId`).
- **If the project does NOT exist in DevLoom yet (Strategy 1):** The CLI **auto-provisions the project on the fly** in your database with active phase `development`, so you never have to leave the terminal or create projects in the web UI first!
- **Manual Project Override:** Use `-P` or `--project <name>` to explicitly assign or override the project:
  ```bash
  devloom task "Refactor authentication flow" -p high -P "api-gateway"
  ```

### 4. Command Reference & Examples

| Command | Description | Example |
| :--- | :--- | :--- |
| `devloom task` | Create a task with priority, notes, and project | `devloom task "Implement Redis caching" -p high -d "Cache summary responses" -P "backend"` |
| `devloom bug` | File a defect report with stack traces | `devloom bug "Postgres timeout under load" -p urgent -s "Error: connection timeout"` |
| `devloom gotcha` | Save a technical gotcha into Leitner Box 1 | `devloom gotcha "Drizzle PgBouncer mode" -s "Set prepare: false in client config"` |
| `devloom capture` | AI Smart-Capture unstructured notes/URLs | `devloom capture "Investigate memory spike on large exports"` |
| `devloom standup` | Fetch daily AI standup & focus items | `devloom standup` |
| `devloom list` | View recent workspace items | `devloom list tasks` / `devloom list bugs` |

### 5. Terminal Shell Shortcuts (Optional)

Add this line to your `~/.zshrc` or `~/.bashrc` to unlock direct terminal aliases:
```bash
source /path/to/devloom/public/devloom.sh
```

Available shortcuts:
- `devloom-task "Task title" -p high`
- `devloom-bug "Bug title" -p urgent`
- `devloom-gotcha "Gotcha title" -s "Solution notes"`
- `devloom-capture "Note or URL"`
- `devloom-standup`
- `devloom-whoami`

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
