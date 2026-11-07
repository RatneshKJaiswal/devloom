import { auth } from "@/lib/auth/config";
import { getUserGitHubToken } from "@/lib/security/tokens";
import { fetchUserRepositories } from "@/lib/github/client";
import {
  jsonResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/api-response";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const token = await getUserGitHubToken(session.user.id);
    if (!token) {
      return jsonResponse(
        {
          error: "No GitHub token found. Please sign out and sign back in with GitHub.",
          repos: [],
        },
        400
      );
    }

    const repos = await fetchUserRepositories(token);
    return jsonResponse({ repos });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
