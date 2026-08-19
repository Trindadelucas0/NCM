import "server-only";

import { Prisma } from "@prisma/client";
import {
  asDestinos,
  compareProduct,
  summarizeStatus,
  type CompareResult,
  type FiscalRule,
  type ImportedProduct,
} from "./compare";
import { isJunkRow } from "./import-cadastro";
import { withTenant } from "./db";
import { HttpError } from "./tenant";

function toNumber(value: Prisma.Decimal | number | null | undefined): number | null {
  if (value == null) return null;
  return Number(value);
}

export function ruleFromDb(row: {
  id: string;
  ncm: string;
  ncmOriginal: string;
  segmento: string;
  cstEntrada: string | null;
  cstSaida: string | null;
  cfopSaida: string | null;
  destinosCst: Prisma.JsonValue;
  situacao: string;
  situacaoCodigo: string;
  mvaPercentual: Prisma.Decimal | null;
  mvaTexto: string | null;
  mvaKind: string;
}): FiscalRule {
  return {
    id: row.id,
    ncm: row.ncm,
    ncmOriginal: row.ncmOriginal,
    segmento: row.segmento,
    cstEntrada: row.cstEntrada,
    cstSaida: row.cstSaida,
    cfopSaida: row.cfopSaida,
    destinosCst: asDestinos(row.destinosCst),
    situacao: row.situacao,
    situacaoCodigo: row.situacaoCodigo,
    mvaPercentual: toNumber(row.mvaPercentual),
    mvaTexto: row.mvaTexto,
    mvaKind: row.mvaKind,
  };
}

export function productFromDb(row: {
  id: string;
  codigo: string;
  descricao: string;
  ncm: string;
  ncmOriginal: string;
  aliquotaIcms: string | null;
  ivaMva: string | null;
  ivaMvaNumero: Prisma.Decimal | null;
  cest: string | null;
  cstCompra: string | null;
  cstUnico: string | null;
  destinosCst: Prisma.JsonValue | null;
}): ImportedProduct {
  return {
    id: row.id,
    codigo: row.codigo,
    descricao: row.descricao,
    ncm: row.ncm,
    ncmOriginal: row.ncmOriginal,
    aliquotaIcms: row.aliquotaIcms,
    ivaMva: row.ivaMva,
    ivaMvaNumero: toNumber(row.ivaMvaNumero),
    cest: row.cest,
    cstCompra: row.cstCompra,
    cstUnico: row.cstUnico,
    destinosCst: row.destinosCst ? asDestinos(row.destinosCst) : null,
  };
}

export async function compareCompanyProducts(
  companyId: string,
  batchId: string,
): Promise<
  {
    product: ImportedProduct;
    compare: CompareResult;
  }[]
> {
  return withTenant(companyId, async (db) => {
    const batch = await db.importBatch.findFirst({
      where: { id: batchId, companyId },
      select: { id: true },
    });
    if (!batch) {
      throw new HttpError(404, "NOT_FOUND", "Lote não encontrado.");
    }
    const [products, rules, links] = await Promise.all([
      db.product.findMany({
        where: { companyId, importBatchId: batchId },
        orderBy: { codigo: "asc" },
      }),
      db.fiscalNcmRule.findMany({ where: { companyId } }),
      db.productRuleLink.findMany({ where: { companyId } }),
    ]);
    const rulesByNcm = new Map<string, FiscalRule[]>();
    for (const rule of rules) {
      const mapped = ruleFromDb(rule);
      const list = rulesByNcm.get(mapped.ncm) ?? [];
      list.push(mapped);
      rulesByNcm.set(mapped.ncm, list);
    }
    const linkByProduct = new Map(links.map((l) => [l.productId, l.ruleId]));
    return products.map((row) => {
      const product = productFromDb(row);
      const compare = compareProduct(
        product,
        rulesByNcm.get(product.ncm) ?? [],
        linkByProduct.get(row.id) ?? null,
      );
      return { product, compare };
    });
  });
}

export async function persistBatchSummary(companyId: string, batchId: string) {
  const items = await compareCompanyProducts(companyId, batchId);
  const usable = items.filter((item) => !isJunkRow(item.product.codigo, item.product.descricao));
  const totals = summarizeStatus(usable.map((item) => item.compare));
  await withTenant(companyId, (db) =>
    db.importBatch.updateMany({
      where: { id: batchId, companyId },
      data: {
        totalRows: usable.length,
        corretos: totals.corretos,
        divergentes: totals.divergentes,
        analise: totals.analise,
      },
    }),
  );
  return totals;
}
