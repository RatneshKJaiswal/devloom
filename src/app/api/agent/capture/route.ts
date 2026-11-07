import { auth } from "@/lib/auth/config";
import { processSmartCapture } from "@/lib/agent/capture";
import { z } from "zod";
import {
  badRequestResponse,
  jsonResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/api-response";

const captureRequestSchema = z.object({
  rawInput: z.string().min(1, "Input text cannot be empty"),
  autoSave: z.boolean().default(false),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const body = await req.json();
    const parsed = captureRequestSchema.safeParse(body);
    if (!parsed.success) return badRequestResponse(parsed.error);

    const result = await processSmartCapture({
      userId: session.user.id,
      rawInput: parsed.data.rawInput,
      autoSave: parsed.data.autoSave,
    });

    if (!result.success) {
      const { code, message } = result.error;

      if (code === "QUOTA_EXCEEDED" || code === "RATE_LIMITED" || code === "GLOBAL_BUDGET_EXCEEDED") {
        return jsonResponse({ error: message, code }, 429);
      }
      if (code === "INPUT_TOO_LARGE") {
        return jsonResponse({ error: message, code }, 400);
      }
      if (code === "SERVICE_UNAVAILABLE") {
        return jsonResponse({ error: message, code }, 503);
      }

      return jsonResponse({ error: message, code }, 500);
    }

    return jsonResponse(result, 200);
  } catch (error) {
    return serverErrorResponse(error);
  }
}
