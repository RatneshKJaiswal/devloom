import { auth } from "@/lib/auth/config";
import { deleteLearning, getLearningById, updateLearning } from "@/lib/dal/learnings";
import { updateLearningSchema } from "@/lib/validators";
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

export async function GET(_req: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const { id } = await params;
    const learning = await getLearningById(session.user.id, id);
    if (!learning) return notFoundResponse("Learning not found");

    return jsonResponse(learning);
  } catch (error) {
    return serverErrorResponse(error);
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const { id } = await params;
    const body = await req.json();
    const parsed = updateLearningSchema.safeParse(body);
    if (!parsed.success) return badRequestResponse(parsed.error);

    const { tagIds, ...learningData } = parsed.data;
    const updated = await updateLearning(session.user.id, id, learningData, tagIds);
    if (!updated) return notFoundResponse("Learning not found");

    return jsonResponse(updated);
  } catch (error) {
    return serverErrorResponse(error);
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const { id } = await params;
    const deleted = await deleteLearning(session.user.id, id);
    if (!deleted) return notFoundResponse("Learning not found");

    return jsonResponse({ message: "Learning deleted successfully" });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
