import { config } from "dotenv";
import { readFileSync } from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

config();

type Destinos = {
  naoContribuinte: string | null;
  contribuinte: string | null;
  revenda: string | null;
  construtora: string | null;
  hospClinica: string | null;
  orgaoPublico: string | null;
  produtorRural: string | null;
  atacado: string | null;
};

type ExtractedRule = {
  company: string;
  sourceSheet: string;
  ncm: string;
  ncmOriginal: string;
  segmento: string;
  cstEntrada: string | null;
  cstSaida: string | null;
  cfopSaida: string | null;
  destinosCst: Destinos;
  situacao: string;
  situacaoCodigo: string;
  mvaPercentual: number | null;
  mvaTexto: string | null;
  mvaKind: string;
  observacao: string | null;
};

type ExtractedFile = {
  company: string;
  sheet: string;
  rules: ExtractedRule[];
};

type CompanySeed = {
  id: string;
  slug: string;
  name: string;
  jsonFile: string;
  adminEmail: string;
  consultaEmail: string;
};

const COMPANIES: CompanySeed[] = [
  {
    id: "cm_baifer_seed_company",
    slug: "baifer",
    name: "BAIFER",
    jsonFile: "base-baifer.json",
    adminEmail: "admin@baifer.local",
    consultaEmail: "consulta@baifer.local",
  },
  {
    id: "cm_loja_seed_company",
    slug: "loja",
    name: "Loja das Máquinas",
    jsonFile: "base-loja.json",
    adminEmail: "admin@loja.local",
    consultaEmail: "consulta@loja.local",
  },
];

const prisma = new PrismaClient();

async function withCompany<T>(companyId: string, fn: () => Promise<T>): Promise<T> {
  await prisma.$executeRaw`SELECT set_config('app.company_id', ${companyId}, false)`;
  return fn();
}

function loadRules(file: string, expectedCompany: string): ExtractedFile {
  const jsonPath = path.join(process.cwd(), "data", file);
  const raw = JSON.parse(readFileSync(jsonPath, "utf8")) as ExtractedFile;
  if (raw.company !== expectedCompany) {
    throw new Error(`JSON ${file} é da empresa ${raw.company}, esperado ${expectedCompany}.`);
  }
  if (expectedCompany === "loja" && raw.rules.some((r) => r.sourceSheet !== "LOJA")) {
    throw new Error("JSON da Loja contém aba que não é LOJA.");
  }
  if (expectedCompany === "baifer" && raw.rules.some((r) => r.sourceSheet === "LOJA")) {
    throw new Error("JSON da BAIFER contém aba LOJA.");
  }
  if (raw.rules.some((r) => "codigoProduto" in r || "descricaoProduto" in r)) {
    throw new Error("Seed recusou payload com produtos.");
  }
  return raw;
}

async function seedCompany(spec: CompanySeed, passwordHash: string) {
  const raw = loadRules(spec.jsonFile, spec.slug);
  await withCompany(spec.id, async () => {
    await prisma.productRuleLink.deleteMany({ where: { companyId: spec.id } });
    await prisma.product.deleteMany({ where: { companyId: spec.id } });
    await prisma.importBatch.deleteMany({ where: { companyId: spec.id } });
    await prisma.fiscalNcmRule.deleteMany({ where: { companyId: spec.id } });
    await prisma.session.deleteMany({ where: { companyId: spec.id } });
    await prisma.user.deleteMany({ where: { companyId: spec.id } });
    await prisma.company.deleteMany({ where: { id: spec.id } });

    await prisma.company.create({
      data: { id: spec.id, name: spec.name, slug: spec.slug },
    });
    await prisma.user.create({
      data: {
        id: `${spec.id}_admin`,
        companyId: spec.id,
        email: spec.adminEmail,
        passwordHash,
        name: "Administrador",
        role: "admin",
      },
    });
    await prisma.user.create({
      data: {
        id: `${spec.id}_consulta`,
        companyId: spec.id,
        email: spec.consultaEmail,
        passwordHash,
        name: "Consulta",
        role: "consulta",
      },
    });

    const chunkSize = 200;
    for (let i = 0; i < raw.rules.length; i += chunkSize) {
      const slice = raw.rules.slice(i, i + chunkSize);
      await prisma.fiscalNcmRule.createMany({
        data: slice.map((rule) => ({
          companyId: spec.id,
          ncm: rule.ncm,
          ncmOriginal: rule.ncmOriginal,
          segmento: rule.segmento,
          cstEntrada: rule.cstEntrada,
          cstSaida: rule.cstSaida,
          cfopSaida: rule.cfopSaida,
          destinosCst: rule.destinosCst,
          situacao: rule.situacao,
          situacaoCodigo: rule.situacaoCodigo,
          mvaPercentual: rule.mvaPercentual,
          mvaTexto: rule.mvaTexto,
          mvaKind: rule.mvaKind,
          observacao: rule.observacao,
        })),
      });
    }

    const products = await prisma.product.count({ where: { companyId: spec.id } });
    const rules = await prisma.fiscalNcmRule.count({ where: { companyId: spec.id } });
    if (products !== 0) throw new Error(`Seed ${spec.slug} não deve criar produtos.`);
    console.log(`Seed OK: ${spec.name} (${spec.slug}) ${rules} regras, admin ${spec.adminEmail}`);
  });
}

async function main() {
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!password) {
    throw new Error("SEED_ADMIN_PASSWORD é obrigatório (não commitar senha no código).");
  }
  const hash = await bcrypt.hash(password, 12);
  for (const spec of COMPANIES) {
    await seedCompany(spec, hash);
  }
  const baiferRules = await prisma.fiscalNcmRule.count({ where: { companyId: "cm_baifer_seed_company" } });
  const lojaRules = await prisma.fiscalNcmRule.count({ where: { companyId: "cm_loja_seed_company" } });
  console.log(`Conferência: BAIFER ${baiferRules} regras, LOJA ${lojaRules} regras — isoladas por companyId.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
