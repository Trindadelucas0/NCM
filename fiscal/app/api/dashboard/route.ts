import { compareCompanyProducts } from "@/src/server/audit";
import { activeBatchForRequest } from "@/src/server/batch";
import { summarizeStatus } from "@/src/server/compare";
import { jsonError, jsonOk } from "@/src/server/http";
import { isJunkRow } from "@/src/server/import-cadastro";
import { requireUser } from "@/src/server/tenant";
import { withTenant } from "@/src/server/db";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const batch = await activeBatchForRequest(user.companyId, request);
    const [items, ruleCount] = await Promise.all([
      batch ? compareCompanyProducts(user.companyId, batch.id) : Promise.resolve([]),
      withTenant(user.companyId, (db) =>
        db.fiscalNcmRule.count({ where: { companyId: user.companyId } }),
      ),
    ]);
    const usable = items.filter((i) => !isJunkRow(i.product.codigo, i.product.descricao));
    const totals = summarizeStatus(usable.map((i) => i.compare));
    return jsonOk({
      totals,
      ruleCount,
      hasCadastro: Boolean(batch),
      batch,
    });
  } catch (error) {
    return jsonError(error);
  }
}
