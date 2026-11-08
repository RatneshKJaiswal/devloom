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
  showPrompt?: boolean;
}

function CodeBlock({ code, language = "bash", caption, platform, showPrompt = true }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isShell = language === "bash" || language === "sh" || language === "shell" || language === "zsh" || language === "powershell";
  const isMultiLine = code.includes("\n");
  const isPowerShell = language === "powershell" || code.startsWith("irm ") || (platform && platform.toLowerCase().includes("win")) || (caption && caption.toLowerCase().includes("powershell"));

  const isDuplicatePlatform = Boolean(platform && caption && caption.toLowerCase().includes(platform.toLowerCase()));

  return (
    <div className="relative group my-3.5 rounded-xl border border-slate-800 bg-[#0d0e12] overflow-hidden shadow-lg shadow-black/40">
      {/* Terminal Header Bar */}
      <div className="px-3.5 py-2.5 border-b border-slate-800/90 bg-[#14151a] flex items-center justify-between text-xs font-mono">
        {/* Left: macOS Window Traffic Lights + Caption */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2 shrink-0 group/traffic cursor-default" aria-hidden="true">
            {/* macOS Close (Red) */}
            <span
              style={{
                background: "radial-gradient(circle at 35% 30%, #ff6f66, #ff5f56 60%, #e0443e 100%)",
                boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.45), 0 1px 2px rgba(0, 0, 0, 0.4)",
              }}
              className="w-3 h-3 rounded-full flex items-center justify-center border border-black/25 transition-transform group-hover/traffic:scale-105"
            >
              <svg
                className="w-1.5 h-1.5 text-[#4c0000] opacity-0 group-hover/traffic:opacity-100 transition-opacity"
                viewBox="0 0 6 6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
              >
                <path d="M1 1l4 4M5 1L1 5" />
              </svg>
            </span>

            {/* macOS Minimize (Yellow) */}
            <span
              style={{
                background: "radial-gradient(circle at 35% 30%, #ffd54f, #ffbd2e 60%, #dea123 100%)",
                boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.45), 0 1px 2px rgba(0, 0, 0, 0.4)",
              }}
              className="w-3 h-3 rounded-full flex items-center justify-center border border-black/25 transition-transform group-hover/traffic:scale-105"
            >
              <svg
                className="w-1.5 h-1.5 text-[#593b00] opacity-0 group-hover/traffic:opacity-100 transition-opacity"
                viewBox="0 0 6 6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
              >
                <path d="M1 3h4" />
              </svg>
            </span>

            {/* macOS Zoom / Fullscreen (Green) */}
            <span
              style={{
                background: "radial-gradient(circle at 35% 30%, #43ea59, #27c93f 60%, #1aab29 100%)",
                boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.45), 0 1px 2px rgba(0, 0, 0, 0.4)",
              }}
              className="w-3 h-3 rounded-full flex items-center justify-center border border-black/25 transition-transform group-hover/traffic:scale-105"
            >
              <svg
                className="w-1.5 h-1.5 text-[#003808] opacity-0 group-hover/traffic:opacity-100 transition-opacity"
                viewBox="0 0 6 6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
              >
                <path d="M1.2 4.8l3.6-3.6M3 1.2h1.8v1.8M3 4.8H1.2V3" />
              </svg>
            </span>
          </div>
          {caption && (
            <span className="font-medium text-slate-300 truncate text-[11px] sm:text-xs">
              {caption}
            </span>
          )}
        </div>

        {/* Right: Platform tag (if distinct) + Copy Button */}
        <div className="flex items-center gap-2 shrink-0">
          {platform && !isDuplicatePlatform && (
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-primary-subtle text-primary border border-primary/20">
              {platform}
            </span>
          )}
          <button
            type="button"
            onClick={handleCopy}
            title="Copy command to clipboard"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-700/80 bg-slate-800/70 hover:bg-slate-700 hover:border-slate-600 text-slate-300 hover:text-white transition cursor-pointer text-xs font-sans font-medium"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-[11px] font-mono text-emerald-400 font-medium">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-300 shrink-0" />
                <span className="text-[11px] font-mono text-slate-300">Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Content Container: Guaranteed overflow-x-auto, min-w-0 */}
      <div className="p-4 overflow-x-auto min-w-0 w-full scrollbar-thin">
        {isMultiLine ? (
          <pre className="font-mono text-xs sm:text-sm text-slate-200 leading-relaxed">
            <code>{code}</code>
          </pre>
        ) : (
          <pre className="font-mono text-xs sm:text-sm text-slate-200 leading-relaxed flex items-center">
            {showPrompt && isShell && (
              <span className="text-primary font-bold mr-2 select-none shrink-0 font-mono">
                {isPowerShell ? "PS >" : "$"}
              </span>
            )}
            <code className="whitespace-pre">{code}</code>
          </pre>
        )}
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
    <div className="max-w-6xl mx-auto space-y-8 pb-20 text-slate-300">
      {/* Top Banner / Hero (Website Themed with Minimal Primary Glow) */}
      <div className="relative p-6 sm:p-8 rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/90 via-[#13151b] to-slate-950 space-y-6 shadow-xl overflow-hidden">
        {/* Subtle ambient primary light */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-72 h-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-subtle border border-primary/25 text-primary text-xs font-semibold">
              <Terminal className="w-3.5 h-3.5 text-primary" />
              <span>DevLoom Documentation & Reference</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
              DevLoom Documentation
            </h1>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
              Complete guide for the DevLoom Web Workspace and Command-Line Interface. Cross-platform support for <strong className="text-white">macOS</strong>, <strong className="text-white">Linux</strong>, and <strong className="text-white">Windows</strong> with zero-configuration Git context.
            </p>
          </div>

          {/* Quick Action Navigation CTAs */}
          <div className="relative z-10 flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
            <a
              href="#cli"
              className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-sm shadow-primary/25 cursor-pointer"
            >
              <Terminal className="w-4 h-4 text-white" />
              <span>CLI Setup Guide</span>
            </a>
            <a
              href="#web"
              className="px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-xs font-medium transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <LayoutDashboard className="w-4 h-4 text-primary" />
              <span>Web Workspace Guide</span>
            </a>
          </div>
        </div>

        {/* Global Platform Selector + Search + Navigation Tabs */}
        <div className="relative z-10 pt-6 border-t border-slate-800/80 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documentation, commands, flags..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-800 bg-slate-950/90 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary transition"
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

            {/* Platform Selector (macOS / Linux / Windows) */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium hidden sm:inline">Platform:</span>
              <div className="inline-flex rounded-xl border border-slate-800 bg-slate-950/80 p-1 gap-1">
                <button
                  type="button"
                  onClick={() => setPlatform("mac")}
                  className={clsx(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer",
                    platform === "mac"
                      ? "bg-primary-subtle text-primary border border-primary/30 font-semibold shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
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
                      ? "bg-primary-subtle text-primary border border-primary/30 font-semibold shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
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
                      ? "bg-primary-subtle text-primary border border-primary/30 font-semibold shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
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
                    ? "bg-primary-subtle text-primary border border-primary/30 font-semibold shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
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
        <div className="p-6 sm:p-7 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-4">
          <div className="flex items-center gap-2 text-white">
            <Zap className="w-5 h-5 text-primary" />
            <h2 className="text-base font-bold text-white">How DevLoom Works</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            DevLoom synchronizes your command line and browser into a unified engineering workspace. When you log tasks, track defects, or record gotchas, items synchronize instantly to PostgreSQL with multi-tenant row-level isolation.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-5 rounded-xl border border-slate-800/90 bg-slate-950/60 space-y-2">
              <div className="flex items-center gap-2 text-primary text-xs font-bold">
                <Terminal className="w-4 h-4 text-primary" />
                <span>1. Terminal CLI (Cross-Platform)</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Log tasks, bugs, and gotchas right from your shell. Auto-detects local Git repos on macOS, Linux, and Windows.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-800/90 bg-slate-950/60 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>2. Multi-Tenant Cloud</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Secured by PostgreSQL Row-Level Security (RLS) and encrypted Personal Access Tokens (PATs).
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-800/90 bg-slate-950/60 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                <LayoutDashboard className="w-4 h-4 text-amber-400" />
                <span>3. Web Workspace</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                52-week activity heatmap, Kanban & Gantt dual views, AI fix prompts, and Obsidian Markdown vault export.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION: TERMINAL CLI GUIDE */}
      {(activeTab === "all" || activeTab === "cli" || activeTab === "git" || activeTab === "gotchas") && (
        <section id="cli" className="space-y-6 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary-subtle border border-primary/20 text-primary">
                <Terminal className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">DevLoom Terminal CLI Guide</h2>
                <p className="text-xs text-slate-400">The developer-first command-line suite for macOS, Linux, and Windows</p>
              </div>
            </div>
            <span className="text-xs font-mono text-primary bg-primary-subtle border border-primary/20 px-2.5 py-1 rounded-md font-semibold">
              v1.0.0
            </span>
          </div>

          {/* 1. Platform-Specific Installation */}
          {(activeTab === "all" || activeTab === "cli") && matchesSearch("install installer curl bash setup path windows mac linux powershell") && (
            <div className="p-6 sm:p-7 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5 text-white font-bold text-sm">
                  <span className="w-6 h-6 rounded-full bg-primary-subtle text-primary border border-primary/30 flex items-center justify-center text-xs font-bold">1</span>
                  <span>1-Line Installation ({platform === "mac" ? "macOS" : platform === "linux" ? "Linux" : "Windows"})</span>
                </div>
                <div className="inline-flex rounded-lg border border-slate-800 bg-slate-950 p-0.5">
                  {(["mac", "linux", "windows"] as Platform[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPlatform(p)}
                      className={clsx(
                        "px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer capitalize",
                        platform === p ? "bg-primary-subtle text-primary font-semibold border border-primary/25" : "text-slate-400 hover:text-white"
                      )}
                    >
                      {p === "mac" ? "macOS" : p}
                    </button>
                  ))}
                </div>
              </div>

              {platform === "mac" && (
                <div className="space-y-3">
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Open your terminal and run the 1-line curl script. It downloads the binary to <code className="text-primary font-mono text-xs bg-primary-subtle px-1.5 py-0.5 rounded border border-primary/20">~/.devloom/bin</code> and adds it to your <code className="text-primary font-mono text-xs bg-primary-subtle px-1.5 py-0.5 rounded border border-primary/20">~/.zshrc</code>:
                  </p>
                  <CodeBlock
                    code="curl -fsSL https://dev-loom.vercel.app/install.sh | bash"
                    caption="macOS (zsh / bash)"
                    platform="macOS"
                  />
                  <div className="text-xs text-slate-400 space-y-1.5 pt-1">
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Reload shell after install: <code className="text-slate-200 font-mono">source ~/.zshrc</code></span>
                    </p>
                  </div>
                </div>
              )}

              {platform === "linux" && (
                <div className="space-y-3">
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Works on Ubuntu, Debian, Fedora, Arch, and all major Linux distributions:
                  </p>
                  <CodeBlock
                    code="curl -fsSL https://dev-loom.vercel.app/install.sh | bash"
                    caption="Linux Terminal (bash / zsh)"
                    platform="Linux"
                  />
                  <div className="text-xs text-slate-400 space-y-1.5 pt-1">
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Reload shell after install: <code className="text-slate-200 font-mono">source ~/.bashrc</code> (or <code className="text-slate-200 font-mono">source ~/.zshrc</code>)</span>
                    </p>
                  </div>
                </div>
              )}

              {platform === "windows" && (
                <div className="space-y-3">
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Open <strong>PowerShell</strong> or <strong>Windows Terminal</strong> and run:
                  </p>
                  <CodeBlock
                    code="irm https://dev-loom.vercel.app/install.ps1 | iex"
                    caption="Windows PowerShell / Terminal"
                    platform="Windows"
                  />
                  <div className="text-xs text-slate-400 space-y-1.5 pt-1">
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Creates <code className="text-primary font-mono">devloom.cmd</code> and <code className="text-primary font-mono">devloom.ps1</code> in <code className="text-primary font-mono">%USERPROFILE%\.devloom\bin</code>.</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Automatically adds the folder to your User <code className="text-slate-200 font-mono">Path</code>. Works seamlessly in PowerShell, Command Prompt (CMD), and Git Bash.</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. Authentication & Login */}
          {(activeTab === "all" || activeTab === "cli") && matchesSearch("auth login token personal access pat whoami") && (
            <div className="p-6 sm:p-7 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-5">
              <div className="flex items-center gap-2.5 text-white font-bold text-sm">
                <span className="w-6 h-6 rounded-full bg-primary-subtle text-primary border border-primary/30 flex items-center justify-center text-xs font-bold">2</span>
                <span>Authenticate with Personal Access Token (PAT)</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                DevLoom authenticates terminal requests securely using Personal Access Tokens. Follow these 3 steps:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 space-y-1.5">
                  <span className="font-bold text-white block">Step A: Open Settings</span>
                  <p className="text-slate-400 leading-relaxed">
                    Navigate to <Link href="/settings" className="text-primary hover:underline">Settings</Link> in the DevLoom sidebar.
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 space-y-1.5">
                  <span className="font-bold text-white block">Step B: Generate Token</span>
                  <p className="text-slate-400 leading-relaxed">
                    Under <strong>Personal Access Tokens</strong>, click "Generate Token" and copy the token starting with <code className="text-primary font-mono text-[11px]">devloom_pat_</code>.
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 space-y-1.5">
                  <span className="font-bold text-white block">Step C: Run devloom login</span>
                  <p className="text-slate-400 leading-relaxed">
                    Run <code className="text-primary font-mono text-[11px]">devloom login</code> in your shell and paste your token.
                  </p>
                </div>
              </div>

              <CodeBlock
                code={`$ devloom login
DevLoom Host [https://dev-loom.vercel.app]: <press enter for default>
Personal Access Token (devloom_pat_...): devloom_pat_9f81a7b...
Authenticated as developer (dev@example.com)`}
                caption="Interactive Login"
              />

              <p className="text-xs text-slate-400">
                Verify your connection and active credentials at any time:
              </p>
              <CodeBlock code="devloom whoami" caption="Verify Active Credentials" />
            </div>
          )}

          {/* 3. Automatic Git Context & Auto-Provisioning */}
          {(activeTab === "all" || activeTab === "git" || activeTab === "cli") && matchesSearch("git repository repo auto-provision zero-setup branch remote") && (
            <div id="git-auto-provision" className="p-6 sm:p-7 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 text-white font-bold text-sm">
                  <GitBranch className="w-5 h-5 text-purple-400" />
                  <span>Automatic Git Context & Project Auto-Provisioning</span>
                </div>
                <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-purple-500/10 text-purple-400 border border-purple-500/25 font-semibold">
                  Zero Setup
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                When you run any <code className="text-primary font-mono text-xs bg-primary-subtle px-1.5 py-0.5 rounded border border-primary/20">devloom</code> command inside any Git repository on macOS, Linux, or Windows:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs text-slate-300">
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 space-y-1.5">
                  <span className="font-bold text-white block">1. Auto-Detects Git Remote</span>
                  <p className="text-slate-400 leading-relaxed">
                    Inspects your repository's <code className="text-primary font-mono">git remote get-url origin</code> across all operating systems.
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 space-y-1.5">
                  <span className="font-bold text-white block">2. Finds or Auto-Provisions</span>
                  <p className="text-slate-400 leading-relaxed">
                    If the project exists in your DevLoom account, it links immediately. If not, DevLoom automatically creates the project on the fly.
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 space-y-1.5">
                  <span className="font-bold text-white block">3. Zero Context Switching</span>
                  <p className="text-slate-400 leading-relaxed">
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

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                <span className="font-bold text-white">Manual Override:</span>
                <span>Override the project at any time using <code className="text-primary font-mono">-P &lt;slug&gt;</code> or <code className="text-primary font-mono">--project &lt;slug&gt;</code>.</span>
              </div>
            </div>
          )}

          {/* 4. Complete Command Reference */}
          {matchesSearch("commands task bug gotcha learning capture standup list status") && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-white">
                <Command className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold text-white">CLI Command Reference & Examples</h3>
              </div>

              {/* Task Command */}
              {matchesSearch("task priority tags desc") && (
                <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-white font-bold text-sm">
                      <CheckSquare className="w-4 h-4 text-primary" />
                      <code className="text-primary font-mono text-xs sm:text-sm bg-primary-subtle px-2 py-0.5 rounded border border-primary/25">
                        devloom task &quot;&lt;title&gt;&quot; [options]
                      </code>
                    </div>
                    <span className="text-xs text-slate-400">Log engineering to-do</span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    Creates an actionable task in your workspace. Priority defaults to <code className="text-primary font-mono text-xs">medium</code>.
                  </p>

                  <div className="overflow-x-auto rounded-xl border border-slate-800">
                    <table className="w-full text-left text-xs font-mono text-slate-300 border-collapse bg-slate-950">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400">
                          <th className="py-2.5 px-3 font-semibold">Flag</th>
                          <th className="py-2.5 px-3 font-semibold">Description</th>
                          <th className="py-2.5 px-3 font-semibold">Example Values</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        <tr>
                          <td className="py-2 px-3 text-primary font-bold">-d, --desc</td>
                          <td className="py-2 px-3 text-slate-300">Detailed task description</td>
                          <td className="py-2 px-3 text-slate-400">&quot;Update Auth.js edge middleware&quot;</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 text-primary font-bold">-p, --priority</td>
                          <td className="py-2 px-3 text-slate-300">Task priority level</td>
                          <td className="py-2 px-3 text-slate-400">low, medium, high, urgent</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 text-primary font-bold">-P, --project</td>
                          <td className="py-2 px-3 text-slate-300">Project slug (overrides git detection)</td>
                          <td className="py-2 px-3 text-slate-400">devloom, auth-api</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 text-primary font-bold">-t, --tags</td>
                          <td className="py-2 px-3 text-slate-300">Comma-separated tags</td>
                          <td className="py-2 px-3 text-slate-400">auth,security,nextjs</td>
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
                <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-white font-bold text-sm">
                      <Bug className="w-4 h-4 text-amber-400" />
                      <code className="text-amber-400 font-mono text-xs sm:text-sm bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/25">
                        devloom bug &quot;&lt;title&gt;&quot; [options]
                      </code>
                    </div>
                    <span className="text-xs text-slate-400">Record a software defect</span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    Logs a software defect with severity level, reproduction steps, and error logs.
                  </p>

                  <div className="overflow-x-auto rounded-xl border border-slate-800">
                    <table className="w-full text-left text-xs font-mono text-slate-300 border-collapse bg-slate-950">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400">
                          <th className="py-2.5 px-3 font-semibold">Flag</th>
                          <th className="py-2.5 px-3 font-semibold">Description</th>
                          <th className="py-2.5 px-3 font-semibold">Example Values</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        <tr>
                          <td className="py-2 px-3 text-amber-400 font-bold">-s, --severity</td>
                          <td className="py-2 px-3 text-slate-300">Bug severity</td>
                          <td className="py-2 px-3 text-slate-400">low, medium, high, critical</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 text-amber-400 font-bold">-r, --repro</td>
                          <td className="py-2 px-3 text-slate-300">Reproduction steps or error trace</td>
                          <td className="py-2 px-3 text-slate-400">&quot;Run k6 load test with 500 VUs&quot;</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 text-amber-400 font-bold">-P, --project</td>
                          <td className="py-2 px-3 text-slate-300">Project slug</td>
                          <td className="py-2 px-3 text-slate-400">billing-service</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 text-amber-400 font-bold">-t, --tags</td>
                          <td className="py-2 px-3 text-slate-300">Comma-separated tags</td>
                          <td className="py-2 px-3 text-slate-400">db,postgres,leak</td>
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
                <div id="gotchas" className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-white font-bold text-sm">
                      <Code2 className="w-4 h-4 text-emerald-400" />
                      <code className="text-emerald-400 font-mono text-xs sm:text-sm bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/25">
                        devloom gotcha &quot;&lt;title&gt;&quot; -s &quot;&lt;fix&gt;&quot; [options]
                      </code>
                    </div>
                    <span className="text-xs text-slate-400">Save technical lesson</span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    Never forget a hard-earned technical discovery. Captures tricky bugs, library quirks, and architecture rules into your Spaced Repetition knowledge base.
                  </p>

                  <div className="overflow-x-auto rounded-xl border border-slate-800">
                    <table className="w-full text-left text-xs font-mono text-slate-300 border-collapse bg-slate-950">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400">
                          <th className="py-2.5 px-3 font-semibold">Flag</th>
                          <th className="py-2.5 px-3 font-semibold">Description</th>
                          <th className="py-2.5 px-3 font-semibold">Requirement</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        <tr>
                          <td className="py-2 px-3 text-emerald-400 font-bold">-s, --summary</td>
                          <td className="py-2 px-3 text-slate-300">The crucial takeaway, workaround, or solution</td>
                          <td className="py-2 px-3 text-emerald-300 font-semibold">Required</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 text-emerald-400 font-bold">-t, --tags</td>
                          <td className="py-2 px-3 text-slate-300">Comma-separated tags for categorization</td>
                          <td className="py-2 px-3 text-slate-400">Optional</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 text-emerald-400 font-bold">-P, --project</td>
                          <td className="py-2 px-3 text-slate-300">Project slug</td>
                          <td className="py-2 px-3 text-slate-400">Optional</td>
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
                  <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-3">
                    <div className="flex items-center gap-2 text-white font-bold text-sm">
                      <AIIcon className="w-4 h-4 text-primary" />
                      <code className="text-primary font-mono text-xs bg-primary-subtle px-2 py-0.5 rounded border border-primary/25">
                        devloom capture &quot;&lt;text&gt;&quot;
                      </code>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Paste unstructured terminal output, error logs, or quick thoughts. AI parses it into a task, bug, or gotcha automatically!
                    </p>
                    <CodeBlock
                      code={`devloom capture "Remember to test edge middleware when deploying to Vercel"`}
                      caption="AI Smart Capture"
                    />
                  </div>

                  <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-3">
                    <div className="flex items-center gap-2 text-white font-bold text-sm">
                      <Flame className="w-4 h-4 text-amber-400" />
                      <code className="text-amber-400 font-mono text-xs bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/25">
                        devloom standup
                      </code>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
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
                <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white font-bold text-sm">
                      <Layers className="w-4 h-4 text-primary" />
                      <code className="text-primary font-mono text-xs sm:text-sm bg-primary-subtle px-2 py-0.5 rounded border border-primary/25">
                        devloom list [tasks|bugs|learnings]
                      </code>
                    </div>
                    <span className="text-xs text-slate-400">Terminal inspection</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
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
            <div id="shortcuts" className="p-6 sm:p-7 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>2-Letter Shell Shortcuts ({platform === "mac" ? "macOS" : platform === "linux" ? "Linux" : "Windows"})</span>
                </div>
                <span className="text-xs text-primary font-mono bg-primary-subtle border border-primary/20 px-2 py-0.5 rounded">
                  Instant Capture
                </span>
              </div>

              {platform === "windows" ? (
                <div className="space-y-3">
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    In Windows PowerShell, add this line to your PowerShell profile (<code className="text-primary font-mono text-xs">notepad $PROFILE</code>):
                  </p>
                  <CodeBlock
                    code='. "$HOME\.devloom\devloom.ps1"'
                    caption="Windows PowerShell ($PROFILE)"
                    platform="Windows"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    Add this to your <code className="text-primary font-mono text-xs bg-primary-subtle px-1.5 py-0.5 rounded border border-primary/20">~/.zshrc</code> or <code className="text-primary font-mono text-xs bg-primary-subtle px-1.5 py-0.5 rounded border border-primary/20">~/.bashrc</code>:
                  </p>
                  <CodeBlock
                    code="source ~/.devloom/devloom.sh"
                    caption="macOS & Linux Shell Profile"
                    platform={platform === "mac" ? "macOS" : "Linux"}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1 text-center text-xs">
                <div className="p-3.5 rounded-xl border border-primary/20 bg-primary-subtle/30 space-y-1">
                  <code className="text-primary font-mono font-bold text-sm">dt</code>
                  <div className="text-slate-400 text-[11px]">devloom task</div>
                </div>
                <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/10 space-y-1">
                  <code className="text-amber-400 font-mono font-bold text-sm">db</code>
                  <div className="text-slate-400 text-[11px]">devloom bug</div>
                </div>
                <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 space-y-1">
                  <code className="text-emerald-400 font-mono font-bold text-sm">dg</code>
                  <div className="text-slate-400 text-[11px]">devloom gotcha</div>
                </div>
                <div className="p-3.5 rounded-xl border border-primary/20 bg-primary-subtle/30 space-y-1">
                  <code className="text-primary font-mono font-bold text-sm">dc</code>
                  <div className="text-slate-400 text-[11px]">devloom capture</div>
                </div>
                <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/10 space-y-1">
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
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary-subtle border border-primary/20 text-primary">
                <LayoutDashboard className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">DevLoom Web Workspace Guide</h2>
                <p className="text-xs text-slate-400">Everything inside your browser dashboard and productivity tools</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Feature 1: 52-Week Recall & Activity Heatmap */}
            {matchesSearch("heatmap recall review activity streaks consistency yearly calendar") && (
              <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5 text-white font-bold text-sm">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <span>52-Week Activity Heatmap & Streaks</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Located right on your <Link href="/dashboard" className="text-primary hover:underline">Dashboard</Link>. Tracks daily engineering reviews, notes, and tasks in a GitHub-style calendar.
                  </p>
                  <div className="text-xs text-slate-400 space-y-1.5 pt-1">
                    <p className="flex items-center gap-2">
                      <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span><strong>Multi-Year History:</strong> Switch between <em>Current Year</em>, <em>Current - 1</em>, and <em>Current - 2</em>.</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span><strong>Consistency Streaks:</strong> Calculates active and all-time record streaks.</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Feature 2: Engineering Knowledge Base */}
            {matchesSearch("knowledge base gotchas patterns snippets markdown export") && (
              <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5 text-white font-bold text-sm">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Code2 className="w-4 h-4" />
                    </div>
                    <span>Engineering Knowledge Base (Gotchas & Snippets)</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Centralized repository for technical gotchas, architectural design patterns, and CLI snippets.
                  </p>
                  <div className="text-xs text-slate-400 space-y-1.5 pt-1">
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Full Markdown solution viewer with 1-click clipboard copy.</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>1-click export to an Obsidian & Markdown knowledge vault.</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Feature 3: Tasks with Kanban & Gantt Critical Path */}
            {matchesSearch("tasks kanban gantt timeline critical path dependencies") && (
              <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5 text-white font-bold text-sm">
                    <div className="p-1.5 rounded-lg bg-primary-subtle text-primary border border-primary/20">
                      <CheckSquare className="w-4 h-4" />
                    </div>
                    <span>Dual Task Views: Kanban & Gantt</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    On the <Link href="/tasks" className="text-primary hover:underline">Tasks page</Link>, toggle between Kanban Board (Todo, In Progress, In Review, Done) and Gantt Critical Path Timeline.
                  </p>
                  <div className="text-xs text-slate-400 space-y-1.5 pt-1">
                    <p className="flex items-center gap-2">
                      <ChevronRight className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span><strong>Timeline Scheduling:</strong> Start dates, deadlines, and dependencies.</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <ChevronRight className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span><strong>Critical Path Highlighting:</strong> Visualizes release-blocking bottlenecks.</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Feature 4: Bug Defect Triage & AI Fix Prompts */}
            {matchesSearch("bug defect stack trace ai fix prompt prompt llm claude cursor antigravity") && (
              <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5 text-white font-bold text-sm">
                    <div className="p-1.5 rounded-lg bg-warning-subtle text-amber-400 border border-warning/20">
                      <Bug className="w-4 h-4" />
                    </div>
                    <span>Bugs & 1-Click AI Fix Prompts</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    In <Link href="/bugs" className="text-amber-400 hover:underline">Bug Triage</Link>, capture error logs, repro steps, and severity levels.
                  </p>
                  <div className="text-xs text-slate-400 space-y-1.5 pt-1">
                    <p className="flex items-center gap-2">
                      <AIIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span><strong>AI Fix Prompt:</strong> Click AI Fix to generate a structured debugging prompt.</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <AIIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Paste into Claude Code, Cursor, ChatGPT, or Antigravity for instant resolutions.</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Feature 5: Obsidian Vault Export */}
            {matchesSearch("obsidian markdown export zip foam logseq vault notes") && (
              <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5 text-white font-bold text-sm">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Download className="w-4 h-4" />
                    </div>
                    <span>Obsidian & Markdown Vault Export</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    You own 100% of your data. In <Link href="/learnings" className="text-emerald-400 hover:underline">Knowledge Base</Link>, click <strong>Export Vault</strong> to download your entire technical library.
                  </p>
                  <div className="text-xs text-slate-400 space-y-1.5 pt-1">
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Exports clean Markdown files formatted with YAML frontmatter tags.</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Compatible with Obsidian, Logseq, Foam, or GitHub repositories.</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Feature 6: Global Command Palette */}
            {matchesSearch("command palette search keyboard shortcuts k") && (
              <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5 text-white font-bold text-sm">
                    <div className="p-1.5 rounded-lg bg-primary-subtle text-primary border border-primary/20">
                      <Command className="w-4 h-4" />
                    </div>
                    <span>Global Command Palette (⌘K)</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[11px] font-mono text-white">⌘K</kbd> (or <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[11px] font-mono text-white">Ctrl+K</kbd>) anywhere to open the instant search modal.
                  </p>
                  <div className="text-xs text-slate-400 space-y-1.5 pt-1">
                    <p className="flex items-center gap-2">
                      <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Fuzzy search across tasks, bugs, gotchas, and projects in milliseconds.</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
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
          <div className="p-6 sm:p-7 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-4">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Cpu className="w-5 h-5 text-primary" />
              <span>CI/CD & Headless Automation ({platform === "windows" ? "Windows / PowerShell" : "macOS / Linux / bash"})</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Run the CLI in automated pipelines (GitHub Actions, Docker, Jenkins) using environment variables without running <code className="text-primary font-mono text-xs bg-primary-subtle px-1.5 py-0.5 rounded border border-primary/20">devloom login</code>:
            </p>

            {platform === "windows" ? (
              <CodeBlock
                code={`# PowerShell / Windows CI pipeline:
$env:DEVLOOM_TOKEN = "devloom_pat_xxxxxxxxxxxxxxxxxxxxxxxx"
$env:DEVLOOM_HOST = "https://dev-loom.vercel.app"

# Run any command headlessly:
devloom task "Verify Windows build #\${env:GITHUB_RUN_ID}" -p high -t deploy,ci`}
                caption="Windows CI/CD Environment"
                platform="Windows"
              />
            ) : (
              <CodeBlock
                code={`# Bash / macOS / Linux CI pipeline:
export DEVLOOM_TOKEN="devloom_pat_xxxxxxxxxxxxxxxxxxxxxxxx"
export DEVLOOM_HOST="https://dev-loom.vercel.app"

# Run any command headlessly:
devloom task "Verify deployment #\${{ github.sha }}" -p high -t deploy,ci`}
                caption="Linux & macOS CI/CD Environment"
                platform="Linux / macOS"
              />
            )}
          </div>
        </section>
      )}

      {/* Footer Support Callout */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <DevLoomLogo className="w-6 h-6 shrink-0" />
          <span>Have questions or need assistance? Check your <Link href="/settings" className="text-primary hover:underline font-semibold">Settings</Link> or inspect the open-source CLI suite.</span>
        </div>
        <a
          href="https://github.com/ratnesh-maurya/devloom"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white transition shrink-0 font-medium"
        >
          <span>GitHub Repository</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
