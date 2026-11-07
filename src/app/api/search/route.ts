import { getAuthenticatedUser } from "@/lib/auth/api-auth";
import { searchAcrossEntities } from "@/lib/dal/search";
import {
  jsonResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/api-response";

export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 20;

    const results = await searchAcrossEntities(user.id, query, limit);
    return jsonResponse(results);
  } catch (error) {
    return serverErrorResponse(error);
  }
}
