"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 rounded-lg transition-colors border border-red-600/30"
      title="Logout"
    >
      <LogOut className="w-4 h-4" />
      <span className="hidden sm:inline text-sm font-medium">Logout</span>
    </button>
  );
}
