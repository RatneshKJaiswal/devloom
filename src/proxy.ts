import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/edge";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|install\\.sh|devloom\\.sh|devloom|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
