# DevLoom — Problem Statement

## 1. Summary

DevLoom is a lightweight, developer-centric personal workspace for tracking **tasks, bugs, and learnings** in one place, with an **AI agent** that reduces the effort of capturing, connecting, and revisiting that information. It is a public, multi-user web product: any developer can create an account and use it for themselves, and each user's data is fully isolated from every other user's.

## 2. The Problem

### 2.1 Fragmented personal workflow
Individual developers generate three kinds of information every day:

- **Tasks** — things to do (implement X, refactor Y, review Z).
- **Bugs** — defects encountered, with stack traces, reproduction steps, and suspected causes.
- **Learnings** — things figured out along the way (a gotcha, a command, a design insight) that are easy to forget.

Today these live in unrelated places: a to-do app, scattered text files, browser tabs, Slack messages to oneself, code comments, GitHub issues, and memory. Switching between them breaks focus, and information gets lost or never revisited.

### 2.2 Existing tools miss the middle
- **Simple to-do apps** handle tasks but have no notion of bugs (with technical context) or learnings (with review), and no connection to code.
- **Team tools (Jira, Linear, GitHub Projects)** are built for teams: heavyweight setup, workflow ceremony, and shared-project assumptions that are overkill for personal use.
- **Note apps (Notion, Obsidian)** are flexible but unstructured; they require manual setup and offer no developer-specific features such as code linking or bug-aware capture.

There is no low-friction tool built for an *individual developer's* mix of tasks, bugs, and knowledge.

### 2.3 Friction kills capture
The value of any tracker depends on how fast an item can be recorded. Typing structured fields (title, description, tags, priority, project) for every bug or note is enough friction that developers stop logging things. Raw material such as a pasted stack trace or a rough thought is the natural input, but no tool turns it into structured records automatically.

### 2.4 Learnings are written once and never reviewed
Developers occasionally write down what they learned but rarely return to it. Without a review mechanism, notes become a graveyard and the knowledge is lost.

### 2.5 No connection to the code context
Tasks and bugs are meaningless without context: which repository, issue, pull request, or file they relate to. Manually copying links is tedious, so the connection is usually missing.

## 3. Target Users

- Primary: individual software developers (students, interns, professionals, freelancers, open-source contributors) who want a personal system for their own work.
- Secondary: the project author, as the first user.
- Out of scope for now: teams, shared workspaces, assignment, and collaboration.

## 4. Proposed Solution

A web application where each signed-in developer manages three separate entity types (tasks, bugs, learnings) in one workspace, supported by an AI agent powered by the Gemini API.

### 4.1 Core tracker

- **Entities:** Tasks, Bugs, and Learnings are separate entities, each with fields suited to its purpose (for example, bugs hold stack trace and reproduction notes; learnings hold the note content and review state).
- **Organization:** projects, tags, priorities, statuses, and due dates across entities.
- **Search:** fast search across all entities by text, tag, project, status, and type.
- **Learning review:** learnings are resurfaced on a review schedule (spaced intervals) so knowledge is revisited rather than forgotten.
- **Low-friction capture:** quick-add from anywhere in the app.

### 4.2 GitHub integration

- Sign in with GitHub and connect repositories.
- Link any item to a GitHub issue, pull request, or file (by URL).
- Show linked item metadata (title, state) inside the tracker.
- Use minimum scopes (read-only for issues and pull requests); tokens stored encrypted.

### 4.3 AI agent (Gemini API)

The agent takes actions inside the app on the user's behalf, not just returns text. Capabilities:

1. **Smart capture** — paste a stack trace, message, or rough note; the agent creates a structured task, bug, or learning with title, description, tags, priority, and suggested project.
2. **GitHub context** — given an issue or PR link, the agent fetches details, summarizes them, and fills in and links the item.
3. **Learning review** — generates quiz questions and recall prompts from a user's learnings for the review flow.
4. **Duplicate and related-item detection** — flags when a new item resembles an existing one and suggests linking or merging.
5. **Summaries and planning** — answers questions such as "what did I fix this week?" or "what should I work on today?" from the user's own data.

