import { auth } from "@/lib/auth/config";
import { recordLearningReview } from "@/lib/dal/learnings";
import { reviewLearningSchema } from "@/lib/validators";
import {
  badRequestResponse,
  jsonResponse,
  notFoundResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/api-response";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const { id } = await params;
    const body = await req.json();
    const parsed = reviewLearningSchema.safeParse(body);
    if (!parsed.success) return badRequestResponse(parsed.error);

    const updated = await recordLearningReview(session.user.id, id, parsed.data.passed);
    if (!updated) return notFoundResponse("Learning not found");

    return jsonResponse(updated);
  } catch (error) {
    return serverErrorResponse(error);
  }
}
