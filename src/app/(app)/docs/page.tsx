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
  Monitor,
  Apple,
} from "lucide-react";
import { AIIcon } from "@/components/icons/ai";
import { DevLoomLogo } from "@/components/icons/devloom-logo";
import clsx from "clsx";

type Platform = "mac" | "linux" | "windows";

interface CodeBlockProps {
  code: string;
  language?: string;
  caption?: string;
  platform?: string;
}

function CodeBlock({ code, language = "bash", caption, platform }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-3.5 rounded-xl border border-[#30363d] bg-[#0d1117] overflow-hidden shadow-sm">
      {/* GitHub-style Terminal Header Bar */}
      <div className="px-4 py-2.5 border-b border-[#30363d] bg-[#161b22] flex items-center justify-between text-xs text-[#8b949e] font-mono">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#30363d] inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#30363d] inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#30363d] inline-block" />
          </div>
          {caption && <span className="ml-2 font-medium text-[#c9d1d9]">{caption}</span>}
        </div>
        <div className="flex items-center gap-2">
          {platform && (
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-[#21262d] text-[#c9d1d9] border border-[#30363d]">
              {platform}
            </span>
          )}
          <span className="text-[10px] uppercase text-[#8b949e]">{language}</span>
        </div>
      </div>

      {/* Code Area */}
      <div className="relative p-4 flex items-start justify-between gap-4">
        <pre className="font-mono text-xs sm:text-sm text-[#e6edf3] overflow-x-auto leading-relaxed scrollbar-thin flex-1">
          <code>{code}</code>
        </pre>
        <button
          type="button"
          onClick={handleCopy}
          title="Copy code"
          className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#30363d] bg-[#21262d] hover:bg-[#30363d] hover:border-[#8b949e] text-[#c9d1d9] hover:text-white transition cursor-pointer text-xs"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-white" />
              <span className="text-[11px] font-mono text-white font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span className="text-[11px] font-mono">Copy</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function DocsPage() {
  const [activeTab, setActiveTab] = useState<"all" | "cli" | "web" | "git" | "gotchas">("all");
  const [platform, setPlatform] = useState<Platform>("mac");
  const [searchQuery, setSearchQuery] = useState("");

  const matchesSearch = (text: string) => {
    if (!searchQuery.trim()) return true;
    return text.toLowerCase().includes(searchQuery.toLowerCase());
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 text-[#c9d1d9]">
      {/* Top Banner / Hero (GitHub Black & White Theme) */}
      <div className="p-6 sm:p-8 rounded-2xl border border-[#30363d] bg-[#161b22] space-y-6 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#21262d] border border-[#30363d] text-[#f0f6fc] text-xs font-medium">
              <Terminal className="w-3.5 h-3.5 text-white" />
              <span>DevLoom Documentation & Reference</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
              DevLoom Documentation
            </h1>
            <p className="text-sm sm:text-base text-[#8b949e] leading-relaxed">
              Complete guide for the DevLoom Web Workspace and Command-Line Interface. Cross-platform support for <strong className="text-white">macOS</strong>, <strong className="text-white">Linux</strong>, and <strong className="text-white">Windows</strong> with zero-configuration Git context.
            </p>
          </div>

          {/* Quick Action Navigation CTAs */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
            <a
              href="#cli"
              className="px-4 py-2.5 rounded-xl bg-[#f0f6fc] hover:bg-white text-[#0d1117] font-semibold text-xs transition flex items-center justify-center gap-2 shadow-sm"
            >
              <Terminal className="w-4 h-4" />
              <span>CLI Setup Guide</span>
            </a>
            <a
              href="#web"
              className="px-4 py-2.5 rounded-xl border border-[#30363d] bg-[#21262d] hover:bg-[#30363d] text-[#f0f6fc] text-xs font-medium transition flex items-center justify-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Web Workspace Guide</span>
            </a>
          </div>
        </div>

        {/* Global Platform Selector + Search + Navigation Tabs */}
        <div className="pt-6 border-t border-[#30363d] space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#8b949e] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documentation, commands, flags..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#30363d] bg-[#0d1117] text-xs text-white placeholder-[#8b949e] focus:outline-none focus:border-white transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8b949e] hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Platform Selector (macOS / Linux / Windows) */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#8b949e] font-medium hidden sm:inline">Platform:</span>
              <div className="inline-flex rounded-xl border border-[#30363d] bg-[#0d1117] p-1 gap-1">
                <button
                  type="button"
                  onClick={() => setPlatform("mac")}
                  className={clsx(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer",
                    platform === "mac"
                      ? "bg-[#21262d] text-white border border-[#30363d] font-semibold"
                      : "text-[#8b949e] hover:text-white"
                  )}
                >
                  <Apple className="w-3.5 h-3.5" />
                  <span>macOS</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPlatform("linux")}
                  className={clsx(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer",
                    platform === "linux"
                      ? "bg-[#21262d] text-white border border-[#30363d] font-semibold"
                      : "text-[#8b949e] hover:text-white"
                  )}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Linux</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPlatform("windows")}
                  className={clsx(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer",
                    platform === "windows"
                      ? "bg-[#21262d] text-white border border-[#30363d] font-semibold"
                      : "text-[#8b949e] hover:text-white"
                  )}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Windows</span>
                </button>
              </div>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1">
            {[
              { id: "all", label: "All Docs" },
              { id: "cli", label: "Terminal CLI" },
              { id: "git", label: "Git Context & Auto-Provision" },
              { id: "web", label: "Web Workspace" },
              { id: "gotchas", label: "Gotchas & Knowledge Base" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={clsx(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap cursor-pointer",
                  activeTab === tab.id
                    ? "bg-[#f0f6fc] text-[#0d1117] font-semibold"
                    : "text-[#8b949e] hover:text-white hover:bg-[#21262d]"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION: ARCHITECTURE OVERVIEW */}
      {(activeTab === "all" || activeTab === "git") && matchesSearch("architecture sync terminal web database") && (
        <div className="p-6 sm:p-7 rounded-2xl border border-[#30363d] bg-[#161b22] space-y-4">
          <div className="flex items-center gap-2 text-white">
            <Zap className="w-5 h-5 text-white" />
            <h2 className="text-base font-bold text-white">How DevLoom Works</h2>
          </div>
          <p className="text-xs sm:text-sm text-[#8b949e] leading-relaxed">
            DevLoom synchronizes your command line and browser into a unified engineering workspace. When you log tasks, track defects, or record gotchas, items synchronize instantly to PostgreSQL with multi-tenant row-level isolation.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-5 rounded-xl border border-[#30363d] bg-[#0d1117] space-y-2">
              <div className="flex items-center gap-2 text-white text-xs font-bold">
                <Terminal className="w-4 h-4" />
                <span>1. Terminal CLI (Cross-Platform)</span>
              </div>
              <p className="text-xs text-[#8b949e] leading-relaxed">
                Log tasks, bugs, and gotchas right from your shell. Auto-detects local Git repos on macOS, Linux, and Windows.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-[#30363d] bg-[#0d1117] space-y-2">
              <div className="flex items-center gap-2 text-white text-xs font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>2. Multi-Tenant Cloud</span>
              </div>
              <p className="text-xs text-[#8b949e] leading-relaxed">
                Secured by PostgreSQL Row-Level Security (RLS) and encrypted Personal Access Tokens (PATs).
              </p>
            </div>

            <div className="p-5 rounded-xl border border-[#30363d] bg-[#0d1117] space-y-2">
              <div className="flex items-center gap-2 text-white text-xs font-bold">
                <LayoutDashboard className="w-4 h-4" />
                <span>3. Web Workspace</span>
              </div>
              <p className="text-xs text-[#8b949e] leading-relaxed">
                52-week activity heatmap, Kanban & Gantt dual views, AI fix prompts, and Obsidian Markdown vault export.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION: TERMINAL CLI GUIDE */}
      {(activeTab === "all" || activeTab === "cli" || activeTab === "git" || activeTab === "gotchas") && (
        <section id="cli" className="space-y-6 pt-2">
          <div className="flex items-center justify-between border-b border-[#30363d] pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#21262d] border border-[#30363d] text-white">
                <Terminal className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">DevLoom Terminal CLI Guide</h2>
                <p className="text-xs text-[#8b949e]">The developer-first command-line suite for macOS, Linux, and Windows</p>
              </div>
            </div>
            <span className="text-xs font-mono text-[#f0f6fc] bg-[#21262d] border border-[#30363d] px-2.5 py-1 rounded-md font-semibold">
              v1.0.0
            </span>
          </div>

          {/* 1. Platform-Specific Installation */}
          {(activeTab === "all" || activeTab === "cli") && matchesSearch("install installer curl bash setup path windows mac linux powershell") && (
            <div className="p-6 sm:p-7 rounded-2xl border border-[#30363d] bg-[#161b22] space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5 text-white font-bold text-sm">
                  <span className="w-6 h-6 rounded-full bg-[#21262d] text-white border border-[#30363d] flex items-center justify-center text-xs font-bold">1</span>
                  <span>1-Line Installation ({platform === "mac" ? "macOS" : platform === "linux" ? "Linux" : "Windows"})</span>
                </div>
                <div className="inline-flex rounded-lg border border-[#30363d] bg-[#0d1117] p-0.5">
                  {(["mac", "linux", "windows"] as Platform[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPlatform(p)}
                      className={clsx(
                        "px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer capitalize",
                        platform === p ? "bg-[#21262d] text-white font-semibold" : "text-[#8b949e] hover:text-white"
                      )}
                    >
                      {p === "mac" ? "macOS" : p}
                    </button>
                  ))}
                </div>
              </div>

              {platform === "mac" && (
                <div className="space-y-3">
                  <p className="text-xs sm:text-sm text-[#c9d1d9] leading-relaxed">
                    Open your terminal and run the 1-line curl script. It downloads the binary to <code className="text-white font-mono text-xs bg-[#21262d] px-1.5 py-0.5 rounded border border-[#30363d]">~/.devloom/bin</code> and adds it to your <code className="text-white font-mono text-xs bg-[#21262d] px-1.5 py-0.5 rounded border border-[#30363d]">~/.zshrc</code>:
                  </p>
                  <CodeBlock
                    code="curl -fsSL https://devloom.app/install.sh | bash"
                    caption="macOS (zsh / bash)"
                    platform="macOS"
                  />
                  <div className="text-xs text-[#8b949e] space-y-1.5 pt-1">
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />
                      <span>Reload shell after install: <code className="text-[#f0f6fc] font-mono">source ~/.zshrc</code></span>
                    </p>
                  </div>
                </div>
              )}

              {platform === "linux" && (
                <div className="space-y-3">
                  <p className="text-xs sm:text-sm text-[#c9d1d9] leading-relaxed">
                    Works on Ubuntu, Debian, Fedora, Arch, and all major Linux distributions:
                  </p>
                  <CodeBlock
                    code="curl -fsSL https://devloom.app/install.sh | bash"
                    caption="Linux Terminal (bash / zsh)"
                    platform="Linux"
                  />
                  <div className="text-xs text-[#8b949e] space-y-1.5 pt-1">
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />
                      <span>Reload shell after install: <code className="text-[#f0f6fc] font-mono">source ~/.bashrc</code> (or <code className="text-[#f0f6fc] font-mono">source ~/.zshrc</code>)</span>
                    </p>
                  </div>
                </div>
              )}

              {platform === "windows" && (
                <div className="space-y-3">
                  <p className="text-xs sm:text-sm text-[#c9d1d9] leading-relaxed">
                    Open <strong>PowerShell</strong> or <strong>Windows Terminal</strong> and run:
                  </p>
                  <CodeBlock
                    code="irm https://devloom.app/install.ps1 | iex"
                    caption="Windows PowerShell / Terminal"
                    platform="Windows"
                  />
                  <div className="text-xs text-[#8b949e] space-y-1.5 pt-1">
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />
                      <span>Creates <code className="text-[#f0f6fc] font-mono">devloom.cmd</code> and <code className="text-[#f0f6fc] font-mono">devloom.ps1</code> in <code className="text-[#f0f6fc] font-mono">%USERPROFILE%\.devloom\bin</code>.</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />
                      <span>Automatically adds the folder to your User <code className="text-[#f0f6fc] font-mono">Path</code>. Works seamlessly in PowerShell, Command Prompt (CMD), and Git Bash.</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. Authentication & Login */}
          {(activeTab === "all" || activeTab === "cli") && matchesSearch("auth login token personal access pat whoami") && (
            <div className="p-6 sm:p-7 rounded-2xl border border-[#30363d] bg-[#161b22] space-y-5">
              <div className="flex items-center gap-2.5 text-white font-bold text-sm">
                <span className="w-6 h-6 rounded-full bg-[#21262d] text-white border border-[#30363d] flex items-center justify-center text-xs font-bold">2</span>
                <span>Authenticate with Personal Access Token (PAT)</span>
              </div>
              <p className="text-xs sm:text-sm text-[#8b949e] leading-relaxed">
                DevLoom authenticates terminal requests securely using Personal Access Tokens. Follow these 3 steps:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
                <div className="p-4 rounded-xl border border-[#30363d] bg-[#0d1117] space-y-1.5">
                  <span className="font-bold text-white block">Step A: Open Settings</span>
                  <p className="text-[#8b949e] leading-relaxed">
                    Navigate to <Link href="/settings" className="text-white underline hover:text-[#8b949e]">Settings</Link> in the DevLoom sidebar.
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-[#30363d] bg-[#0d1117] space-y-1.5">
                  <span className="font-bold text-white block">Step B: Generate Token</span>
                  <p className="text-[#8b949e] leading-relaxed">
                    Under <strong>Personal Access Tokens</strong>, click "Generate Token" and copy the token starting with <code className="text-white font-mono text-[11px]">dvl_live_</code>.
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-[#30363d] bg-[#0d1117] space-y-1.5">
                  <span className="font-bold text-white block">Step C: Run devloom login</span>
                  <p className="text-[#8b949e] leading-relaxed">
                    Run <code className="text-white font-mono text-[11px]">devloom login</code> in your shell and paste your token.
                  </p>
                </div>
              </div>

              <CodeBlock
                code={`$ devloom login
DevLoom Host [https://devloom.app]: <press enter for default>
Personal Access Token (dvl_live_...): dvl_live_9f81a7b...
Authenticated as developer (dev@example.com)`}
                caption="Interactive Login"
              />

              <p className="text-xs text-[#8b949e]">
                Verify your connection and active credentials at any time:
              </p>
              <CodeBlock code="devloom whoami" caption="Verify Active Credentials" />
            </div>
          )}

          {/* 3. Automatic Git Context & Auto-Provisioning */}
          {(activeTab === "all" || activeTab === "git" || activeTab === "cli") && matchesSearch("git repository repo auto-provision zero-setup branch remote") && (
            <div id="git-auto-provision" className="p-6 sm:p-7 rounded-2xl border border-[#30363d] bg-[#161b22] space-y-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 text-white font-bold text-sm">
                  <GitBranch className="w-5 h-5 text-white" />
                  <span>Automatic Git Context & Project Auto-Provisioning</span>
                </div>
                <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-[#21262d] text-white border border-[#30363d] font-semibold">
                  Zero Setup
                </span>
              </div>

              <p className="text-xs sm:text-sm text-[#8b949e] leading-relaxed">
                When you run any <code className="text-white font-mono text-xs bg-[#21262d] px-1.5 py-0.5 rounded border border-[#30363d]">devloom</code> command inside any Git repository on macOS, Linux, or Windows:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs text-[#c9d1d9]">
                <div className="p-4 rounded-xl border border-[#30363d] bg-[#0d1117] space-y-1.5">
                  <span className="font-bold text-white block">1. Auto-Detects Git Remote</span>
                  <p className="text-[#8b949e] leading-relaxed">
                    Inspects your repository's <code className="text-white font-mono">git remote get-url origin</code> across all operating systems.
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-[#30363d] bg-[#0d1117] space-y-1.5">
                  <span className="font-bold text-white block">2. Finds or Auto-Provisions</span>
                  <p className="text-[#8b949e] leading-relaxed">
                    If the project exists in your DevLoom account, it links immediately. If not, DevLoom automatically creates the project on the fly.
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-[#30363d] bg-[#0d1117] space-y-1.5">
                  <span className="font-bold text-white block">3. Zero Context Switching</span>
                  <p className="text-[#8b949e] leading-relaxed">
                    You never need to open your browser to manually register projects before using the CLI.
                  </p>
                </div>
              </div>

              <CodeBlock
                code={`$ cd ~/Projects/payment-service
$ git remote get-url origin
https://github.com/my-org/payment-service.git

# DevLoom automatically provisions 'payment-service' in your account:
$ devloom task "Implement Stripe idempotent webhooks" -p high -t stripe,webhooks
Auto-provisioned project 'payment-service' (github.com/my-org/payment-service)
Created Task #42: Implement Stripe idempotent webhooks [high]`}
                caption="Git Context in Action"
              />

              <div className="p-3.5 rounded-xl bg-[#0d1117] border border-[#30363d] text-xs text-[#8b949e] flex items-center gap-2">
                <span className="font-bold text-white">Manual Override:</span>
                <span>Override the project at any time using <code className="text-white font-mono">-P &lt;slug&gt;</code> or <code className="text-white font-mono">--project &lt;slug&gt;</code>.</span>
              </div>
            </div>
          )}

          {/* 4. Complete Command Reference */}
          {matchesSearch("commands task bug gotcha learning capture standup list status") && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-white">
                <Command className="w-5 h-5 text-white" />
                <h3 className="text-lg font-bold text-white">CLI Command Reference & Examples</h3>
              </div>

              {/* Task Command */}
              {matchesSearch("task priority tags desc") && (
                <div className="p-6 rounded-2xl border border-[#30363d] bg-[#161b22] space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-white font-bold text-sm">
                      <CheckSquare className="w-4 h-4 text-white" />
                      <code className="text-white font-mono text-xs sm:text-sm bg-[#0d1117] px-2 py-0.5 rounded border border-[#30363d]">
                        devloom task &quot;&lt;title&gt;&quot; [options]
                      </code>
                    </div>
                    <span className="text-xs text-[#8b949e]">Log engineering to-do</span>
                  </div>

                  <p className="text-xs sm:text-sm text-[#8b949e] leading-relaxed">
                    Creates an actionable task in your workspace. Priority defaults to <code className="text-white font-mono text-xs">medium</code>.
                  </p>

                  <div className="overflow-x-auto rounded-xl border border-[#30363d]">
                    <table className="w-full text-left text-xs font-mono text-[#c9d1d9] border-collapse bg-[#0d1117]">
                      <thead>
                        <tr className="border-b border-[#30363d] bg-[#161b22] text-[#8b949e]">
                          <th className="py-2.5 px-3 font-semibold">Flag</th>
                          <th className="py-2.5 px-3 font-semibold">Description</th>
                          <th className="py-2.5 px-3 font-semibold">Example Values</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#30363d]/60">
                        <tr>
                          <td className="py-2 px-3 text-white font-bold">-d, --desc</td>
                          <td className="py-2 px-3 text-[#c9d1d9]">Detailed task description</td>
                          <td className="py-2 px-3 text-[#8b949e]">&quot;Update Auth.js edge middleware&quot;</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 text-white font-bold">-p, --priority</td>
                          <td className="py-2 px-3 text-[#c9d1d9]">Task priority level</td>
                          <td className="py-2 px-3 text-[#8b949e]">low, medium, high, urgent</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 text-white font-bold">-P, --project</td>
                          <td className="py-2 px-3 text-[#c9d1d9]">Project slug (overrides git detection)</td>
                          <td className="py-2 px-3 text-[#8b949e]">devloom, auth-api</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 text-white font-bold">-t, --tags</td>
                          <td className="py-2 px-3 text-[#c9d1d9]">Comma-separated tags</td>
                          <td className="py-2 px-3 text-[#8b949e]">auth,security,nextjs</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <CodeBlock
                    code={`# Simple task
devloom task "Refactor database connection pool"

# Detailed task with priority, tags, and description
devloom task "Implement JWT session rotation" -p high -t auth,security -d "Rotate edge tokens every 15 minutes"`}
                    caption="Example Task Commands"
                  />
                </div>
              )}

              {/* Bug Command */}
              {matchesSearch("bug severity repro steps defect") && (
                <div className="p-6 rounded-2xl border border-[#30363d] bg-[#161b22] space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-white font-bold text-sm">
                      <Bug className="w-4 h-4 text-white" />
                      <code className="text-white font-mono text-xs sm:text-sm bg-[#0d1117] px-2 py-0.5 rounded border border-[#30363d]">
                        devloom bug &quot;&lt;title&gt;&quot; [options]
                      </code>
                    </div>
                    <span className="text-xs text-[#8b949e]">Record a software defect</span>
                  </div>

                  <p className="text-xs sm:text-sm text-[#8b949e] leading-relaxed">
                    Logs a software defect with severity level, reproduction steps, and error logs.
                  </p>

                  <div className="overflow-x-auto rounded-xl border border-[#30363d]">
                    <table className="w-full text-left text-xs font-mono text-[#c9d1d9] border-collapse bg-[#0d1117]">
                      <thead>
                        <tr className="border-b border-[#30363d] bg-[#161b22] text-[#8b949e]">
                          <th className="py-2.5 px-3 font-semibold">Flag</th>
                          <th className="py-2.5 px-3 font-semibold">Description</th>
                          <th className="py-2.5 px-3 font-semibold">Example Values</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#30363d]/60">
                        <tr>
                          <td className="py-2 px-3 text-white font-bold">-s, --severity</td>
                          <td className="py-2 px-3 text-[#c9d1d9]">Bug severity</td>
                          <td className="py-2 px-3 text-[#8b949e]">low, medium, high, critical</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 text-white font-bold">-r, --repro</td>
                          <td className="py-2 px-3 text-[#c9d1d9]">Reproduction steps or error trace</td>
                          <td className="py-2 px-3 text-[#8b949e]">&quot;Run k6 load test with 500 VUs&quot;</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 text-white font-bold">-P, --project</td>
                          <td className="py-2 px-3 text-[#c9d1d9]">Project slug</td>
                          <td className="py-2 px-3 text-[#8b949e]">billing-service</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 text-white font-bold">-t, --tags</td>
                          <td className="py-2 px-3 text-[#c9d1d9]">Comma-separated tags</td>
                          <td className="py-2 px-3 text-[#8b949e]">db,postgres,leak</td>
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
                <div id="gotchas" className="p-6 rounded-2xl border border-[#30363d] bg-[#161b22] space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-white font-bold text-sm">
                      <Code2 className="w-4 h-4 text-white" />
                      <code className="text-white font-mono text-xs sm:text-sm bg-[#0d1117] px-2 py-0.5 rounded border border-[#30363d]">
                        devloom gotcha &quot;&lt;title&gt;&quot; -s &quot;&lt;fix&gt;&quot; [options]
                      </code>
                    </div>
                    <span className="text-xs text-[#8b949e]">Save technical lesson</span>
                  </div>

                  <p className="text-xs sm:text-sm text-[#8b949e] leading-relaxed">
                    Never forget a hard-earned technical discovery. Captures tricky bugs, library quirks, and architecture rules into your Spaced Repetition knowledge base.
                  </p>

                  <div className="overflow-x-auto rounded-xl border border-[#30363d]">
                    <table className="w-full text-left text-xs font-mono text-[#c9d1d9] border-collapse bg-[#0d1117]">
                      <thead>
                        <tr className="border-b border-[#30363d] bg-[#161b22] text-[#8b949e]">
                          <th className="py-2.5 px-3 font-semibold">Flag</th>
                          <th className="py-2.5 px-3 font-semibold">Description</th>
                          <th className="py-2.5 px-3 font-semibold">Requirement</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#30363d]/60">
                        <tr>
                          <td className="py-2 px-3 text-white font-bold">-s, --summary</td>
                          <td className="py-2 px-3 text-[#c9d1d9]">The crucial takeaway, workaround, or solution</td>
                          <td className="py-2 px-3 text-white font-semibold">Required</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 text-white font-bold">-t, --tags</td>
                          <td className="py-2 px-3 text-[#c9d1d9]">Comma-separated tags for categorization</td>
                          <td className="py-2 px-3 text-[#8b949e]">Optional</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 text-white font-bold">-P, --project</td>
                          <td className="py-2 px-3 text-[#c9d1d9]">Project slug</td>
                          <td className="py-2 px-3 text-[#8b949e]">Optional</td>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-6 rounded-2xl border border-[#30363d] bg-[#161b22] space-y-3">
                    <div className="flex items-center gap-2 text-white font-bold text-sm">
                      <AIIcon className="w-4 h-4 text-white" />
                      <code className="text-white font-mono text-xs bg-[#0d1117] px-2 py-0.5 rounded border border-[#30363d]">
                        devloom capture &quot;&lt;text&gt;&quot;
                      </code>
                    </div>
                    <p className="text-xs text-[#8b949e] leading-relaxed">
                      Paste unstructured terminal output, error logs, or quick thoughts. AI parses it into a task, bug, or gotcha automatically!
                    </p>
                    <CodeBlock
                      code={`devloom capture "Remember to test edge middleware when deploying to Vercel"`}
                      caption="AI Smart Capture"
                    />
                  </div>

                  <div className="p-6 rounded-2xl border border-[#30363d] bg-[#161b22] space-y-3">
                    <div className="flex items-center gap-2 text-white font-bold text-sm">
                      <Flame className="w-4 h-4 text-white" />
                      <code className="text-white font-mono text-xs bg-[#0d1117] px-2 py-0.5 rounded border border-[#30363d]">
                        devloom standup
                      </code>
                    </div>
                    <p className="text-xs text-[#8b949e] leading-relaxed">
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
                <div className="p-6 rounded-2xl border border-[#30363d] bg-[#161b22] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white font-bold text-sm">
                      <Layers className="w-4 h-4 text-white" />
                      <code className="text-white font-mono text-xs sm:text-sm bg-[#0d1117] px-2 py-0.5 rounded border border-[#30363d]">
                        devloom list [tasks|bugs|learnings]
                      </code>
                    </div>
                    <span className="text-xs text-[#8b949e]">Terminal inspection</span>
                  </div>
                  <p className="text-xs text-[#8b949e] leading-relaxed">
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

          {/* 5. Platform-Specific Shell Aliases & Productivity Shortcuts */}
          {matchesSearch("aliases shortcuts dt db dg dc ds productivity zshrc bashrc powershell windows mac linux") && (
            <div id="shortcuts" className="p-6 sm:p-7 rounded-2xl border border-[#30363d] bg-[#161b22] space-y-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Zap className="w-4 h-4 text-white" />
                  <span>2-Letter Shell Shortcuts ({platform === "mac" ? "macOS" : platform === "linux" ? "Linux" : "Windows"})</span>
                </div>
                <span className="text-xs text-[#f0f6fc] font-mono bg-[#21262d] border border-[#30363d] px-2 py-0.5 rounded">
                  Instant Capture
                </span>
              </div>

              {platform === "windows" ? (
                <div className="space-y-3">
                  <p className="text-xs sm:text-sm text-[#8b949e] leading-relaxed">
                    In Windows PowerShell, add this line to your PowerShell profile (<code className="text-white font-mono text-xs">notepad $PROFILE</code>):
                  </p>
                  <CodeBlock
                    code='. "$HOME\.devloom\devloom.ps1"'
                    caption="Windows PowerShell ($PROFILE)"
                    platform="Windows"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs sm:text-sm text-[#8b949e] leading-relaxed">
                    Add this to your <code className="text-white font-mono text-xs bg-[#21262d] px-1.5 py-0.5 rounded border border-[#30363d]">~/.zshrc</code> or <code className="text-white font-mono text-xs bg-[#21262d] px-1.5 py-0.5 rounded border border-[#30363d]">~/.bashrc</code>:
                  </p>
                  <CodeBlock
                    code="source ~/.devloom/devloom.sh"
                    caption="macOS & Linux Shell Profile"
                    platform={platform === "mac" ? "macOS" : "Linux"}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1 text-center text-xs">
                <div className="p-3.5 rounded-xl border border-[#30363d] bg-[#0d1117] space-y-1">
                  <code className="text-white font-mono font-bold text-sm">dt</code>
                  <div className="text-[#8b949e] text-[11px]">devloom task</div>
                </div>
                <div className="p-3.5 rounded-xl border border-[#30363d] bg-[#0d1117] space-y-1">
                  <code className="text-white font-mono font-bold text-sm">db</code>
                  <div className="text-[#8b949e] text-[11px]">devloom bug</div>
                </div>
                <div className="p-3.5 rounded-xl border border-[#30363d] bg-[#0d1117] space-y-1">
                  <code className="text-white font-mono font-bold text-sm">dg</code>
                  <div className="text-[#8b949e] text-[11px]">devloom gotcha</div>
                </div>
                <div className="p-3.5 rounded-xl border border-[#30363d] bg-[#0d1117] space-y-1">
                  <code className="text-white font-mono font-bold text-sm">dc</code>
                  <div className="text-[#8b949e] text-[11px]">devloom capture</div>
                </div>
                <div className="p-3.5 rounded-xl border border-[#30363d] bg-[#0d1117] space-y-1">
                  <code className="text-white font-mono font-bold text-sm">ds</code>
                  <div className="text-[#8b949e] text-[11px]">devloom standup</div>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* SECTION: WEB WORKSPACE GUIDE */}
      {(activeTab === "all" || activeTab === "web") && (
        <section id="web" className="space-y-6 pt-6">
          <div className="flex items-center justify-between border-b border-[#30363d] pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#21262d] border border-[#30363d] text-white">
                <LayoutDashboard className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">DevLoom Web Workspace Guide</h2>
                <p className="text-xs text-[#8b949e]">Everything inside your browser dashboard and productivity tools</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Feature 1: 52-Week Recall & Activity Heatmap */}
            {matchesSearch("heatmap recall review activity streaks consistency yearly calendar") && (
              <div className="p-6 rounded-2xl border border-[#30363d] bg-[#161b22] space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5 text-white font-bold text-sm">
                    <div className="p-1.5 rounded-lg bg-[#21262d] text-white border border-[#30363d]">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <span>52-Week Activity Heatmap & Streaks</span>
                  </div>
                  <p className="text-xs text-[#8b949e] leading-relaxed">
                    Located right on your <Link href="/dashboard" className="text-white underline hover:text-[#8b949e]">Dashboard</Link>. Tracks daily engineering reviews, notes, and tasks in a GitHub-style calendar.
                  </p>
                  <div className="text-xs text-[#8b949e] space-y-1.5 pt-1">
                    <p className="flex items-center gap-2">
                      <Flame className="w-3.5 h-3.5 text-white shrink-0" />
                      <span><strong>Multi-Year History:</strong> Switch between <em>Current Year</em>, <em>Current - 1</em>, and <em>Current - 2</em>.</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Flame className="w-3.5 h-3.5 text-white shrink-0" />
                      <span><strong>Consistency Streaks:</strong> Calculates active and all-time record streaks.</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Feature 2: Spaced Repetition Reviews */}
            {matchesSearch("spaced repetition leitner ebbinghaus review memory learning gotcha") && (
              <div className="p-6 rounded-2xl border border-[#30363d] bg-[#161b22] space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5 text-white font-bold text-sm">
                    <div className="p-1.5 rounded-lg bg-[#21262d] text-white border border-[#30363d]">
                      <Code2 className="w-4 h-4" />
                    </div>
                    <span>Leitner Spaced Repetition (Never Forget)</span>
                  </div>
                  <p className="text-xs text-[#8b949e] leading-relaxed">
                    Fights the developer forgetting curve with the proven Leitner 5-box spaced repetition algorithm (1d, 3d, 7d, 14d, 30d).
                  </p>
                  <div className="text-xs text-[#8b949e] space-y-1.5 pt-1">
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />
                      <span>Recall the fix before revealing the answer.</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />
                      <span>Promotes card on success; resets on failure.</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Feature 3: Tasks with Kanban & Gantt Critical Path */}
            {matchesSearch("tasks kanban gantt timeline critical path dependencies") && (
              <div className="p-6 rounded-2xl border border-[#30363d] bg-[#161b22] space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5 text-white font-bold text-sm">
                    <div className="p-1.5 rounded-lg bg-[#21262d] text-white border border-[#30363d]">
                      <CheckSquare className="w-4 h-4" />
                    </div>
                    <span>Dual Task Views: Kanban & Gantt</span>
                  </div>
                  <p className="text-xs text-[#8b949e] leading-relaxed">
                    On the <Link href="/tasks" className="text-white underline hover:text-[#8b949e]">Tasks page</Link>, toggle between Kanban Board (Todo, In Progress, In Review, Done) and Gantt Critical Path Timeline.
                  </p>
                  <div className="text-xs text-[#8b949e] space-y-1.5 pt-1">
                    <p className="flex items-center gap-2">
                      <ChevronRight className="w-3.5 h-3.5 text-white shrink-0" />
                      <span><strong>Timeline Scheduling:</strong> Start dates, deadlines, and dependencies.</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <ChevronRight className="w-3.5 h-3.5 text-white shrink-0" />
                      <span><strong>Critical Path Highlighting:</strong> Visualizes release-blocking bottlenecks.</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Feature 4: Bug Defect Triage & AI Fix Prompts */}
            {matchesSearch("bug defect stack trace ai fix prompt prompt llm claude cursor antigravity") && (
              <div className="p-6 rounded-2xl border border-[#30363d] bg-[#161b22] space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5 text-white font-bold text-sm">
                    <div className="p-1.5 rounded-lg bg-[#21262d] text-white border border-[#30363d]">
                      <Bug className="w-4 h-4" />
                    </div>
                    <span>Bugs & 1-Click AI Fix Prompts</span>
                  </div>
                  <p className="text-xs text-[#8b949e] leading-relaxed">
                    In <Link href="/bugs" className="text-white underline hover:text-[#8b949e]">Bug Triage</Link>, capture error logs, repro steps, and severity levels.
                  </p>
                  <div className="text-xs text-[#8b949e] space-y-1.5 pt-1">
                    <p className="flex items-center gap-2">
                      <AIIcon className="w-3.5 h-3.5 text-white shrink-0" />
                      <span><strong>AI Fix Prompt:</strong> Click AI Fix to generate a structured debugging prompt.</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <AIIcon className="w-3.5 h-3.5 text-white shrink-0" />
                      <span>Paste into Claude Code, Cursor, ChatGPT, or Antigravity for instant resolutions.</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Feature 5: Obsidian Vault Export */}
            {matchesSearch("obsidian markdown export zip foam logseq vault notes") && (
              <div className="p-6 rounded-2xl border border-[#30363d] bg-[#161b22] space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5 text-white font-bold text-sm">
                    <div className="p-1.5 rounded-lg bg-[#21262d] text-white border border-[#30363d]">
                      <Download className="w-4 h-4" />
                    </div>
                    <span>Obsidian & Markdown Vault Export</span>
                  </div>
                  <p className="text-xs text-[#8b949e] leading-relaxed">
                    You own 100% of your data. In <Link href="/learnings" className="text-white underline hover:text-[#8b949e]">Knowledge Base</Link>, click <strong>Export Vault</strong> to download your entire technical library.
                  </p>
                  <div className="text-xs text-[#8b949e] space-y-1.5 pt-1">
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />
                      <span>Exports clean Markdown files formatted with YAML frontmatter tags.</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />
                      <span>Compatible with Obsidian, Logseq, Foam, or GitHub repositories.</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Feature 6: Global Command Palette */}
            {matchesSearch("command palette search keyboard shortcuts k") && (
              <div className="p-6 rounded-2xl border border-[#30363d] bg-[#161b22] space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5 text-white font-bold text-sm">
                    <div className="p-1.5 rounded-lg bg-[#21262d] text-white border border-[#30363d]">
                      <Command className="w-4 h-4" />
                    </div>
                    <span>Global Command Palette (⌘K)</span>
                  </div>
                  <p className="text-xs text-[#8b949e] leading-relaxed">
                    Press <kbd className="px-1.5 py-0.5 rounded bg-[#21262d] border border-[#30363d] text-[11px] font-mono text-white">⌘K</kbd> (or <kbd className="px-1.5 py-0.5 rounded bg-[#21262d] border border-[#30363d] text-[11px] font-mono text-white">Ctrl+K</kbd>) anywhere to open the instant search modal.
                  </p>
                  <div className="text-xs text-[#8b949e] space-y-1.5 pt-1">
                    <p className="flex items-center gap-2">
                      <Search className="w-3.5 h-3.5 text-white shrink-0" />
                      <span>Fuzzy search across tasks, bugs, gotchas, and projects in milliseconds.</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Search className="w-3.5 h-3.5 text-white shrink-0" />
                      <span>Trigger Smart AI Capture or Quick Add directly from the keyboard.</span>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* SECTION: CI/CD & HEADLESS SCRIPTING */}
      {(activeTab === "all" || activeTab === "cli") && matchesSearch("cicd github actions pipeline environment variables token headless") && (
        <section className="space-y-4 pt-4">
          <div className="p-6 sm:p-7 rounded-2xl border border-[#30363d] bg-[#161b22] space-y-4">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Cpu className="w-5 h-5 text-white" />
              <span>CI/CD & Headless Automation ({platform === "windows" ? "Windows / PowerShell" : "macOS / Linux / bash"})</span>
            </div>
            <p className="text-xs sm:text-sm text-[#8b949e] leading-relaxed">
              Run the CLI in automated pipelines (GitHub Actions, Docker, Jenkins) using environment variables without running <code className="text-white font-mono text-xs bg-[#21262d] px-1.5 py-0.5 rounded border border-[#30363d]">devloom login</code>:
            </p>

            {platform === "windows" ? (
              <CodeBlock
                code={`# PowerShell / Windows CI pipeline:
$env:DEVLOOM_TOKEN = "dvl_live_xxxxxxxxxxxxxxxxxxxxxxxx"
$env:DEVLOOM_HOST = "https://devloom.app"

# Run any command headlessly:
devloom task "Verify Windows build #\${env:GITHUB_RUN_ID}" -p high -t deploy,ci`}
                caption="Windows CI/CD Environment"
                platform="Windows"
              />
            ) : (
              <CodeBlock
                code={`# Bash / macOS / Linux CI pipeline:
export DEVLOOM_TOKEN="dvl_live_xxxxxxxxxxxxxxxxxxxxxxxx"
export DEVLOOM_HOST="https://devloom.app"

# Run any command headlessly:
devloom task "Verify deployment #\${{ github.sha }}" -p high -t deploy,ci`}
                caption="Linux & macOS CI/CD Environment"
                platform="Linux / macOS"
              />
            )}
          </div>
        </section>
      )}

      {/* Footer Support Callout (GitHub Style) */}
      <div className="p-6 rounded-2xl border border-[#30363d] bg-[#161b22] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8b949e]">
        <div className="flex items-center gap-3">
          <DevLoomLogo className="w-6 h-6 shrink-0" />
          <span>Have questions or need assistance? Check your <Link href="/settings" className="text-white underline hover:text-[#8b949e] font-semibold">Settings</Link> or inspect the open-source CLI suite.</span>
        </div>
        <a
          href="https://github.com/ratnesh-maurya/devloom"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-[#30363d] bg-[#21262d] hover:bg-[#30363d] text-white transition shrink-0 font-medium"
        >
          <span>GitHub Repository</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
