import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fail, HttpError } from "@/lib/http";
import { serializePost } from "@/lib/facebook/serialize";
import { parsePostForm } from "@/lib/facebook/postInput";
import { saveUpload } from "@/lib/facebook/uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// List all posts
export async function GET() {
  try {
    const posts = await prisma.fbPost.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, data: posts.map(serializePost) });
  } catch (error) {
    return fail(error);
  }
}

// Create a post (multipart form: caption, status, scheduledAt, image)
export async function POST(req: Request) {
  try {
    const input = await parsePostForm(req);

    if (!input.caption && !input.image) {
      throw new HttpError(400, "Add a caption or an image");
    }

    const imageName = input.image ? await saveUpload(input.image) : null;

    const post = await prisma.fbPost.create({
      data: {
        caption: input.caption,
        imageName,
        scheduledAt: input.scheduledAt,
        status: input.status,
      },
    });

    return NextResponse.json(
      { success: true, data: serializePost(post) },
      { status: 201 },
    );
  } catch (error) {
    return fail(error);
  }
}
