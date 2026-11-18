import PostForm from "@/components/facebook/PostForm";

export default function NewPostPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">New post</h1>
        <p className="mt-1 text-sm text-slate-500">
          Choose an image, write a caption and pick when it should go live on
          your Facebook Page.
        </p>
      </div>
      <PostForm />
    </div>
  );
}
