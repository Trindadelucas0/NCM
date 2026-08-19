import { jsonError, jsonOk } from "@/src/server/http";
import { HttpError, ownedWhere, requireUser } from "@/src/server/tenant";
import { withTenant } from "@/src/server/db";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const rule = await withTenant(user.companyId, (db) =>
      db.fiscalNcmRule.findFirst({ where: ownedWhere(id, user.companyId) }),
    );
    if (!rule) throw new HttpError(404, "NOT_FOUND", "Regra não encontrada.");
    return jsonOk({ rule });
  } catch (error) {
    return jsonError(error);
  }
}
