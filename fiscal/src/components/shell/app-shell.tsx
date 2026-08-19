"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/src/components/ui/button";

const NAV = [
  { href: "/dashboard", label: "Panorama" },
  { href: "/consulta", label: "Consultar" },
  { href: "/divergencias", label: "Divergências" },
  { href: "/base-fiscal", label: "Base fiscal" },
  { href: "/importar", label: "Importar", admin: true },
];

type Me = {
  name: string;
  email: string;
  role: "admin" | "consulta";
  companyName: string;
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/auth/me", { signal: controller.signal })
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        if (!res.ok) {
          throw new Error(json.error?.message ?? "Não foi possível validar a sessão");
        }
        setMe(json.data);
        setError("");
      })
      .catch((err: Error) => {
        if (err.name === "AbortError") return;
        setError(err.message || "Falha de rede. Se o servidor estiver reiniciando, aguarde e recarregue.");
      });
    return () => controller.abort();
  }, [router]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const links = NAV.filter((item) => !item.admin || me?.role === "admin");

  return (
    <div className="min-h-screen bg-paper">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-white focus:px-3 focus:py-2">
        Ir para o conteúdo
      </a>
      <header className="sticky top-0 z-30 border-b border-line bg-paper-raised/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-2">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-line bg-white md:hidden"
              aria-expanded={open}
              aria-controls="menu-principal"
              onClick={() => setOpen((v) => !v)}
            >
              <span className="sr-only">Menu</span>
              <span className="flex flex-col gap-1" aria-hidden>
                <span className="block h-0.5 w-5 bg-ink" />
                <span className="block h-0.5 w-5 bg-ink" />
                <span className="block h-0.5 w-5 bg-ink" />
              </span>
            </button>
            <Link href="/dashboard" className="leading-tight">
              <span className="block text-[11px] font-medium uppercase tracking-[0.16em] text-ink-muted">
                Escritório
              </span>
              <span className="font-display text-lg text-brand">Auditor Fiscal</span>
            </Link>
          </div>
          <div className="hidden items-center gap-3 text-sm md:flex">
            <div className="text-right">
              <p className="font-medium text-ink">{me?.companyName ?? "BAIFER"}</p>
              <p className="text-ink-muted">{me ? `${me.name} · ${me.role}` : "…"}</p>
            </div>
            <Button variant="secondary" onClick={logout}>
              Sair
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1600px]">
        <nav
          id="menu-principal"
          className={`${open ? "block" : "hidden"} w-full border-b border-line bg-white px-4 py-3 md:block md:w-56 md:border-b-0 md:border-r md:bg-transparent md:py-8`}
        >
          <ul className="grid gap-1">
            {links.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`block rounded-md px-3 py-2.5 text-sm ${
                      active ? "bg-brand text-white" : "text-ink hover:bg-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 md:hidden">
            <Button variant="secondary" className="w-full" onClick={logout}>
              Sair
            </Button>
          </div>
        </nav>
        <main id="conteudo" className="min-w-0 flex-1 px-4 py-6 sm:px-8">
          {error ? <p className="mb-4 text-sm text-status-bad">{error}</p> : null}
          {children}
        </main>
      </div>
    </div>
  );
}
