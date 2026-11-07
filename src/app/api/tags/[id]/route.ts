import { auth } from "@/lib/auth/config";
import { deleteTag } from "@/lib/dal/organization";
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
    const deleted = await deleteTag(session.user.id, id);
    if (!deleted) return notFoundResponse("Tag not found");

    return jsonResponse({ message: "Tag deleted successfully" });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
