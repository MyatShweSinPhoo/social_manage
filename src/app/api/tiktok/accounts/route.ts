import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bad, done } from "@/lib/tiktok/respond";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Never returns tokens. */
export async function GET() {
  const rows = await prisma.ttAccount.findMany({
    select: { id: true, name: true, openId: true, expiresAt: true },
    orderBy: { id: "asc" },
  });
  return NextResponse.json({ success: true, data: rows });
}

export async function POST(req: Request) {
  const f = await req.formData();

  if (String(f.get("action")) === "delete") {
    const id = Number(f.get("id"));
    if (id) await prisma.ttAccount.delete({ where: { id } }).catch(() => {});
    return done(req, undefined, "/tiktok/accounts");
  }

  const openId = String(f.get("openId") ?? "").trim();
  const accessToken = String(f.get("accessToken") ?? "").trim();
  if (!openId || !accessToken) return bad(req, "TikTok open_id and access token are required.");

  const expiresIn = Number(f.get("expiresIn") ?? 0);
  const data = {
    name: String(f.get("name") ?? "").trim() || openId,
    accessToken,
    refreshToken: String(f.get("refreshToken") ?? "").trim() || null,
    expiresAt: expiresIn > 0 ? new Date(Date.now() + expiresIn * 1000) : null,
  };
  await prisma.ttAccount.upsert({ where: { openId }, create: { openId, ...data }, update: data });
  return done(req, undefined, "/tiktok/accounts");
}
