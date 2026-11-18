"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import type { PostDTO } from "@/lib/facebook/serialize";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// ISO string -> value for <input type="datetime-local"> in the browser's local time
function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

export default function PostForm({ post }: { post?: PostDTO }) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);

  const [caption, setCaption] = useState(post?.caption ?? "");
  const [scheduledAt, setScheduledAt] = useState(
    toLocalInput(post?.scheduledAt ?? null),
  );
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removeExisting, setRemoveExisting] = useState(false);
  const [saving, setSaving] = useState<"SCHEDULED" | "DRAFT" | null>(null);
  const [error, setError] = useState<string | null>(null);

  // computed after mount to avoid server/client hydration differences
  const [timeZone, setTimeZone] = useState("");
  const [minNow, setMinNow] = useState("");

  useEffect(() => {
    setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    setMinNow(toLocalInput(new Date().toISOString()));
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const shownImage =
    previewUrl ?? (removeExisting ? null : (post?.imageUrl ?? null));

  function onPickImage(e: ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    if (!picked) return;

    if (!ALLOWED_TYPES.includes(picked.type)) {
      setError("Only JPG, PNG, WEBP or GIF images are allowed.");
      e.target.value = "";
      return;
    }
    if (picked.size > MAX_BYTES) {
      setError("Image is too large (max 8 MB).");
      e.target.value = "";
      return;
    }

    setError(null);
    setFile(picked);
    setPreviewUrl(URL.createObjectURL(picked));
    setRemoveExisting(false);
  }

  function removeImage() {
    setFile(null);
    setPreviewUrl(null);
    if (post?.imageUrl) setRemoveExisting(true);
    if (fileInput.current) fileInput.current.value = "";
  }

  async function submit(status: "SCHEDULED" | "DRAFT") {
    setError(null);

    if (!caption.trim() && !shownImage) {
      setError("Add a caption or an image.");
      return;
    }

    if (status === "SCHEDULED") {
      if (!scheduledAt) {
        setError("Choose a date and time to schedule.");
        return;
      }
      if (new Date(scheduledAt).getTime() < Date.now()) {
        setError("The schedule time must be in the future.");
        return;
      }
    }

    const form = new FormData();
    form.append("caption", caption);
    form.append("status", status);
    if (scheduledAt) {
      form.append("scheduledAt", new Date(scheduledAt).toISOString());
    }
    if (file) form.append("image", file);
    if (removeExisting && !file) form.append("removeImage", "true");

    setSaving(status);
    try {
      const res = await fetch(post ? `/api/facebook/posts/${post.id}` : "/api/facebook/posts", {
        method: post ? "PUT" : "POST",
        body: form,
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to save the post");
      }

      router.push("/facebook");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save the post");
    } finally {
      setSaving(null);
    }
  }

  const previewTime =
    timeZone && scheduledAt
      ? new Date(scheduledAt).toLocaleString([], {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : null;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
      {/* ---------- Form ---------- */}
      <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Image
          </label>

          {shownImage ? (
            <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={shownImage}
                alt="Selected"
                className="max-h-72 w-full object-contain"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute right-3 top-3 rounded-lg bg-slate-900/80 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur transition hover:bg-slate-900"
              >
                Remove
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center transition hover:border-indigo-400 hover:bg-indigo-50/40">
              <span className="text-3xl">🖼️</span>
              <span className="text-sm font-medium text-slate-700">
                Click to choose an image
              </span>
              <span className="text-xs text-slate-500">
                JPG, PNG, WEBP or GIF · max 8 MB (optional)
              </span>
              <input
                ref={fileInput}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={onPickImage}
                className="hidden"
              />
            </label>
          )}

          {shownImage && (
            <label className="mt-3 inline-block cursor-pointer text-sm font-medium text-indigo-600 hover:text-indigo-700">
              Replace image
              <input
                ref={fileInput}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={onPickImage}
                className="hidden"
              />
            </label>
          )}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label
              htmlFor="caption"
              className="text-sm font-semibold text-slate-700"
            >
              Caption
            </label>
            <span className="text-xs text-slate-400">{caption.length} characters</span>
          </div>
          <textarea
            id="caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={7}
            placeholder="Write your caption…"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm leading-relaxed outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
          />
        </div>

        <div>
          <label
            htmlFor="scheduledAt"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Publish date &amp; time
          </label>
          <input
            id="scheduledAt"
            type="datetime-local"
            value={scheduledAt}
            min={minNow || undefined}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 sm:w-auto"
          />
          {timeZone && (
            <p className="mt-2 text-xs text-slate-500">
              Your time zone: {timeZone}. The post is sent to Facebook within
              about a minute after this time.
            </p>
          )}
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-6">
          <button
            type="button"
            disabled={saving !== null}
            onClick={() => submit("SCHEDULED")}
            className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving === "SCHEDULED" ? "Saving…" : "Schedule post"}
          </button>
          <button
            type="button"
            disabled={saving !== null}
            onClick={() => submit("DRAFT")}
            className="rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            {saving === "DRAFT" ? "Saving…" : "Save as draft"}
          </button>
          <Link
            href="/facebook"
            className="px-2 text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            Cancel
          </Link>
        </div>
      </div>

      {/* ---------- Facebook-style preview ---------- */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Preview
        </p>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 p-4">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-sky-400" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Your Page</p>
              <p className="text-xs text-slate-500">
                {previewTime ? `Scheduled · ${previewTime}` : "Not scheduled"}
              </p>
            </div>
          </div>

          {caption && (
            <p className="whitespace-pre-wrap break-words px-4 pb-3 text-sm text-slate-800">
              {caption}
            </p>
          )}

          {shownImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shownImage} alt="Preview" className="w-full object-cover" />
          )}

          {!caption && !shownImage && (
            <p className="px-4 pb-8 pt-2 text-sm text-slate-400">
              Your post preview will appear here.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
