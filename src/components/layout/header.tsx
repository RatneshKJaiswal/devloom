import { auth, signOut } from "@/lib/auth/config";
import { LogOut } from "lucide-react";
import { HeaderActions } from "./header-actions";

export async function Header() {
  const session = await auth();

  return (
    <header className="h-16 px-6 border-b border-slate-800 bg-[#090d16]/80 backdrop-blur sticky top-0 z-40 flex items-center justify-between">
      <HeaderActions />

      {/* User Profile & Sign Out */}
      <div className="flex items-center gap-3 ml-4 shrink-0">
        <div className="h-4 w-px bg-slate-800" />

        <div className="flex items-center gap-3">
          {session?.user?.image ? (
            <img
              src={session.user.image}
              alt={session.user.name || "User"}
              className="w-7 h-7 rounded-full border border-slate-700 object-cover"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-medium text-slate-300">
              {session?.user?.name?.[0] || "U"}
            </div>
          )}
          <span className="text-xs font-medium text-slate-300 hidden sm:inline-block max-w-[120px] truncate">
            {session?.user?.name || "Developer"}
          </span>

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
      </div>
    </header>
  );
}
