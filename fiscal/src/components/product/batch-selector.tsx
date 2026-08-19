"use client";

import { useEffect, useRef, useState } from "react";
import { resolveDisplayedBatchId } from "@/src/lib/batch-scope";

export type BatchOption = {
  id: string;
  fileName: string;
  totalRows: number;
  corretos: number;
  divergentes: number;
  analise: number;
  createdAt: string;
};

export function BatchSelector({
  onChange,
  preferredId,
}: {
  onChange: (batchId: string | null, batches: BatchOption[]) => void;
  preferredId?: string | null;
}) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const preferred = preferredId?.trim() || "";
  const activeIdRef = useRef(activeId);
  activeIdRef.current = activeId;

  useEffect(() => {
    if (preferred && preferred === activeIdRef.current) return;
    let cancelled = false;
    setLoading(true);
    const boot = async () => {
      const res = await fetch("/api/import");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? "Falha ao listar lotes");
      if (cancelled) return;
      const list = (json.data.batches ?? []) as BatchOption[];
      const wanted = resolveDisplayedBatchId(
        list,
        preferred || null,
        json.data.activeBatchId as string | null,
      );
      if (wanted && wanted !== json.data.activeBatchId) {
        const selectRes = await fetch("/api/import/select", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ batchId: wanted }),
        });
        if (!selectRes.ok) {
          const selectJson = await selectRes.json().catch(() => ({}));
          throw new Error(selectJson.error?.message ?? "Não foi possível selecionar a planilha.");
        }
      }
      if (cancelled) return;
      setBatches(list);
      setActiveId(wanted);
      onChangeRef.current(wanted || null, list);
    };
    boot()
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message);
        onChangeRef.current(null, []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [preferred]);

  async function select(batchId: string) {
    if (batchId === activeId) return;
    const previous = activeId;
    setActiveId(batchId);
    setError("");
    const res = await fetch("/api/import/select", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ batchId }),
    });
    const json = await res.json();
    if (!res.ok) {
      setActiveId(previous);
      setError(json.error?.message ?? "Não foi possível selecionar a planilha.");
      return;
    }
    onChangeRef.current(batchId, batches);
  }

  if (loading) {
    return <p className="text-sm text-ink-muted">Carregando planilhas importadas…</p>;
  }
  if (batches.length === 0) {
    return (
      <p className="text-sm text-ink-muted">
        Nenhuma planilha importada nesta empresa. Importe um cadastro para conferir.
      </p>
    );
  }

  const active = batches.find((batch) => batch.id === activeId);

  return (
    <div className="grid gap-2">
      <label className="grid gap-1.5 text-sm font-medium text-ink" htmlFor="planilha-ativa">
        Ver dados desta planilha
        <select
          id="planilha-ativa"
          className="min-h-11 w-full rounded-md border border-line bg-white px-3 font-normal"
          value={activeId}
          onChange={(e) => void select(e.target.value)}
        >
          {batches.map((batch) => (
            <option key={batch.id} value={batch.id}>
              {batch.fileName} · {new Date(batch.createdAt).toLocaleString("pt-BR")} ·{" "}
              {batch.totalRows} produtos
            </option>
          ))}
        </select>
      </label>
      {active ? (
        <p className="text-sm text-ink-muted">
          Mostrando só o arquivo <span className="font-medium text-ink">{active.fileName}</span>
          {` · correto ${active.corretos} · divergente ${active.divergentes} · análise ${active.analise}`}
        </p>
      ) : null}
      {error ? <p className="text-sm text-status-bad">{error}</p> : null}
    </div>
  );
}
