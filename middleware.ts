import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Handle short link redirects
async function handleShortLinkRedirect(request: NextRequest) {
  const url = request.nextUrl.clone();
  const pathname = url.pathname;

  // Only handle paths that look like short links (single segment, not starting with /)
  if (
    pathname &&
    pathname !== "/" &&
    !pathname.startsWith("/") &&
    !pathname.includes("/")
  ) {
    const slug = pathname.substring(1); // Remove leading slash

    // Skip if it's a known route
    if (
      [
        "dashboard",
        "api",
        "login",
        "password",
        "blog",
        "about-us",
        "agency",
        "media-partner",
        "podcast",
        "programs",
      ].includes(slug)
    ) {
      return null;
    }

    // Redirect to our API endpoint
    const redirectUrl = new URL(`/api/redirect/${slug}`, request.url);
    return NextResponse.rewrite(redirectUrl);
  }

  return null;
}

// Main middleware function
export default async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();

  // Handle short link redirects first
  const shortLinkRedirect = await handleShortLinkRedirect(request);
  if (shortLinkRedirect) {
    return shortLinkRedirect;
  }

  // Handle dashboard authentication
  if (url.pathname.startsWith("/dashboard")) {
    return withAuth({
      pages: {
        signIn: "/login",
      },
      callbacks: {
        authorized: ({ token }) => !!token,
      },
    })(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
