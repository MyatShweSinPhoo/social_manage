// Optional: run the TikTok worker + Telegram bot in their own process (`npm run services`)
// instead of inside the Next.js server. Set ENABLE_INTERNAL_SCHEDULER=false and ENABLE_TELEGRAM_BOT=false
// in .env for the web server when you do this, otherwise everything runs twice.
import "dotenv/config";
import { startBot } from "./bot";
import { startTikTokWorker } from "./worker";

startTikTokWorker();
if (process.env.TELEGRAM_BOT_TOKEN) startBot();
else console.warn("[bot] TELEGRAM_BOT_TOKEN not set — Telegram control disabled");
