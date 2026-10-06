import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/auth";

const SESSION_COOKIE_NAME = "gym_session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Read session token cookie
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = token ? await verifySessionToken(token) : null;

  // 1. If accessing /login and already logged in, redirect to /portal
  if (pathname === "/login") {
    if (user) {
      return NextResponse.redirect(new URL("/portal", request.url));
    }
    return NextResponse.next();
  }

  // 2. Protect all /portal routes
  if (pathname.startsWith("/portal")) {
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Role-based protection: /portal/settings is restricted to ADMIN and SUPERUSER
    if (pathname.startsWith("/portal/settings") && user.role === "FRONTDESK") {
      return NextResponse.redirect(new URL("/portal", request.url));
    }

    // Role-based protection: /portal/members/[id]/edit is restricted from FRONTDESK
    if (pathname.includes("/edit") && user.role === "FRONTDESK") {
      return NextResponse.redirect(new URL("/portal/members", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/portal/:path*", "/login"],
};
