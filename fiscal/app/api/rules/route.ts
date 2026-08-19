import { Prisma } from "@prisma/client";
import { jsonError, jsonOk } from "@/src/server/http";
import { HttpError, requireAdmin, requireUser } from "@/src/server/tenant";
import { withTenant } from "@/src/server/db";
import { ruleBodySchema, ruleWriteData } from "@/src/server/rule-write";

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

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    requireAdmin(user);
    const body = ruleBodySchema.parse(await request.json());
    const data = ruleWriteData(user.companyId, body);
    const rule = await withTenant(user.companyId, (db) => db.fiscalNcmRule.create({ data }));
    return jsonOk({ rule }, 201);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return jsonError(new HttpError(409, "CONFLICT", "Já existe regra com este NCM e situação."));
    }
    return jsonError(error);
  }
}
