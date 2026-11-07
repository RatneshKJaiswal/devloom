import { getAuthenticatedUser } from "@/lib/auth/api-auth";
import { generateChangelog } from "@/lib/agent/changelog";
import { z } from "zod";
import {
  badRequestResponse,
  jsonResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/api-response";

const changelogSchema = z.object({
  projectId: z.string().uuid().optional().nullable(),
  version: z.string().trim().min(1).max(32).optional(),
  sinceDate: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const body = await req.json().catch(() => ({}));
    const parsed = changelogSchema.safeParse(body);
    if (!parsed.success) return badRequestResponse(parsed.error);

    const { projectId, version, sinceDate } = parsed.data;

    const result = await generateChangelog({
      userId: user.id,
      projectId: projectId || undefined,
      version: version || "1.0.0",
      sinceDate: sinceDate || undefined,
    });

    return jsonResponse(result);
  } catch (error) {
    return serverErrorResponse(error);
  }
}
