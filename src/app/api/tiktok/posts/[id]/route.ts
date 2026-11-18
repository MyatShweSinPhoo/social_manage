import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { uploadDir } from "@/lib/tiktok/config";
import { nextFreeSlot } from "@/lib/tiktok/slots";
import { bad, done } from "@/lib/tiktok/respond";

export const runtime = "nodejs";

/** Form action endpoint: approve | reject | retry | delete */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const action = String((await req.formData()).get("action"));
  const post = await prisma.ttPost.findUnique({ where: { id } });
  if (!post) return bad(req, "Not found", 404);

  if (action === "approve" && post.status === "PENDING_APPROVAL") {
    await prisma.ttPost.update({
      where: { id },
      data: { status: "SCHEDULED", scheduledAt: await nextFreeSlot(post.accountId) },
    });
  } else if (action === "reject" && post.status !== "PUBLISHING" && post.status !== "PUBLISHED") {
    await prisma.ttPost.update({ where: { id }, data: { status: "REJECTED" } });
  } else if (action === "retry" && post.status === "FAILED") {
    await prisma.ttPost.update({
      where: { id },
      data: { status: "SCHEDULED", attempts: 0, error: null, scheduledAt: new Date(Date.now() + 60_000) },
    });
  } else if (action === "delete" && post.status !== "PUBLISHING") {
    await prisma.ttPost.delete({ where: { id } });
    // Remove the media file only if no other post (one per account) still uses it.
    const stillUsed = await prisma.ttPost.count({ where: { mediaFile: post.mediaFile } });
    if (stillUsed === 0) await fs.unlink(path.join(uploadDir(), path.basename(post.mediaFile))).catch(() => {});
  }
  return done(req);
}
