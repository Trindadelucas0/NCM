"use client";

import { ProductCatalog } from "@/src/components/product/product-catalog";
import { useEffect, useState } from "react";

type Dash = {
  totals: { total: number; corretos: number; divergentes: number; analise: number };
  ruleCount: number;
  hasCadastro: boolean;
};

export default function DashboardPage() {
  return (
    <ProductCatalog
      kicker="BAIFER"
      title="Panorama do cadastro"
      description="Escolha a planilha importada para conferir só os dados dela com a aba BAIFER. Clique na linha para abrir a ficha."
      rowMode="navigate"
      extra={(batchId) => <DashboardMetrics batchId={batchId} />}
    />
  );
}

function DashboardMetrics({ batchId }: { batchId: string | null }) {
  const [data, setData] = useState<Dash | null>(null);

  useEffect(() => {
    if (!batchId) {
      setData(null);
      return;
    }
    const params = new URLSearchParams({ lote: batchId });
    fetch(`/api/dashboard?${params}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error?.message ?? "Falha ao carregar");
        setData(json.data);
      })
      .catch(() => setData(null));
  }, [batchId]);

  if (!data) return null;

  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-4">
      <Metric label="Analisados" value={data.totals.total} />
      <Metric label="Corretos" value={data.totals.corretos} />
      <Metric label="Divergentes" value={data.totals.divergentes} />
      <Metric label="Análise" value={data.totals.analise} />
    </dl>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white px-4 py-3">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">{label}</dt>
      <dd className="mt-1 font-display text-2xl tabular text-ink">{value}</dd>
    </div>
  );
}
