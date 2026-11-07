export type KnowledgeCategory = "gotcha" | "pattern" | "snippet";

export interface KnowledgeCategoryConfig {
  id: KnowledgeCategory;
  label: string;
  shortLabel: string;
  badgeClass: string;
  description: string;
}

export const KNOWLEDGE_CATEGORIES: Record<KnowledgeCategory, KnowledgeCategoryConfig> = {
  gotcha: {
    id: "gotcha",
    label: "Technical Gotcha",
    shortLabel: "Gotcha",
    badgeClass: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    description: "Tricky runtime bugs, framework caveats, and edge-case fixes",
  },
  pattern: {
    id: "pattern",
    label: "Design Pattern",
    shortLabel: "Design Pattern",
    badgeClass: "bg-purple-500/15 text-purple-300 border-purple-500/30",
    description: "Architectural structures, clean code idioms, and API design",
  },
  snippet: {
    id: "snippet",
    label: "CLI Snippet",
    shortLabel: "CLI Snippet",
    badgeClass: "bg-sky-500/15 text-sky-300 border-sky-500/30",
    description: "Terminal commands, shell scripts, and devops one-liners",
  },
};

export function inferKnowledgeCategory(item: {
  title?: string;
  content?: string;
  tags?: Array<{ name: string }>;
}): KnowledgeCategory {
  // 1. Check explicit tag names
  const tagNames = (item.tags || []).map((t) => t.name.toLowerCase());
  if (
    tagNames.some((t) =>
      t.includes("snippet") ||
      t.includes("cli") ||
      t.includes("terminal") ||
      t.includes("bash") ||
      t.includes("shell") ||
      t.includes("command")
    )
  ) {
    return "snippet";
  }
  if (
    tagNames.some((t) =>
      t.includes("pattern") ||
      t.includes("architecture") ||
      t.includes("design") ||
      t.includes("solid") ||
      t.includes("principle")
    )
  ) {
    return "pattern";
  }
  if (
    tagNames.some((t) =>
      t.includes("gotcha") ||
      t.includes("bug") ||
      t.includes("troubleshoot") ||
      t.includes("fix") ||
      t.includes("caveat")
    )
  ) {
    return "gotcha";
  }

  // 2. Check title & content heuristics
  const title = (item.title || "").toLowerCase();
  const content = (item.content || "").toLowerCase();
  const text = `${title} ${content}`;

  // CLI Snippets: CLI tools, commands, shell blocks
  if (
    text.includes("```bash") ||
    text.includes("```sh") ||
    text.includes("```zsh") ||
    text.includes("```shell") ||
    title.includes("cli") ||
    title.includes("snippet") ||
    title.includes("command") ||
    /(^|\s)(npm |pnpm |yarn |npx |git |docker |kubectl |cargo |go |brew |curl |chmod |grep |find |awk |sed )/m.test(content)
  ) {
    return "snippet";
  }

  // Design Patterns: Architecture, SOLID, Gang of Four, System Design
  if (
    text.includes("pattern") ||
    text.includes("solid") ||
    text.includes("architecture") ||
    text.includes("singleton") ||
    text.includes("factory") ||
    text.includes("observer") ||
    text.includes("strategy") ||
    text.includes("clean code") ||
    text.includes("dependency injection") ||
    text.includes("inversion of control") ||
    text.includes("principles") ||
    text.includes("repository pattern") ||
    text.includes("cqrs") ||
    text.includes("event-driven")
  ) {
    return "pattern";
  }

  // Default to Technical Gotcha
  return "gotcha";
}
