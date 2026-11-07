import { auth } from "@/lib/auth/config";
import { refreshGitHubLink } from "@/lib/dal/links";
import {
  jsonResponse,
  notFoundResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/api-response";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(_req: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const { id } = await params;
    const refreshed = await refreshGitHubLink(session.user.id, id);
    if (!refreshed) return notFoundResponse("GitHub link not found");

    return jsonResponse(refreshed);
  } catch (error) {
    return serverErrorResponse(error);
  }
}
