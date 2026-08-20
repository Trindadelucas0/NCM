import "server-only";

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/src/lib/constants";
import { prisma, withTenant } from "./db";

export { SESSION_COOKIE };
const SESSION_HOURS = 8;

export type AuthUser = {
  id: string;
  companyId: string | null;
  email: string;
  name: string;
  role: "admin" | "consulta" | "superadmin";
  companyName: string | null;
};

export type CompanyAuthUser = AuthUser & { companyId: string; companyName: string };

function toAuthUser(user: {
  id: string;
  companyId: string | null;
  email: string;
  name: string;
  role: "admin" | "consulta" | "superadmin";
  company: { name: string } | null;
}): AuthUser {
  return {
    id: user.id,
    companyId: user.companyId,
    email: user.email,
    name: user.name,
    role: user.role,
    companyName: user.company?.name ?? null,
  };
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export async function authenticate(email: string, password: string): Promise<AuthUser | null> {
  const normalized = email.trim().toLowerCase();
  const user = await prisma.user.findFirst({
    where: { email: normalized },
    include: { company: true },
  });
  if (!user) {
    await bcrypt.hash(password, 10);
    return null;
  }
  if (user.role !== "superadmin" && !user.companyId) {
    await bcrypt.hash(password, 10);
    return null;
  }
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return null;
  return toAuthUser(user);
}

export async function createSession(user: AuthUser): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000);
  const data = {
    companyId: user.companyId,
    userId: user.id,
    tokenHash,
    expiresAt,
  };
  if (!user.companyId) {
    await prisma.session.create({ data });
    return token;
  }
  await withTenant(user.companyId, async (db) => {
    await db.session.create({ data });
  });
  return token;
}

export async function destroySession(token: string | undefined): Promise<void> {
  if (!token) return;
  const tokenHash = hashSessionToken(token);
  await prisma.session.deleteMany({ where: { tokenHash } });
}

export async function getUserFromToken(token: string | undefined): Promise<AuthUser | null> {
  if (!token) return null;
  const tokenHash = hashSessionToken(token);
  const session = await prisma.session.findFirst({
    where: { tokenHash, expiresAt: { gt: new Date() } },
    include: { user: { include: { company: true } } },
  });
  if (!session) return null;
  return toAuthUser(session.user);
}

export async function readSessionCookie(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(SESSION_COOKIE)?.value;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = await readSessionCookie();
  return getUserFromToken(token);
}

export function sessionCookieOptions() {
  const secure =
    process.env.COOKIE_SECURE === "1" ||
    (process.env.NODE_ENV === "production" && process.env.COOKIE_SECURE !== "0");
  return {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_HOURS * 60 * 60,
  };
}

export function requireRole(user: AuthUser, role: "admin"): void {
  if (user.role !== role || !user.companyId) {
    const error = new Error("FORBIDDEN") as Error & { status: number };
    error.status = 403;
    throw error;
  }
}
