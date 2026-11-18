import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadDir } from "@/lib/tiktok/config";
import { nextFreeSlot, parseLocal } from "@/lib/tiktok/slots";
import { bad, done } from "@/lib/tiktok/respond";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 64 * 1024 * 1024; // single-chunk TikTok upload limit used by the publisher

export async function GET() {
  const posts = await prisma.ttPost.findMany({
    include: { account: { select: { name: true } } },
    orderBy: { id: "desc" },
    take: 100,
  });
  return NextResponse.json({ success: true, data: posts });
}

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("media");
  const accountIds = form.getAll("accountId").map(Number).filter(Boolean);
  if (!(file instanceof File) || file.size === 0 || accountIds.length === 0) {
    return bad(req, "Choose a video or photo and at least one TikTok account.");
  }
  const isVideo = file.type.startsWith("video/");
  if (!isVideo && !file.type.startsWith("image/")) return bad(req, "Only video or image files are allowed.");
  if (isVideo && file.size > MAX_BYTES) return bad(req, "Video is over 64 MB. Compress it first (chunked upload is not implemented).");

  const ext = path.extname(file.name).toLowerCase() || (isVideo ? ".mp4" : ".jpg");
  const name = `${randomUUID()}${ext}`;
  await fs.mkdir(uploadDir(), { recursive: true });
  await fs.writeFile(path.join(uploadDir(), name), Buffer.from(await file.arrayBuffer()));

  const caption = String(form.get("caption") ?? "");
  const when = parseLocal(String(form.get("scheduledAt") ?? ""));
  if (when && when.getTime() < Date.now() - 60_000) {
    await fs.unlink(path.join(uploadDir(), name)).catch(() => {});
    return bad(req, "The schedule time must be in the future.");
  }

  let created = 0;
  for (const accountId of accountIds) {
    const account = await prisma.ttAccount.findUnique({ where: { id: accountId } });
    if (!account) continue;
    await prisma.ttPost.create({
      data: {
        accountId,
        caption,
        mediaFile: name,
        mediaType: isVideo ? "VIDEO" : "IMAGE",
        status: "SCHEDULED",
        scheduledAt: when ?? (await nextFreeSlot(accountId)),
      },
    });
    created++;
  }
  if (created === 0) {
    await fs.unlink(path.join(uploadDir(), name)).catch(() => {});
    return bad(req, "That TikTok account no longer exists.");
  }
  return done(req);
}
