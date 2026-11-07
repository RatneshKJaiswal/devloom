import { auth } from "@/lib/auth/config";
import { getDashboardAnalytics } from "@/lib/dal/analytics";
import {
  jsonResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/api-response";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorizedResponse();

    const analytics = await getDashboardAnalytics(session.user.id);
    return jsonResponse(analytics);
  } catch (error) {
    console.error("Dashboard Analytics Error:", error);
    return serverErrorResponse(error);
  }
}
