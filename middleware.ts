import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "https://localhost:3000",
  "https://api.prediksi.my.id",
  "https://prediksi.my.id",
  "https://tstradio.wtf",
];

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
  "proxy-audio",
  "_next",
  "favicon.ico",
  "contributors",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const slug = pathname.split("/")[1];

  // --- CORS handling for all API routes ---
  if (pathname.startsWith("/api/")) {
    const origin = request.headers.get("origin") || "";
    const isAllowedOrigin = ALLOWED_ORIGINS.includes(origin);

    // Handle preflight requests
    if (request.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": isAllowedOrigin ? origin : "",
          "Access-Control-Allow-Methods":
            "GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH",
          "Access-Control-Allow-Headers":
            "Content-Type, Authorization, Range, Content-Range",
          "Access-Control-Max-Age": "86400",
          "Access-Control-Expose-Headers":
            "Content-Length, Content-Range, Accept-Ranges",
          "Access-Control-Allow-Credentials": "true",
        },
      });
    }

    // Attach CORS headers to all API responses
    const response = NextResponse.next();
    if (isAllowedOrigin) {
      response.headers.set("Access-Control-Allow-Origin", origin);
      response.headers.set("Access-Control-Allow-Credentials", "true");
      response.headers.set(
        "Access-Control-Expose-Headers",
        "Content-Length, Content-Range, Accept-Ranges",
      );
    }
    return response;
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
