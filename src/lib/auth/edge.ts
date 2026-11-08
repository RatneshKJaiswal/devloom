import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";

/**
 * Edge-compatible Auth.js configuration.
 * Uses JWT session strategy so edge middleware and server routes
 * decode the session identically without requiring a database connection on the edge.
 */
export const authConfig: NextAuthConfig = {
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID || "mock_github_id",
      clientSecret: process.env.AUTH_GITHUB_SECRET || "mock_github_secret",
      authorization: {
        params: {
          scope: "read:user user:email repo",
        },
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = nextUrl;

      // 1. Static installation and CLI scripts are public
      if (
        pathname === "/install.sh" ||
        pathname === "/devloom.sh" ||
        pathname === "/devloom"
      ) {
        return true;
      }

      // 2. API routes handle their own JSON authentication (Bearer PAT or session cookie)
      // They must NEVER be redirected to the HTML /login page
      if (pathname.startsWith("/api/")) {
        return true;
      }

      // 3. Public landing, auth, and docs pages
      const isPublicRoute =
        pathname === "/" ||
        pathname === "/login" ||
        pathname === "/privacy" ||
        pathname.startsWith("/docs");

      if (!isLoggedIn && !isPublicRoute) {
        return false;
      }

      return true;
    },
  },
};
