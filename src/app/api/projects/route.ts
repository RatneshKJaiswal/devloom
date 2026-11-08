import { getAuthenticatedUser } from "@/lib/auth/api-auth";
import { createProject, listProjects } from "@/lib/dal/organization";
import { createProjectSchema } from "@/lib/validators";
import {
  badRequestResponse,
  jsonResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/api-response";

export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const data = await listProjects(user.id);
    return jsonResponse(data);
  } catch (error) {
    return serverErrorResponse(error);
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const body = await req.json();
    const parsed = createProjectSchema.safeParse(body);
    if (!parsed.success) return badRequestResponse(parsed.error);

    const created = await createProject(user.id, parsed.data);
    return jsonResponse(created, 201);
  } catch (error) {
    return serverErrorResponse(error);
  }
}
