"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";

const MAX_VIDEO = 64 * 1024 * 1024;
const MAX_CAPTION = 2200;

export default function NewVideoForm({ accounts, tz }: { accounts: { id: number; name: string }[]; tz: string }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [selected, setSelected] = useState<number[]>(accounts.map((a) => a.id));
  const [when, setWhen] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);

  function pick(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("video/") && !f.type.startsWith("image/")) {
      setError("Choose a video (MP4/MOV) or an image.");
      e.target.value = "";
      return;
    }
    if (f.type.startsWith("video/") && f.size > MAX_VIDEO) {
      setError("Video is over 64 MB. Compress it first.");
      e.target.value = "";
      return;
    }
    setError(null);
    setFile(f);
    setUrl(URL.createObjectURL(f));
  }

  function toggle(id: number) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!file) return setError("Choose a video or photo first.");
    if (selected.length === 0) return setError("Select at least one TikTok account.");

    const form = new FormData();
    form.append("media", file);
    form.append("caption", caption);
    if (when) form.append("scheduledAt", when);
    for (const id of selected) form.append("accountId", String(id));

    setBusy(true);
    try {
      const res = await fetch("/api/tiktok/posts", { method: "POST", body: form, headers: { Accept: "application/json" } });
      const json = await res.json().catch(() => null);
      if (!res.ok || json?.success === false) throw new Error(json?.message || "Could not schedule the post.");
      router.push("/tiktok");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not schedule the post.");
    } finally {
      setBusy(false);
    }
  }

  const isVideo = file?.type.startsWith("video/");
  const handle = accounts.find((a) => selected.includes(a.id))?.name ?? "your_account";

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="tt-phone" aria-label="Preview">
        {url ? (
          isVideo ? (
            <video src={url} muted loop playsInline autoPlay />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="Selected" />
          )
        ) : (
          <div className="ph-empty">Your video preview appears here</div>
        )}
        {(caption || url) && (
          <div className="ph-cap">
            <b>@{handle}</b>
            {caption || ""}
          </div>
        )}
      </div>

      <label className="tt-drop">
        {file ? `Selected: ${file.name}` : "Choose video or photo"}
        <small>MP4 / MOV up to 64 MB · 9:16 vertical works best</small>
        <input ref={input} type="file" accept="video/*,image/*" onChange={pick} style={{ display: "none" }} />
      </label>

      <div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <label className="l" htmlFor="caption">Caption</label>
          <span className="tt-counter">{caption.length}/{MAX_CAPTION}</span>
        </div>
        <textarea
          id="caption"
          className="in"
          maxLength={MAX_CAPTION}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Describe your video… #fyp #hashtags"
        />
      </div>

      <div>
        <span className="l" style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>Post to</span>
        {accounts.map((a) => (
          <label key={a.id} className="tt-chip">
            <input type="checkbox" checked={selected.includes(a.id)} onChange={() => toggle(a.id)} />
            @{a.name}
          </label>
        ))}
      </div>

      <div>
        <label className="l" htmlFor="scheduledAt">Publish at (optional, {tz})</label>
        <input id="scheduledAt" type="datetime-local" className="in" value={when} onChange={(e) => setWhen(e.target.value)} />
        <p className="tt-m">Leave empty to use the next free daily slot (POST_TIMES).</p>
      </div>

      {error && <div className="tt-banner" role="alert">{error}</div>}

      <button type="submit" className="s full" disabled={busy}>
        {busy ? "Uploading…" : "Schedule TikTok"}
      </button>
    </form>
  );
}
