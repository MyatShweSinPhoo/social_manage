import { NextResponse } from "next/server";
import { publishDuePosts } from "@/lib/facebook/publisher";
import { fail } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// "Run due posts now" button on the Settings page (admin login required via middleware).
export async function POST() {
  try {
    const result = await publishDuePosts();
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return fail(error);
  }
}
