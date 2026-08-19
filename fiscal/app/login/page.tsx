"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import { Field } from "@/src/components/ui/field";

type CompanyOption = { slug: string; name: string };

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [company, setCompany] = useState("");
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  useEffect(() => {
    const ctrl = new AbortController();
    fetch("/api/auth/companies", { signal: ctrl.signal })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error?.message ?? "Não foi possível listar empresas.");
        const list = (json.data.companies ?? []) as CompanyOption[];
        setCompanies(list);
        setCompany((current) => current || list[0]?.slug || "");
      })
      .catch((err: Error) => {
        if (err.name !== "AbortError") setError(err.message);
      })
      .finally(() => setLoadingCompanies(false));
    return () => ctrl.abort();
  }, []);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, company }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error?.message ?? "Não foi possível entrar.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Falha de rede. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-ink-muted">Escritório</p>
        <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">Auditor Fiscal</h1>
        <p className="mt-3 text-sm text-ink-muted">
          Entre na empresa. As regras fiscais de cada empresa não se misturam.
        </p>
        <form onSubmit={onSubmit} className="mt-8 grid gap-4 rounded-lg border border-line bg-white p-6 shadow-panel">
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-ink">Empresa</span>
            <select
              name="company"
              required
              disabled={loadingCompanies || companies.length === 0}
              className="min-h-11 rounded-md border border-line bg-white px-3 text-base md:text-sm"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            >
              {companies.length === 0 ? (
                <option value="">Nenhuma empresa cadastrada</option>
              ) : (
                companies.map((item) => (
                  <option key={item.slug} value={item.slug}>
                    {item.name}
                  </option>
                ))
              )}
            </select>
          </label>
          <Field
            label="E-mail"
            name="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Field
            label="Senha"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error ? (
            <p role="alert" className="text-sm text-status-bad">
              {error}
            </p>
          ) : null}
          <Button type="submit" disabled={loading || loadingCompanies || !company}>
            {loading ? "Entrando…" : "Entrar"}
          </Button>
        </form>
      </div>
    </main>
  );
}
