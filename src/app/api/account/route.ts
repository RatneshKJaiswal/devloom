import { auth, signOut } from "@/lib/auth/config";
import { deleteUserAccount } from "@/lib/dal/account";
import {
  jsonResponse,
  notFoundResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/api-response";

export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const deleted = await deleteUserAccount(session.user.id);
    if (!deleted) return notFoundResponse("User not found");

    return jsonResponse({ message: "Account and all associated data permanently deleted" });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
