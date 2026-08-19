# API

Autenticação: cookie `fiscal_session` (HttpOnly, SameSite=Lax, Secure em produção).  
Todas as rotas de negócio exigem sessão válida. Mutações de importação/vínculo exigem papel `admin`.  
Respostas: `{ success, data }` ou `{ success: false, error: { code, message } }`.

| Método | Rota | Auth | Função |
| --- | --- | --- | --- |
| POST | `/api/auth/login` | pública + rate limit | autentica |
| POST | `/api/auth/logout` | sessão | encerra cookie |
| GET | `/api/auth/me` | sessão | usuário e empresa |
| GET | `/api/dashboard` | sessão | totais do lote ativo (`lote`) |
| GET | `/api/rules` | sessão | lista NCM (`q`, `situacao`) |
| GET | `/api/rules/:id` | sessão | regra; outro tenant → 404 |
| GET | `/api/products` | sessão | cadastro do lote (`q`, `ncm`, `status`, `lote`); `diffs`, `importado.destinosCst`, `correto.destinosCst` e `summary` |
| GET | `/api/products/:id` | sessão | ficha + matriz + guia de entrada |
| POST | `/api/products/:id` | admin | vincula regra quando NCM é duplo |
| GET | `/api/import` | sessão | histórico de lotes + `activeBatchId` |
| POST | `/api/import` | admin | cria um lote novo (não apaga os anteriores) |
| POST | `/api/import/select` | sessão | escolhe o lote ativo (cookie HttpOnly) |
| DELETE | `/api/import/:id` | admin | apaga um lote; outro tenant → 404; regras NCM intactas |
| GET | `/api/export/excel` | sessão | Excel profissional (Resumo, Por regra, Regras, Campos); filtro `somente=divergentes` |
| GET | `/api/export/pdf` | sessão | PDF A4 paisagem: grade completa + detalhe campo a campo; texto escapado |

Login inválido: `401` sem distinguir se o e-mail existe.  
Sem permissão: `403`.  
Recurso de outra empresa: `404`.
