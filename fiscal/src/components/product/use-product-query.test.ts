import { describe, expect, it } from "vitest";
import { buildProductsUrl } from "./use-product-query";

describe("URL da consulta por planilha", () => {
  const filters = { q: "", ncm: "", status: "" as const };

  it("envia lote na query para não misturar planilhas", () => {
    expect(buildProductsUrl(filters, "lote-x")).toBe("/api/products?lote=lote-x");
  });

  it("não envia lote vazio e preserva filtros", () => {
    expect(buildProductsUrl(filters, null)).toBe("/api/products");
    expect(buildProductsUrl({ q: "tinta", ncm: "", status: "DIVERGENTE" }, "lote-x")).toBe(
      "/api/products?q=tinta&status=DIVERGENTE&lote=lote-x",
    );
  });
});
