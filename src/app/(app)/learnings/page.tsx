"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  BookOpen,
  Trash2,
  Pencil,
  FolderKanban,
  Calendar,
  Search,
  Copy,
  Check,
  Zap,
  Layers,
  Terminal,
  X,
  Loader2,
  Tag,
  ExternalLink,
} from "lucide-react";
import { QuickCaptureModal } from "@/components/quick-capture-dialog";
import { EditLearningModal } from "@/components/edit-learning-modal";
import { ViewLearningModal } from "@/components/learnings/view-learning-modal";
import { stripMarkdown } from "@/components/ui/markdown-preview";
import {
  inferKnowledgeCategory,
  KNOWLEDGE_CATEGORIES,
  KnowledgeCategory,
} from "@/lib/knowledge";

export default function LearningsPage() {
  const [learnings, setLearnings] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingLearning, setEditingLearning] = useState<any | null>(null);
  const [viewingLearning, setViewingLearning] = useState<any | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<KnowledgeCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState<string>("all");

  async function loadData() {
    setLoading(true);
    try {
      const [allRes, projRes] = await Promise.all([
        fetch("/api/learnings"),
        fetch("/api/projects"),
      ]);

      if (allRes.ok) {
        const allData = await allRes.json();
        setLearnings(Array.isArray(allData) ? allData : []);
      }
      if (projRes.ok) {
        const projData = await projRes.json();
        setProjects(Array.isArray(projData) ? projData : []);
      }
    } catch (err) {
      console.error("Failed to load knowledge entries:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function deleteLearning(id: string) {
    if (!confirm("Are you sure you want to delete this knowledge entry?")) return;
    try {
      const res = await fetch(`/api/learnings/${id}`, { method: "DELETE" });
      if (res.ok) {
        setLearnings((prev) => prev.filter((l) => l.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete entry:", err);
    }
  }

  function handleCopyContent(id: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId((curr) => (curr === id ? null : curr));
    }, 2000);
  }

  // Categorize items
  const categorizedLearnings = useMemo(() => {
    return learnings.map((item) => ({
      ...item,
      category: inferKnowledgeCategory(item),
    }));
  }, [learnings]);

  // Counts per category
  const counts = useMemo(() => {
    const map = { all: learnings.length, gotcha: 0, pattern: 0, snippet: 0 };
    for (const item of categorizedLearnings) {
      if (item.category === "gotcha") map.gotcha++;
      else if (item.category === "pattern") map.pattern++;
      else if (item.category === "snippet") map.snippet++;
    }
    return map;
  }, [categorizedLearnings, learnings.length]);

  // Filtered list
  const filteredLearnings = useMemo(() => {
    return categorizedLearnings.filter((item) => {
      // Category filter
      if (selectedCategory !== "all" && item.category !== selectedCategory) {
        return false;
      }

      // Project filter
      if (projectFilter !== "all" && item.projectId !== projectFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = (item.title || "").toLowerCase().includes(q);
        const contentMatch = (item.content || "").toLowerCase().includes(q);
        const tagMatch = (item.tags || []).some((t: any) =>
          (t.name || "").toLowerCase().includes(q)
        );
        const projectMatch = (item.projectName || "").toLowerCase().includes(q);
        if (!titleMatch && !contentMatch && !tagMatch && !projectMatch) {
          return false;
        }
      }

      return true;
    });
  }, [categorizedLearnings, selectedCategory, projectFilter, searchQuery]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-emerald-400" />
            <span>Knowledge Base</span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Engineering repository for technical gotchas, design patterns, and CLI snippets.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-medium flex items-center gap-1.5 shadow-md shadow-primary/20 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Entry</span>
        </button>
      </div>

      {/* Category Pills Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-4">
        <button
          type="button"
          onClick={() => setSelectedCategory("all")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
            selectedCategory === "all"
              ? "bg-slate-800 text-white border border-slate-700 shadow-sm"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
          }`}
        >
          <span>All Entries</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold leading-none min-w-[20px] text-center ${
              selectedCategory === "all"
                ? "bg-primary/20 text-primary"
                : "bg-slate-900 text-slate-400"
            }`}
          >
            {counts.all}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedCategory("gotcha")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
            selectedCategory === "gotcha"
              ? "bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm shadow-amber-500/10"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Technical Gotchas</span>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold leading-none min-w-[20px] text-center bg-amber-500/20 text-amber-300">
            {counts.gotcha}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedCategory("pattern")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
            selectedCategory === "pattern"
              ? "bg-purple-500/15 text-purple-300 border border-purple-500/30 shadow-sm shadow-purple-500/10"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-purple-400" />
          <span>Design Patterns</span>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold leading-none min-w-[20px] text-center bg-purple-500/20 text-purple-300">
            {counts.pattern}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedCategory("snippet")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
            selectedCategory === "snippet"
              ? "bg-sky-500/15 text-sky-300 border border-sky-500/30 shadow-sm shadow-sky-500/10"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
          }`}
        >
          <Terminal className="w-3.5 h-3.5 text-sky-400" />
          <span>CLI Snippets</span>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold leading-none min-w-[20px] text-center bg-sky-500/20 text-sky-300">
            {counts.snippet}
          </span>
        </button>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search gotchas, design patterns, commands, or tags..."
            className="w-full !pl-10 pr-9 py-2.5 rounded-xl border border-slate-800 bg-slate-900/70 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary text-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Project Selector */}
        {projects.length > 0 && (
          <div className="relative min-w-[200px]">
            <FolderKanban className="w-3.5 h-3.5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="w-full !pl-9 pr-8 py-2.5 rounded-xl border border-slate-800 bg-slate-900/70 text-slate-300 focus:outline-none focus:border-primary text-xs cursor-pointer"
            >
              <option value="all">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Content Library */}
      {loading ? (
        <div className="p-20 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-7 h-7 text-primary animate-spin" />
          <p className="text-xs">Loading knowledge entries...</p>
        </div>
      ) : filteredLearnings.length === 0 ? (
        <div className="p-16 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
          <BookOpen className="w-9 h-9 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-white">No knowledge entries found</h3>
          <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto mb-4">
            {searchQuery || selectedCategory !== "all" || projectFilter !== "all"
              ? "No entries match your current search or category filter. Try clearing filters."
              : "Capture technical gotchas, design patterns, and CLI snippets so you and your team never solve the same problem twice."}
          </p>
          {searchQuery || selectedCategory !== "all" || projectFilter !== "all" ? (
            <button
              onClick={() => {
                setSelectedCategory("all");
                setProjectFilter("all");
                setSearchQuery("");
              }}
              className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition cursor-pointer"
            >
              Clear Filters
            </button>
          ) : (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-medium shadow-md shadow-primary/20 transition cursor-pointer"
            >
              Add First Entry
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredLearnings.map((item) => {
            const catCfg = KNOWLEDGE_CATEGORIES[item.category as KnowledgeCategory] || KNOWLEDGE_CATEGORIES.gotcha;
            const isCopied = copiedId === item.id;

            return (
              <div
                key={item.id}
                className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 hover:border-slate-700/80 transition flex flex-col justify-between gap-4 relative group"
              >
                <div className="space-y-3">
                  {/* Top Header: Category Badge + Project + Actions */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* Category Badge */}
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-md border flex items-center gap-1.5 leading-none ${catCfg.badgeClass}`}
                      >
                        {item.category === "gotcha" && <Zap className="w-3 h-3 text-amber-400" />}
                        {item.category === "pattern" && <Layers className="w-3 h-3 text-purple-400" />}
                        {item.category === "snippet" && <Terminal className="w-3 h-3 text-sky-400" />}
                        <span>{catCfg.label}</span>
                      </span>

                      {/* Project Badge */}
                      {item.projectName && (
                        <span
                          onClick={() => setProjectFilter(item.projectId)}
                          className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-primary-subtle text-primary border border-primary/20 cursor-pointer hover:bg-primary/20 transition leading-none"
                          title="Filter by this project"
                        >
                          {item.projectName}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Copy snippet button */}
                      <button
                        type="button"
                        onClick={() => handleCopyContent(item.id, item.content)}
                        title="Copy content / snippet"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                      >
                        {isCopied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => setEditingLearning(item)}
                        title="Edit knowledge entry"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => deleteLearning(item.id)}
                        title="Delete entry"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <h3
                    onClick={() => setViewingLearning(item)}
                    className="text-base font-semibold text-white hover:text-primary transition cursor-pointer leading-snug"
                    title="Click to view full note"
                  >
                    {item.title}
                  </h3>

                  {/* Content Preview */}
                  <div>
                    <div
                      onClick={() => setViewingLearning(item)}
                      className="text-xs text-slate-300 leading-relaxed font-normal line-clamp-3 cursor-pointer hover:text-slate-100 transition"
                      title="Click to view full note"
                    >
                      {stripMarkdown(item.content)}
                    </div>

                    {(item.content.length > 80 ||
                      item.content.includes("\n") ||
                      item.content.includes("```")) && (
                      <button
                        type="button"
                        onClick={() => setViewingLearning(item)}
                        className="mt-2 text-[11px] font-medium text-primary hover:underline transition inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>Read more</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Footer: Date + Tags */}
                <div className="text-[11px] text-slate-400 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-center gap-1 text-slate-500">
                    <Calendar className="w-3 h-3" />
                    <span>Added {new Date(item.createdAt).toLocaleDateString()}</span>
                  </span>

                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {item.tags.map((t: any) => (
                        <span
                          key={t.id || t.name}
                          className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/60 font-mono leading-none"
                        >
                          #{t.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View Learning Popup Modal */}
      <ViewLearningModal
        isOpen={!!viewingLearning}
        onClose={() => setViewingLearning(null)}
        learning={viewingLearning}
        onEdit={(item) => setEditingLearning(item)}
      />

      {/* Create Learning Dialog */}
      <QuickCaptureModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={loadData}
        defaultTab="learning"
        lockTab={true}
      />

      {/* Edit Learning Dialog */}
      <EditLearningModal
        isOpen={!!editingLearning}
        onClose={() => setEditingLearning(null)}
        learning={editingLearning}
        projects={projects}
        onSuccess={loadData}
      />
    </div>
  );
}
