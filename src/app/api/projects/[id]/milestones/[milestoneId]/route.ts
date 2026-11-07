import { auth } from "@/lib/auth/config";
import { deleteProjectMilestone, updateProjectMilestone } from "@/lib/dal/organization";
import { updateProjectMilestoneSchema } from "@/lib/validators";
import {
  badRequestResponse,
  jsonResponse,
  notFoundResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/api-response";

interface Params {
  params: Promise<{ id: string; milestoneId: string }>;
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const { milestoneId } = await params;
    const body = await req.json();
    const parsed = updateProjectMilestoneSchema.safeParse(body);
    if (!parsed.success) return badRequestResponse(parsed.error);

    const updated = await updateProjectMilestone(session.user.id, milestoneId, parsed.data);
    if (!updated) return notFoundResponse("Milestone not found");

    return jsonResponse(updated);
  } catch (error) {
    return serverErrorResponse(error);
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const { milestoneId } = await params;
    const deleted = await deleteProjectMilestone(session.user.id, milestoneId);
    if (!deleted) return notFoundResponse("Milestone not found");

    return jsonResponse({ message: "Milestone deleted successfully" });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
