import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const RESERVED = [
  "",
  "api",
  "dashboard",
  "login",
  "not-found",
  "password",
  "blog",
  "about-us",
  "agency",
  "media-partner",
  "podcast",
  "programs",
  "_next",
  "favicon.ico",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const slug = pathname.split("/")[1];

  // Shortlink rewrite
  if (pathname !== "/" && slug && !RESERVED.includes(slug)) {
    return NextResponse.rewrite(
      new URL(`/api/redirect${pathname}`, request.url),
    );
  }

  // Manual auth for dashboard
  if (pathname.startsWith("/dashboard")) {
    // Cek session token (NextAuth)
    const token =
      request.cookies.get("next-auth.session-token") ||
      request.cookies.get("__Secure-next-auth.session-token");
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
