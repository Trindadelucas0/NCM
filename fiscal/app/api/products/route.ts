import { compareCompanyProducts } from "@/src/server/audit";
import { activeBatchForRequest } from "@/src/server/batch";
import { summarizeStatus } from "@/src/server/compare";
import { jsonError, jsonOk } from "@/src/server/http";
import { isJunkRow } from "@/src/server/import-cadastro";
import { requireUser } from "@/src/server/tenant";

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const batch = await activeBatchForRequest(user.companyId, request);
    if (!batch) {
      return jsonOk({
        items: [],
        summary: { total: 0, corretos: 0, divergentes: 0, analise: 0 },
        catalogTotal: 0,
        batch: null,
      });
    }
    const url = new URL(request.url);
    const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
    const ncmFilter = digitsOnly(url.searchParams.get("ncm") ?? "");
    const status = (url.searchParams.get("status") ?? "").trim();
    const items = (await compareCompanyProducts(user.companyId, batch.id)).filter(
      (item) => !isJunkRow(item.product.codigo, item.product.descricao),
    );
    const searched = items.filter((item) => {
      if (ncmFilter && !item.product.ncm.includes(ncmFilter)) return false;
      if (!q) return true;
      const ncmDigits = digitsOnly(q);
      return (
        item.product.codigo.toLowerCase().includes(q) ||
        item.product.descricao.toLowerCase().includes(q) ||
        item.product.ncm.includes(q) ||
        item.product.ncmOriginal.toLowerCase().includes(q) ||
        (ncmDigits.length >= 4 && item.product.ncm.includes(ncmDigits))
      );
    });
    const summary = summarizeStatus(searched.map((item) => item.compare));
    const filtered = searched.filter((item) => !status || item.compare.status === status);
    return jsonOk({
      items: filtered.map((item) => ({
        id: item.product.id,
        codigo: item.product.codigo,
        descricao: item.product.descricao,
        ncm: item.product.ncm,
        ncmOriginal: item.product.ncmOriginal,
        status: item.compare.status,
        motivo: item.compare.motivo,
        needsLink: item.compare.needsLink,
        situacao: item.compare.rule?.situacao ?? item.compare.rule?.situacaoCodigo ?? null,
        situacaoCodigo: item.compare.rule?.situacaoCodigo ?? null,
        diffs: item.compare.diffs,
        importado: {
          cstCompra: item.product.cstCompra ?? null,
          cstUnico: item.product.cstUnico ?? null,
          ivaMva: item.product.ivaMva ?? null,
          destinosCst: item.product.destinosCst,
        },
        correto: item.compare.rule
          ? {
              ncm: item.compare.rule.ncm,
              cstEntrada: item.compare.rule.cstEntrada,
              cstSaida: item.compare.rule.cstSaida,
              cfopSaida: item.compare.rule.cfopSaida,
              destinosCst: item.compare.rule.destinosCst,
              mva:
                item.compare.rule.mvaPercentual != null
                  ? String(item.compare.rule.mvaPercentual)
                  : item.compare.rule.mvaTexto,
              situacao: item.compare.rule.situacao || item.compare.rule.situacaoCodigo,
            }
          : null,
        candidates: item.compare.candidates.map((candidate) => ({
          id: candidate.id,
          situacao: candidate.situacao,
          situacaoCodigo: candidate.situacaoCodigo,
          cstSaida: candidate.cstSaida,
          cfopSaida: candidate.cfopSaida,
        })),
      })),
      summary,
      catalogTotal: items.length,
      batch,
    });
  } catch (error) {
    return jsonError(error);
  }
}
