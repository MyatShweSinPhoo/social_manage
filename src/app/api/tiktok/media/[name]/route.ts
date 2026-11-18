import fs from "node:fs/promises";
import { mediaPath } from "@/lib/tiktok/config";

export const runtime = "nodejs";

const types: Record<string, string> = {
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

// Public on purpose: TikTok pulls photo posts from this URL. File names are random UUIDs.
export async function GET(req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  try {
    const buf = await fs.readFile(mediaPath(name)); // basename() inside prevents path traversal
    const dot = name.lastIndexOf(".");
    const type = types[dot >= 0 ? name.slice(dot).toLowerCase() : ""] ?? "application/octet-stream";
    const headers: Record<string, string> = {
      "Content-Type": type,
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=3600",
    };

    // Basic Range support so <video> previews can seek.
    const range = req.headers.get("range")?.match(/^bytes=(\d*)-(\d*)$/);
    if (range && (range[1] || range[2])) {
      const size = buf.byteLength;
      let start = range[1] ? Number(range[1]) : size - Number(range[2]);
      let end = range[1] && range[2] ? Number(range[2]) : size - 1;
      start = Math.max(0, start);
      end = Math.min(size - 1, end);
      if (start > end) return new Response("Range not satisfiable", { status: 416, headers: { "Content-Range": `bytes */${size}` } });
      return new Response(new Uint8Array(buf.subarray(start, end + 1)), {
        status: 206,
        headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) },
      });
    }
    return new Response(new Uint8Array(buf), { headers });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
