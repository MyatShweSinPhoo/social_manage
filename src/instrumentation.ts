// Runs once when the Next.js server starts. Starts the Facebook scheduler, the TikTok worker
// and the Telegram bot (see instrumentation-node.ts).
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startBackgroundServices } = await import("./instrumentation-node");
    await startBackgroundServices();
  }
}
