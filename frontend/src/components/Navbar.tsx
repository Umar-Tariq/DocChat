"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "@/lib/auth";

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const isChat = pathname.startsWith("/chat");

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md">
      <div
        className={`flex items-center justify-between px-4 py-3 sm:px-6 ${
          isChat ? "w-full" : "mx-auto max-w-6xl"
        }`}
      >
        <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-sm font-bold text-indigo-400">
            D
          </span>
          <span className="text-lg font-semibold text-white">
            Doc<span className="text-indigo-400">Chat</span>
          </span>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-4 text-sm">
          {user ? (
            <>
              <span className="hidden text-zinc-500 sm:inline">{user.email}</span>
              <Link
                href="/dashboard"
                className={`rounded-lg px-3 py-1.5 transition-colors ${
                  pathname === "/dashboard"
                    ? "bg-indigo-500/15 text-indigo-300"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                }`}
              >
                Dashboard
              </Link>
              <button
                onClick={() => logout()}
                className="rounded-lg border border-zinc-700/80 px-3 py-1.5 text-zinc-400 transition-colors hover:border-zinc-600 hover:text-white"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg px-3 py-1.5 text-zinc-400 hover:text-white"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-indigo-500 px-3 py-1.5 font-medium text-white hover:bg-indigo-400"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
