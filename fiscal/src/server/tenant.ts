import "server-only";

import { notFound } from "next/navigation";
import type { AuthUser } from "./auth";
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

export function requireAdmin(user: AuthUser): void {
  if (user.role !== "admin") {
    throw new HttpError(403, "FORBIDDEN", "Esta ação exige perfil administrador.");
  }
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