The agent only reads and writes the signed-in user's own data.

## 5. Goals

- Let a developer capture a bug, task, or learning in seconds, ideally from raw pasted text.
- Keep all three kinds of personal engineering information in one searchable place.
- Make learnings actually get reviewed.
- Tie items to the real code context through GitHub.
- Make the agent useful enough that it reduces effort rather than being a novelty.
- Support any developer signing up, with strict data isolation.

## 6. Non-Goals (for now)

- Team collaboration, sharing, assignment, comments between users.
- A VS Code extension (planned as a later phase; GitHub integration comes first).
- Replacing Jira or enterprise project management.
- Native mobile apps.

## 7. Key Requirements

### 7.1 Functional
- Account creation and sign-in (GitHub login; email optional).
- CRUD for tasks, bugs, learnings, projects, and tags.
- Statuses, priorities, due dates, filtering, and full-text search.
- Learning review scheduling and a review session UI.
- GitHub linking of items to issues, PRs, and files.
- Agent actions for all five capabilities above.
- Account deletion and data export.

### 7.2 Non-functional
- **Data isolation:** every record belongs to one user and every query is scoped to that user, enforced in a single data-access layer (with optional row-level security in the database).
- **Security:** encrypted storage of third-party tokens, input validation, minimal OAuth scopes, protection of the agent against prompt injection from pasted or fetched content (agent actions limited to the user's own data, with confirmation for destructive operations).
- **Cost control (public product with a paid LLM API):** per-user daily agent quota, rate limiting, input size caps, and a hard spending limit on the Gemini API key.
- **Performance:** fast capture and search; minimal queries per request, given serverless hosting and a cross-cloud database.
- **Privacy:** privacy policy, clear statement of what data is sent to the LLM provider.
- **Reliability:** graceful behavior when the LLM or GitHub is unavailable; the core tracker works without the agent.

## 8. Technical Direction

- **Framework:** Next.js, full-stack (frontend and API routes in one app).
- **Hosting:** everything deployed on Vercel.
- **Database:** Azure Database for PostgreSQL (cheapest suitable tier, using existing Azure credits), accessed with connection pooling because of serverless functions.
- **ORM:** Drizzle.
- **Auth:** Auth.js with GitHub login (public multi-user).
- **LLM:** Gemini API for all agent features.
- **Integrations:** GitHub App or OAuth app for issue, PR, and file linking.

## 9. Success Criteria

- A new user can sign up and log their first bug from a pasted stack trace in under a minute.
- No user can ever read or modify another user's data (verified by tests).
- The agent stays within its per-user quota and the global spending limit under abuse testing.
- Learnings appear in a review queue on schedule and the review flow is usable.
- Linked GitHub items display correct metadata.

## 10. Risks and Open Questions

| Risk / Question | Why it matters | Mitigation / Next step |
|---|---|---|
| Scope is large for a solo build | Public auth, isolation, cost control, GitHub, and five agent features compete for time | Phase delivery; build the tracker first, then capture, then remaining agent features |
| Agent cost on a public product | Unbounded usage can drain the budget | Quotas, rate limits, hard spend cap |
| Cross-user data leakage | Fatal for trust | Single scoped data-access layer, tests, optional RLS |
| Prompt injection via pasted text or GitHub content | Agent has write access to the user's data | Restrict tool scope, confirm destructive actions, treat fetched content as data |
| Duplicate detection and summaries need data | Feels empty for new users | Ship them after capture and review; degrade gracefully with little data |
| Serverless to Azure Postgres connections and latency | Connection exhaustion, slow requests | Use PgBouncer pooling; keep queries per request low; revisit hosting if painful |
| Build timeline and weekly hours undecided | Cannot size the plan | Decide hours per week and a demo date before the plan is finalized |
