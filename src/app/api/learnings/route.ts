import { getAuthenticatedUser } from "@/lib/auth/api-auth";
import { createLearning, listLearnings } from "@/lib/dal/learnings";
import { createLearningSchema } from "@/lib/validators";
import {
  badRequestResponse,
  jsonResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/api-response";

export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId") || undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : undefined;
    const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!, 10) : undefined;

    const data = await listLearnings(user.id, {
      projectId,
      limit,
      offset,
    });

    return jsonResponse(data);
  } catch (error) {
    return serverErrorResponse(error);
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const body = await req.json();
    const parsed = createLearningSchema.safeParse(body);
    if (!parsed.success) return badRequestResponse(parsed.error);

    const { tagIds, ...learningData } = parsed.data;
    const created = await createLearning(user.id, learningData, tagIds);

    return jsonResponse(created, 201);
  } catch (error) {
    return serverErrorResponse(error);
  }
}
