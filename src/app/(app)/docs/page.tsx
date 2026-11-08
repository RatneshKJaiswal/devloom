"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Terminal,
  BookText,
  LayoutDashboard,
  CheckSquare,
  Bug,
  Code2,
  FolderKanban,
  Search,
  Copy,
  Check,
  GitBranch,
  ArrowRight,
  Zap,
  ShieldCheck,
  Layers,
  Calendar,
  Flame,
  Download,
  CheckCircle2,
  Command,
  ChevronRight,
  ExternalLink,
  Cpu,
  Key,
} from "lucide-react";
import { AIIcon } from "@/components/icons/ai";
import { DevLoomLogo } from "@/components/icons/devloom-logo";
import clsx from "clsx";

interface CodeBlockProps {
  code: string;
  language?: string;
  caption?: string;
}

function CodeBlock({ code, language = "bash", caption }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-3 rounded-xl border border-slate-800 bg-[#0c0e14] overflow-hidden shadow-inner">
      {caption && (
        <div className="px-4 py-2 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>{caption}</span>
          <span className="text-[10px] text-slate-500 uppercase">{language}</span>
        </div>
      )}
      <div className="relative p-4 flex items-start justify-between gap-3">
        <pre className="font-mono text-xs sm:text-sm text-emerald-400 overflow-x-auto leading-relaxed scrollbar-thin">
          <code>{code}</code>
        </pre>
        <button
          type="button"
          onClick={handleCopy}
          title="Copy to clipboard"
          className="shrink-0 p-1.5 rounded-lg border border-slate-700/60 bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
        >
          {copied ? (
            <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 font-medium px-1">
              <Check className="w-3.5 h-3.5" />
              <span>Copied</span>
            </span>
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}

export default function DocsPage() {
  const [activeTab, setActiveTab] = useState<"all" | "cli" | "web" | "git" | "gotchas">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const matchesSearch = (text: string) => {
    if (!searchQuery.trim()) return true;
    return text.toLowerCase().includes(searchQuery.toLowerCase());
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-16">
      {/* Top Banner / Hero */}
      <div className="relative p-6 sm:p-8 rounded-3xl border border-slate-800 bg-gradient-to-br from-[#12141c] via-[#0d0e14] to-[#0a0b0f] overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-medium">
              <Terminal className="w-3.5 h-3.5" />
              <span>DevLoom Documentation & Guides</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
              Learn DevLoom Web & CLI
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Everything you need to master your personal engineering workspace. Capture tasks in 2 seconds from your terminal, triage bugs with AI fix prompts, and remember critical gotchas forever with spaced repetition.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
            <a
              href="#cli"
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <Terminal className="w-4 h-4" />
              <span>CLI Setup Guide</span>
            </a>
            <a
              href="#web"
              className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-xs font-medium transition flex items-center justify-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Web Workspace Guide</span>
            </a>
          </div>
        </div>

        {/* Search Bar & Filter Tabs */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search docs (e.g. gotcha, cli, git, pat, heatmap, tags)..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-800 bg-slate-950/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: "all", label: "All Docs" },
              { id: "cli", label: "Terminal CLI" },
              { id: "git", label: "Git Context" },
              { id: "web", label: "Web Workspace" },
              { id: "gotchas", label: "Gotchas & KB" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={clsx(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap cursor-pointer",
                  activeTab === tab.id
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Architecture Diagram / Summary */}
      {(activeTab === "all" || activeTab === "git") && matchesSearch("architecture sync terminal web database") && (
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Zap className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-semibold text-white">How DevLoom Works</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            DevLoom bridges your terminal and browser into a single unified brain. When you capture a task, log an error, or record a gotcha from your command line, it synchronizes immediately to your DevLoom cloud database and displays on your Web Workspace.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <div className="p-4 rounded-xl border border-slate-800/90 bg-slate-950/60 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                <Terminal className="w-4 h-4" />
                <span>1. Terminal CLI</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Log tasks, bugs, and gotchas with simple shell commands. Automatically detects your git repository and links context without switching windows.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-800/90 bg-slate-950/60 space-y-2">
              <div className="flex items-center gap-2 text-primary text-xs font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>2. Multi-Tenant Cloud</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Secured by PostgreSQL Row-Level Security (RLS) and encrypted Personal Access Tokens (PATs). Only your account can access your data.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-800/90 bg-slate-950/60 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
                <LayoutDashboard className="w-4 h-4" />
                <span>3. Web Workspace</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Inspect your 52-week activity heatmap, prioritize tasks on Kanban & Gantt timelines, generate AI fix prompts, and export to Obsidian.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION: TERMINAL CLI GUIDE */}
      {(activeTab === "all" || activeTab === "cli" || activeTab === "git" || activeTab === "gotchas") && (
        <section id="cli" className="space-y-6 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Terminal className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">DevLoom Terminal CLI Guide</h2>
                <p className="text-xs text-slate-400">The developer-native command-line interface for your workspace</p>
              </div>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md">
              v1.0.0
            </span>
          </div>

          {/* 1. Installation */}
          {(activeTab === "all" || activeTab === "cli") && matchesSearch("install installer curl bash setup path") && (
            <div className="p-6 rounded-2xl border border-slate-800 bg-[#0d0e14] space-y-3">
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-xs font-bold">1</span>
                <span>Fast 1-Line Installation</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Run this single command in your terminal (macOS or Linux). It downloads the lightweight standalone binary, installs it to <code className="text-emerald-400 font-mono text-xs">~/.devloom/bin</code>, and configures your <code className="text-emerald-400 font-mono text-xs">PATH</code> automatically:
              </p>

              <CodeBlock
                code="curl -fsSL https://devloom.app/install.sh | bash"
                caption="One-line Terminal Installation"
              />

              <div className="text-xs text-slate-400 space-y-1 pt-1">
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Works out of the box with <code className="text-slate-300 font-mono">zsh</code>, <code className="text-slate-300 font-mono">bash</code>, and modern shells.</span>
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>After running the installer, reload your shell: <code className="text-emerald-400 font-mono">source ~/.zshrc</code> (or <code className="text-emerald-400 font-mono">source ~/.bashrc</code>).</span>
                </p>
              </div>
            </div>
          )}

          {/* 2. Authentication & Login */}
          {(activeTab === "all" || activeTab === "cli") && matchesSearch("auth login token personal access pat whoami") && (
            <div className="p-6 rounded-2xl border border-slate-800 bg-[#0d0e14] space-y-4">
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-xs font-bold">2</span>
                <span>Authenticate with Personal Access Token (PAT)</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                DevLoom authenticates terminal requests securely using high-entropy Personal Access Tokens. Follow these simple steps:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
                  <span className="font-semibold text-white">Step A: Open Settings</span>
                  <p className="text-slate-400">Navigate to the <Link href="/settings" className="text-primary hover:underline">Settings page</Link> in the DevLoom sidebar.</p>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
                  <span className="font-semibold text-white">Step B: Generate Token</span>
                  <p className="text-slate-400">Under <strong>Personal Access Tokens</strong>, click "Generate Token" and copy the token starting with <code className="text-emerald-400 font-mono">dvl_live_</code>.</p>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
                  <span className="font-semibold text-white">Step C: Run devloom login</span>
                  <p className="text-slate-400">Run <code className="text-emerald-400 font-mono">devloom login</code> and paste your token when prompted.</p>
                </div>
              </div>

              <CodeBlock
                code={`$ devloom login
DevLoom Host [https://devloom.app]: <press enter or type custom URL>
Personal Access Token (dvl_live_...): dvl_live_9f81a7b...
Authenticated as developer (dev@example.com)`}
                caption="Interactive Login"
              />

              <p className="text-xs text-slate-400">
                To verify your connection and active credentials at any time:
              </p>
              <CodeBlock code="devloom whoami" caption="Verify Active Authentication" />
            </div>
          )}

          {/* 3. Automatic Git Context & Auto-Provisioning */}
          {(activeTab === "all" || activeTab === "git" || activeTab === "cli") && matchesSearch("git repository repo auto-provision zero-setup branch remote") && (
            <div id="git-auto-provision" className="p-6 rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-[#0c1318] via-[#0d0e14] to-[#0a0b0f] space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-white font-semibold text-sm">
                  <GitBranch className="w-5 h-5 text-emerald-400" />
                  <span>Automatic Git Context & Project Auto-Provisioning</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                  Zero Configuration
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                When you run any <code className="text-emerald-400 font-mono text-xs">devloom</code> command inside a Git repository (e.g. <code className="text-slate-200 font-mono text-xs">cd ~/Projects/my-app</code>):
              </p>

              <div className="space-y-2.5 text-xs text-slate-300">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">1</div>
                  <p>
                    <strong>Auto-Detects Git Remote:</strong> The CLI inspects your local repository's <code className="text-emerald-400 font-mono">git remote get-url origin</code> (or fallback directory name).
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">2</div>
                  <p>
                    <strong>Finds or Auto-Creates the Project:</strong> If the repository is already in your DevLoom account, it attaches to it immediately. If it does <em>not</em> exist yet, DevLoom automatically provisions a brand new project in your account with the GitHub URL and slug.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">3</div>
                  <p>
                    <strong>Zero Friction:</strong> You never need to go to your browser to create a project before using the terminal. Just start coding and capturing!
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <span className="text-xs text-slate-400 font-medium">Terminal demonstration:</span>
                <CodeBlock
                  code={`$ cd ~/Projects/payment-service
$ git remote get-url origin
https://github.com/my-org/payment-service.git

# No manual project setup needed! DevLoom automatically provisions 'payment-service':
$ devloom task "Implement Stripe idempotent webhooks" -p high -t stripe,webhooks
Auto-provisioned project 'payment-service' (github.com/my-org/payment-service)
Created Task #42: Implement Stripe idempotent webhooks [high]`}
                  caption="Git Context in Action"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                <span className="font-semibold text-slate-300">Manual Override:</span>
                <span>You can always override the detected project anytime using the <code className="text-emerald-400 font-mono">-P &lt;slug&gt;</code> flag.</span>
              </div>
            </div>
          )}

          {/* 4. Complete Command Reference */}
          {matchesSearch("commands task bug gotcha learning capture standup list status") && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Command className="w-4 h-4 text-emerald-400" />
                <span>CLI Command Reference & Examples</span>
              </h3>

              {/* Task Command */}
              {matchesSearch("task priority tags desc") && (
                <div className="p-5 rounded-2xl border border-slate-800 bg-[#0d0e14] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white font-semibold text-sm">
                      <CheckSquare className="w-4 h-4 text-primary" />
                      <code className="text-emerald-400 font-mono">devloom task &quot;&lt;title&gt;&quot; [options]</code>
                    </div>
                    <span className="text-xs text-slate-400">Log an engineering to-do</span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    Creates an actionable task in your workspace. Priority defaults to <code className="text-slate-300 font-mono">medium</code>.
                  </p>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono text-slate-300 border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400">
                          <th className="py-2 pr-4">Flag</th>
                          <th className="py-2 pr-4">Description</th>
                          <th className="py-2">Example Values</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        <tr>
                          <td className="py-2 text-emerald-400">-d, --desc</td>
                          <td className="py-2 text-slate-300">Detailed task description</td>
                          <td className="py-2 text-slate-400">&quot;Update Auth.js edge middleware&quot;</td>
                        </tr>
                        <tr>
                          <td className="py-2 text-emerald-400">-p, --priority</td>
                          <td className="py-2 text-slate-300">Task priority level</td>
                          <td className="py-2 text-slate-400">low, medium, high, urgent</td>
                        </tr>
                        <tr>
                          <td className="py-2 text-emerald-400">-P, --project</td>
                          <td className="py-2 text-slate-300">Project slug (overrides git detection)</td>
                          <td className="py-2 text-slate-400">devloom, auth-api</td>
                        </tr>
                        <tr>
                          <td className="py-2 text-emerald-400">-t, --tags</td>
                          <td className="py-2 text-slate-300">Comma-separated tags</td>
                          <td className="py-2 text-slate-400">auth,security,nextjs</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <CodeBlock
                    code={`# Simple task
devloom task "Refactor database connection pool"

# Detailed task with priority and tags
devloom task "Implement JWT session rotation" -p high -t auth,security -d "Rotate edge tokens every 15 minutes"`}
                    caption="Example Task Commands"
                  />
                </div>
              )}

              {/* Bug Command */}
              {matchesSearch("bug severity repro steps defect") && (
                <div className="p-5 rounded-2xl border border-slate-800 bg-[#0d0e14] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white font-semibold text-sm">
                      <Bug className="w-4 h-4 text-warning" />
                      <code className="text-emerald-400 font-mono">devloom bug &quot;&lt;title&gt;&quot; [options]</code>
                    </div>
                    <span className="text-xs text-slate-400">Record a software defect</span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    Logs an engineering bug with severity, steps to reproduce, and context.
                  </p>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono text-slate-300 border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400">
                          <th className="py-2 pr-4">Flag</th>
                          <th className="py-2 pr-4">Description</th>
                          <th className="py-2">Example Values</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        <tr>
                          <td className="py-2 text-emerald-400">-s, --severity</td>
                          <td className="py-2 text-slate-300">Bug severity</td>
                          <td className="py-2 text-slate-400">low, medium, high, critical</td>
                        </tr>
                        <tr>
                          <td className="py-2 text-emerald-400">-r, --repro</td>
                          <td className="py-2 text-slate-300">Reproduction steps or error trace</td>
                          <td className="py-2 text-slate-400">&quot;Run k6 load test with 500 VUs&quot;</td>
                        </tr>
                        <tr>
                          <td className="py-2 text-emerald-400">-P, --project</td>
                          <td className="py-2 text-slate-300">Project slug</td>
                          <td className="py-2 text-slate-400">billing-service</td>
                        </tr>
                        <tr>
                          <td className="py-2 text-emerald-400">-t, --tags</td>
                          <td className="py-2 text-slate-300">Comma-separated tags</td>
                          <td className="py-2 text-slate-400">db,postgres,leak</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <CodeBlock
                    code={`# Critical bug with repro steps
devloom bug "PostgreSQL connection pool exhausted under spike" -s critical -r "Run autocannon with 300 concurrent requests on /api/feed" -t db,postgres

# High priority bug
devloom bug "OAuth redirect URI mismatch on production" -s high -t auth,oauth`}
                    caption="Example Bug Commands"
                  />
                </div>
              )}

              {/* Gotcha / Learning Command */}
              {matchesSearch("gotcha learning summary fix solution spaced repetition") && (
                <div id="gotchas" className="p-5 rounded-2xl border border-slate-800 bg-[#0d0e14] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white font-semibold text-sm">
                      <Code2 className="w-4 h-4 text-emerald-400" />
                      <code className="text-emerald-400 font-mono">devloom gotcha &quot;&lt;title&gt;&quot; -s &quot;&lt;fix&gt;&quot; [options]</code>
                    </div>
                    <span className="text-xs text-slate-400">Save a technical lesson or workaround</span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Never forget a hard-earned technical discovery. Captures tricky bugs, library quirks, and architecture rules into your Spaced Repetition knowledge base.
                  </p>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono text-slate-300 border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400">
                          <th className="py-2 pr-4">Flag</th>
                          <th className="py-2 pr-4">Description</th>
                          <th className="py-2">Requirement</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        <tr>
                          <td className="py-2 text-emerald-400">-s, --summary</td>
                          <td className="py-2 text-slate-300">The crucial takeaway, workaround, or solution</td>
                          <td className="py-2 text-amber-400">Required</td>
                        </tr>
                        <tr>
                          <td className="py-2 text-emerald-400">-t, --tags</td>
                          <td className="py-2 text-slate-300">Comma-separated tags for categorization</td>
                          <td className="py-2 text-slate-400">Optional</td>
                        </tr>
                        <tr>
                          <td className="py-2 text-emerald-400">-P, --project</td>
                          <td className="py-2 text-slate-300">Project slug</td>
                          <td className="py-2 text-slate-400">Optional</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <CodeBlock
                    code={`# Real world example 1: Drizzle & Supabase PgBouncer
devloom gotcha "Drizzle PgBouncer mode" -s "Set prepare: false in client config to avoid prepared statement errors" -t drizzle,postgres,pgbouncer

# Real world example 2: Next.js 15 breaking change
devloom gotcha "Next.js 15 cookies() is async" -s "Must await cookies() in server components and server actions" -t nextjs,react`}
                    caption="Example Gotcha / Knowledge Base Commands"
                  />
                </div>
              )}

              {/* Smart Capture, Standup, and List Commands */}
              {matchesSearch("capture standup list status ai") && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="p-5 rounded-2xl border border-slate-800 bg-[#0d0e14] space-y-3">
                    <div className="flex items-center gap-2 text-white font-semibold text-sm">
                      <AIIcon className="w-4 h-4 text-primary" />
                      <code className="text-emerald-400 font-mono">devloom capture &quot;&lt;text&gt;&quot;</code>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Paste unstructured terminal output, error logs, or quick thoughts. AI parses it into a task, bug, or gotcha automatically!
                    </p>
                    <CodeBlock
                      code={`devloom capture "Remember to test edge middleware when deploying to Vercel"`}
                      caption="AI Smart Capture"
                    />
                  </div>

                  <div className="p-5 rounded-2xl border border-slate-800 bg-[#0d0e14] space-y-3">
                    <div className="flex items-center gap-2 text-white font-semibold text-sm">
                      <Flame className="w-4 h-4 text-amber-400" />
                      <code className="text-emerald-400 font-mono">devloom standup</code>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Generates a concise markdown standup report of what you shipped today, active blockers, and learnings ready for Slack.
                    </p>
                    <CodeBlock
                      code={`devloom standup`}
                      caption="Daily Standup Report"
                    />
                  </div>
                </div>
              )}

              {/* Inspection Commands */}
              {matchesSearch("list status inspecting") && (
                <div className="p-5 rounded-2xl border border-slate-800 bg-[#0d0e14] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white font-semibold text-sm">
                      <Layers className="w-4 h-4 text-emerald-400" />
                      <code className="text-emerald-400 font-mono">devloom list [tasks|bugs|learnings]</code>
                    </div>
                    <span className="text-xs text-slate-400">Terminal inspection</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Check your pending tasks, active bugs, and recorded gotchas right in your terminal.
                  </p>
                  <CodeBlock
                    code={`# List active tasks
devloom list tasks

# List unresolved bugs
devloom list bugs

# Check configuration & git status
devloom status`}
                    caption="Terminal Inspection"
                  />
                </div>
              )}
            </div>
          )}

          {/* 5. Shell Aliases & Productivity Shortcuts */}
          {matchesSearch("aliases shortcuts dt db dg dc ds productivity zshrc bashrc") && (
            <div id="shortcuts" className="p-6 rounded-2xl border border-slate-800 bg-[#0d0e14] space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-white font-semibold text-sm">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Ultra-Fast 2-Letter Shell Aliases</span>
                </div>
                <span className="text-xs text-emerald-400 font-mono">10x Speed</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Add this to your <code className="text-emerald-400 font-mono text-xs">~/.zshrc</code> or <code className="text-emerald-400 font-mono text-xs">~/.bashrc</code> to enable instantaneous 2-letter shortcuts:
              </p>

              <CodeBlock
                code="source ~/.devloom/devloom.sh"
                caption="Load Shell Shortcuts"
              />

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2 text-center text-xs">
                <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
                  <code className="text-emerald-400 font-mono font-bold text-sm">dt</code>
                  <div className="text-slate-400 text-[11px]">devloom task</div>
                </div>
                <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
                  <code className="text-warning font-mono font-bold text-sm">db</code>
                  <div className="text-slate-400 text-[11px]">devloom bug</div>
                </div>
                <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
                  <code className="text-emerald-400 font-mono font-bold text-sm">dg</code>
                  <div className="text-slate-400 text-[11px]">devloom gotcha</div>
                </div>
                <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
                  <code className="text-primary font-mono font-bold text-sm">dc</code>
                  <div className="text-slate-400 text-[11px]">devloom capture</div>
                </div>
                <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
                  <code className="text-amber-400 font-mono font-bold text-sm">ds</code>
                  <div className="text-slate-400 text-[11px]">devloom standup</div>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* SECTION: WEB WORKSPACE GUIDE */}
      {(activeTab === "all" || activeTab === "web") && (
        <section id="web" className="space-y-6 pt-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/15 border border-primary/25 text-primary">
                <LayoutDashboard className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">DevLoom Web Workspace Guide</h2>
                <p className="text-xs text-slate-400">Everything inside your web dashboard and productivity features</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Feature 1: 52-Week Recall & Activity Heatmap */}
            {matchesSearch("heatmap recall review activity streaks consistency yearly calendar") && (
              <div className="p-6 rounded-2xl border border-slate-800 bg-[#0d0e14] space-y-3">
                <div className="flex items-center gap-2.5 text-white font-semibold text-sm">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <span>52-Week Activity Heatmap & Streaks</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Located right on your <Link href="/dashboard" className="text-emerald-400 hover:underline">Dashboard</Link>. Displays a GitHub-style 52-week activity calendar tracking your daily engineering reviews, captured notes, and completed tasks.
                </p>
                <div className="text-xs text-slate-400 space-y-1.5 pt-1">
                  <p className="flex items-center gap-2">
                    <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span><strong>Multi-Year History:</strong> Switch between <em>Current Year</em>, <em>Current - 1</em>, and <em>Current - 2</em> at any time.</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span><strong>Consistency Streaks:</strong> Calculates your active daily streak and all-time record.</span>
                  </p>
                </div>
              </div>
            )}

            {/* Feature 2: Spaced Repetition Reviews */}
            {matchesSearch("spaced repetition leitner ebbinghaus review memory learning gotcha") && (
              <div className="p-6 rounded-2xl border border-slate-800 bg-[#0d0e14] space-y-3">
                <div className="flex items-center gap-2.5 text-white font-semibold text-sm">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Code2 className="w-4 h-4" />
                  </div>
                  <span>Leitner Spaced Repetition (Never Forget)</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  DevLoom fights the developer forgetting curve using the proven Leitner 5-box spaced repetition algorithm (1d, 3d, 7d, 14d, 30d).
                </p>
                <div className="text-xs text-slate-400 space-y-1.5 pt-1">
                  <p className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>When a gotcha is due, you are prompted to recall the fix before revealing the answer.</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Remembering promotes the card to the next box; forgetting resets it for review tomorrow.</span>
                  </p>
                </div>
              </div>
            )}

            {/* Feature 3: Tasks with Kanban & Gantt Critical Path */}
            {matchesSearch("tasks kanban gantt timeline critical path dependencies") && (
              <div className="p-6 rounded-2xl border border-slate-800 bg-[#0d0e14] space-y-3">
                <div className="flex items-center gap-2.5 text-white font-semibold text-sm">
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
                    <CheckSquare className="w-4 h-4" />
                  </div>
                  <span>Dual Task Views: Kanban & Gantt Timeline</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  On the <Link href="/tasks" className="text-primary hover:underline">Tasks page</Link>, toggle between a flexible Kanban Board (Todo, In Progress, In Review, Done) and a Gantt Critical Path Timeline.
                </p>
                <div className="text-xs text-slate-400 space-y-1.5 pt-1">
                  <p className="flex items-center gap-2">
                    <ChevronRight className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span><strong>Timeline Scheduling:</strong> Set start dates, deadlines, and blocking dependencies.</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <ChevronRight className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span><strong>Critical Path Highlighting:</strong> Visualizes which blockers threaten release deadlines.</span>
                  </p>
                </div>
              </div>
            )}

            {/* Feature 4: Bug Defect Triage & AI Fix Prompts */}
            {matchesSearch("bug defect stack trace ai fix prompt prompt llm claude cursor antigravity") && (
              <div className="p-6 rounded-2xl border border-slate-800 bg-[#0d0e14] space-y-3">
                <div className="flex items-center gap-2.5 text-white font-semibold text-sm">
                  <div className="p-1.5 rounded-lg bg-warning/10 text-warning border border-warning/20">
                    <Bug className="w-4 h-4" />
                  </div>
                  <span>Bugs & 1-Click AI Fix Prompts</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  In <Link href="/bugs" className="text-warning hover:underline">Bug Triage</Link>, record error logs, reproduction steps, and severity levels.
                </p>
                <div className="text-xs text-slate-400 space-y-1.5 pt-1">
                  <p className="flex items-center gap-2">
                    <AIIcon className="w-3.5 h-3.5 text-warning shrink-0" />
                    <span><strong>AI Fix Prompt:</strong> Click the AI Fix button on any bug card to generate a structured debugging prompt complete with stack trace and context.</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <AIIcon className="w-3.5 h-3.5 text-warning shrink-0" />
                    <span>Paste directly into Antigravity, Claude Code, Cursor, or ChatGPT to get an immediate fix!</span>
                  </p>
                </div>
              </div>
            )}

            {/* Feature 5: Obsidian Vault Export */}
            {matchesSearch("obsidian markdown export zip foam logseq vault notes") && (
              <div className="p-6 rounded-2xl border border-slate-800 bg-[#0d0e14] space-y-3">
                <div className="flex items-center gap-2.5 text-white font-semibold text-sm">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Download className="w-4 h-4" />
                  </div>
                  <span>Obsidian & Markdown Vault Export</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  You own 100% of your data. On the <Link href="/learnings" className="text-emerald-400 hover:underline">Knowledge Base page</Link>, click <strong>Export Obsidian Vault</strong> to download your entire technical library.
                </p>
                <div className="text-xs text-slate-400 space-y-1.5 pt-1">
                  <p className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Exports clean Markdown files formatted with standard YAML frontmatter tags.</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Fully compatible with Obsidian, Foam, Logseq, or local Git repositories.</span>
                  </p>
                </div>
              </div>
            )}

            {/* Feature 6: Global Command Palette */}
            {matchesSearch("command palette search keyboard shortcuts k") && (
              <div className="p-6 rounded-2xl border border-slate-800 bg-[#0d0e14] space-y-3">
                <div className="flex items-center gap-2.5 text-white font-semibold text-sm">
                  <div className="p-1.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                    <Command className="w-4 h-4" />
                  </div>
                  <span>Global Command Palette (⌘K)</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[11px] font-mono text-slate-300">⌘K</kbd> (or <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[11px] font-mono text-slate-300">Ctrl+K</kbd>) anywhere in DevLoom to open the instant fuzzy search modal.
                </p>
                <div className="text-xs text-slate-400 space-y-1.5 pt-1">
                  <p className="flex items-center gap-2">
                    <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Search across all tasks, bugs, learnings, and projects in milliseconds.</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Trigger Smart AI Capture or Quick Add directly from the keyboard.</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* SECTION: CI/CD & AUTOMATION */}
      {(activeTab === "all" || activeTab === "cli") && matchesSearch("cicd github actions pipeline environment variables token headless") && (
        <section className="space-y-4 pt-4">
          <div className="p-6 rounded-2xl border border-slate-800 bg-[#0d0e14] space-y-3">
            <div className="flex items-center gap-2 text-white font-semibold text-sm">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>CI/CD & Headless Scripting</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              You can run the DevLoom CLI in non-interactive CI environments (such as GitHub Actions or Docker) by providing environment variables instead of running <code className="text-emerald-400 font-mono text-xs">devloom login</code>:
            </p>

            <CodeBlock
              code={`# Set environment variables in your pipeline:
export DEVLOOM_TOKEN="dvl_live_xxxxxxxxxxxxxxxxxxxxxxxx"
export DEVLOOM_HOST="https://devloom.app"

# Now run any devloom command headlessly:
devloom task "Verify production deployment #\${{ github.sha }}" -p high -t deploy,ci`}
              caption="Headless CI/CD Usage"
            />
          </div>
        </section>
      )}

      {/* Footer Support Callout */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <DevLoomLogo className="w-6 h-6 shrink-0" />
          <span>Have questions or feature suggestions? Check your <Link href="/settings" className="text-primary hover:underline font-medium">Settings</Link> or inspect the open-source CLI.</span>
        </div>
        <a
          href="https://github.com/ratnesh-maurya/devloom"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition shrink-0"
        >
          <span>GitHub Repo</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
