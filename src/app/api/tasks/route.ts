import { auth } from "@/lib/auth/config";
import { createTask, listTasks } from "@/lib/dal/tasks";
import { createTaskSchema } from "@/lib/validators";
import {
  badRequestResponse,
  jsonResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/api-response";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as any;
    const priority = searchParams.get("priority") as any;
    const projectId = searchParams.get("projectId") || undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : undefined;
    const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!, 10) : undefined;

    const data = await listTasks(session.user.id, {
      status,
      priority,
      projectId,
      limit,
      offset,
    });

    return jsonResponse(data);
  } catch (error) {
    return serverErrorResponse(error);
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const body = await req.json();
    const parsed = createTaskSchema.safeParse(body);
    if (!parsed.success) return badRequestResponse(parsed.error);

    const { tagIds, bugIds, ...taskData } = parsed.data;
    const created = await createTask(session.user.id, taskData, tagIds, bugIds);

    return jsonResponse(created, 201);
  } catch (error) {
    return serverErrorResponse(error);
  }
}
