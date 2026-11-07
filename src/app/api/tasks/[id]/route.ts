import { auth } from "@/lib/auth/config";
import { deleteTask, getTaskById, updateTask } from "@/lib/dal/tasks";
import { updateTaskSchema } from "@/lib/validators";
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
    const task = await getTaskById(session.user.id, id);
    if (!task) return notFoundResponse("Task not found");

    return jsonResponse(task);
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
    const parsed = updateTaskSchema.safeParse(body);
    if (!parsed.success) return badRequestResponse(parsed.error);

    const { tagIds, ...taskData } = parsed.data;
    const updated = await updateTask(session.user.id, id, taskData as any, tagIds);
    if (!updated) return notFoundResponse("Task not found");

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
    const deleted = await deleteTask(session.user.id, id);
    if (!deleted) return notFoundResponse("Task not found");

    return jsonResponse({ message: "Task deleted successfully" });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
