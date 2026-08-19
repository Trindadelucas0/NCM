import path from "node:path";
import * as XLSX from "xlsx";
import type { DestinosCst } from "@/src/lib/fiscal";
import { DESTINO_KEYS } from "@/src/lib/fiscal";
import { normalizeCst, normalizeNcm, parseMvaNumber } from "./ncm";

export const ALLOWED_EXTENSIONS = new Set([".xlsx", ".csv", ".ods"]);
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export type ParsedProduct = {
  codigo: string;
  descricao: string;
  ncm: string;
  ncmOriginal: string;
  aliquotaIcms: string | null;
  ivaMva: string | null;
  ivaMvaNumero: number | null;
  cest: string | null;
  cstCompra: string | null;
  cstUnico: string | null;
  destinosCst: DestinosCst | null;
};

const HEADER_MAP: Record<string, string> = {
  codigo: "codigo",
  código: "codigo",
  code: "codigo",
  descricao: "descricao",
  descrição: "descricao",
  "nome do produto": "descricao",
  produto: "descricao",
  ncm: "ncm",
  cest: "cest",
  aliquota: "aliquotaIcms",
  alíquota: "aliquotaIcms",
  "%icms": "aliquotaIcms",
  icms: "aliquotaIcms",
  iva: "ivaMva",
  mva: "ivaMva",
  "%iva": "ivaMva",
  "%iva compra": "ivaMva",
  "iva compra": "ivaMva",
  cst: "cstUnico",
  "cst venda": "cstUnico",
  "cst saida": "cstUnico",
  "cst saída": "cstUnico",
  "cst baifer": "cstUnico",
  "cst compra": "cstCompra",
  "cst entrada": "cstCompra",
  revenda_1: "cstCompra",
  "nao contr": "naoContribuinte",
  "não contr": "naoContribuinte",
  naocontribuinte: "naoContribuinte",
  contrib: "contribuinte",
  contribuinte: "contribuinte",
  revenda: "revenda",
  construt: "construtora",
  construtora: "construtora",
  "hosp/clinica": "hospClinica",
  "hosp/clínica": "hospClinica",
  hospclinica: "hospClinica",
  "orgao pub": "orgaoPublico",
  "órgão púb": "orgaoPublico",
  orgaopublico: "orgaoPublico",
  "prod.rural": "produtorRural",
  prodrural: "produtorRural",
  "produtor rural": "produtorRural",
  atacado: "atacado",
};

const SKIP_SHEETS = new Set(["baifer", "loja", "ncm_geral"]);

function foldHeader(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ");
}

export function sanitizeFileName(name: string): string {
  const base = path.basename(name).replace(/[^\w.\- ()À-ÿ]/g, "_");
  return base.slice(0, 120) || "cadastro.xlsx";
}

export function assertSafeUpload(fileName: string, size: number, mime: string): string {
  if (size > MAX_UPLOAD_BYTES) {
    throw new Error("Arquivo excede 8 MB.");
  }
  const ext = path.extname(fileName).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new Error("Extensão não permitida. Use XLSX, CSV ou ODS.");
  }
  if (ext === ".xlsx" && mime && !/spreadsheet|excel|octet-stream|officedocument/i.test(mime)) {
    throw new Error("Tipo de arquivo inválido.");
  }
  return ext;
}

function mapHeader(header: string): string | null {
  const folded = foldHeader(header);
  if (folded === "codigo original" || folded === "marca") return null;
  if (folded.includes("iva") && folded.includes("venda")) return null;
  if (HEADER_MAP[folded]) return HEADER_MAP[folded];
  for (const [key, mapped] of Object.entries(HEADER_MAP)) {
    if (key.length < 3) continue;
    if (folded.includes(key)) return mapped;
  }
  return null;
}

function isCadastroHeader(cells: unknown[]): boolean {
  const folded = cells.map((c) => foldHeader(String(c ?? "")));
  const hasCodigo = folded.some((c) => c === "codigo");
  const hasNcm = folded.some((c) => c === "ncm");
  const hasNome = folded.some(
    (c) => c === "nome do produto" || c === "descricao" || c === "produto",
  );
  return hasCodigo && hasNcm && hasNome;
}

