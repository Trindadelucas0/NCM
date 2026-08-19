"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { FiscalGrid } from "@/src/components/grid/fiscal-grid";
import { DiffTable } from "@/src/components/product/diff-table";
import { BatchSelector, type BatchOption } from "@/src/components/product/batch-selector";
import { PRODUCT_SHEET_COLUMNS } from "@/src/components/product/product-sheet-columns";
import type { ProductSheetItem } from "@/src/components/product/product-sheet-types";
import {
  ProductFilters,
  type ProductFilterValues,
} from "@/src/components/product/product-filters";
import { useProductQuery } from "@/src/components/product/use-product-query";
import { Button } from "@/src/components/ui/button";
import { EmptyState } from "@/src/components/ui/empty-state";
import { PageHeader } from "@/src/components/ui/page-header";
import { Pagination } from "@/src/components/ui/pagination";

type CatalogSlot = ReactNode | ((batchId: string | null) => ReactNode);

function renderSlot(slot: CatalogSlot | undefined, batchId: string | null) {
  if (slot == null) return null;
  return typeof slot === "function" ? slot(batchId) : slot;
}

export function ProductCatalog({
  kicker,
  title,
  description,
  actions,
  defaultStatus = "",
  rowMode,
  extra,
}: {
  kicker: string;
  title: string;
  description: string;
  actions?: CatalogSlot;
  defaultStatus?: ProductFilterValues["status"];
  rowMode: "navigate" | "expand";
  extra?: CatalogSlot;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const loteFromUrl = searchParams.get("lote");
  const [batchId, setBatchId] = useState<string | null>(loteFromUrl);
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [batchBooted, setBatchBooted] = useState(false);
  const [filters, setFilters] = useState<ProductFilterValues>({
    q: "",
    ncm: "",
    status: defaultStatus,
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { rows, summary, catalogTotal, loading, error } = useProductQuery(
    filters,
    batchId,
    batchBooted,
  );

  function syncLoteInUrl(id: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (id) params.set("lote", id);
    else params.delete("lote");
    const qs = params.toString();
    const next = qs ? `${pathname}?${qs}` : pathname;
    const current = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname;
    if (next !== current) router.replace(next, { scroll: false });
  }

  useEffect(() => {
    setPage(1);
    setExpandedId(null);
  }, [filters, batchId]);

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, page, pageSize]);
  const from = rows.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, rows.length);

  function activate(row: ProductSheetItem) {
    if (rowMode === "expand") {
      setExpandedId((current) => (current === row.id ? null : row.id));
      return;
    }
    const params = batchId ? `?lote=${encodeURIComponent(batchId)}` : "";
    router.push(`/consulta/${row.id}${params}`);
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        kicker={kicker}
        title={title}
        description={description}
        actions={renderSlot(actions, batchId)}
      />
      {renderSlot(extra, batchId)}
      <ProductFilters
        values={filters}
        summary={summary}
        onChange={setFilters}
        resetStatus={defaultStatus}
        lead={
          <BatchSelector
            preferredId={loteFromUrl}
            onChange={(id, list) => {
              setBatches(list);
              setBatchBooted(true);
              setBatchId(id);
              syncLoteInUrl(id);
            }}
          />
        }
      />
      {error ? <p className="text-sm text-status-bad">{error}</p> : null}
      {!loading && !error && rows.length === 0 ? (
        <EmptyState
          title={
            batches.length === 0
              ? "Nenhum produto no cadastro"
              : catalogTotal === 0
                ? "Esta planilha não tem produtos"
                : "Nenhum resultado"
          }
          description={
            batches.length === 0
              ? "O panorama e a consulta ficam vazios até a importação de um arquivo."
              : catalogTotal === 0
                ? "Escolha outra planilha no seletor acima ou importe um cadastro."
                : "Nenhum produto combina com os filtros. Limpe a busca, mude a situação ou escolha outra planilha."
          }
          actionHref={batches.length === 0 ? "/importar" : undefined}
          actionLabel={batches.length === 0 ? "Importar cadastro" : undefined}
        />
      ) : null}
      {loading || rows.length > 0 ? (
        <>
          <p className="text-sm text-ink-muted">
            {loading
              ? "Buscando…"
              : `${rows.length} produto${rows.length === 1 ? "" : "s"} · mostrando ${from}–${to}`}
          </p>
          <FiscalGrid
            caption={title}
            columns={PRODUCT_SHEET_COLUMNS}
            rows={pageRows}
            getRowId={(row) => row.id}
            loading={loading}
            expandedId={rowMode === "expand" ? expandedId : null}
            onRowActivate={activate}
            renderExpanded={
              rowMode === "expand"
                ? (item) => <ExpandedProduct item={item} batchId={batchId} />
                : undefined
            }
          />
          <Pagination
            page={page}
            pageCount={pageCount}
            onPage={setPage}
            pageSize={pageSize}
            onPageSize={(size) => {
              setPageSize(size);
              setPage(1);
            }}
            label={`Paginação: ${title}`}
          />
        </>
      ) : null}
    </div>
  );
}

function ExpandedProduct({
  item,
  batchId,
}: {
  item: ProductSheetItem;
  batchId: string | null;
}) {
  const lote = batchId ? `?lote=${encodeURIComponent(batchId)}` : "";
  return (
    <div className="grid gap-3 text-sm">
      <p className="text-ink">{item.motivo}</p>
      {item.needsLink ? (
        <p className="rounded-md border border-status-warn bg-status-warn-bg px-3 py-2">
          Este NCM tem duas regras. Vincule a hipótese na ficha antes de corrigir o cadastro.
        </p>
      ) : null}
      <DiffTable diffs={item.diffs} />
      <div className="flex flex-wrap gap-2">
        <Link href={`/consulta/${item.id}${lote}`}>
          <Button variant="primary">Ver ficha</Button>
        </Link>
        <Link href={`/como-dar-entrada/${item.id}${lote}`}>
          <Button variant="secondary">Como dar entrada</Button>
        </Link>
      </div>
    </div>
  );
}
