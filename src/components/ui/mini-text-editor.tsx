"use client";

import React, { useState, useRef } from "react";
import {
  Bold,
  Italic,
  Code,
  Heading,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Link as LinkIcon,
  Eye,
  Edit3,
} from "lucide-react";
import { MarkdownPreview } from "./markdown-preview";

interface MiniTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  required?: boolean;
}

export function MiniTextEditor({
  value,
  onChange,
  placeholder = "Write your notes using markdown...",
  minHeight = "min-h-[140px]",
  required = false,
}: MiniTextEditorProps) {
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function insertFormatting(prefix: string, suffix = "", defaultText = "") {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const currentVal = el.value;

    const selectedText = currentVal.substring(start, end) || defaultText;
    const replacement = `${prefix}${selectedText}${suffix}`;

    const newVal =
      currentVal.substring(0, start) + replacement + currentVal.substring(end);
    onChange(newVal);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selectedText.length
      );
    }, 0);
  }

  function insertLinePrefix(linePrefix: string) {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const currentVal = el.value;

    // Find the beginning of current line
    const lastNewline = currentVal.lastIndexOf("\n", start - 1);
    const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;

    const newVal =
      currentVal.substring(0, lineStart) +
      linePrefix +
      currentVal.substring(lineStart);
    onChange(newVal);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + linePrefix.length, start + linePrefix.length);
    }, 0);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
      e.preventDefault();
      insertFormatting("**", "**", "bold text");
    } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "i") {
      e.preventDefault();
      insertFormatting("*", "*", "italic text");
    } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      insertFormatting("[", "](https://)", "link text");
    }
  }

  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const charCount = value.length;

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-950 overflow-hidden focus-within:border-primary transition shadow-inner">
      {/* Editor Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-2.5 py-1.5 border-b border-slate-800 bg-slate-900/70 text-slate-300 gap-1 select-none">
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            title="Bold (Cmd+B)"
            onClick={() => insertFormatting("**", "**", "bold text")}
            className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition cursor-pointer"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Italic (Cmd+I)"
            onClick={() => insertFormatting("*", "*", "italic text")}
            className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition cursor-pointer"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Heading"
            onClick={() => insertLinePrefix("### ")}
            className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition cursor-pointer"
          >
            <Heading className="w-3.5 h-3.5" />
          </button>
          <div className="h-4 w-px bg-slate-800 mx-1" />
          <button
            type="button"
            title="Inline Code"
            onClick={() => insertFormatting("`", "`", "code")}
            className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition cursor-pointer"
          >
            <Code className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Code Block"
            onClick={() => insertFormatting("```\n", "\n```", "code here")}
            className="px-2 py-1 rounded-lg text-[11px] font-mono hover:bg-slate-800 hover:text-white transition cursor-pointer"
          >
            {"{ }"}
          </button>
          <div className="h-4 w-px bg-slate-800 mx-1" />
          <button
            type="button"
            title="Bullet List"
            onClick={() => insertLinePrefix("- ")}
            className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition cursor-pointer"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Numbered List"
            onClick={() => insertLinePrefix("1. ")}
            className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition cursor-pointer"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Checklist"
            onClick={() => insertLinePrefix("- [ ] ")}
            className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition cursor-pointer"
          >
            <CheckSquare className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Blockquote"
            onClick={() => insertLinePrefix("> ")}
            className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition cursor-pointer"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Link (Cmd+K)"
            onClick={() => insertFormatting("[", "](https://)", "link text")}
            className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition cursor-pointer"
          >
            <LinkIcon className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Write / Preview Tab Switcher */}
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px]">
          <button
            type="button"
            onClick={() => setActiveTab("write")}
            className={`px-2 py-1 rounded-md font-medium flex items-center gap-1 transition cursor-pointer ${
              activeTab === "write"
                ? "bg-slate-800 text-white shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Edit3 className="w-3 h-3" />
            <span>Write</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            className={`px-2 py-1 rounded-md font-medium flex items-center gap-1 transition cursor-pointer ${
              activeTab === "preview"
                ? "bg-slate-800 text-white shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Eye className="w-3 h-3" />
            <span>Preview</span>
          </button>
        </div>
      </div>

      {/* Editor Body */}
      {activeTab === "write" ? (
        <textarea
          ref={textareaRef}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full px-4 py-3 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none resize-y leading-relaxed font-sans ${minHeight}`}
        />
      ) : (
        <div className={`p-4 bg-slate-950/40 text-xs overflow-y-auto ${minHeight}`}>
          {value.trim() ? (
            <MarkdownPreview content={value} />
          ) : (
            <p className="text-slate-500 italic">Nothing to preview yet. Switch to Write to begin typing.</p>
          )}
        </div>
      )}

      {/* Footer Info */}
      <div className="px-3 py-1.5 bg-slate-900/50 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
        <span>Markdown supported</span>
        <div className="flex items-center gap-3 font-mono">
          <span>{wordCount} words</span>
          <span>{charCount} chars</span>
        </div>
      </div>
    </div>
  );
}
