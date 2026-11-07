import { auth } from "@/lib/auth/config";
import { deleteBug, getBugById, updateBug } from "@/lib/dal/bugs";
import { updateBugSchema } from "@/lib/validators";
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
    const bug = await getBugById(session.user.id, id);
    if (!bug) return notFoundResponse("Bug not found");

    return jsonResponse(bug);
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
    const parsed = updateBugSchema.safeParse(body);
    if (!parsed.success) return badRequestResponse(parsed.error);

    const { tagIds, taskId, ...bugData } = parsed.data;
    const updated = await updateBug(session.user.id, id, bugData as any, tagIds, taskId);
    if (!updated) return notFoundResponse("Bug not found");

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
    const deleted = await deleteBug(session.user.id, id);
    if (!deleted) return notFoundResponse("Bug not found");

    return jsonResponse({ message: "Bug deleted successfully" });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
