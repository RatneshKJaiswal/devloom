import { auth } from "@/lib/auth/config";
import { deleteTaskDependency } from "@/lib/dal/dependencies";
import {
  jsonResponse,
  notFoundResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/api-response";

interface Params {
  params: Promise<{ id: string; dependencyId: string }>;
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const { dependencyId } = await params;
    const deleted = await deleteTaskDependency(session.user.id, dependencyId);
    if (!deleted) return notFoundResponse("Dependency not found");

    return jsonResponse({ message: "Dependency deleted successfully" });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
