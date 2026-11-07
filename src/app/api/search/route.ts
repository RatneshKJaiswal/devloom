import { auth } from "@/lib/auth/config";
import { searchAcrossEntities } from "@/lib/dal/search";
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
    const query = searchParams.get("q") || "";
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 20;

    const results = await searchAcrossEntities(session.user.id, query, limit);
    return jsonResponse(results);
  } catch (error) {
    return serverErrorResponse(error);
  }
}
