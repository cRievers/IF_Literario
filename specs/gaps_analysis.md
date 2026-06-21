# 🔍 Análise de Gaps — IF Literário

> Comparação entre o especificado em `specs/` e o que está implementado em `api/` e `web/`.

---

## Resumo Executivo

| Área | Status |
|---|---|
| 🗄️ Schema do Banco | ✅ Completo (Fase 1 concluída) |
| 🌱 Seed de Dados | ✅ Completo (Fase 1 concluída) |
| 🛡️ Middleware `requireAuth` | ⚠️ Parcial — valida token, mas **não busca o usuário no banco local** |
| 🔒 Middleware RBAC `requireRole` | ❌ Não implementado |
| 📋 `GET /api/me` | ❌ Não implementado |
| 📊 `GET /api/avaliacoes/turma/:id` | ❌ Não implementado |
| 📝 `POST /api/avaliacoes` | ❌ Não implementado |
| 🏆 `GET /api/resultados/campea` | ❌ Não implementado |
| 📈 `GET /api/resultados/consolidado` | ❌ Não implementado |
| 🚨 `POST /api/ocorrencias` | ❌ Não implementado |
| 🪵 Utilitário de Auditoria (`logger.ts`) | ❌ Não implementado |
| 🌐 UI — Tela pós-login (painel do avaliador) | ❌ Não implementado |
| 🌐 UI — Formulário dinâmico de avaliação | ❌ Não implementado |
| 🌐 UI — Tela de resultados/ranking | ❌ Não implementado |
| 🌐 UI — Tela de ocorrências (orientador) | ❌ Não implementado |
| 🌐 UI — Painel administrativo | ❌ Não implementado |

---

## 🔴 Backend — O que falta

### Fase 2: Autenticação e RBAC

