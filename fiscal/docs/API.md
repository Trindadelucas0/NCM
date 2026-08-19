# API

Autenticação: cookie `fiscal_session` (HttpOnly, SameSite=Lax, Secure em produção).  
Todas as rotas de negócio exigem sessão válida. Mutações de importação/vínculo exigem papel `admin`. Marcar “já tratado” vale para admin e consulta.  
Respostas: `{ success, data }` ou `{ success: false, error: { code, message } }`.

| Método | Rota | Auth | Função |
| --- | --- | --- | --- |
| POST | `/api/auth/login` | pública + rate limit | autentica |
| POST | `/api/auth/logout` | sessão | encerra cookie |
| GET | `/api/auth/me` | sessão | usuário e empresa |
| GET | `/api/dashboard` | sessão | totais do lote ativo (`lote`) |
| GET | `/api/rules` | sessão | lista NCM (`q`, `situacao`) |
| GET | `/api/rules/:id` | sessão | regra; outro tenant → 404 |
| GET | `/api/products` | sessão | cadastro do lote (`q`, `ncm`, `status`, `lote`, `page`, `pageSize`, `tratado=nao\|sim`); summary e página |
| GET | `/api/products/ncm-summary` | sessão | agrupamento por NCM do lote (`status`, `tratado`) |
| GET | `/api/products/:id` | sessão | ficha + matriz + guia de entrada + tratado |
| POST | `/api/products/:id` | admin | vincula regra quando NCM é duplo |
| POST | `/api/products/:id/treated` | sessão | marca/desmarca já tratado |
| POST | `/api/products/treated-ncm` | sessão | marca/desmarca todos os produtos do NCM no lote |
| GET | `/api/import` | sessão | histórico de lotes + `activeBatchId` |
| POST | `/api/import` | admin | cria um lote novo com `auditStatus` gravado; `manterTratados=1\|0` |
| GET | `/api/import/diff` | sessão | diff vs lote anterior (`lote`, `tipo`, `page`) |
| POST | `/api/import/select` | sessão | escolhe o lote ativo (cookie HttpOnly) |
| DELETE | `/api/import/:id` | admin | apaga um lote; outro tenant → 404; regras NCM intactas |
| GET | `/api/export/excel` | sessão | Excel; `status=DIVERGENTE\|CORRETO\|NECESSITA_ANALISE` (vazio = todos); `somente=divergentes\|corretos\|analise\|todos` (legado); `tratado=nao` oculta já tratados |
| GET | `/api/export/pdf` | sessão | PDF A4 paisagem; mesmos filtros; texto escapado |

Login inválido: `401` sem distinguir se o e-mail existe.  
Sem permissão: `403`.  
Recurso de outra empresa: `404`.
