import type { FbPostStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { publishPhoto, publishText } from "./api";
import { mimeFromName, readUpload } from "./uploads";

export type PublishResult =
  | { ok: true; facebookPostId: string | null }
  | { ok: false; status: number; message: string };

// Atomically "claims" the post (status -> PUBLISHING) so the same post is never sent twice,
// then publishes it to Facebook and records the result.
export async function publishPostById(
  id: number,
  allowedFrom: FbPostStatus[],
): Promise<PublishResult> {
  const claimed = await prisma.fbPost.updateMany({
    where: { id, status: { in: allowedFrom } },
    data: { status: "PUBLISHING" },
  });

  if (claimed.count === 0) {
    return {
      ok: false,
      status: 409,
      message:
        "This post cannot be published right now (it may already be posting or posted).",
    };
  }

  const post = await prisma.fbPost.findUnique({ where: { id } });
  if (!post) {
    return { ok: false, status: 404, message: "Post not found" };
  }

  try {
    let facebookPostId: string | null;

    if (post.imageName) {
      const buffer = await readUpload(post.imageName);
      facebookPostId = await publishPhoto({
        caption: post.caption,
        buffer,
        filename: post.imageName,
        mimeType: mimeFromName(post.imageName),
      });
    } else {
      facebookPostId = await publishText(post.caption);
    }

    await prisma.fbPost.update({
      where: { id },
      data: {
        status: "POSTED",
        postedAt: new Date(),
        facebookPostId,
        errorMessage: null,
        attempts: { increment: 1 },
      },
    });

    return { ok: true, facebookPostId };
  } catch (error) {
    const message = (
      error instanceof Error ? error.message : "Unknown error"
    ).slice(0, 1000);

    await prisma.fbPost.update({
      where: { id },
      data: {
        status: "FAILED",
        errorMessage: message,
        attempts: { increment: 1 },
      },
    });

    return { ok: false, status: 502, message };
  }
}

// Called every minute: publishes every SCHEDULED post whose time has come.
export async function publishDuePosts() {
  // Posts stuck in PUBLISHING for 10+ minutes (e.g. server crashed) -> FAILED.
  // They are NOT retried automatically because Facebook may already have received them.
  await prisma.fbPost.updateMany({
    where: {
      status: "PUBLISHING",
      updatedAt: { lt: new Date(Date.now() - 10 * 60_000) },
    },
    data: {
      status: "FAILED",
      errorMessage:
        "Publishing was interrupted. Check your Facebook Page first, then retry to avoid a duplicate post.",
    },
  });

  const due = await prisma.fbPost.findMany({
    where: { status: "SCHEDULED", scheduledAt: { lte: new Date() } },
    orderBy: { scheduledAt: "asc" },
    take: 10,
  });

  let posted = 0;
  let failed = 0;

  for (const post of due) {
    const result = await publishPostById(post.id, ["SCHEDULED"]);
    if (result.ok) posted++;
    else failed++;
  }

  return { processed: due.length, posted, failed };
}
