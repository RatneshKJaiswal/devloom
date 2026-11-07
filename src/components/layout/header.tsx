import Link from "next/link";
import { auth, signOut } from "@/lib/auth/config";
import { LogOut } from "lucide-react";
import { HeaderActions } from "./header-actions";

export async function Header() {
  const session = await auth();

  const userProfile = (
    <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-slate-800">
      <Link
        href="/settings"
        title="View Profile & Settings"
        className="flex items-center gap-2 hover:opacity-85 transition group cursor-pointer"
      >
        {session?.user?.image ? (
          <img
            src={session.user.image}
            alt={session.user.name || "User"}
            className="w-7 h-7 rounded-full border border-slate-700 object-cover group-hover:border-primary transition"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-medium text-slate-300 group-hover:border-primary transition">
            {session?.user?.name?.[0] || "U"}
          </div>
        )}
        <span className="text-xs font-medium text-slate-300 hidden md:inline-block max-w-[120px] truncate group-hover:text-white transition">
          {session?.user?.name || "Developer"}
        </span>
      </Link>

      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/" });
        }}
      >
        <button
          type="submit"
          title="Sign out"
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </form>
    </div>
  );

  return (
    <header className="h-16 px-4 sm:px-6 border-b border-slate-800 bg-[#121316]/90 backdrop-blur sticky top-0 z-40 flex items-center">
      <HeaderActions userProfile={userProfile} />
    </header>
  );
}
