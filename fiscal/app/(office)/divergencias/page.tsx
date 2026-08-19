"use client";

import { ProductCatalog } from "@/src/components/product/product-catalog";
import { ExportFileButton } from "@/src/components/ui/export-file-button";

export default function DivergenciasPage() {
  return (
    <ProductCatalog
      kicker="Relatório"
      title="Divergências"
      description="Escolha a planilha e veja só as divergências dela. Clique na linha para ver o que veio errado no importado e como a regra fiscal manda ficar."
      defaultStatus="DIVERGENTE"
      rowMode="expand"
      actions={(batchId) => {
        const lote = batchId ? `&lote=${encodeURIComponent(batchId)}` : "";
        return (
          <>
            <ExportFileButton href={`/api/export/excel?somente=divergentes${lote}`}>
              Exportar Excel
            </ExportFileButton>
            <ExportFileButton href={`/api/export/pdf?somente=divergentes${lote}`}>
              Exportar PDF
            </ExportFileButton>
          </>
        );
      }}
    />
  );
}
