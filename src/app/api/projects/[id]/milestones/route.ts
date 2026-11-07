import { auth } from "@/lib/auth/config";
import { createProjectMilestone, listProjectMilestones } from "@/lib/dal/organization";
import { createProjectMilestoneSchema } from "@/lib/validators";
import {
  badRequestResponse,
  jsonResponse,
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
    const milestones = await listProjectMilestones(session.user.id, id);
    return jsonResponse(milestones);
  } catch (error) {
    return serverErrorResponse(error);
  }
}

export async function POST(req: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const { id } = await params;
    const body = await req.json();
    const parsed = createProjectMilestoneSchema.safeParse(body);
    if (!parsed.success) return badRequestResponse(parsed.error);

    const created = await createProjectMilestone(session.user.id, {
      projectId: id,
      title: parsed.data.title,
      description: parsed.data.description,
      targetDate: parsed.data.targetDate,
    });

    return jsonResponse(created, 201);
  } catch (error) {
    return serverErrorResponse(error);
  }
}
