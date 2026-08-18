import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
      select: { id: true, role: true },
    });
    return NextResponse.redirect(new URL(membership ? "/" : "/onboarding", request.url));
  }

  if (session) {
    const membership = await prisma.workspaceMember.findFirst({
      where: { userId: session.user.id },
      select: { id: true, role: true },
    });
    if (!membership && request.nextUrl.pathname !== "/onboarding") {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
    if (membership && request.nextUrl.pathname === "/onboarding") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    if (membership?.role === "STAFF") {
      const staffAllowed = request.nextUrl.pathname.startsWith("/internal-requests");
      if (!staffAllowed) return NextResponse.redirect(new URL("/internal-requests", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
