"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Field } from "@/src/components/ui/field";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [company, setCompany] = useState("baifer");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-ink-muted">
          Escritório · BAIFER e Loja das Máquinas
        </p>
        <h1 className="mt-2 font-display text-4xl text-ink">Auditor Fiscal</h1>
        <p className="mt-3 text-sm text-ink-muted">
          Escolha a empresa. As regras da BAIFER (OK.xlsx) e da Loja (aba LOJA do ODS) não se misturam.
        </p>
        <form onSubmit={onSubmit} className="mt-8 grid gap-4 rounded-lg border border-line bg-white p-6 shadow-panel">
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-ink">Empresa</span>
            <select
              name="company"
              required
              className="min-h-11 rounded-md border border-line bg-white px-3"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            >
              <option value="baifer">BAIFER</option>
              <option value="loja">Loja das Máquinas</option>
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
          <Button type="submit" disabled={loading}>
            {loading ? "Entrando…" : "Entrar"}
          </Button>
        </form>
      </div>
    </main>
  );
}
