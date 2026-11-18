import { NextResponse } from "next/server";
import {
  COOKIE_NAME,
  SESSION_SECONDS,
  createSession,
  safeEqual,
} from "@/lib/auth";

export async function POST(req: Request) {
  const expectedUser = process.env.ADMIN_USERNAME;
  const expectedPass = process.env.ADMIN_PASSWORD;

  if (!expectedUser || !expectedPass || !process.env.AUTH_SECRET) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Server is not configured. Set ADMIN_USERNAME, ADMIN_PASSWORD and AUTH_SECRET in .env",
      },
      { status: 500 },
    );
  }

  const body = await req.json().catch(() => null);
  const username = String(body?.username ?? "");
  const password = String(body?.password ?? "");

  const userOk = safeEqual(username, expectedUser);
  const passOk = safeEqual(password, expectedPass);

  if (!userOk || !passOk) {
    return NextResponse.json(
      { success: false, message: "Wrong username or password" },
      { status: 401 },
    );
  }

  const token = await createSession();
  const secure = process.env.COOKIE_SECURE
    ? process.env.COOKIE_SECURE === "true"
    : process.env.NODE_ENV === "production";

  const response = NextResponse.json({ success: true });
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: SESSION_SECONDS,
  });
  return response;
}
