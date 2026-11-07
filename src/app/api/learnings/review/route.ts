import { auth } from "@/lib/auth/config";
import { getDueLearnings } from "@/lib/dal/learnings";
import {
  jsonResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/api-response";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const { searchParams } = new URL(req.url);
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 20;

    const dueItems = await getDueLearnings(session.user.id, limit);
    return jsonResponse(dueItems);
  } catch (error) {
    return serverErrorResponse(error);
  }
}
