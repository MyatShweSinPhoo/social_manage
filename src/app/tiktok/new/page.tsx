import { prisma } from "@/lib/prisma";
import { tzName } from "@/lib/tiktok/config";
import Top from "@/components/tiktok/Top";
import NewVideoForm from "@/components/tiktok/NewVideoForm";

export const dynamic = "force-dynamic";

export default async function NewPost() {
  const accounts = await prisma.ttAccount.findMany({ orderBy: { id: "asc" }, select: { id: true, name: true } });
  return (
    <>
      <Top title="New TikTok" />
      <div className="tt-body">
        {accounts.length === 0 ? (
          <p className="tt-empty">Connect a TikTok account first in the Accounts tab.</p>
        ) : (
          <NewVideoForm accounts={accounts} tz={tzName()} />
        )}
      </div>
    </>
  );
}
