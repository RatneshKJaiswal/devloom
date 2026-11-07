import { auth } from "@/lib/auth/config";
import { linkItemToGitHub, listGitHubLinks } from "@/lib/dal/links";
import { z } from "zod";
import {
  badRequestResponse,
  jsonResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/api-response";

const linkRequestSchema = z.object({
  entityType: z.enum(["task", "bug", "learning"]),
  entityId: z.string().uuid("Invalid entity ID format"),
  url: z.string().url("Must be a valid URL"),
});

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get("entityType") as any;
    const entityId = searchParams.get("entityId") || undefined;

    const links = await listGitHubLinks(session.user.id, entityType, entityId);
    return jsonResponse(links);
  } catch (error) {
    return serverErrorResponse(error);
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const body = await req.json();
    const parsed = linkRequestSchema.safeParse(body);
    if (!parsed.success) return badRequestResponse(parsed.error);

    const created = await linkItemToGitHub(session.user.id, parsed.data);
    return jsonResponse(created, 201);
  } catch (error: any) {
    if (error.message?.includes("Invalid GitHub URL")) {
      return badRequestResponse(error.message);
    }
    return serverErrorResponse(error);
  }
}
