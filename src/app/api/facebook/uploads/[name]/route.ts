import { NextResponse } from "next/server";
import { mimeFromName, readUpload } from "@/lib/facebook/uploads";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ name: string }> };

// Serves uploaded images to the (logged-in) admin panel for previews.
export async function GET(_req: Request, ctx: Ctx) {
  try {
    const { name } = await ctx.params;
    const buffer = await readUpload(name);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": mimeFromName(name),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Image not found" },
      { status: 404 },
    );
  }
}
