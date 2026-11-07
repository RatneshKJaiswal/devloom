import { auth } from "@/lib/auth/config";
import { createProject, listProjects } from "@/lib/dal/organization";
import { createProjectSchema } from "@/lib/validators";
import {
  badRequestResponse,
  jsonResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/api-response";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const data = await listProjects(session.user.id);
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
    const parsed = createProjectSchema.safeParse(body);
    if (!parsed.success) return badRequestResponse(parsed.error);

    const created = await createProject(session.user.id, parsed.data);
    return jsonResponse(created, 201);
  } catch (error) {
    return serverErrorResponse(error);
  }
}
