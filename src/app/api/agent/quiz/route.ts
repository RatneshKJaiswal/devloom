import { auth } from "@/lib/auth/config";
import { generateLearningQuiz } from "@/lib/agent/quiz";
import { z } from "zod";
import {
  badRequestResponse,
  jsonResponse,
  notFoundResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/api-response";

const quizRequestSchema = z.object({
  learningId: z.string().uuid("Invalid learning ID"),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const body = await req.json();
    const parsed = quizRequestSchema.safeParse(body);
    if (!parsed.success) return badRequestResponse(parsed.error);

    const result = await generateLearningQuiz({
      userId: session.user.id,
      learningId: parsed.data.learningId,
    });

    if (!result.success && result.error) {
      const { code, message } = result.error;
      if (code === "NOT_FOUND") return notFoundResponse(message);
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
