import { type NextRequest, NextResponse } from "next/server";

// Synchronous middleware — zero network calls, zero async, zero timeout risk.
// Actual token verification happens inside each page/API route via getUser().
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAuthPage  = pathname.startsWith("/auth");
  const isPublicPage = pathname === "/";

  if (isAuthPage || isPublicPage) return NextResponse.next();

  // Detect Supabase session cookie without instantiating a client.
  // @supabase/ssr stores the session as sb-<project-ref>-auth-token.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const projectRef  = supabaseUrl.match(/\/\/([^.]+)\./)?.[1] ?? "";
  const cookieName  = `sb-${projectRef}-auth-token`;

  const hasSession =
    request.cookies.has(cookieName) ||
    // fallback for older cookie names
    request.cookies.has("sb-access-token") ||
    [...request.cookies.getAll()].some((c) => c.name.endsWith("-auth-token"));

  if (!hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Skip API routes, static files, Next.js internals.
  matcher: [
    "/((?!api/|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