#### Tarefa 2.1 — `requireAuth` incompleto
O middleware [`auth.ts`](file:///c:/Users/caio.duarte/Documents/IF_Literario/api/src/middlewares/auth.ts) atualmente:
- ✅ Valida o Bearer Token com Supabase
- ❌ **NÃO** busca o usuário correspondente no banco local (`prisma.user.findUnique`)
- ❌ `req.user` recebe o objeto bruto do Supabase, sem `role` local nem dados do banco
- ❌ `AuthRequest` usa `user?: any` em vez de tipagem com o modelo Prisma

**O que implementar:**
```typescript
// Após validar o token...
const dbUser = await prisma.user.findUnique({ where: { id: data.user.id } });
if (!dbUser) return res.status(401).json({ error: 'Usuário não cadastrado no banco do sistema' });
req.user = dbUser; // tipado como User do Prisma
```

---

#### Tarefa 2.2 — Middleware RBAC `requireRole` ausente
- ❌ O arquivo `api/src/middlewares/roles.ts` **não existe**
- ❌ Nenhuma rota hoje protege por papel — qualquer usuário autenticado acessa tudo
- Sem isso, avaliadores podem acessar rotas de admin e vice-versa

**O que criar:** `api/src/middlewares/roles.ts` com factory `requireRole(allowedRoles: Role[])`.

---

### Fase 3: Endpoints Principais

#### Tarefa 3.1 — `GET /api/me` ausente
O endpoint [`/api/perfil`](file:///c:/Users/caio.duarte/Documents/IF_Literario/api/src/server.ts#L46) existe mas é **rascunho**:
- ❌ Não implementa lógica condicional por papel
- ❌ Não retorna turmas associadas (via `Alocacao` para avaliadores, `orientadorId` para orientadores)
- ❌ Rota está em `/api/perfil`, o PRD especifica `/api/me`

**O que implementar:** lógica com `switch` por `req.user.role` retornando as turmas corretas.

---

#### Tarefa 3.2 — `GET /api/avaliacoes/turma/:id` ausente
- ❌ Rota inexistente
- Frontend não tem como exibir "X/3 avaliações preenchidas"

**Payload esperado:**
```json
{
  "turmaId": "uuid",
  "avaliadoresVisitantesConcluidos": 2,
  "totalEsperadoAvaliadores": 3,
  "orientadorSubmetido": false
}
```

---

#### Tarefa 3.3 — `POST /api/avaliacoes` ausente (endpoint mais crítico)
- ❌ Rota inexistente — o sistema não aceita nenhuma avaliação ainda
- ❌ Sem validação de alocação (regra 3x3)
- ❌ Sem limite de avaliações por turma (máx. 3)
- ❌ Sem validação de critérios (submissão parcial não detectada)
- ❌ Sem transação ACID (`prisma.$transaction`)
- ❌ Sem idempotência (double-click gera duplicatas)
- ❌ Sem log de auditoria ao criar avaliação

---

### Fase 4: Motor de Cálculo

#### Tarefa 4.1 — `GET /api/resultados/campea` ausente
- ❌ Rota inexistente
- ❌ Sem lógica de ranking por média dos visitantes

#### Tarefa 4.2 — `GET /api/resultados/consolidado` ausente
- ❌ Rota inexistente
- ❌ Sem fórmula de normalização `(média_visitantes_0a1 + nota_orientador_0a1) / 2 * 100`

---

### Fase 5: Ocorrências e Auditoria

#### Tarefa 5.1 — `POST /api/ocorrencias` ausente
- ❌ Rota inexistente (modelo `Ocorrencia` está no schema mas não há endpoint)
- ❌ Sem proteção `requireRole(['ORIENTADOR', 'ADMIN'])`

#### Tarefa 5.2 — `api/src/lib/logger.ts` ausente
- ❌ Arquivo não existe (apenas `supabase.ts` está em `lib/`)
- ❌ Nenhuma operação atual registra logs em `LogAuditoria`

---

### Gaps de Infraestrutura da API

| Item | Status | Observação |
|---|---|---|
| Separação de rotas em arquivos (`routes/`) | ❌ | Tudo em `server.ts` — escalabilidade ruim |
| Instância compartilhada do Prisma | ❌ | `prisma` é instanciado dentro de `server.ts`; não reutilizável por módulos |
| Tratamento global de erros | ❌ | Cada rota tem `try/catch` próprio; sem middleware de erro centralizado |
| Configuração de CORS restrita | ⚠️ | `cors()` sem restrição de origem — qualquer domínio pode chamar a API |
| Variáveis de ambiente validadas | ❌ | Não há checagem de `SUPABASE_URL`, `DATABASE_URL` na inicialização |
| `datasource` do schema sem `url`/`directUrl` | ⚠️ | `schema.prisma` está sem as chaves de conexão (foram removidas) |

---

## 🔴 Frontend — O que falta

O frontend (`web/`) tem **apenas a tela de login** implementada. Após autenticação, o usuário vê uma mensagem de sucesso e o console.log — sem nenhum redirecionamento ou painel.

### Telas não implementadas

#### 1. Tela de Painel/Dashboard pós-login
- ❌ Roteamento (React Router ou similar) — não há sistema de rotas no frontend
- ❌ Lógica de sessão persistente (ao recarregar, usuário perde sessão)
- ❌ Listener `onAuthStateChange` do Supabase não configurado
- ❌ Painel diferenciado por papel (avaliador vs orientador vs admin)

---

#### 2. Tela do Avaliador (fluxo principal)
- ❌ Lista de turmas alocadas ao avaliador (consumindo `GET /api/me`)
- ❌ Indicador de status "X/3 avaliações já preenchidas" por turma (consumindo `GET /api/avaliacoes/turma/:id`)
- ❌ Formulário dinâmico de avaliação:
  - ❌ Leitura do template via `GET /api/templates/:id`
  - ❌ Renderização condicional por `TipoCriterio`:
    - `NUMERICO` → slider ou input numérico com validação de 0 até `pesoMaximo`
    - `BOOLEANO` → radio button Sim/Não
    - `TEXTO` → textarea
  - ❌ Campo de comentário livre
  - ❌ Submissão via `POST /api/avaliacoes` com tratamento de idempotência
  - ❌ Bloqueio do formulário quando turma já foi avaliada pelo usuário

---

#### 3. Tela do Orientador
- ❌ Ficha de avaliação do orientador (usando template próprio)
- ❌ Formulário de registro de ocorrências (consumindo `POST /api/ocorrencias`)
- ❌ Indicador se já submeteu sua nota

---

#### 4. Painel do Administrador
- ❌ Ranking em tempo real — Turma Campeã (consumindo `GET /api/resultados/campea`)
- ❌ Tabela de notas consolidadas — Notas Escolares (consumindo `GET /api/resultados/consolidado`)
- ❌ Listagem e gerenciamento de ocorrências
- ❌ Visão geral de progresso das avaliações por turma

---

### Gaps de Infraestrutura do Frontend

| Item | Status | Observação |
|---|---|---|
| Sistema de roteamento | ❌ | Não há `react-router-dom` ou equivalente |
| Gerenciamento de sessão Supabase | ❌ | `onAuthStateChange` não implementado; sessão não persiste |
| Contexto de autenticação (AuthContext) | ❌ | Role do usuário não é propagada para os componentes |
| Cliente HTTP centralizado (axios/fetch) | ❌ | Não há abstração para chamadas à API backend |
| Tratamento de erros global na UI | ❌ | Sem componente de toast/notification |
| Proteção de rotas por papel (PrivateRoute) | ❌ | Qualquer URL acessível sem autenticação |
| Estados de carregamento | ⚠️ | Existe apenas no login; demais telas precisam de skeletons/spinners |

---

## 📋 Checklist Completo — O que fazer

### Backend
- [ ] **2.1** Enriquecer `requireAuth` com busca no banco local
- [ ] **2.1** Tipar corretamente `AuthRequest` com modelo Prisma `User`
- [ ] **2.2** Criar `middlewares/roles.ts` com `requireRole()`
- [ ] **2.3** Criar instância compartilhada do Prisma (`lib/prisma.ts`)
- [ ] **2.4** Criar `lib/logger.ts` para logs de auditoria
- [ ] **3.1** Implementar `GET /api/me` (com lógica por papel)
- [ ] **3.2** Implementar `GET /api/avaliacoes/turma/:id`
- [ ] **3.3** Implementar `POST /api/avaliacoes` (transacional + idempotente)
- [ ] **4.1** Implementar `GET /api/resultados/campea`
- [ ] **4.2** Implementar `GET /api/resultados/consolidado`
- [ ] **5.1** Implementar `POST /api/ocorrencias`
- [ ] **Extra** Organizar rotas em pasta `src/routes/`
- [ ] **Extra** Middleware global de tratamento de erros
- [ ] **Extra** Corrigir `schema.prisma` — adicionar `url` e `directUrl` no datasource
- [ ] **Extra** Restringir `cors()` para origem do frontend

### Frontend
- [ ] Instalar e configurar `react-router-dom`
- [ ] Implementar `AuthContext` com `onAuthStateChange`
- [ ] Criar `PrivateRoute` com redirecionamento por papel
- [ ] Criar cliente HTTP (`api/client.ts`) com interceptor de token
- [ ] **Tela Avaliador:** Lista de turmas alocadas
- [ ] **Tela Avaliador:** Formulário dinâmico (por `TipoCriterio`)
- [ ] **Tela Avaliador:** Status de progresso por turma
- [ ] **Tela Orientador:** Formulário de avaliação do orientador
- [ ] **Tela Orientador:** Formulário de registro de ocorrências
- [ ] **Tela Admin:** Ranking Turma Campeã (tempo real)
- [ ] **Tela Admin:** Tabela de notas consolidadas
- [ ] **Tela Admin:** Listagem de ocorrências
- [ ] Componente de notificação/toast global
- [ ] Estados de carregamento (skeleton screens)
