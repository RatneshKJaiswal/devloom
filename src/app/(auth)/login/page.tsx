import { signIn } from "@/lib/auth/config";
import { ShieldCheck } from "lucide-react";
import { GithubIcon } from "@/components/icons/github";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#090d16]">
      <div className="w-full max-w-md p-8 rounded-2xl border border-slate-800 bg-slate-900/70 shadow-2xl backdrop-blur">
        <div className="text-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center font-bold text-white text-xl mx-auto mb-4 shadow-lg shadow-primary/20">
            D
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Sign in to DevLoom
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Your personal workspace for tasks, bugs, and engineering notes.
          </p>
        </div>

        <form
          action={async () => {
            "use server";
            await signIn("github", { redirectTo: "/dashboard" });
          }}
          className="space-y-4"
        >
          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl bg-white text-slate-900 font-medium hover:bg-slate-100 flex items-center justify-center gap-3 transition shadow-md shadow-white/5 cursor-pointer"
          >
            <GithubIcon className="w-5 h-5 text-slate-900" />
            <span>Continue with GitHub</span>
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-success" />
          <span>Complete tenant data isolation. We only request read scopes.</span>
        </div>
      </div>
    </div>
  );
}
