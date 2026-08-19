"use client";

import Link from "next/link";
import { BatchDiffPanel } from "@/src/components/product/batch-diff-panel";
import { BatchSelector } from "@/src/components/product/batch-selector";
import { useActiveBatch } from "@/src/components/product/use-active-batch";
import { EmptyState } from "@/src/components/ui/empty-state";
import { PageHeader } from "@/src/components/ui/page-header";

export function KpiDashboard() {
  const { batchId, onBatchChange, loteFromUrl, active, batchBooted } = useActiveBatch();

  return (
    <div className="grid gap-6">
      <PageHeader
        kicker="BAIFER"
        title="Panorama do cadastro"
        description="Números da planilha ativa. A listagem fica em Consultar e Divergências."
      />
      <div className="max-w-xl">
        <BatchSelector preferredId={loteFromUrl} onChange={onBatchChange} />
      </div>
      {!batchBooted ? (
        <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {["Analisados", "Corretos", "Divergentes", "Análise"].map((label) => (
            <div key={label} className="rounded-lg border border-line bg-white p-4">
              <dt className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">{label}</dt>
              <dd className="mt-1 h-8 w-16 animate-pulse rounded bg-line" />
            </div>
          ))}
        </dl>
      ) : null}
      {batchBooted && !active ? (
        <EmptyState
          title="Nenhuma planilha importada"
          description="O panorama fica vazio até a importação de um arquivo desta empresa."
          actionHref="/importar"
          actionLabel="Importar cadastro"
        />
      ) : null}
      {active && batchId ? (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Kpi
              label="Analisados"
              value={active.totalRows}
              href={`/consulta?lote=${encodeURIComponent(batchId)}`}
            />
            <Kpi
              label="Corretos"
              value={active.corretos}
              href={`/consulta?status=CORRETO&lote=${encodeURIComponent(batchId)}`}
            />
            <Kpi
              label="Divergentes"
              value={active.divergentes}
              href={`/divergencias?lote=${encodeURIComponent(batchId)}`}
            />
            <Kpi
              label="Análise"
              value={active.analise}
              href={`/consulta?status=NECESSITA_ANALISE&lote=${encodeURIComponent(batchId)}`}
            />
          </div>
          <BatchDiffPanel lote={batchId} />
        </>
      ) : null}
    </div>
  );
}

function Kpi({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link
      href={href}
      className="block rounded-lg border border-line bg-white p-4 hover:bg-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      <span className="block text-[11px] font-medium uppercase tracking-wide text-ink-muted">{label}</span>
      <span className="mt-1 block font-display text-xl tabular text-ink sm:text-2xl">{value}</span>
    </Link>
  );
}
