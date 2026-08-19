"use client";

import { useEffect, useState } from "react";
import { Button } from "@/src/components/ui/button";
import { PageHeader } from "@/src/components/ui/page-header";
import type { BatchOption } from "@/src/components/product/batch-selector";

export default function ImportarPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");
  const [forbidden, setForbidden] = useState(false);
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function loadBatches() {
    const res = await fetch("/api/import");
    const json = await res.json();
    if (res.ok) setBatches(json.data.batches ?? []);
  }

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((json) => {
        if (json.data?.role !== "admin") setForbidden(true);
      });
    void loadBatches();
  }, []);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!file) {
      setStatus("error");
      setMessage("Selecione um arquivo XLSX, CSV ou ODS.");
      return;
    }
    setStatus("loading");
    const body = new FormData();
    body.append("file", file);
    try {
      const res = await fetch("/api/import", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(json.error?.message ?? "Falha na importação.");
        return;
      }
      setStatus("ok");
      setMessage(
        `${json.data.imported} produtos importados neste lote. A base NCM permanece com ${json.data.rulesStillThere} regras. Lotes anteriores foram mantidos.`,
      );
      setFile(null);
      await loadBatches();
    } catch {
      setStatus("error");
      setMessage("Falha de rede.");
    }
  }

  async function apagar(id: string, fileName: string) {
    if (!window.confirm(`Apagar o lote “${fileName}”? A base fiscal da empresa não será alterada.`)) {
      return;
    }
    setDeleting(id);
    try {
      const res = await fetch(`/api/import/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(json.error?.message ?? "Não foi possível apagar o lote.");
        return;
      }
      await loadBatches();
    } finally {
      setDeleting(null);
    }
  }

  if (forbidden) {
    return (
      <p className="text-sm text-status-bad">
        Somente administradores podem importar cadastro. O perfil consulta apenas lê e exporta.
      </p>
    );
  }

  return (
    <div className="grid gap-8">
      <PageHeader
        kicker="Cadastro atual"
        title="Importar produtos"
        description="Cada planilha vira um lote separado. A conferência (como está × como deve ficar) usa só o lote escolhido. A base fiscal da empresa não é substituída."
      />
      <form onSubmit={onSubmit} className="max-w-xl rounded-lg border border-line bg-white p-6">
        <label htmlFor="arquivo" className="text-sm font-medium text-ink">
          Arquivo (XLSX, CSV ou ODS, até 8 MB)
        </label>
        <input
          id="arquivo"
          name="arquivo"
          type="file"
          accept=".xlsx,.csv,.ods"
          className="mt-2 block w-full text-sm"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <p className="mt-3 text-xs text-ink-muted">
          Colunas reconhecidas: codigo, descricao, ncm, CST por destinatário, CST compra, alíquota, IVA/MVA, CEST.
        </p>
        <div className="mt-6">
          <Button type="submit" disabled={status === "loading"}>
            {status === "loading" ? "Importando…" : "Importar planilha"}
          </Button>
        </div>
        {status === "ok" ? <p className="mt-4 text-sm text-status-ok">{message}</p> : null}
        {status === "error" ? <p className="mt-4 text-sm text-status-bad">{message}</p> : null}
      </form>

      <section className="grid gap-3">
        <h2 className="font-display text-xl text-ink">Histórico de planilhas</h2>
        {batches.length === 0 ? (
          <p className="text-sm text-ink-muted">Ainda não há lote importado nesta empresa.</p>
        ) : (
          <ul className="grid gap-3">
            {batches.map((batch) => (
              <li
                key={batch.id}
                className="flex flex-col gap-3 rounded-lg border border-line bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-ink">{batch.fileName}</p>
                  <p className="text-sm text-ink-muted">
                    {new Date(batch.createdAt).toLocaleString("pt-BR")} · {batch.totalRows}{" "}
                    produtos
                  </p>
                  <p className="mt-1 text-sm text-ink-muted">
                    Correto {batch.corretos} · Divergente {batch.divergentes} · Análise{" "}
                    {batch.analise}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a href={`/consulta?lote=${batch.id}`}>
                    <Button type="button" variant="secondary">
                      Ver conferência
                    </Button>
                  </a>
                  <Button
                    type="button"
                    variant="danger"
                    disabled={deleting === batch.id}
                    onClick={() => void apagar(batch.id, batch.fileName)}
                  >
                    {deleting === batch.id ? "Apagando…" : "Apagar lote"}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
