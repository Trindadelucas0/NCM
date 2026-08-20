"use client";

import { useEffect, useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Field } from "@/src/components/ui/field";
import { PageHeader } from "@/src/components/ui/page-header";

type CompanyRow = { id: string; name: string; slug: string; createdAt: string };

export default function EscritorioEmpresasPage() {
  const [forbidden, setForbidden] = useState(false);
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const me = await fetch("/api/auth/me").then((r) => r.json());
      if (me.data?.role !== "superadmin") {
        setForbidden(true);
        return;
      }
      const res = await fetch("/api/companies");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? "Falha ao listar empresas.");
      setCompanies(json.data.companies ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, adminName, adminEmail, adminPassword }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? "Não foi possível cadastrar.");
      setSuccess(
        `Empresa “${json.data.company.name}” criada. Entre com ${json.data.admin.email} para abrir o painel fiscal dela.`,
      );
      setName("");
      setSlug("");
      setAdminName("");
      setAdminEmail("");
      setAdminPassword("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível cadastrar.");
    } finally {
      setSaving(false);
    }
  }

  if (forbidden) {
    return (
      <p className="text-sm text-status-bad">Somente o administrador do escritório cadastra empresas.</p>
    );
  }

  return (
    <div className="grid gap-8">
      <PageHeader
        kicker="Escritório"
        title="Empresas"
        description="Cadastre a empresa e o primeiro administrador. A BAIFER e as demais ficam isoladas: cada login abre só o painel daquela empresa."
      />
      <form
        onSubmit={onSubmit}
        className="grid w-full max-w-xl gap-4 rounded-lg border border-line bg-white p-4 sm:p-6"
      >
        <Field label="Nome da empresa" name="name" required value={name} onChange={(e) => setName(e.target.value)} />
        <Field
          label="Identificador (slug)"
          name="slug"
          required
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="ex.: unica"
        />
        <p className="text-xs text-ink-muted">Letras minúsculas, números e hífen.</p>
        <Field
          label="Nome do administrador"
          name="adminName"
          required
          value={adminName}
          onChange={(e) => setAdminName(e.target.value)}
        />
        <Field
          label="E-mail do administrador"
          name="adminEmail"
          type="email"
          required
          value={adminEmail}
          onChange={(e) => setAdminEmail(e.target.value)}
        />
        <Field
          label="Senha do administrador"
          name="adminPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={adminPassword}
          onChange={(e) => setAdminPassword(e.target.value)}
        />
        {error ? (
          <p role="alert" className="text-sm text-status-bad">
            {error}
          </p>
        ) : null}
        {success ? <p className="text-sm text-status-ok">{success}</p> : null}
        <Button type="submit" disabled={saving}>
          {saving ? "Cadastrando…" : "Cadastrar empresa"}
        </Button>
      </form>
      <section>
        <h2 className="font-display text-xl text-ink">Empresas cadastradas</h2>
        {loading ? <p className="mt-2 text-sm text-ink-muted">Carregando…</p> : null}
        {!loading && companies.length === 0 ? (
          <p className="mt-2 text-sm text-ink-muted">Nenhuma empresa listada.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line rounded-lg border border-line bg-white">
            {companies.map((item) => (
              <li key={item.id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-ink">{item.name}</p>
                  <p className="text-sm text-ink-muted">{item.slug}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
