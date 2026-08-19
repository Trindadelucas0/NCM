import { NextResponse } from "next/server";
import { persistBatchSummary } from "@/src/server/audit";
import {
  BATCH_COOKIE,
  batchCookieOptions,
  listImportBatches,
  readBatchCookie,
  resolveActiveBatch,
} from "@/src/server/batch";
import { withTenant } from "@/src/server/db";
import { jsonError, jsonOk } from "@/src/server/http";
import {
  assertSafeUpload,
  parseCadastroBuffer,
  sanitizeFileName,
} from "@/src/server/import-cadastro";
import { requireAdmin, requireUser } from "@/src/server/tenant";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    requireAdmin(user);
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION", message: "Envie um arquivo." } },
        { status: 400 },
      );
    }
    const ext = assertSafeUpload(file.name, file.size, file.type);
    const buffer = Buffer.from(await file.arrayBuffer());
    const products = parseCadastroBuffer(buffer, ext);
    if (products.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "EMPTY", message: "Nenhuma linha de cadastro reconhecida." },
        },
        { status: 400 },
      );
    }

    const result = await withTenant(user.companyId, async (db) => {
      const batch = await db.importBatch.create({
        data: {
          companyId: user.companyId,
          userId: user.id,
          fileName: sanitizeFileName(file.name),
          totalRows: products.length,
        },
      });
      const chunkSize = 200;
      for (let i = 0; i < products.length; i += chunkSize) {
        const slice = products.slice(i, i + chunkSize);
        await db.product.createMany({
          data: slice.map((item) => ({
            companyId: user.companyId,
            importBatchId: batch.id,
            codigo: item.codigo,
            descricao: item.descricao,
            ncm: item.ncm,
            ncmOriginal: item.ncmOriginal,
            aliquotaIcms: item.aliquotaIcms,
            ivaMva: item.ivaMva,
            ivaMvaNumero: item.ivaMvaNumero,
            cest: item.cest,
            cstCompra: item.cstCompra,
            cstUnico: item.cstUnico,
            destinosCst: item.destinosCst ?? undefined,
          })),
        });
      }
      return { batchId: batch.id, imported: products.length };
    });

    const totals = await persistBatchSummary(user.companyId, result.batchId);
    const rulesStillThere = await withTenant(user.companyId, (db) =>
      db.fiscalNcmRule.count({ where: { companyId: user.companyId } }),
    );

    const response = jsonOk({
      imported: result.imported,
      rulesStillThere,
      batchId: result.batchId,
      totals,
    });
    response.cookies.set(BATCH_COOKIE, result.batchId, batchCookieOptions());
    return response;
  } catch (error) {
    return jsonError(error);
  }
}

export async function GET() {
  try {
    const user = await requireUser();
    let batches = await listImportBatches(user.companyId);
    for (const item of batches) {
      if (item.totalRows > 0 && item.corretos === 0 && item.divergentes === 0 && item.analise === 0) {
        await persistBatchSummary(user.companyId, item.id);
      }
    }
    batches = await listImportBatches(user.companyId);
    const cookieLote = await readBatchCookie();
    const active = await resolveActiveBatch(user.companyId, cookieLote, false);
    return jsonOk({
      batches,
      activeBatchId: active?.id ?? null,
    });
  } catch (error) {
    return jsonError(error);
  }
}
