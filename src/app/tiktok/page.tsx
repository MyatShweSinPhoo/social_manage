import { prisma } from "@/lib/prisma";
import { fmt } from "@/lib/tiktok/config";
import Top from "@/components/tiktok/Top";

export const dynamic = "force-dynamic";

const color: Record<string, string> = {
  PUBLISHED: "#34d399", FAILED: "#fe2c55", REJECTED: "#fe2c55",
  PENDING_APPROVAL: "#fbbf24", PUBLISHING: "#fbbf24", SCHEDULED: "#25f4ee",
};

const actionsFor = (status: string) => {
  const a: [string, string, boolean][] = [];
  if (status === "PENDING_APPROVAL") a.push(["approve", "Approve", true]);
  if (status === "FAILED") a.push(["retry", "Retry", true]);
  if (!["PUBLISHING", "PUBLISHED", "REJECTED"].includes(status)) a.push(["reject", "Reject", false]);
  if (status !== "PUBLISHING") a.push(["delete", "Delete", false]);
  return a;
};

export default async function QueuePage() {
  const posts = await prisma.ttPost.findMany({ include: { account: true }, orderBy: { id: "desc" }, take: 60 });
  return (
    <>
      <Top title="TikTok Queue" signOut />
      <div className="tt-body">
        {posts.length === 0 && (
          <p className="tt-empty">No posts yet. Create one in the New video tab or send a video to your Telegram bot.</p>
        )}
        {posts.map((p) => {
          const src = `/api/tiktok/media/${encodeURIComponent(p.mediaFile)}`;
          return (
            <article key={p.id} className="tt-card">
              <div className="tt-item">
                {p.mediaType === "VIDEO" ? (
                  <video className="tt-thumb" src={`${src}#t=0.1`} preload="metadata" muted playsInline />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="tt-thumb" src={src} alt="" />
                )}
                <div className="grow">
                  <div className="tt-row">
                    <span className="tt-t">@{p.account.name}</span>
                    <span className="tt-st" style={{ color: color[p.status] }}>
                      {p.status.replace("_", " ").toLowerCase()}
                    </span>
                  </div>
                  <p className="tt-cap">{p.caption || "No caption"}</p>
                  <p className="tt-m">
                    #{p.id} · {p.mediaType.toLowerCase()} ·{" "}
                    {p.publishedAt || p.scheduledAt ? fmt(p.publishedAt ?? p.scheduledAt) : "Not scheduled"}
                  </p>
                </div>
              </div>
              {p.error && <p className="tt-err">{p.error}</p>}
              <div className="tt-btns">
                {actionsFor(p.status).map(([action, label, solid]) => (
                  <form key={action} action={`/api/tiktok/posts/${p.id}`} method="post">
                    <input type="hidden" name="action" value={action} />
                    <button type="submit" className={solid ? "s" : ""}>{label}</button>
                  </form>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
