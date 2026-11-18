import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, safeEqual, verifySession } from "@/lib/auth";

// Everything needs the admin login, except:
//  - /login and the login/logout endpoints
//  - /api/cron/*          (protected by CRON_SECRET inside the route)
//  - /api/tiktok/media/*  (TikTok must be able to pull photos from a public URL)
const PUBLIC_PREFIXES = ["/login", "/api/auth/login", "/api/auth/logout", "/api/cron", "/api/tiktok/media/"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return NextResponse.next();

  if (await verifySession(req.cookies.get(COOKIE_NAME)?.value)) return NextResponse.next();

  // Scripts / mobile apps can call the API with HTTP basic auth.
  if (pathname.startsWith("/api")) {
    const user = process.env.ADMIN_USERNAME;
    const pass = process.env.ADMIN_PASSWORD;
    const header = req.headers.get("authorization");
    if (user && pass && header?.startsWith("Basic ")) {
      try {
        const [u, ...rest] = atob(header.slice(6)).split(":");
        if (safeEqual(u, user) && safeEqual(rest.join(":"), pass)) return NextResponse.next();
      } catch {
        /* fall through to 401 */
      }
    }
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401, headers: { "WWW-Authenticate": 'Basic realm="Social Hub"' } },
    );
  }

  return NextResponse.redirect(new URL("/login", req.url));
}

export const config = {
  matcher: ["/((?!_next/|favicon.ico).*)"],
};
