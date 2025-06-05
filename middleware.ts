// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { navItems } from "./app/data/navbarData";

function getRequiredRoles(pathname: string): string[] | null {
  // Find the most specific matching route (longest match first)
  const matchingItems = navItems
    .filter((item) => item.requiredRoles && pathname.startsWith(item.href))
    .sort((a, b) => b.href.length - a.href.length);

  const bestMatch = matchingItems[0];
  return bestMatch?.requiredRoles || null;
}

export async function middleware(request: NextRequest) {
  const sessionCookie =
    request.cookies.get("next-auth.session-token") ||
    request.cookies.get("__Secure-next-auth.session-token");
  const roleTokenCookie = request.cookies.get("user-role-token");

  // Clear stale cookies if no session
  if (!sessionCookie && roleTokenCookie) {
    const response = NextResponse.next();
    response.cookies.set("user-role-token", "", {
      httpOnly: true,
      maxAge: 0,
      path: "/",
    });
    return response;
  }

  // Clear expired role cookies on all routes
  if (roleTokenCookie) {
    try {
      const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);
      await jwtVerify(roleTokenCookie.value, secret);
    } catch (error) {
      const response = NextResponse.next();
      response.cookies.set("user-role-token", "", {
        httpOnly: true,
        maxAge: 0,
        path: "/",
      });

      const requiredRoles = getRequiredRoles(request.nextUrl.pathname);
      if (requiredRoles) {
        const returnUrl = encodeURIComponent(
          request.nextUrl.pathname + request.nextUrl.search
        );
        return NextResponse.redirect(
          new URL(
            `/api/cookie/set-cookie-redirect?returnTo=${returnUrl}`,
            request.url
          )
        );
      }

      return response;
    }
  }

  // Check permissions for protected routes
  const requiredRoles = getRequiredRoles(request.nextUrl.pathname);
  if (requiredRoles) {
    if (!roleTokenCookie) {
      const returnUrl = encodeURIComponent(
        request.nextUrl.pathname + request.nextUrl.search
      );
      return NextResponse.redirect(
        new URL(
          `/api/cookie/set-cookie-redirect?returnTo=${returnUrl}`,
          request.url
        )
      );
    }

    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);
    const { payload } = await jwtVerify(roleTokenCookie.value, secret);
    const userRole = payload.role?.name as string;

    if (!requiredRoles.includes(userRole)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
