import { listTasks } from "@/lib/dal/tasks";
import { listBugs } from "@/lib/dal/bugs";

export interface ChangelogOptions {
  userId: string;
  projectId?: string;
  version?: string;
  sinceDate?: string;
}

export interface ChangelogResult {
  version: string;
  releaseDate: string;
  markdown: string;
  stats: {
    featuresCount: number;
    fixesCount: number;
    maintenanceCount: number;
    totalItems: number;
  };
}

function slugifyScope(text?: string | null): string {
  if (!text) return "core";
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 16);
}

export async function generateChangelog({
  userId,
  projectId,
  version = "1.0.0",
  sinceDate,
}: ChangelogOptions): Promise<ChangelogResult> {
  // Query done tasks and resolved bugs
  const [doneTasks, resolvedBugs] = await Promise.all([
    listTasks(userId, { status: "done", projectId, limit: 100 }),
    listBugs(userId, { status: "resolved", projectId, limit: 100 }),
  ]);

  // Filter by sinceDate if specified
  const sinceTimestamp = sinceDate ? new Date(sinceDate).getTime() : 0;

  const filteredTasks = sinceTimestamp
    ? doneTasks.filter((t) => new Date(t.completedAt || t.updatedAt).getTime() >= sinceTimestamp)
    : doneTasks;

  const filteredBugs = sinceTimestamp
    ? resolvedBugs.filter((b) => new Date(b.updatedAt).getTime() >= sinceTimestamp)
    : resolvedBugs;

  const features: string[] = [];
  const maintenance: string[] = [];
  const fixes: string[] = [];

  for (const t of filteredTasks) {
    const scope = slugifyScope(t.projectName);
    const idBadge = t.taskNumber ? `[TSK-${t.taskNumber}]` : `[${t.id.slice(0, 8)}]`;
    const line = `- feat(${scope}): ${t.title} ${idBadge}`;

    if (t.priority === "urgent" || t.priority === "high" || t.priority === "medium") {
      features.push(line);
    } else {
      maintenance.push(`- chore(${scope}): ${t.title} ${idBadge}`);
    }
  }

  for (const b of filteredBugs) {
    const scope = slugifyScope(b.projectName);
    const idBadge = b.bugNumber ? `[BUG-${b.bugNumber}]` : `[${b.id.slice(0, 8)}]`;
    fixes.push(`- fix(${scope}): ${b.title} ${idBadge}`);
  }

  const todayStr = new Date().toISOString().split("T")[0];
  const lines: string[] = [];

  lines.push(`# Release Notes — v${version} (${todayStr})`);
  lines.push("");

  const totalItems = features.length + fixes.length + maintenance.length;

  if (totalItems === 0) {
    lines.push("No closed tasks or resolved defects found for this release cycle.");
  } else {
    lines.push(
      `This release includes **${features.length}** feature updates, **${fixes.length}** defect fixes, and **${maintenance.length}** maintenance improvements.`
    );
    lines.push("");

    if (features.length > 0) {
      lines.push("### 🚀 Features & Enhancements");
      lines.push(...features);
      lines.push("");
    }

    if (fixes.length > 0) {
      lines.push("### 🐛 Bug Fixes & Stability");
      lines.push(...fixes);
      lines.push("");
    }

    if (maintenance.length > 0) {
      lines.push("### 🔧 Maintenance & Internal");
      lines.push(...maintenance);
      lines.push("");
    }
  }

  return {
    version,
    releaseDate: todayStr,
    markdown: lines.join("\n").trim(),
    stats: {
      featuresCount: features.length,
      fixesCount: fixes.length,
      maintenanceCount: maintenance.length,
      totalItems,
    },
  };
}
