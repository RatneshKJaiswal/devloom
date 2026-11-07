import { signIn } from "@/lib/auth/config";
import { ShieldCheck, ArrowLeft, Lock } from "lucide-react";
import { GithubIcon } from "@/components/icons/github";
import { DevLoomLogo } from "@/components/icons/devloom-logo";
import Link from "next/link";

interface LoginPageProps {
  searchParams: Promise<{ mode?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const isSignIn = params?.mode !== "login";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0d0e12] text-slate-100">
      <div className="w-full max-w-md p-8 rounded-2xl border border-slate-800 bg-[#121316] shadow-2xl relative">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>

        {/* Brand & Header */}
        <div className="text-center mb-6">
          <DevLoomLogo className="h-11 w-11 mx-auto mb-3" />
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {isSignIn ? "Sign In to DevLoom" : "Log In & Initialize Workspace"}
          </h1>
          <p className="mt-1.5 text-xs text-slate-400">
            {isSignIn
              ? "Welcome back. Access your tasks, bugs, and engineering knowledge."
              : "Set up your secure, single-tenant personal engineering workspace."}
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800 mb-6">
          <Link
            href="/login?mode=signin"
            className={`flex-1 py-2 px-3 text-center rounded-lg text-xs font-semibold transition cursor-pointer ${
              isSignIn
                ? "bg-slate-800 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Sign In
          </Link>
          <Link
            href="/login?mode=login"
            className={`flex-1 py-2 px-3 text-center rounded-lg text-xs font-semibold transition cursor-pointer ${
              !isSignIn
                ? "bg-slate-800 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Log In / New Workspace
          </Link>
        </div>

        {/* GitHub Auth Form */}
        <form
          action={async () => {
            "use server";
            await signIn("github", { redirectTo: "/dashboard" });
          }}
          className="space-y-4"
        >
          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl bg-white text-slate-900 font-semibold hover:bg-slate-100 flex items-center justify-center gap-2.5 transition shadow-md shadow-white/5 cursor-pointer text-xs"
          >
            <GithubIcon className="w-4 h-4 text-slate-900" />
            <span>Continue with GitHub</span>
          </button>
        </form>

        {/* Security & Tenant Guarantee */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 space-y-2 text-center text-xs text-slate-400">
          <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-medium">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Tenant Data Isolation</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            We request only public profile and repository read access. All tokens are encrypted using AES-256-GCM.
          </p>
        </div>
      </div>
    </div>
  );
}
