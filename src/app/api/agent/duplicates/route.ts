import { auth } from "@/lib/auth/config";
import { detectDuplicates } from "@/lib/agent/duplicates";
import { z } from "zod";
import {
  badRequestResponse,
  jsonResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/api-response";

const duplicatesCheckSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  type: z.enum(["task", "bug", "learning"]),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const body = await req.json();
    const parsed = duplicatesCheckSchema.safeParse(body);
    if (!parsed.success) return badRequestResponse(parsed.error);

    const result = await detectDuplicates({
      userId: session.user.id,
      item: parsed.data,
    });

    if (!result.success && result.error) {
      const { code, message } = result.error;
      if (code === "QUOTA_EXCEEDED" || code === "GLOBAL_BUDGET_EXCEEDED") {
        return jsonResponse({ error: message, code }, 429);
      }
      return jsonResponse({ error: message, code }, 500);
    }

    return jsonResponse(result.data, 200);
  } catch (error) {
    return serverErrorResponse(error);
  }
}
