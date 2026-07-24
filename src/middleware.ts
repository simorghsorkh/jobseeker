import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  try {
    return await updateSession(request);
  } catch {
    // If Supabase middleware fails (e.g. misconfigured env), let the request
    // pass through — individual pages and server components will re-check auth.
    return NextResponse.next();
  }
}

export const config = {
  // Only run on page routes — skip API routes, static files, and Next.js internals.
  // API routes call getUser() themselves; they don't need middleware redirect logic.
  matcher: [
    "/((?!api/|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
