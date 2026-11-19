import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import type { TenantMembership, Tenant } from "@prisma/client";
import { db } from "./db";
import { SessionUser, TenantRole } from "./types";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "super-secure-production-ready-jwt-key-32chars!"
);

const COOKIE_NAME = "client_platform_session";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function setSessionCookie(userId: string) {
  const token = await createSessionToken(userId);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.sub as string;
    if (!userId) return null;

    const user = await db.user.findUnique({
      where: { id: userId, status: "ACTIVE" },
      include: {
        memberships: {
          include: {
            tenant: true,
          },
        },
      },
    });

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as "SUPERADMIN" | "CLIENT_USER",
      tenants: user.memberships.map((m: TenantMembership & { tenant: Tenant }) => ({
        id: m.tenant.id,
        name: m.tenant.name,
        slug: m.tenant.slug,
        role: m.role as TenantRole,
      })),
    };
  } catch (err) {
    return null;
  }
}

import { redirect } from "next/navigation";

export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

export async function requireSuperadmin(): Promise<SessionUser> {
  const session = await requireAuth();
  if (session.role !== "SUPERADMIN") {
    redirect("/login");
  }
  return session;
}

export async function requireTenantAccess(tenantSlug: string) {
  const session = await requireAuth();

  // Superadmins can inspect any tenant
  if (session.role === "SUPERADMIN") {
    const tenant = await db.tenant.findUnique({
      where: { slug: tenantSlug },
    });
    if (!tenant) redirect("/admin");
    return {
      session,
      tenant,
      role: "CLIENT_ADMIN" as TenantRole,
      isSuperadmin: true,
    };
  }

  // Client user must belong to this tenant
  const membership = session.tenants.find((t) => t.slug === tenantSlug);
  if (!membership) {
    redirect("/login");
  }

  const tenant = await db.tenant.findUnique({
    where: { slug: tenantSlug, status: "ACTIVE" },
  });
  if (!tenant) redirect("/login");

  return {
    session,
    tenant,
    role: membership.role,
    isSuperadmin: false,
  };
}
