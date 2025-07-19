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
  "faq",
  "_next",
  "favicon.ico",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const slug = pathname.split("/")[1];

  // --- CORS handling for all API routes ---
  if (pathname.startsWith("/api/")) {
    // Handle preflight requests
    if (request.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods":
            "GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH",
          "Access-Control-Allow-Headers":
            "Content-Type, Authorization, Range, Content-Range",
          "Access-Control-Max-Age": "86400",
          "Access-Control-Expose-Headers":
            "Content-Length, Content-Range, Accept-Ranges",
        },
      });
    }
    // For all API routes, allow CORS headers on response (for GET, POST, etc)
    // Note: You may want to add CORS headers to all API responses here if needed.
    // But for now, just let the request continue.
    return NextResponse.next();
  }

  // Logika rewrite untuk shortlink
  if (pathname !== "/" && slug && !RESERVED.includes(slug)) {
    return NextResponse.rewrite(
      new URL(`/api/redirect${pathname}`, request.url),
    );
  }

  // Logika autentikasi manual untuk dasbor
  if (pathname.startsWith("/dashboard")) {
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
  matcher: [
    // CORS for all API routes
    "/api/:path*",
    // Shortlink & dashboard logic for all non-API, non-static, non-public asset routes
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
