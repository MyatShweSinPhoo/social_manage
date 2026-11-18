import Link from "next/link";
import type { ReactNode } from "react";
import LogoutButton from "@/components/LogoutButton";
import PlatformSwitch from "@/components/PlatformSwitch";

export default function FacebookLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href="/facebook" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-lg text-white">
                📅
              </span>
              <span className="hidden text-base font-bold text-slate-900 sm:block">Facebook Scheduler</span>
            </Link>

            <nav className="flex items-center gap-1 text-sm font-medium text-slate-600">
              <Link href="/facebook" className="rounded-lg px-3 py-1.5 transition hover:bg-slate-100">
                Posts
              </Link>
              <Link href="/facebook/posts/new" className="rounded-lg px-3 py-1.5 transition hover:bg-slate-100">
                New post
              </Link>
              <Link href="/facebook/settings" className="rounded-lg px-3 py-1.5 transition hover:bg-slate-100">
                Settings
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <PlatformSwitch active="facebook" />
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
