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
    /*
     * Cocokkan semua path permintaan kecuali untuk:
     * - api (Rute API)
     * - _next/static (File statis Next.js)
     * - _next/image (File optimisasi gambar Next.js)
     * - favicon.ico (File favicon)
     * - Semua file di dalam direktori public dengan mengecualikan file yang memiliki ekstensi (misalnya .png, .jpg, .svg)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
