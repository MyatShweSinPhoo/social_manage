import Link from "next/link";
import { prisma } from "@/lib/prisma";
import LogoutButton from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

const fmt = (d: Date | null | undefined) =>
  d
    ? d.toLocaleString("en-GB", {
        timeZone: process.env.TZ_NAME ?? "Asia/Yangon",
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Nothing scheduled";

export default async function Home() {
  const [fbScheduled, fbPosted, fbFailed, fbNext, ttPending, ttScheduled, ttPublished, ttFailed, ttNext] =
    await Promise.all([
      prisma.fbPost.count({ where: { status: "SCHEDULED" } }),
      prisma.fbPost.count({ where: { status: "POSTED" } }),
      prisma.fbPost.count({ where: { status: "FAILED" } }),
      prisma.fbPost.findFirst({ where: { status: "SCHEDULED" }, orderBy: { scheduledAt: "asc" } }),
      prisma.ttPost.count({ where: { status: "PENDING_APPROVAL" } }),
      prisma.ttPost.count({ where: { status: "SCHEDULED" } }),
      prisma.ttPost.count({ where: { status: "PUBLISHED" } }),
      prisma.ttPost.count({ where: { status: "FAILED" } }),
      prisma.ttPost.findFirst({ where: { status: "SCHEDULED" }, orderBy: { scheduledAt: "asc" } }),
    ]);

  const stat = (label: string, value: number, color: string) => (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-extrabold ${color}`}>{value}</p>
    </div>
  );

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Social Hub</h1>
          <p className="mt-1 text-sm text-slate-500">Schedule and publish to Facebook and TikTok from one place.</p>
        </div>
        <LogoutButton />
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {/* Facebook */}
        <Link
          href="/facebook"
          className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-xl text-white">
              📅
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Facebook Page</h2>
              <p className="text-sm text-slate-500">Photo &amp; text posts</p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-4">
            {stat("Scheduled", fbScheduled, "text-indigo-600")}
            {stat("Posted", fbPosted, "text-emerald-600")}
            {stat("Failed", fbFailed, "text-rose-600")}
          </div>
          <p className="mt-5 text-sm text-slate-600">Next: {fmt(fbNext?.scheduledAt)}</p>
          <p className="mt-4 text-sm font-semibold text-indigo-600 group-hover:text-indigo-700">Open Facebook panel →</p>
        </Link>

        {/* TikTok */}
        <Link
          href="/tiktok"
          className="group rounded-2xl border border-zinc-800 bg-black p-6 text-white shadow-sm transition hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-900 text-xl ring-1 ring-zinc-700">
              <span style={{ textShadow: "2px 0 #fe2c55, -2px 0 #25f4ee" }}>♪</span>
            </span>
            <div>
              <h2 className="text-lg font-bold">TikTok</h2>
              <p className="text-sm text-zinc-400">Videos &amp; photo posts</p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-4 gap-4 [&_p:first-child]:text-zinc-400">
            {stat("Pending", ttPending, "text-amber-400")}
            {stat("Scheduled", ttScheduled, "text-[#25f4ee]")}
            {stat("Published", ttPublished, "text-emerald-400")}
            {stat("Failed", ttFailed, "text-[#fe2c55]")}
          </div>
          <p className="mt-5 text-sm text-zinc-300">Next: {fmt(ttNext?.scheduledAt)}</p>
          <p className="mt-4 text-sm font-semibold text-[#fe2c55]">Open TikTok panel →</p>
        </Link>
      </div>
    </main>
  );
}
