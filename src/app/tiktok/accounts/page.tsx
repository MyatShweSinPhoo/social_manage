import { prisma } from "@/lib/prisma";
import { fmt } from "@/lib/tiktok/config";
import Top from "@/components/tiktok/Top";

export const dynamic = "force-dynamic";

export default async function Accounts() {
  const accounts = await prisma.ttAccount.findMany({ orderBy: { id: "asc" } });
  const mode = process.env.TIKTOK_MODE === "direct" ? "direct" : "inbox";
  return (
    <>
      <Top title="TikTok Accounts" />
      <div className="tt-body">
        <p className="tt-m" style={{ margin: 0 }}>
          Publish mode: <b style={{ color: "#fff" }}>{mode === "direct" ? "Direct post" : "Send to TikTok drafts (inbox)"}</b>
          {" · "}privacy: <b style={{ color: "#fff" }}>{process.env.TIKTOK_PRIVACY ?? "SELF_ONLY"}</b>
        </p>

        {accounts.length === 0 && <p className="tt-empty">No TikTok account connected yet.</p>}
        {accounts.map((a) => (
          <article key={a.id} className="tt-card">
            <div className="tt-row">
              <span className="tt-t">@{a.name}</span>
              <form action="/api/tiktok/accounts" method="post">
                <input type="hidden" name="action" value="delete" />
                <input type="hidden" name="id" value={a.id} />
                <button type="submit" className="link">Remove</button>
              </form>
            </div>
            <p className="tt-m">open_id {a.openId}{a.expiresAt ? ` · access token expires ${fmt(a.expiresAt)}` : ""}</p>
          </article>
        ))}

        <form action="/api/tiktok/accounts" method="post" className="tt-card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <span className="tt-t">Connect a TikTok account</span>
          <div>
            <label className="l" htmlFor="name">TikTok username</label>
            <input id="name" name="name" className="in" placeholder="my_tiktok_name" />
          </div>
          <div>
            <label className="l" htmlFor="openId">TikTok open_id</label>
            <input id="openId" name="openId" className="in" required />
          </div>
          <div>
            <label className="l" htmlFor="accessToken">Access token</label>
            <input id="accessToken" name="accessToken" type="password" className="in" required />
          </div>
          <div>
            <label className="l" htmlFor="refreshToken">Refresh token</label>
            <input id="refreshToken" name="refreshToken" type="password" className="in" />
          </div>
          <div>
            <label className="l" htmlFor="expiresIn">Access token lifetime (seconds, e.g. 86400)</label>
            <input id="expiresIn" name="expiresIn" type="number" className="in" />
          </div>
          <button type="submit" className="s full">Save TikTok account</button>
        </form>
      </div>
    </>
  );
}
