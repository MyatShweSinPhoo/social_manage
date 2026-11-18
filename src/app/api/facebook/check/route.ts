import { NextResponse } from "next/server";
import { checkConnection } from "@/lib/facebook/api";
import { fail } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Settings page: "Test connection"
export async function GET() {
  try {
    const schedulerEnabled = process.env.ENABLE_INTERNAL_SCHEDULER !== "false";
    const configured = Boolean(
      process.env.FACEBOOK_PAGE_ID && process.env.FACEBOOK_PAGE_ACCESS_TOKEN,
    );

    if (!configured) {
      return NextResponse.json({
        success: true,
        data: { configured: false, schedulerEnabled },
      });
    }

    const page = await checkConnection();
    return NextResponse.json({
      success: true,
      data: { configured: true, schedulerEnabled, page },
    });
  } catch (error) {
    return fail(error);
  }
}
