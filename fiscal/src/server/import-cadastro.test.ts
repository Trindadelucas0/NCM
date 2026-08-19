import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { parseCadastroBuffer, isJunkRow } from "./import-cadastro";
import { normalizeNcm } from "./ncm";

describe("import cadastro", () => {
  it("lê fixture XLSX e não depende da aba Classes Fiscais", async () => {
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("Cadastro");
    sheet.addRow([
      "codigo",
      "descricao",
      "ncm",
      "nao contr",
      "contrib",
      "revenda",
      "construt",
      "hosp/clinica",
      "orgao pub",
      "prod.rural",
      "atacado",
      "cst compra",
      "iva",
    ]);
    sheet.addRow([
      "TINTA-ST",
      "Tinta ST interno",
      "32141010",
      "0",
      "10",
      "00",
      "0",
      "0",
      "0",
      "0",
      "10",
      "0",
      "30%",
    ]);
    const buf = Buffer.from(await wb.xlsx.writeBuffer());
    const rows = parseCadastroBuffer(buf, ".xlsx");
    expect(rows).toHaveLength(1);
    expect(rows[0].codigo).toBe("TINTA-ST");
    expect(normalizeNcm(rows[0].ncmOriginal)).toBe("32141010");
    expect(rows[0].destinosCst?.revenda).toBe("00");
    expect(JSON.stringify(rows)).not.toMatch(/Planilha_Classes_Fiscais/i);
  });

  it("lê export Santri Relação de Classes Fiscais (cabeçalho em 4 linhas)", async () => {
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("Planilha1");
    sheet.addRow(["Relação de Classes Fiscais"]);
    sheet.addRow(["", "", "", "", "", "", "", "", "", "", "Venda"]);
    sheet.addRow(["", "", "", "", "Dados fiscais do produto"]);
    sheet.addRow([
      "Código",
      "Nome do produto",
      "Código original",
      "Marca",
      "NCM",
      "%ICMS",
      "Preço de pauta",
      "Preço de pauta crédito",
      "%IPI compra",
      "%IPI venda",
      "Não contr",
      "Contrib",
      "Revenda",
      "Construt",
      "Hosp/clínica",
      "Órgão púb",
      "Prod.rural",
      "Atacado",
      "Índ.red.base venda",
      "Índ.red.base ST",
      "Índ.red.DIFAL",
      "%IVA venda",
      "%IVA venda p/ produto importado",
      "Indústria",
      "Revenda",
      "Atacado",
      "x",
      "x",
      "x",
      "x",
      "x",
      "x",
      "%IVA compra",
    ]);
    sheet.addRow([
      "205.199",
      "ADAPT SOLD CURTO LR 25MM",
      "153178",
      "PLASTUBOS",
      "39174090",
      "20,00",
      "0",
      "0",
      "0",
      "0",
      "60",
      "60",
      "60",
      "60",
      "60",
      "60",
      "60",
      "60",
      "",
      "",
      "",
      "0",
      "0",
      "60",
      "60",
      "60",
      "",
      "",
      "",
      "",
      "",
      "",
      "26,51",
    ]);
    sheet.addRow(["Filtros Selecionados"]);
    sheet.addRow(["2 - ATACADO", "2 - ATACADO", "", "", ""]);
    sheet.addRow(["Ativo...............: Sim", "Ativo...............: Sim"]);
    sheet.addRow(["Data de cadastro....: 01/01/2026 até 31/07/2026", "Data de cadastro....: 01/01/2026 até 31/07/2026"]);
    const buf = Buffer.from(await wb.xlsx.writeBuffer());
    const rows = parseCadastroBuffer(buf, ".xlsx");
    expect(rows).toHaveLength(1);
    expect(rows[0].codigo).toBe("205.199");
    expect(rows[0].ncm).toBe("39174090");
    expect(rows[0].destinosCst?.naoContribuinte).toBe("60");
    expect(rows[0].destinosCst?.revenda).toBe("60");
    expect(rows[0].cstCompra).toBe("60");
    expect(rows[0].ivaMvaNumero).toBeCloseTo(26.51);
  });

  it("ignora rodapé e cabeçalho do Santri que não são produto", () => {
    expect(isJunkRow("2 - ATACADO", "2 - ATACADO")).toBe(true);
    expect(isJunkRow("Ativo...............: Sim", "Ativo...............: Sim")).toBe(true);
    expect(
      isJunkRow(
        "Data de cadastro....: 01/01/2026 até 31/07/2026",
        "Data de cadastro....: 01/01/2026 até 31/07/2026",
      ),
    ).toBe(true);
    expect(isJunkRow("204.834", "TINTA ESM FOSCO PISO 18 L PRETO SUVINIL")).toBe(false);
  });
});
