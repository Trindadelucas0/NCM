import { compareCompanyProducts } from "@/src/server/audit";
import { activeBatchForRequest } from "@/src/server/batch";
import { buildPdf, buildReportFromCompared } from "@/src/server/export";
import { jsonError } from "@/src/server/http";
import { parseProductListParams } from "@/src/server/product-query";
import { HttpError, requireUser } from "@/src/server/tenant";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const batch = await activeBatchForRequest(user.companyId, request);
    if (!batch) {
      throw new HttpError(404, "NOT_FOUND", "Nenhum lote importado.");
    }
    const url = new URL(request.url);
    const onlyDivergent = url.searchParams.get("somente") === "divergentes";
    const tratado = parseProductListParams(url).tratado;
    const items = await compareCompanyProducts(user.companyId, batch.id, {
      statuses: onlyDivergent ? ["DIVERGENTE"] : ["DIVERGENTE", "NECESSITA_ANALISE"],
      tratado,
    });
    const buffer = await buildPdf(
      buildReportFromCompared({
        companyName: user.companyName,
        batchFileName: batch.fileName,
        items,
      }),
    );
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="divergencias-${batch.id.slice(0, 8)}.pdf"`,
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
