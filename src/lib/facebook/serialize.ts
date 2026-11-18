import type { FbPost } from "@prisma/client";

export type PostDTO = {
  id: number;
  caption: string;
  imageUrl: string | null;
  scheduledAt: string | null;
  status: "DRAFT" | "SCHEDULED" | "PUBLISHING" | "POSTED" | "FAILED";
  facebookPostId: string | null;
  errorMessage: string | null;
  postedAt: string | null;
  attempts: number;
  createdAt: string;
  updatedAt: string;
};

export function serializePost(post: FbPost): PostDTO {
  return {
    id: post.id,
    caption: post.caption,
    imageUrl: post.imageName ? `/api/facebook/uploads/${post.imageName}` : null,
    scheduledAt: post.scheduledAt ? post.scheduledAt.toISOString() : null,
    status: post.status,
    facebookPostId: post.facebookPostId,
    errorMessage: post.errorMessage,
    postedAt: post.postedAt ? post.postedAt.toISOString() : null,
    attempts: post.attempts,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  };
}
