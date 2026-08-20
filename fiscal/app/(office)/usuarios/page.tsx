"use client";

import { useEffect, useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Field } from "@/src/components/ui/field";
import { Notice } from "@/src/components/ui/notice";
import { PageHeader } from "@/src/components/ui/page-header";

type UserRow = { id: string; name: string; email: string; role: "admin" | "consulta"; createdAt: string };

export default function UsuariosPage() {
  const [forbidden, setForbidden] = useState(false);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "consulta">("consulta");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const me = await fetch("/api/auth/me").then((r) => r.json());
      if (me.data?.role !== "admin") {
        setForbidden(true);
        return;
      }
      const res = await fetch("/api/users");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? "Falha ao listar usuários.");
      setUsers(json.data.users ?? []);
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
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? "Não foi possível cadastrar.");
      setSuccess(`Usuário ${json.data.user.email} cadastrado nesta empresa.`);
      setName("");
      setEmail("");
      setPassword("");
      setRole("consulta");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível cadastrar.");
    } finally {
      setSaving(false);
    }
  }

  if (forbidden) {
    return (
      <p className="text-sm text-status-bad">Somente administradores podem cadastrar usuários.</p>
    );
  }

  return (
    <div className="grid gap-8">
      <PageHeader
        kicker="Administração"
        title="Usuários"
        description="Usuários desta empresa. Não dá para ver ou criar login de outra empresa."
      />
      <form
        onSubmit={onSubmit}
        className="grid w-full max-w-xl gap-4 rounded-lg border border-line bg-white p-4 sm:p-6"
      >
        <Field label="Nome" name="name" required value={name} onChange={(e) => setName(e.target.value)} />
        <Field
          label="E-mail"
          name="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Field
          label="Senha"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium text-ink">Perfil</span>
          <select
            name="role"
            className="min-h-11 rounded-md border border-line-strong bg-white px-3"
            value={role}
            onChange={(e) => setRole(e.target.value as "admin" | "consulta")}
          >
            <option value="consulta">Consulta</option>
            <option value="admin">Administrador</option>
          </select>
        </label>
        {error ? <Notice variant="error">{error}</Notice> : null}
        {success ? <Notice variant="success">{success}</Notice> : null}
        <Button type="submit" disabled={saving}>
          {saving ? "Cadastrando…" : "Cadastrar usuário"}
        </Button>
      </form>
      <section>
        <h2 className="font-display text-xl text-ink">Usuários da empresa</h2>
        {loading ? <p className="mt-2 text-sm text-ink-muted">Carregando…</p> : null}
        {!loading && users.length === 0 ? (
          <p className="mt-2 text-sm text-ink-muted">Nenhum usuário nesta empresa.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line rounded-lg border border-line bg-white">
            {users.map((item) => (
              <li key={item.id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-ink">{item.name}</p>
                  <p className="text-sm text-ink-muted">{item.email}</p>
                </div>
                <p className="text-sm text-ink-muted">{item.role}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
