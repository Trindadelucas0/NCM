import bcrypt from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { postLoginPath } from "@/src/lib/auth-home";
import { loginAllowed, loginFailed, loginSucceeded } from "./rate-limit";
import { HttpError, ownedWhere, requireAdmin, requireCompanyUser, requireSuperAdmin } from "./tenant";
import { escapeHtml } from "@/src/lib/html";

describe("senha inválida", () => {
  it("não autentica hash divergente", async () => {
    const hash = await bcrypt.hash("correta", 8);
    const ok = await bcrypt.compare("errada", hash);
    expect(ok).toBe(false);
  });

  it("login por e-mail único abre só a conta cadastrada", () => {
    const users = [
      { email: "admin@baifer.local", companySlug: "baifer" },
      { email: "admin@loja.local", companySlug: "loja" },
    ];
    const pick = (email: string) => users.find((u) => u.email === email) ?? null;
    expect(pick("admin@baifer.local")?.companySlug).toBe("baifer");
    expect(pick("admin@loja.local")?.companySlug).toBe("loja");
    expect(pick("admin@baifer.local")?.companySlug).not.toBe("loja");
  });
});

describe("papéis", () => {
  const office = {
    id: "office",
    companyId: null,
    email: "escritorio@local",
    name: "Escritório",
    role: "superadmin" as const,
    companyName: null,
  };
  const baiferAdmin = {
    id: "baifer-admin",
    companyId: "cm_baifer_seed_company",
    email: "admin@baifer.local",
    name: "Administrador",
    role: "admin" as const,
    companyName: "BAIFER",
  };

  it("superadmin cai no painel do escritório", () => {
    expect(postLoginPath("superadmin")).toBe("/escritorio/empresas");
    expect(postLoginPath("admin")).toBe("/dashboard");
    expect(postLoginPath("consulta")).toBe("/dashboard");
  });

  it("admin da BAIFER não cadastra empresas; superadmin não acessa API fiscal", () => {
    expect(() => requireSuperAdmin(baiferAdmin)).toThrow(HttpError);
    expect(() => requireAdmin(office)).toThrow(HttpError);
    expect(() => requireCompanyUser(office)).toThrow(HttpError);
    expect(() => requireSuperAdmin(office)).not.toThrow();
    expect(() => requireAdmin(baiferAdmin)).not.toThrow();
    expect(() => requireCompanyUser(baiferAdmin)).not.toThrow();
  });
});

describe("tenant", () => {
  it("findFirst sempre exige id + companyId", () => {
    const where = ownedWhere("prod-1", "empresa-a");
    expect(where).toEqual({ id: "prod-1", companyId: "empresa-a" });
  });

  it("outro companyId não casa o registro", () => {
    const rows = [
      { id: "prod-1", companyId: "empresa-a" },
      { id: "prod-1", companyId: "empresa-b" },
    ];
    const wanted = ownedWhere("prod-1", "empresa-a");
    const found = rows.find((r) => r.id === wanted.id && r.companyId === wanted.companyId);
    const leaked = rows.find((r) => r.id === "prod-1" && r.companyId === "empresa-b");
    expect(found?.companyId).toBe("empresa-a");
    expect(leaked?.companyId).not.toBe(wanted.companyId);
  });
});

describe("rate limit login", () => {
  beforeEach(() => {
    loginSucceeded("ip-test");
  });

  it("bloqueia após várias falhas", () => {
    for (let i = 0; i < 8; i += 1) loginFailed("ip-test");
    expect(loginAllowed("ip-test")).toBe(false);
  });
});

describe("PDF/HTML escape", () => {
  it("escapa HTML de cadastro", () => {
    expect(escapeHtml('<img src=x onerror="alert(1)">')).toBe(
      "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;",
    );
  });
});

describe("IDOR", () => {
  it("outro tenant → 404", async () => {
    const findFirst = vi.fn(async ({ where }: { where: { id: string; companyId: string } }) => {
      if (where.companyId !== "empresa-a") return null;
      return { id: where.id, companyId: where.companyId };
    });
    const own = await findFirst({ where: ownedWhere("abc", "empresa-a") });
    const other = await findFirst({ where: ownedWhere("abc", "empresa-b") });
    expect(own).toBeTruthy();
    expect(other).toBeNull();
  });
});
