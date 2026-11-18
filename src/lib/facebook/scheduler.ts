import { publishDuePosts } from "./publisher";

const globalForScheduler = globalThis as unknown as {
  __fbSchedulerTimer?: ReturnType<typeof setInterval>;
  __fbSchedulerRunning?: boolean;
};

// Starts a 60-second loop inside the Next.js server process (see instrumentation.ts).
// Needs an always-on server (npm run dev / npm start / VPS / PM2). Not for serverless hosting.
export function startScheduler() {
  if (globalForScheduler.__fbSchedulerTimer) return;

  const tick = async () => {
    if (globalForScheduler.__fbSchedulerRunning) return;
    globalForScheduler.__fbSchedulerRunning = true;

    try {
      const result = await publishDuePosts();
      if (result.processed > 0) {
        console.log(
          `[scheduler] processed ${result.processed} post(s): ${result.posted} posted, ${result.failed} failed`,
        );
      }
    } catch (error) {
      console.error(
        "[scheduler] error:",
        error instanceof Error ? error.message : error,
      );
    } finally {
      globalForScheduler.__fbSchedulerRunning = false;
    }
  };

  globalForScheduler.__fbSchedulerTimer = setInterval(tick, 60_000);
  setTimeout(tick, 5_000);
  console.log("[scheduler] started - checking for due posts every 60 seconds");
}
