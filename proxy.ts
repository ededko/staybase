import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { effectivePermissions } from "@/lib/permissions";

const publicPaths = new Set(["/login", "/register"]);

export async function proxy(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  const isPublicPath = publicPaths.has(request.nextUrl.pathname) || request.nextUrl.pathname.startsWith("/report/maintenance");

  if (!session && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (session && isPublicPath) {
    const membership = await prisma.workspaceMember.findFirst({
      where: { userId: session.user.id },
      select: { id: true, role: true, permissions: true, permissionsConfigured: true },
    });
    return NextResponse.redirect(new URL(membership ? "/" : "/onboarding", request.url));
  }

  if (session) {
    const membership = await prisma.workspaceMember.findFirst({
      where: { userId: session.user.id },
      select: { id: true, role: true, permissions: true, permissionsConfigured: true },
    });
    if (!membership && request.nextUrl.pathname !== "/onboarding") {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
    if (membership && request.nextUrl.pathname === "/onboarding") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    if (membership && membership.role !== "OWNER") {
      const permissions = effectivePermissions(membership);
      const routeRules: Array<[string, string[]]> = [
        ["/hostels", ["HOSTELS_VIEW"]], ["/rooms", ["ROOMS_VIEW"]],
        ["/residents", ["RESIDENTS_VIEW"]], ["/payments", ["PAYMENTS_VIEW"]],
        ["/applications", ["APPLICATIONS_VIEW"]], ["/maintenance", ["MAINTENANCE_VIEW", "MAINTENANCE_ASSIGNED"]],
        ["/internal-requests", ["REQUESTS_VIEW", "REQUESTS_OWN"]], ["/quality", ["QUALITY_VIEW"]],
        ["/settings/activity", ["AUDIT_VIEW"]], ["/settings/team", ["TEAM_VIEW"]],
        ["/", ["DASHBOARD_VIEW"]],
      ];
      const rule = routeRules.find(([path]) => path === "/" ? request.nextUrl.pathname === "/" : request.nextUrl.pathname.startsWith(path));
      if (rule && !rule[1].some((permission) => permissions.includes(permission as never))) {
        const fallback = routeRules.find(([, required]) => required.some((permission) => permissions.includes(permission as never)))?.[0] || "/login";
        return NextResponse.redirect(new URL(fallback, request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
