import { NextResponse } from "next/server";

/** JSON for fetch/API clients, redirect back to the TikTok panel for plain HTML forms. */
export function done(req: Request, body: unknown = { success: true }, to = "/tiktok") {
  if (req.headers.get("accept")?.includes("application/json")) return NextResponse.json(body);
  return NextResponse.redirect(new URL(to, req.url), 303);
}

export function bad(req: Request, message: string, status = 400) {
  if (req.headers.get("accept")?.includes("application/json")) {
    return NextResponse.json({ success: false, message }, { status });
  }
  return new NextResponse(message, { status });
}
