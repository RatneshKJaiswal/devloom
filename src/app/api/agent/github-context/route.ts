import { auth } from "@/lib/auth/config";
import { processGitHubContext } from "@/lib/agent/github-context";
import { z } from "zod";
import {
  badRequestResponse,
  jsonResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/api-response";

const gitHubContextSchema = z.object({
  githubUrl: z.string().url("A valid GitHub URL is required"),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const body = await req.json();
    const parsed = gitHubContextSchema.safeParse(body);
    if (!parsed.success) return badRequestResponse(parsed.error);

    const result = await processGitHubContext({
      userId: session.user.id,
      githubUrl: parsed.data.githubUrl,
    });

    if (!result.success) {
      const { code, message } = result.error;
      if (code === "ALREADY_EXISTS") {
        return jsonResponse({ error: message, code }, 409);
      }
      if (code === "QUOTA_EXCEEDED" || code === "RATE_LIMITED" || code === "GLOBAL_BUDGET_EXCEEDED") {
        return jsonResponse({ error: message, code }, 429);
      }
      if (code === "SERVICE_UNAVAILABLE") {
        return jsonResponse({ error: message, code }, 503);
      }
      return jsonResponse({ error: message, code }, 400);
    }

    return jsonResponse(result, 201);
  } catch (error) {
    return serverErrorResponse(error);
  }
}
