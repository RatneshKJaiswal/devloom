import { getAuthenticatedUser } from "@/lib/auth/api-auth";
import { revokePersonalAccessToken } from "@/lib/dal/tokens";
import {
  jsonResponse,
  notFoundResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/api-response";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const { id } = await params;
    if (!id) return notFoundResponse("Token ID required");

    const success = await revokePersonalAccessToken(user.id, id);
    if (!success) {
      return notFoundResponse("Token not found or already revoked");
    }

    return jsonResponse({ success: true, revokedId: id });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
