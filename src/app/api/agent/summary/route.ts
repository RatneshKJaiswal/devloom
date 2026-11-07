import { getAuthenticatedUser } from "@/lib/auth/api-auth";
import { generateWorkspaceSummary } from "@/lib/agent/summary";
import { z } from "zod";
import {
  badRequestResponse,
  jsonResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/api-response";

const summaryRequestSchema = z.object({
  mode: z.enum(["daily_plan", "weekly_standup"]),
});

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const body = await req.json();
    const parsed = summaryRequestSchema.safeParse(body);
    if (!parsed.success) return badRequestResponse(parsed.error);

    const result = await generateWorkspaceSummary({
      userId: user.id,
      mode: parsed.data.mode,
    });

    if (!result.success && result.error) {
      const { code, message } = result.error;
      if (code === "QUOTA_EXCEEDED" || code === "GLOBAL_BUDGET_EXCEEDED") {
        return jsonResponse({ error: message, code }, 429);
      }
      return jsonResponse({ error: message, code }, 500);
    }

    return jsonResponse({
      ...result.data,
      isAiFallback: result.isAiFallback || false,
    }, 200);
  } catch (error) {
    return serverErrorResponse(error);
  }
}
