import { getAuthenticatedUser } from "@/lib/auth/api-auth";
import { listLearnings } from "@/lib/dal/learnings";
import { inferKnowledgeCategory } from "@/lib/knowledge";
import {
  jsonResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/api-response";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const items = await listLearnings(user.id);

    // Build Obsidian-compatible Markdown vault document
    const sections: string[] = [];

    sections.push("# DevLoom Engineering Knowledge Vault");
    sections.push(`*Exported on ${new Date().toISOString().split("T")[0]} • ${items.length} Entries*\n`);

    for (const item of items) {
      const category = inferKnowledgeCategory(item);
      const tagList = (item.tags || []).map((t: any) => `"${t.name}"`).join(", ");
      const dateStr = item.createdAt ? new Date(item.createdAt).toISOString().split("T")[0] : "";

      const frontmatter = [
        "---",
        `title: "${item.title.replace(/"/g, '\\"')}"`,
        `category: "${category}"`,
        `tags: [${tagList}]`,
        item.projectName ? `project: "${item.projectName}"` : null,
        `created_at: "${dateStr}"`,
        "---",
      ]
        .filter(Boolean)
        .join("\n");

      sections.push(frontmatter);
      sections.push(`\n## ${item.title}\n`);
      sections.push(item.content);
      sections.push("\n---\n");
    }

    const fullContent = sections.join("\n");

    return new NextResponse(fullContent, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="devloom-vault-${new Date().toISOString().split("T")[0]}.md"`,
      },
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
