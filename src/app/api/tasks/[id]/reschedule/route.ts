import { auth } from "@/lib/auth/config";
import { rescheduleTask } from "@/lib/dal/tasks";
import { rescheduleTaskSchema } from "@/lib/validators";
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

export async function PATCH(req: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const { id } = await params;
    const body = await req.json();
    const parsed = rescheduleTaskSchema.safeParse(body);
    if (!parsed.success) return badRequestResponse(parsed.error);

    const result = await rescheduleTask(session.user.id, id, parsed.data);

    if ("error" in result) {
      if (result.error === "not_found") {
        return notFoundResponse("Task not found");
      }
      if (result.error === "version_conflict") {
        return jsonResponse(
          {
            error: "Version conflict: task was modified by another operation",
            currentVersion: result.currentVersion,
            task: result.task,
          },
          409
        );
      }
      if (result.error === "invalid_dates" || result.error === "predecessor_conflict") {
        return badRequestResponse(result.message);
      }
    }

    return jsonResponse(result.task);
  } catch (error) {
    return serverErrorResponse(error);
  }
}
