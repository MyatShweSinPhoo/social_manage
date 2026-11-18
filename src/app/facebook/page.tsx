"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { PostDTO } from "@/lib/facebook/serialize";
import StatusBadge from "@/components/facebook/StatusBadge";

const TABS = [
  { key: "ALL", label: "All" },
  { key: "SCHEDULED", label: "Scheduled" },
  { key: "POSTED", label: "Posted" },
  { key: "FAILED", label: "Failed" },
  { key: "DRAFT", label: "Drafts" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const EDITABLE = ["DRAFT", "SCHEDULED", "FAILED"];

function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function sortTime(p: PostDTO) {
  return new Date(p.postedAt ?? p.scheduledAt ?? p.createdAt).getTime();
}

export default function PostsPage() {
  const [posts, setPosts] = useState<PostDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("ALL");
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/facebook/posts", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to load posts");
      }
      setPosts(json.data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load posts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 30_000); // pick up status changes made by the scheduler
    return () => clearInterval(timer);
  }, [load]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: posts.length };
    for (const p of posts) c[p.status] = (c[p.status] ?? 0) + 1;
    return c;
  }, [posts]);

  const nextScheduled = useMemo(() => {
    const times = posts
      .filter((p) => p.status === "SCHEDULED" && p.scheduledAt)
      .map((p) => new Date(p.scheduledAt as string).getTime());
    return times.length ? new Date(Math.min(...times)).toISOString() : null;
  }, [posts]);

  const visible = useMemo(() => {
    const list =
      tab === "ALL"
        ? posts
        : posts.filter(
            (p) =>
              p.status === tab ||
              (tab === "SCHEDULED" && p.status === "PUBLISHING"),
          );

    return [...list].sort((a, b) =>
      tab === "SCHEDULED" ? sortTime(a) - sortTime(b) : sortTime(b) - sortTime(a),
    );
  }, [posts, tab]);

  async function act(id: number, kind: "publish" | "delete") {
    if (
      kind === "publish" &&
      !confirm("Publish this post to your Facebook Page right now?")
    ) {
      return;
    }
    if (
      kind === "delete" &&
      !confirm(
        "Delete this post from the scheduler?\n(Anything already published on Facebook will NOT be deleted.)",
      )
    ) {
      return;
    }

    setBusyId(id);
    try {
      const res = await fetch(
        kind === "publish" ? `/api/facebook/posts/${id}/publish` : `/api/facebook/posts/${id}`,
        { method: kind === "publish" ? "POST" : "DELETE" },
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Action failed");
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusyId(null);
      await load();
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Posts</h1>
          <p className="mt-1 text-sm text-slate-500">
            Create posts here — they are sent to your Facebook Page at the time
            you choose.
          </p>
        </div>
        <Link
          href="/facebook/posts/new"
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        >
          + New post
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Scheduled
          </p>
          <p className="mt-2 text-3xl font-extrabold text-indigo-600">
            {counts.SCHEDULED ?? 0}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Posted
          </p>
          <p className="mt-2 text-3xl font-extrabold text-emerald-600">
            {counts.POSTED ?? 0}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Failed
          </p>
          <p className="mt-2 text-3xl font-extrabold text-rose-600">
            {counts.FAILED ?? 0}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Next post
          </p>
          <p className="mt-2 text-base font-bold text-slate-800">
            {nextScheduled ? fmt(nextScheduled) : "Nothing scheduled"}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              tab === t.key
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100"
            }`}
          >
            {t.label}
            <span className="ml-1.5 opacity-60">{counts[t.key] ?? 0}</span>
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* List */}
      {loading ? (
        <p className="py-12 text-center text-sm text-slate-500">Loading…</p>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <p className="text-4xl">📭</p>
          <p className="mt-3 text-sm font-medium text-slate-600">
            No posts here yet.
          </p>
          <Link
            href="/facebook/posts/new"
            className="mt-4 inline-block text-sm font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Create your first post →
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {visible.map((post) => {
            const editable = EDITABLE.includes(post.status);
            const busy = busyId === post.id;

            return (
              <li
                key={post.id}
                className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md sm:gap-5 sm:p-5"
              >
                {post.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.imageUrl}
                    alt=""
                    className="h-24 w-24 shrink-0 rounded-xl object-cover sm:h-28 sm:w-28"
                  />
                ) : (
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-2xl text-slate-400 sm:h-28 sm:w-28">
                    ✍️
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={post.status} />
                    <span className="text-xs text-slate-500">
                      {post.status === "POSTED"
                        ? `Posted ${fmt(post.postedAt)}`
                        : post.scheduledAt
                          ? `Scheduled for ${fmt(post.scheduledAt)}`
                          : "No schedule"}
                    </span>
                  </div>

                  <p className="mt-2 line-clamp-3 whitespace-pre-wrap break-words text-sm text-slate-800">
                    {post.caption || (
                      <span className="italic text-slate-400">(no caption)</span>
                    )}
                  </p>

                  {post.status === "FAILED" && post.errorMessage && (
                    <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
                      {post.errorMessage}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {editable && (
                      <>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => act(post.id, "publish")}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {busy
                            ? "Working…"
                            : post.status === "FAILED"
                              ? "Retry now"
                              : "Post now"}
                        </button>
                        <Link
                          href={`/facebook/posts/${post.id}`}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          Edit
                        </Link>
                      </>
                    )}
                    <button
                      type="button"
                      disabled={busy || post.status === "PUBLISHING"}
                      onClick={() => act(post.id, "delete")}
                      className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
