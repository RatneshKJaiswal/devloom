import { auth } from "@/lib/auth/config";
import { transitionProjectPhase } from "@/lib/dal/organization";
import { transitionProjectPhaseSchema } from "@/lib/validators";
import {
  badRequestResponse,
  jsonResponse,
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
    const parsed = transitionProjectPhaseSchema.safeParse(body);
    if (!parsed.success) return badRequestResponse(parsed.error);

    const result = await transitionProjectPhase(
      session.user.id,
      id,
      parsed.data.phase,
      parsed.data.notes
    );

    return jsonResponse(result);
  } catch (error) {
    return serverErrorResponse(error);
  }
}
