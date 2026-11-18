import { NextResponse } from "next/server";
import { safeEqual } from "@/lib/auth";
import { publishDuePosts } from "@/lib/facebook/publisher";
import { runTikTokOnce } from "@/services/worker";
import { fail } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

// For external cron services (cron-job.org, server crontab, etc.). Publishes due Facebook AND TikTok posts:
//   curl -H "Authorization: Bearer <CRON_SECRET>" https://your-site.com/api/cron/publish
// Optional: ?platform=facebook or ?platform=tiktok to run only one of them.
async function handle(req: Request) {
  try {
    const secret = process.env.CRON_SECRET;
    if (!secret) {
      return NextResponse.json({ success: false, message: "CRON_SECRET is not set in .env" }, { status: 503 });
    }

    const auth = req.headers.get("authorization");
    const provided = auth?.startsWith("Bearer ") ? auth.slice(7) : req.headers.get("x-cron-secret");
    if (!provided || !safeEqual(provided, secret)) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const only = new URL(req.url).searchParams.get("platform");
    const data: Record<string, unknown> = {};
    if (only !== "tiktok") data.facebook = await publishDuePosts();
    if (only !== "facebook") data.tiktok = await runTikTokOnce();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return fail(error);
  }
}

export const GET = handle;
export const POST = handle;