export function findHeaderRowIndex(aoa: unknown[][]): number {
  for (let i = 0; i < Math.min(aoa.length, 30); i++) {
    if (isCadastroHeader(aoa[i] ?? [])) return i;
  }
  return 0;
}

export function isJunkRow(codigo: string, descricao: string): boolean {
  const codigoFold = foldHeader(codigo);
  const descFold = foldHeader(descricao);
  const haystack = `${codigoFold} ${descFold}`.trim();
  if (!haystack) return true;
  if (
    /filtros selecionados|grupo fiscal|^estado\b|^df -|ativo\s*\.+|data de cadastro/.test(
      haystack,
    )
  ) {
    return true;
  }
  if (
    /^\d+\s*-\s*(atacado|revenda|contrib|nao contr|construt|hosp|orgao|prod)/.test(
      codigoFold,
    )
  ) {
    return true;
  }
  if (
    /^(nao contr|contrib|revenda|construt|hosp\/clinica|orgao pub|prod\.rural|atacado)$/.test(
      codigoFold,
    )
  ) {
    return true;
  }
  return false;
}

function sheetLooksLikeCadastro(sheet: XLSX.WorkSheet): boolean {
  const aoa = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "", raw: false });
  return findHeaderRowIndex(aoa) >= 0 && isCadastroHeader(aoa[findHeaderRowIndex(aoa)] ?? []);
}

function pickSheet(workbook: XLSX.WorkBook): string {
  const names = workbook.SheetNames.filter((n) => !SKIP_SHEETS.has(n.trim().toLowerCase()));
  for (const name of names) {
    if (sheetLooksLikeCadastro(workbook.Sheets[name])) return name;
  }
  if (names.length === 0) {
    throw new Error("Nenhuma aba de cadastro válida no arquivo (abas BAIFER/LOJA não são cadastro).");
  }
  return names[0];
}

export function parseCadastroBuffer(buffer: Buffer, _ext: string): ParsedProduct[] {
  const workbook = XLSX.read(buffer, { type: "buffer", raw: false });
  const sheetName = pickSheet(workbook);
  const sheet = workbook.Sheets[sheetName];
  const aoa = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "", raw: false });
  const headerRow = findHeaderRowIndex(aoa);
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    range: headerRow,
    defval: "",
    raw: false,
  });
  return rows
    .map((row) => toProduct(row))
    .filter((item): item is ParsedProduct => item != null);
}

function toProduct(row: Record<string, unknown>): ParsedProduct | null {
  const mapped: Record<string, string> = {};
  for (const [key, value] of Object.entries(row)) {
    const dest = mapHeader(key);
    if (!dest) continue;
    if (mapped[dest]) continue;
    mapped[dest] = String(value ?? "").trim();
  }
  const codigo = mapped.codigo;
  const descricao = mapped.descricao || "";
  const ncmOriginal = mapped.ncm || "";
  if (isJunkRow(codigo || "", descricao)) return null;
  if (!codigo && !descricao && !ncmOriginal) return null;
  if (!codigo && !ncmOriginal && !descricao) return null;
  if (!codigo) return null;

  const destinos: DestinosCst = {
    naoContribuinte: mapped.naoContribuinte || null,
    contribuinte: mapped.contribuinte || null,
    revenda: mapped.revenda || null,
    construtora: mapped.construtora || null,
    hospClinica: mapped.hospClinica || null,
    orgaoPublico: mapped.orgaoPublico || null,
    produtorRural: mapped.produtorRural || null,
    atacado: mapped.atacado || null,
  };
  const filled = DESTINO_KEYS.filter((k) => destinos[k]).length;

  return {
    codigo,
    descricao: descricao || codigo,
    ncm: normalizeNcm(ncmOriginal),
    ncmOriginal,
    aliquotaIcms: mapped.aliquotaIcms || null,
    ivaMva: mapped.ivaMva || null,
    ivaMvaNumero: parseMvaNumber(mapped.ivaMva),
    cest: mapped.cest || null,
    cstCompra: normalizeCst(mapped.cstCompra),
    cstUnico: normalizeCst(mapped.cstUnico),
    destinosCst: filled > 0 ? destinos : null,
  };
}
