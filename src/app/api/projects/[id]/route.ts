import { auth } from "@/lib/auth/config";
import { deleteProject, getProjectDetails, updateProject } from "@/lib/dal/organization";
import { updateProjectSchema } from "@/lib/validators";
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
    const details = await getProjectDetails(session.user.id, id);
    if (!details) return notFoundResponse("Project not found");

    return jsonResponse(details);
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
    const parsed = updateProjectSchema.safeParse(body);
    if (!parsed.success) return badRequestResponse(parsed.error);

    const updated = await updateProject(session.user.id, id, parsed.data);
    if (!updated) return notFoundResponse("Project not found");

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
    const deleted = await deleteProject(session.user.id, id);
    if (!deleted) return notFoundResponse("Project not found");

    return jsonResponse({ message: "Project deleted successfully" });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
