import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { HttpError } from "@/lib/http";

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

// Facebook images live in <UPLOAD_DIR>/facebook (TikTok media is kept separately in <UPLOAD_DIR>/tiktok).
export function uploadDir() {
  const base = process.env.UPLOAD_DIR
    ? path.resolve(process.env.UPLOAD_DIR)
    : path.join(process.cwd(), "uploads");
  return path.join(base, "facebook");
}

function isSafeName(name: string) {
  return /^[A-Za-z0-9._-]+$/.test(name) && !name.includes("..");
}

export function mimeFromName(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return MIME_BY_EXT[ext] ?? "application/octet-stream";
}

export async function saveUpload(file: File): Promise<string> {
  const ext = EXT_BY_MIME[file.type];
  if (!ext) {
    throw new HttpError(400, "Only JPG, PNG, WEBP or GIF images are allowed");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new HttpError(400, "Image is too large (max 8 MB)");
  }

  const dir = uploadDir();
  await fs.mkdir(dir, { recursive: true });

  const name = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
  await fs.writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return name;
}

export async function readUpload(name: string): Promise<Buffer> {
  if (!isSafeName(name)) {
    throw new HttpError(400, "Invalid file name");
  }
  return fs.readFile(path.join(uploadDir(), name));
}

export async function deleteUpload(name: string | null | undefined) {
  if (!name || !isSafeName(name)) return;
  await fs.unlink(path.join(uploadDir(), name)).catch(() => {});
}
