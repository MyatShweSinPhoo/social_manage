import Link from "next/link";
import { notFound } from "next/navigation";
import PostForm from "@/components/facebook/PostForm";
import { prisma } from "@/lib/prisma";
import { serializePost } from "@/lib/facebook/serialize";

export const dynamic = "force-dynamic";

const EDITABLE = ["DRAFT", "SCHEDULED", "FAILED"];

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const postId = Number(id);
  if (!Number.isInteger(postId) || postId <= 0) notFound();

  const post = await prisma.fbPost.findUnique({ where: { id: postId } });
  if (!post) notFound();

  if (!EDITABLE.includes(post.status)) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-3xl">🔒</p>
        <h1 className="mt-3 text-lg font-bold text-slate-900">
          This post can&apos;t be edited
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Posts that are being published or already posted are locked.
        </p>
        <Link
          href="/facebook"
          className="mt-5 inline-block text-sm font-semibold text-indigo-600 hover:text-indigo-700"
        >
          ← Back to posts
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Edit post</h1>
        <p className="mt-1 text-sm text-slate-500">
          Update the image, caption or schedule time.
        </p>
      </div>
      <PostForm post={serializePost(post)} />
    </div>
  );
}
