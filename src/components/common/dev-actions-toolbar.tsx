"use client";

import { useState } from "react";
import { GitCommit, Check, Copy } from "lucide-react";
import { AIIcon } from "@/components/icons/ai";

interface DevActionsToolbarProps {
  type: "task" | "bug";
  idDisplay: string;
  title: string;
  description?: string | null;
  stackTrace?: string | null;
  suspectedCause?: string | null;
  reproSteps?: string | null;
  projectName?: string | null;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 36);
}

export function DevActionsToolbar({
  type,
  idDisplay,
  title,
  description,
  stackTrace,
  suspectedCause,
  reproSteps,
  projectName,
}: DevActionsToolbarProps) {
  const [copiedAction, setCopiedAction] = useState<string | null>(null);

  const cleanTitle = title.trim();
  const projectScope = projectName ? slugify(projectName) : "core";

  const commitType = type === "task" ? "feat" : "fix";
  const commitMsg = `${commitType}(${projectScope}): ${cleanTitle} [${idDisplay}]`;

  function copyText(text: string, actionKey: string) {
    navigator.clipboard.writeText(text);
    setCopiedAction(actionKey);
    setTimeout(() => setCopiedAction(null), 2000);
  }

  function handleCopyAiPrompt() {
    const prompt = `# Defect Resolution Request: ${idDisplay} — ${cleanTitle}

## Defect Summary
${description || "No detailed description provided."}

${
  suspectedCause
    ? `## Suspected Cause
${suspectedCause}
`
    : ""
}${
      stackTrace
        ? `## Stack Trace / Error Output
\`\`\`
${stackTrace}
\`\`\`
`
        : ""
    }${
      reproSteps
        ? `## Reproduction Steps
${reproSteps}
`
        : ""
    }
## Engineering Instructions for AI Agent
1. Locate where this failure occurs in the repository.
2. Implement the root-cause fix cleanly without introducing performance or regression issues.
3. Write or update unit tests to verify that this defect is permanently resolved.`;

    copyText(prompt, "ai-prompt");
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px]">
      <span className="text-slate-500 font-medium px-1.5 hidden sm:inline">Actions:</span>

      {/* Conventional Commit */}
      <button
        type="button"
        onClick={() => copyText(commitMsg, "commit")}
        className="px-2 py-1 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
        title={commitMsg}
      >
        {copiedAction === "commit" ? (
          <Check className="w-3.5 h-3.5 text-emerald-400" />
        ) : (
          <GitCommit className="w-3.5 h-3.5 text-amber-400" />
        )}
        <span>{copiedAction === "commit" ? "Copied Commit" : "Commit Msg"}</span>
      </button>

      {/* AI Fix Prompt (for bugs) */}
      {type === "bug" && (
        <button
          type="button"
          onClick={handleCopyAiPrompt}
          className="px-2 py-1 rounded-md bg-purple-950/40 hover:bg-purple-950/70 border border-purple-500/30 text-purple-300 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
          title="Copy formatted prompt for Cursor / Claude Code / Copilot"
        >
          {copiedAction === "ai-prompt" ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <AIIcon className="w-3.5 h-3.5 text-purple-400" />
          )}
          <span>{copiedAction === "ai-prompt" ? "Copied AI Fix Prompt" : "Copy AI Fix Prompt"}</span>
        </button>
      )}
    </div>
  );
}
