import { jsonError, jsonOk } from "@/src/server/http";
import { requireUser } from "@/src/server/tenant";
import { withTenant } from "@/src/server/db";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const url = new URL(request.url);
    const q = (url.searchParams.get("q") ?? "").trim();
    const situacao = (url.searchParams.get("situacao") ?? "").trim();
    const rules = await withTenant(user.companyId, (db) =>
      db.fiscalNcmRule.findMany({
        where: {
          companyId: user.companyId,
          ...(situacao ? { situacaoCodigo: situacao } : {}),
          ...(q
            ? {
                OR: [
                  { ncm: { contains: q } },
                  { ncmOriginal: { contains: q } },
                  { segmento: { contains: q, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        orderBy: [{ ncm: "asc" }, { situacaoCodigo: "asc" }],
        take: 2000,
      }),
    );
    return jsonOk({ rules });
  } catch (error) {
    return jsonError(error);
  }
}
