import "server-only";

import { notFound } from "next/navigation";
import type { AuthUser, CompanyAuthUser } from "./auth";
import { getCurrentUser } from "./auth";

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new HttpError(401, "UNAUTHORIZED", "Sessão inválida ou expirada.");
  }
  return user;
}

export function requireSuperAdmin(user: AuthUser): void {
  if (user.role !== "superadmin") {
    throw new HttpError(403, "FORBIDDEN", "Esta ação exige o administrador do escritório.");
  }
}

export function requireAdmin(user: AuthUser): void {
  if (user.role !== "admin" || !user.companyId) {
    throw new HttpError(403, "FORBIDDEN", "Esta ação exige perfil administrador da empresa.");
  }
}

export function requireCompanyUser(user: AuthUser): asserts user is CompanyAuthUser {
  if (user.role === "superadmin" || !user.companyId) {
    throw new HttpError(
      403,
      "FORBIDDEN",
      "Esta ação é da empresa. Entre com o login cadastrado nela.",
    );
  }
}

export async function requireCompanySession(): Promise<CompanyAuthUser> {
  const user = await requireUser();
  requireCompanyUser(user);
  return user;
}

export function tenantWhere(companyId: string) {
  if (!companyId) {
    throw new HttpError(400, "TENANT_REQUIRED", "Empresa ativa não informada.");
  }
  return { companyId };
}

export function ownedWhere(id: string, companyId: string) {
  if (!companyId) {
    throw new HttpError(400, "TENANT_REQUIRED", "Empresa ativa não informada.");
  }
  return { id, companyId };
}

export async function requirePageUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    notFound();
  }
  return user;
}
