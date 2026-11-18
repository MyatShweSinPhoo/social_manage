import { prisma } from "@/lib/prisma";
import { fmt } from "@/lib/tiktok/config";
import { notify } from "@/lib/tiktok/telegram";
import { publishTikTok } from "@/lib/tiktok/publisher";

const MAX_ATTEMPTS = 3;

/** Publishes every due TikTok post once. Safe to call from the loop, the cron route or the standalone script. */
export async function runTikTokOnce() {
  // Recover jobs stuck in PUBLISHING (e.g. process crashed mid-upload).
  await prisma.ttPost.updateMany({
    where: { status: "PUBLISHING", updatedAt: { lt: new Date(Date.now() - 20 * 60_000) } },
    data: { status: "SCHEDULED" },
  });

  const due = await prisma.ttPost.findMany({
    where: { status: "SCHEDULED", scheduledAt: { lte: new Date() } },
    include: { account: true },
    orderBy: { scheduledAt: "asc" },
    take: 5,
  });

  let published = 0;
  let failed = 0;

  for (const post of due) {
    // Claim the job so two workers never publish the same post.
    const claim = await prisma.ttPost.updateMany({
      where: { id: post.id, status: "SCHEDULED" },
      data: { status: "PUBLISHING" },
    });
    if (claim.count === 0) continue;

    const label = `TikTok · ${post.account.name} · #${post.id}`;
    try {
      const externalId = await publishTikTok(post);
      await prisma.ttPost.update({
        where: { id: post.id },
        data: { status: "PUBLISHED", externalId, publishedAt: new Date(), error: null },
      });
      published++;
      await notify(`✅ Published: ${label}\nID: ${externalId}`, post.telegramChatId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const attempts = post.attempts + 1;
      if (attempts < MAX_ATTEMPTS) {
        const retryAt = new Date(Date.now() + attempts * 5 * 60_000);
        await prisma.ttPost.update({
          where: { id: post.id },
          data: { status: "SCHEDULED", attempts, scheduledAt: retryAt, error: msg },
        });
        await notify(`⚠️ ${label} failed (attempt ${attempts}/${MAX_ATTEMPTS}), retrying at ${fmt(retryAt)}\n${msg.slice(0, 300)}`, post.telegramChatId);
      } else {
        failed++;
        await prisma.ttPost.update({ where: { id: post.id }, data: { status: "FAILED", attempts, error: msg } });
        await notify(`❌ ${label} failed permanently\n${msg.slice(0, 500)}`, post.telegramChatId, {
          reply_markup: { inline_keyboard: [[{ text: "🔁 Retry", callback_data: `retry:${post.id}` }]] },
        });
      }
    }
  }
  return { processed: due.length, published, failed };
}

const g = globalThis as unknown as { __ttWorkerTimer?: ReturnType<typeof setInterval>; __ttWorkerRunning?: boolean };

/** Starts the 30-second TikTok publish loop (once per process). */
export function startTikTokWorker(intervalMs = 30_000) {
  if (g.__ttWorkerTimer) return;
  const tick = async () => {
    if (g.__ttWorkerRunning) return;
    g.__ttWorkerRunning = true;
    try {
      await runTikTokOnce();
    } catch (e) {
      console.error("[tiktok-worker]", e);
    } finally {
      g.__ttWorkerRunning = false;
    }
  };
  g.__ttWorkerTimer = setInterval(tick, intervalMs);
  setTimeout(tick, 5_000);
  console.log(`[tiktok-worker] started, checking every ${intervalMs / 1000}s`);
}
