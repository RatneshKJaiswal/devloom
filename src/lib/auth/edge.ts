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

      const isPublicRoute =
        pathname === "/" ||
        pathname === "/login" ||
        pathname === "/privacy" ||
        pathname.startsWith("/api/auth");

      if (!isLoggedIn && !isPublicRoute) {
        return false;
      }

      return true;
    },
  },
};
