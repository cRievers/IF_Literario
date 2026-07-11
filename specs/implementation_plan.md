# Implementação do IF Literário (Backend + Frontend)

Este plano detalha a implementação do sistema IF Literário, cobrindo as fases do backend e as telas do frontend de forma paralela. O plano foi atualizado para refletir as definições recentes:
1. O critério booleano "Relação com o curso" valerá 0 ou 10 no cálculo da nota.
2. Os endpoints de resultados serão restritos apenas a Administradores.
3. Os endpoints CRUD administrativos (Turmas, Alocações, Templates) estão no escopo.
4. Backend e Frontend serão desenvolvidos em paralelo.

## User Review Required

> [!IMPORTANT]
> Este plano expande significativamente o escopo original para incluir a construção das interfaces Frontend e as rotas administrativas CRUD no Backend. Por favor, revise a ordem das tarefas e os componentes propostos antes da execução.

## Open Questions

Nenhuma questão aberta no momento.

> [!NOTE]
> **Correção pós-Sprint 2**: Identificada falha de design onde `AvaliacaoForm.tsx` usava `TEMPLATE_ID = 1` hardcoded.
> O schema foi atualizado para incluir `templateId` em `Turma`, e o `templateId` agora flui via `navigation state`
> do `TurmaCard` → `AvaliacaoForm`, eliminando qualquer suposição sobre IDs do banco.

## Proposed Changes

O trabalho será dividido em "Sprints" lógicos, abordando Backend e Frontend juntos sempre que possível.

### ✅ Sprint 1: Autenticação, RBAC e Infraestrutura Base (CONCLUÍDA)

**Backend (`api/`)**
- [x] Criar a instância global do Prisma em `src/lib/prisma.ts`.
- [x] Enriquecer `requireAuth` (`src/middlewares/auth.ts`) para buscar o usuário no Prisma e anexar a `role`.
- [x] Criar middleware de autorização `requireRole` (`src/middlewares/roles.ts`).
- [x] Implementar `GET /api/me` para retornar o perfil completo e as turmas associadas (dependendo da role).
- [x] Adicionar CORS restrito e tratamento de erros global.

**Frontend (`web/`)**
- [x] Configurar React Router DOM e estrutura básica de navegação.
- [x] Implementar o `AuthContext` para gerenciar estado de login persistente e ouvir `onAuthStateChange` do Supabase.
- [x] Criar componente `PrivateRoute` para proteger rotas baseado em autenticação e `role`.
- [x] Criar um cliente HTTP (`src/api/client.ts`) configurado para injetar o token JWT automaticamente.

---

### ✅ Sprint 2: Fluxo do Avaliador (CONCLUÍDA + CORRIGIDA)

**Backend (`api/`)**
- [x] Implementar `GET /api/avaliacoes/turma/:id` (retornar progresso das avaliações de uma turma).
- [x] Criar utilitário `src/lib/logger.ts` para salvar logs na tabela `LogAuditoria`.
- [x] Criar rota `GET /api/templates/:id` para o frontend consumir o barema dinamicamente.
- [x] Implementar o crítico `POST /api/avaliacoes`:
  - [x] Garantir idempotência.
  - [x] Validar regra 3x3 (Avaliador não pode submeter mais que 3 avaliações).
  - [x] Validar limite por turma (Turma só recebe 3 avaliações de visitantes).
  - [x] Validar todos os critérios do template e usar transação ACID (`prisma.$transaction`).
- [x] **[CORREÇÃO]** Adicionar `templateId` em `Turma` no schema — cada turma indica explicitamente qual barema usar.
- [x] **[CORREÇÃO]** Atualizar `GET /api/me` para incluir `templateId` nas turmas retornadas e filtrar por edição ativa.
- [x] Atualizar `prisma/seed.ts` para popular `templateId` nas turmas de teste.

**Frontend (`web/`)**
- [x] Criar o Painel Principal (Avaliador) listando as turmas alocadas.
- [x] Integrar com `GET /api/me` e `GET /api/avaliacoes/turma/:id` para mostrar o status de cada turma.
- [x] **[CORREÇÃO]** `TurmaCard` passa `templateId` via `navigation state` ao navegar para `/avaliar/:id`.
- [x] Criar a Tela de Avaliação (Formulário Dinâmico):
  - [x] Consumir `GET /api/templates/:id` com o ID recebido via `location.state` (nunca hardcoded).
  - [x] Renderizar os campos condicionalmente (`NUMERICO` -> Slider, `BOOLEANO` -> Radio Sim/Não, `TEXTO` -> Textarea).
  - [x] Exibir erro descritivo se a turma não tiver template configurado.
  - [x] Implementar lógica de envio conectada ao `POST /api/avaliacoes` e tratamento de erros.

---

### ✅ Sprint 3: Fluxo do Orientador e Ocorrências (CONCLUÍDA)

Nesta sprint focamos nas ações específicas do **Orientador**, permitindo que ele avalie a turma que orienta e crie ocorrências.

#### Proposed Changes

