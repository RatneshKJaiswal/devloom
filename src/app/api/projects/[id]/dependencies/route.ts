import { auth } from "@/lib/auth/config";
import { createTaskDependency, listProjectDependencies } from "@/lib/dal/dependencies";
import { createTaskDependencySchema } from "@/lib/validators";
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
    const dependencies = await listProjectDependencies(session.user.id, id);
    return jsonResponse(dependencies);
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
    const parsed = createTaskDependencySchema.safeParse(body);
    if (!parsed.success) return badRequestResponse(parsed.error);

    try {
      const created = await createTaskDependency(session.user.id, {
        projectId: id,
        predecessorId: parsed.data.predecessorId,
        successorId: parsed.data.successorId,
      });

      return jsonResponse(created, 201);
    } catch (err: any) {
      return badRequestResponse(err.message || "Failed to create dependency");
    }
  } catch (error) {
    return serverErrorResponse(error);
  }
}
