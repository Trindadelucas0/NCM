"use client";

import type { ReactNode } from "react";
import { SheetToolbar } from "@/src/components/ui/sheet-toolbar";
import { Field } from "@/src/components/ui/field";
import { Button } from "@/src/components/ui/button";

export type ProductFilterValues = {
  q: string;
  ncm: string;
  status: "" | "DIVERGENTE" | "NECESSITA_ANALISE" | "CORRETO";
};

export type ProductFilterSummary = {
  total: number;
  corretos: number;
  divergentes: number;
  analise: number;
};

const STATUS_CHIPS: {
  id: ProductFilterValues["status"];
  label: string;
  count: keyof ProductFilterSummary;
}[] = [
  { id: "", label: "Todos", count: "total" },
  { id: "DIVERGENTE", label: "Divergente", count: "divergentes" },
  { id: "NECESSITA_ANALISE", label: "Necessita análise", count: "analise" },
  { id: "CORRETO", label: "Correto", count: "corretos" },
];

export function ProductFilters({
  values,
  summary,
  onChange,
  resetStatus = "",
  lead,
}: {
  values: ProductFilterValues;
  summary?: ProductFilterSummary;
  onChange: (next: ProductFilterValues) => void;
  resetStatus?: ProductFilterValues["status"];
  lead?: ReactNode;
}) {
  const dirty = Boolean(values.q || values.ncm || values.status !== resetStatus);

  return (
    <SheetToolbar>
      {lead}
      <div className="grid gap-4 md:grid-cols-2">
        <Field
          id="filtro-busca"
          label="Buscar código ou descrição"
          value={values.q}
          onChange={(e) => onChange({ ...values, q: e.target.value })}
          placeholder="Ex.: 204.834 ou TINTA SUVINIL"
          autoComplete="off"
        />
        <Field
          id="filtro-ncm"
          label="Filtrar NCM"
          value={values.ncm}
          onChange={(e) => onChange({ ...values, ncm: e.target.value })}
          placeholder="Ex.: 32091010"
          inputMode="numeric"
          autoComplete="off"
        />
      </div>
      <div>
        <p className="mb-2 text-sm font-medium text-ink">Situação</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por situação">
          {STATUS_CHIPS.map((chip) => {
            const active = values.status === chip.id;
            const count = summary?.[chip.count];
            return (
              <button
                key={chip.id || "todos"}
                type="button"
                aria-pressed={active}
                onClick={() => onChange({ ...values, status: chip.id })}
                className={`min-h-11 rounded-md border px-3 text-sm font-medium transition ${
                  active
                    ? "border-brand bg-brand text-white"
                    : "border-line bg-paper text-ink hover:bg-white"
                }`}
              >
                {chip.label}
                {typeof count === "number" ? ` (${count})` : ""}
              </button>
            );
          })}
        </div>
      </div>
      {dirty ? (
        <div>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onChange({ q: "", ncm: "", status: resetStatus })}
          >
            Limpar filtros
          </Button>
        </div>
      ) : null}
    </SheetToolbar>
  );
}