**Backend (`api/`)**
- [x] `src/routes/ocorrencias.ts`: Criar novo router para ocorrências.
- [x] `src/routes/ocorrencias.ts`: Implementar `POST /api/ocorrencias` restrito a `ORIENTADOR` e `ADMIN`. O payload receberá `descricao` e, opcionalmente, `turmaId`.
- [x] `src/routes/ocorrencias.ts`: Implementar `GET /api/ocorrencias/minhas` para o `ORIENTADOR` listar o status de suas ocorrências (`resolvida: boolean`).
- [x] `src/routes/avaliacoes.ts`: Adaptar o endpoint `POST /api/avaliacoes` para validar a role `ORIENTADOR` (não aplicar a regra de 3 avaliações máximas para ele, mas garantir que ele seja o `orientadorId` da turma e permitir apenas 1 avaliação daquele orientador).

**Frontend (`web/`)**
- [x] `src/pages/Dashboard.tsx`: Atualizar a interface para, quando `user.role === 'ORIENTADOR'`, listar apenas as turmas de `user.turmasOrientadas`. (Adicionado link para Minhas Ocorrências)
- [x] `src/components/TurmaCard.tsx` e `src/pages/AvaliacaoForm.tsx`: O formulário e o card aceitam o fluxo do orientador sem as regras de visitante e registram a submissão corretamente.
- [x] `src/pages/Ocorrencias.tsx`: Criar tela para listar ocorrências enviadas pelo orientador (com status de Pendente/Resolvida).
- [x] `src/pages/OcorrenciaForm.tsx` (ou modal dentro de `Ocorrencias.tsx`): Formulário para submeter uma nova ocorrência (campo texto longo para descrição e select opcional para a turma relacionada).
- [x] `src/App.tsx`: Adicionar rotas para listar ocorrências.

---

### Sprint 4: Resultados, Motor de Cálculo e Painel Admin

**Backend (`api/`)**
- [x] Implementar `GET /api/resultados/campea` (Restrito a `ADMIN`). Média simples das avaliações dos visitantes. O critério booleano será tratado com peso 10 (se verdadeiro) ou 0 (se falso).
- [x] Implementar `GET /api/resultados/consolidado` (Restrito a `ADMIN`). Cálculo da nota final cruzando visitantes e orientador.
- [x] Implementar Endpoints CRUD básicos (Restritos a `ADMIN`):
  - [x] `POST /api/turmas` e `PUT /api/turmas/:id`
  - [x] `POST /api/alocacoes` e `DELETE /api/alocacoes/:id`
  - [x] `PUT /api/templates/:id`

**Frontend (`web/`)**
- [x] Painel Administrativo com Abas (Resultados, Turmas, Avaliadores, Ocorrências).
- [x] Tela de Ranking: Exibir de forma visual a Turma Campeã e o consolidado.
- [x] Interface CRUD: Listagens e formulários simplificados para gerenciar edições, turmas e alocações.
- [x] Exportação de Planilha: Adicionar suporte para geração de arquivos `.xlsx` (utilizando a biblioteca `xlsx`) e incluir botão de exportação das notas consolidadas na aba de resultados do administrador.

---

### ✅ Sprint 5: Avaliação Livre + Aviso de Mínimo (CONCLUÍDA)

Mudança de regras de negócio: avaliador passa a ter acesso livre a qualquer turma, e o mínimo de 3 avaliações por turma vira aviso (não bloqueio). A fórmula de cálculo permanece inalterada (opção A — booleanos e numéricos calculados juntos por normalização).

**Backend (`api/`)**
- [x] Remover validação que limitava o avaliador a 3 avaliações (`Regra 3x3`).
- [x] Remover bloqueio de turma com 3 avaliações de visitantes.
- [x] `GET /api/avaliacoes/turma/:id`: substituir `maxAvaliacoes` por `avisoMinimo: boolean` (true se < 3 avaliações).
- [x] `GET /api/me`: para `AVALIADOR`, retornar **todas** as turmas da edição ativa (não só as alocadas).

**Frontend (`web/`)**
- [x] `TurmaCard`: remover lógica de `limiteAtingido`; adicionar badge amarelo informativo `⚠️ Mínimo de 3 avaliações não atingido`.
- [x] `Dashboard.tsx`: atualizar título de "Minhas Turmas" para "Turmas Disponíveis".
- [x] `ResultadosTab.tsx`: badges de status exibem contagem atual (ex: `⚠️ 1/3 avaliações`) em vez de texto genérico.

---

## Verification Plan

### Automated Tests
Não há testes unitários ou E2E definidos até o momento. A verificação primária será manual durante o desenvolvimento.

### Manual Verification
1. **Login e Rotas:** Tentar acessar rotas de Admin com login de Avaliador (deve ser bloqueado). Verificar permanência de sessão no Frontend ao recarregar a página.
2. **Avaliação Livre:** Avaliador deve ver todas as turmas da edição ativa e conseguir avaliar mais de 3 sem bloqueio.
3. **Aviso de Mínimo:** Turma com menos de 3 avaliações deve exibir badge amarelo no card e no painel admin — sem impedir o fluxo.
4. **Cálculos:** Verificar que booleanos (0 ou pesoMaximo) e numéricos são normalizados juntos em `achieved/max`, resultando em percentual correto.
5. **CRUD:** Alocações permanecem funcionais para fins administrativos, mas não restringem o acesso do avaliador.
