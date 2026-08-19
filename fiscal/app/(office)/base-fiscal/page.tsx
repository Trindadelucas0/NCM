"use client";

import { useEffect, useMemo, useState } from "react";
import { FiscalGrid } from "@/src/components/grid/fiscal-grid";
import { RULE_SHEET_COLUMNS, type RuleSheetItem } from "@/src/components/grid/rule-sheet-columns";
import { CstMatrix } from "@/src/components/matrix/cst-matrix";
import { PageHeader } from "@/src/components/ui/page-header";
import { Pagination } from "@/src/components/ui/pagination";
import { SheetToolbar } from "@/src/components/ui/sheet-toolbar";
import { Button } from "@/src/components/ui/button";

const SITUACOES = [
  { value: "", label: "Todas as situações" },
  { value: "REGRA_GERAL", label: "Regra geral" },
  { value: "ST_INTERNO", label: "ST interno" },
  { value: "ST_NACIONAL", label: "ST nacional" },
  { value: "REDUCAO", label: "Redução" },
  { value: "INCOMPLETA", label: "Incompleta" },
];

const PAGE_SIZE_DEFAULT = 50;

export default function BaseFiscalPage() {
  const [q, setQ] = useState("");
  const [situacao, setSituacao] = useState("");
  const [rules, setRules] = useState<RuleSheetItem[]>([]);
  const [selected, setSelected] = useState<RuleSheetItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT);

  useEffect(() => {
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (situacao) params.set("situacao", situacao);
      fetch(`/api/rules?${params}`, { signal: ctrl.signal })
        .then(async (res) => {
          const json = await res.json();
          if (!res.ok) throw new Error(json.error?.message ?? "Falha");
          setRules(json.data.rules);
          setPage(1);
        })
        .catch((err: Error) => {
          if (err.name !== "AbortError") setError(err.message);
        })
        .finally(() => setLoading(false));
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q, situacao]);

  const highlight = useMemo(
    () => selected ?? rules[0] ?? null,
    [selected, rules],
  );
  const pageCount = Math.max(1, Math.ceil(rules.length / pageSize));
  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return rules.slice(start, start + pageSize);
  }, [rules, page, pageSize]);
  const dirty = Boolean(q || situacao);

  return (
    <div className="grid gap-6">
      <PageHeader
        kicker="Aba BAIFER"
        title="Base fiscal"
        description="Mesmas colunas da planilha de regras: NCM, CST, CFOP, os 8 destinatários, situação e MVA. Produtos não entram aqui."
      />
      <SheetToolbar>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-1.5">
            <label htmlFor="busca-ncm" className="text-sm font-medium text-ink">
              Buscar NCM ou segmento
            </label>
            <input
              id="busca-ncm"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Ex.: 32141010 ou Tintas"
              className="min-h-11 rounded-md border border-line bg-white px-3 text-sm"
            />
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="filtro-sit" className="text-sm font-medium text-ink">
              Situação
            </label>
            <select
              id="filtro-sit"
              value={situacao}
              onChange={(e) => setSituacao(e.target.value)}
              className="min-h-11 rounded-md border border-line bg-white px-3 text-sm"
            >
              {SITUACOES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        {dirty ? (
          <div>
            <Button type="button" variant="ghost" onClick={() => { setQ(""); setSituacao(""); }}>
              Limpar filtros
            </Button>
          </div>
        ) : null}
      </SheetToolbar>
      {error ? <p className="text-sm text-status-bad">{error}</p> : null}
      <p className="text-sm text-ink-muted">
        {loading ? "Carregando regras…" : `${rules.length} regra${rules.length === 1 ? "" : "s"}`}
      </p>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0">
          <FiscalGrid
            caption="Base fiscal NCM"
            columns={RULE_SHEET_COLUMNS}
            rows={pageRows}
            getRowId={(row) => row.id}
            loading={loading}
            selectedId={highlight?.id}
            onRowActivate={setSelected}
          />
          <div className="mt-4">
            <Pagination
              page={page}
              pageCount={pageCount}
              onPage={setPage}
              pageSize={pageSize}
              onPageSize={(size) => {
                setPageSize(size);
                setPage(1);
              }}
              label="Paginação da base fiscal"
            />
          </div>
        </div>
        {highlight ? (
          <aside className="hidden rounded-lg border border-line bg-white p-4 xl:block">
            <p className="text-xs uppercase tracking-wide text-ink-muted">Linha selecionada</p>
            <h2 className="mt-1 font-display text-2xl tabular">{highlight.ncm}</h2>
            <p className="text-sm text-ink-muted">
              {highlight.segmento} · {highlight.situacaoCodigo} · MVA {highlight.mvaTexto ?? "—"}
            </p>
            <div className="mt-4">
              <CstMatrix ideal={highlight.destinosCst} />
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
