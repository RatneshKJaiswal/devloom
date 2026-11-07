"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Copy,
  Check,
  Pencil,
  Zap,
  Layers,
  Terminal,
  Calendar,
  FolderKanban,
  Tag,
} from "lucide-react";
import { MarkdownPreview } from "@/components/ui/markdown-preview";
import {
  inferKnowledgeCategory,
  KNOWLEDGE_CATEGORIES,
  KnowledgeCategory,
} from "@/lib/knowledge";

interface ViewLearningModalProps {
  isOpen: boolean;
  onClose: () => void;
  learning: any | null;
  onEdit?: (learning: any) => void;
}

export function ViewLearningModal({
  isOpen,
  onClose,
  learning,
  onEdit,
}: ViewLearningModalProps) {
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !learning || !mounted) return null;

  const category = inferKnowledgeCategory(learning);
  const catCfg = KNOWLEDGE_CATEGORIES[category] || KNOWLEDGE_CATEGORIES.gotcha;

  function handleCopy() {
    if (!learning?.content) return;
    navigator.clipboard.writeText(learning.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 relative max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          title="Close dialog (Esc)"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header: Category & Metadata */}
        <div className="flex flex-wrap items-center gap-2 pr-10 mb-3">
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-md border flex items-center gap-1.5 leading-none ${catCfg.badgeClass}`}
          >
            {category === "gotcha" && <Zap className="w-3.5 h-3.5 text-amber-400" />}
            {category === "pattern" && <Layers className="w-3.5 h-3.5 text-purple-400" />}
            {category === "snippet" && <Terminal className="w-3.5 h-3.5 text-sky-400" />}
            <span>{catCfg.label}</span>
          </span>

          {learning.projectName && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-primary-subtle text-primary border border-primary/20 flex items-center gap-1.5 leading-none">
              <FolderKanban className="w-3.5 h-3.5" />
              <span>{learning.projectName}</span>
            </span>
          )}

          <span className="text-xs text-slate-500 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>Added {new Date(learning.createdAt).toLocaleDateString()}</span>
          </span>
        </div>

        {/* Note Title */}
        <h2 className="text-xl font-bold text-white tracking-tight leading-snug mb-4">
          {learning.title}
        </h2>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 text-sm text-slate-200 shadow-inner">
            <MarkdownPreview content={learning.content} />
          </div>

          {/* Tags */}
          {learning.tags && learning.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <Tag className="w-3.5 h-3.5 text-slate-500" />
              {learning.tags.map((t: any) => (
                <span
                  key={t.id || t.name}
                  className="text-xs px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700/80 font-mono leading-none"
                >
                  #{t.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800 mt-4 shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium transition cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Note / Snippet</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(learning);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium transition cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
