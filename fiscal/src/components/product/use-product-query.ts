"use client";

import { useEffect, useState } from "react";
import type { ProductFilterSummary, ProductFilterValues } from "./product-filters";
import type { ProductSheetItem } from "./product-sheet-types";

export function buildProductsUrl(filters: ProductFilterValues, lote?: string | null) {
  const params = new URLSearchParams();
  if (filters.q.trim()) params.set("q", filters.q.trim());
  if (filters.ncm.trim()) params.set("ncm", filters.ncm.trim());
  if (filters.status) params.set("status", filters.status);
  if (lote) params.set("lote", lote);
  const qs = params.toString();
  return qs ? `/api/products?${qs}` : "/api/products";
}

export function useProductQuery(
  filters: ProductFilterValues,
  lote: string | null,
  enabled: boolean,
) {
  const [rows, setRows] = useState<ProductSheetItem[]>([]);
  const [summary, setSummary] = useState<ProductFilterSummary | undefined>();
  const [catalogTotal, setCatalogTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!enabled) return;
    if (!lote) {
      setRows([]);
      setSummary({ total: 0, corretos: 0, divergentes: 0, analise: 0 });
      setCatalogTotal(0);
      setLoading(false);
      setError("");
      return;
    }
    const timer = setTimeout(() => {
      setLoading(true);
      setError("");
      fetch(buildProductsUrl(filters, lote))
        .then(async (res) => {
          const json = await res.json();
          if (!res.ok) throw new Error(json.error?.message ?? "Falha");
          setRows(json.data.items);
          setSummary(json.data.summary);
          setCatalogTotal(json.data.catalogTotal ?? 0);
        })
        .catch((err: Error) => setError(err.message))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [filters, lote, enabled]);

  return { rows, summary, catalogTotal, loading: !enabled || loading, error };
}
