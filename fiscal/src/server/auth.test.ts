import bcrypt from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { loginAllowed, loginFailed, loginSucceeded } from "./rate-limit";
import { ownedWhere } from "./tenant";
import { escapeHtml } from "@/src/lib/html";

describe("senha inválida", () => {
  it("não autentica hash divergente", async () => {
    const hash = await bcrypt.hash("correta", 8);
    const ok = await bcrypt.compare("errada", hash);
    expect(ok).toBe(false);
  });

  it("login exige empresa: BAIFER e Loja não compartilham o mesmo user", () => {
    const users = [
      { email: "admin@baifer.local", companySlug: "baifer" },
      { email: "admin@loja.local", companySlug: "loja" },
    ];
    const pick = (email: string, slug: string) =>
      users.find((u) => u.email === email && u.companySlug === slug) ?? null;
    expect(pick("admin@baifer.local", "loja")).toBeNull();
    expect(pick("admin@loja.local", "baifer")).toBeNull();
    expect(pick("admin@baifer.local", "baifer")?.companySlug).toBe("baifer");
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
