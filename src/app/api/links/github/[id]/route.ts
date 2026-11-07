import { auth } from "@/lib/auth/config";
import { deleteGitHubLink } from "@/lib/dal/links";
import {
  jsonResponse,
  notFoundResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/api-response";

interface Params {
  params: Promise<{ id: string }>;
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const { id } = await params;
    const deleted = await deleteGitHubLink(session.user.id, id);
    if (!deleted) return notFoundResponse("GitHub link not found");

    return jsonResponse({ message: "GitHub link unlinked successfully" });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
