import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db";
import { accounts, sessions, users, verificationTokens } from "@/lib/db/schema";
import { authConfig } from "./edge";
import { storeUserGitHubToken } from "@/lib/security/tokens";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  events: {
    async signIn({ user, account }) {
      if (account?.provider === "github" && account.access_token && user?.id) {
        try {
          await storeUserGitHubToken(user.id, account.access_token);
        } catch (err) {
          console.error("Failed to encrypt GitHub token on sign-in:", err);
        }
      }
    },
  },
});
