import { NextResponse } from "next/server";
import { fail, HttpError } from "@/lib/http";
import { publishPostById } from "@/lib/facebook/publisher";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// "Post now" / "Retry" button
export async function POST(_req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const postId = Number(id);
    if (!Number.isInteger(postId) || postId <= 0) {
      throw new HttpError(400, "Invalid id");
    }

    const result = await publishPostById(postId, [
      "DRAFT",
      "SCHEDULED",
      "FAILED",
    ]);

    if (!result.ok) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: result.status },
      );
    }

    return NextResponse.json({
      success: true,
      data: { facebookPostId: result.facebookPostId },
    });
  } catch (error) {
    return fail(error);
  }
}
