import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes - no auth needed
  const publicRoutes = ["/", "/login", "/register"];
  const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith("/p/");

  // Check for token in cookies (we'll also check localStorage on client)
  const token = request.cookies.get("access_token")?.value;

  // For now, let all routes through - auth check happens client-side
  // This prevents SSR issues with localStorage
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};