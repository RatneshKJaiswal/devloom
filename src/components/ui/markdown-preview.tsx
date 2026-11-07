"use client";

import React, { useMemo } from "react";
import { CheckSquare, Square, ExternalLink } from "lucide-react";

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

export function stripMarkdown(md: string): string {
  if (!md) return "";
  return md
    .replace(/\\n/g, "\n")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/`{3}[\s\S]*?`{3}/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/^[-*+]\s+\[[ xX]\]\s+/gm, "")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/^>\s+/gm, "")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

function renderInlineText(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const tokenRegex = /(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith("`") && token.endsWith("`")) {
      parts.push(
        <code
          key={match.index}
          className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700/60 text-primary-300 text-[11px] font-mono select-all"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(
        <strong key={match.index} className="font-semibold text-slate-100">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("[") && token.includes("](")) {
      const linkMatch = token.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        const [, label, url] = linkMatch;
        parts.push(
          <a
            key={match.index}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-primary hover:underline font-medium inline-flex items-center gap-0.5"
          >
            <span>{label}</span>
            <ExternalLink className="w-3 h-3 inline-block opacity-75" />
          </a>
        );
      } else {
        parts.push(token);
      }
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

export function MarkdownPreview({ content, className = "" }: MarkdownPreviewProps) {
  const elements = useMemo(() => {
    if (!content) return null;

    const raw = content.replace(/\\n/g, "\n").replace(/\r\n/g, "\n");
    const lines = raw.split("\n");
    const nodes: React.ReactNode[] = [];

    let inCodeBlock = false;
    let codeBlockBuffer: string[] = [];
    let codeBlockKey = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (trimmed.startsWith("```")) {
        if (inCodeBlock) {
          nodes.push(
            <pre
              key={`code-${codeBlockKey++}`}
              className="p-3 my-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto whitespace-pre leading-relaxed"
            >
              {codeBlockBuffer.join("\n")}
            </pre>
          );
          codeBlockBuffer = [];
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
        }
        continue;
      }

      if (inCodeBlock) {
        codeBlockBuffer.push(line);
        continue;
      }

      if (!trimmed) {
        nodes.push(<div key={`spacer-${i}`} className="h-1.5" />);
        continue;
      }

      if (trimmed.startsWith("### ")) {
        nodes.push(
          <h4
            key={`h3-${i}`}
            className="text-xs font-semibold text-slate-200 mt-2.5 mb-1 tracking-tight flex items-center gap-1.5 border-b border-slate-800/60 pb-0.5"
          >
            {renderInlineText(trimmed.slice(4))}
          </h4>
        );
        continue;
      }
      if (trimmed.startsWith("## ")) {
        nodes.push(
          <h3
            key={`h2-${i}`}
            className="text-sm font-semibold text-white mt-3 mb-1 tracking-tight border-b border-slate-800 pb-1"
          >
            {renderInlineText(trimmed.slice(3))}
          </h3>
        );
        continue;
      }
      if (trimmed.startsWith("# ")) {
        nodes.push(
          <h2 key={`h1-${i}`} className="text-base font-bold text-white mt-3.5 mb-1.5 tracking-tight">
            {renderInlineText(trimmed.slice(2))}
          </h2>
        );
        continue;
      }

      if (trimmed.startsWith("> ")) {
        nodes.push(
          <blockquote
            key={`quote-${i}`}
            className="border-l-2 border-primary/50 pl-3 my-1.5 text-xs text-slate-400 italic bg-primary/5 py-1 rounded-r"
          >
            {renderInlineText(trimmed.slice(2))}
          </blockquote>
        );
        continue;
      }

      if (trimmed.startsWith("- [ ] ") || trimmed.startsWith("* [ ] ")) {
        nodes.push(
          <div key={`chk-${i}`} className="flex items-start gap-2 my-1 text-xs text-slate-300">
            <Square className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
            <span>{renderInlineText(trimmed.slice(6))}</span>
          </div>
        );
        continue;
      }
      if (
        trimmed.startsWith("- [x] ") ||
        trimmed.startsWith("- [X] ") ||
        trimmed.startsWith("* [x] ") ||
        trimmed.startsWith("* [X] ")
      ) {
        nodes.push(
          <div key={`chk-done-${i}`} className="flex items-start gap-2 my-1 text-xs text-slate-400 line-through">
            <CheckSquare className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
            <span>{renderInlineText(trimmed.slice(6))}</span>
          </div>
        );
        continue;
      }

      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        nodes.push(
          <div key={`li-${i}`} className="flex items-start gap-2 my-1 text-xs text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-primary/70 shrink-0 mt-1.5" />
            <span className="leading-relaxed">{renderInlineText(trimmed.slice(2))}</span>
          </div>
        );
        continue;
      }

      const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
      if (numMatch) {
        nodes.push(
          <div key={`ol-${i}`} className="flex items-start gap-2 my-1 text-xs text-slate-300">
            <span className="text-[10px] font-mono font-semibold text-slate-500 shrink-0 mt-0.5 min-w-[14px]">
              {numMatch[1]}.
            </span>
            <span className="leading-relaxed">{renderInlineText(numMatch[2])}</span>
          </div>
        );
        continue;
      }

      nodes.push(
        <p key={`p-${i}`} className="text-xs text-slate-300 leading-relaxed my-0.5">
          {renderInlineText(line)}
        </p>
      );
    }

    if (inCodeBlock && codeBlockBuffer.length > 0) {
      nodes.push(
        <pre
          key={`code-tail`}
          className="p-3 my-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto whitespace-pre leading-relaxed"
        >
          {codeBlockBuffer.join("\n")}
        </pre>
      );
    }

    return nodes;
  }, [content]);

  return <div className={`space-y-0.5 ${className}`}>{elements}</div>;
}
