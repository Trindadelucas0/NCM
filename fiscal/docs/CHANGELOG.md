# Changelog

## v1.1.0 — 19/08/2026

Adicionado:

- Diff automático da planilha contra o lote anterior (novos, saíram, NCM mudou, situação mudou).
- Agrupamento de divergências por NCM.
- Marca “já tratado” por produto ou por NCM, com opção de trazer as marcas na próxima importação.

Alterado:

- Importação grava o status da conferência na hora, sem reler o cadastro inteiro depois.
- Consulta pagina no servidor usando o status gravado.
- Seed atualiza regras sem apagar lotes (wipe só com `SEED_RESET_CADASTRO=1`).

Banco:

- Unique `(company_id, ncm, situacao_codigo)` nas regras.
- Colunas `treated_*` em produtos.

## v1.0.5 — 19/08/2026

Corrigido:

- Panorama, consulta e divergências passam a ter seletor de planilha e a buscar só o lote escolhido (`lote` na URL e na API). Clicar em “Ver conferência” no histórico abre os dados daquele arquivo, não da última importação.

## v1.0.4 — 19/08/2026

Alterado:

- PDF de divergências passa a ser A4 paisagem, com a grade da tela (NCM, CST, CFOP, MVA e 8 destinatários) e detalhe campo a campo.
- Excel sai em quatro abas (Resumo, Por regra, Regras, Campos), com a regra NCM por inteiro e colunas importado × regra.

## v1.0.3 — 19/08/2026

Alterado:

- Consulta, divergências, panorama e base fiscal passam a usar grade no formato da planilha (NCM, CST, CFOP, MVA e 8 destinatários), com filtros sticky.
- Matriz da ficha mostra destinatários em colunas (importado × como deve ficar).

## v1.0.2 — 19/08/2026

Alterado:

- Cada planilha importada vira um lote isolado, com histórico.
- Consulta, divergências e panorama usam só o lote escolhido.
- Importar não apaga lotes anteriores.

## v1.0.1 — 18/08/2026

Alterado:

- BAIFER usa só a primeira aba do `OK.xlsx`; Loja usa só a aba `LOJA` do ODS.
- Login exige empresa; seed e extração isolam as duas bases (`companyId`).
- Cadastro `bs.xlsx` importa só na BAIFER; Loja fica sem misturar produtos.

## v1.0.0 — 18/08/2026

Adicionado:

- Extração Python da regra fiscal e pytest das contagens/matriz.
- Next.js App Router, login, panorama, importação, base fiscal, divergências, ficha e orientação de entrada.
- Prisma/PostgreSQL com tenant, papéis admin/consulta e seed sem produtos.
- Motor de comparação (matriz CST, MVA, NCM duplicado) com Vitest.
- Export Excel/PDF.

Segurança:

- Cookie de sessão HttpOnly, rate limit no login, allowlist de upload, escape no PDF.

Banco:

- Tabelas companies, users, sessions, fiscal_ncm_rules, products, product_rule_links, import_batches.
