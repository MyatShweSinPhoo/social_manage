// Node-only startup code (kept in its own file so the Edge bundle never sees fs/path/etc.).
export async function startBackgroundServices() {
  if (process.env.ENABLE_INTERNAL_SCHEDULER !== "false") {
    const { startScheduler } = await import("./lib/facebook/scheduler");
    startScheduler();
    const { startTikTokWorker } = await import("./services/worker");
    startTikTokWorker();
  }

  if (process.env.ENABLE_TELEGRAM_BOT !== "false" && process.env.TELEGRAM_BOT_TOKEN) {
    const { startBot } = await import("./services/bot");
    startBot();
  }
}
