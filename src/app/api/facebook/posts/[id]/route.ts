import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fail, HttpError } from "@/lib/http";
import { serializePost } from "@/lib/facebook/serialize";
import { parsePostForm } from "@/lib/facebook/postInput";
import { deleteUpload, saveUpload } from "@/lib/facebook/uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const EDITABLE = ["DRAFT", "SCHEDULED", "FAILED"];

async function getId(ctx: Ctx) {
  const { id } = await ctx.params;
  const parsed = Number(id);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new HttpError(400, "Invalid id");
  }
  return parsed;
}

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const id = await getId(ctx);
    const post = await prisma.fbPost.findUnique({ where: { id } });
    if (!post) throw new HttpError(404, "Post not found");
    return NextResponse.json({ success: true, data: serializePost(post) });
  } catch (error) {
    return fail(error);
  }
}

export async function PUT(req: Request, ctx: Ctx) {
  try {
    const id = await getId(ctx);
    const existing = await prisma.fbPost.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, "Post not found");

    if (!EDITABLE.includes(existing.status)) {
      throw new HttpError(409, "This post can no longer be edited");
    }

    const input = await parsePostForm(req);

    const willHaveImage = input.image
      ? true
      : input.removeImage
        ? false
        : Boolean(existing.imageName);

    if (!input.caption && !willHaveImage) {
      throw new HttpError(400, "Add a caption or an image");
    }

    let imageName = existing.imageName;
    if (input.image) {
      const newName = await saveUpload(input.image);
      await deleteUpload(existing.imageName);
      imageName = newName;
    } else if (input.removeImage) {
      await deleteUpload(existing.imageName);
      imageName = null;
    }

    const post = await prisma.fbPost.update({
      where: { id },
      data: {
        caption: input.caption,
        imageName,
        scheduledAt: input.scheduledAt,
        status: input.status,
        errorMessage: null,
        attempts: 0,
      },
    });

    return NextResponse.json({ success: true, data: serializePost(post) });
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const id = await getId(ctx);
    const existing = await prisma.fbPost.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, "Post not found");

    if (existing.status === "PUBLISHING") {
      throw new HttpError(409, "This post is being published right now");
    }

    await deleteUpload(existing.imageName);
    await prisma.fbPost.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return fail(error);
  }
}
