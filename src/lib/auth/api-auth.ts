import { auth } from "@/lib/auth/config";
import { verifyPersonalAccessToken } from "@/lib/dal/tokens";

export interface AuthenticatedUser {
  id: string;
  email?: string | null;
  name?: string | null;
  authType: "session" | "pat";
}

/**
 * Resolves the authenticated user for API routes.
 * Supports both standard web sessions (cookies) and Bearer tokens (DevLoom CLI / PAT).
 */
export async function getAuthenticatedUser(req?: Request): Promise<AuthenticatedUser | null> {
  // 1. Check for Authorization: Bearer <token>
  if (req) {
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const rawToken = authHeader.slice(7).trim();
      if (rawToken) {
        const patUser = await verifyPersonalAccessToken(rawToken);
        if (patUser) {
          return {
            id: patUser.id,
            email: patUser.email,
            name: patUser.name,
            authType: "pat",
          };
        }
        // If Bearer token was provided but invalid or expired, reject directly
        return null;
      }
    }
  }

  // 2. Fall back to NextAuth cookie session
  try {
    const session = await auth();
    if (session?.user?.id) {
      return {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        authType: "session",
      };
    }
  } catch (err) {
    console.warn("Session check failed in getAuthenticatedUser:", err);
  }

  return null;
}
