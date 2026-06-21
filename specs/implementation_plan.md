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

### Sprint 3: Fluxo do Orientador e Ocorrências

**Backend (`api/`)**
- Implementar `POST /api/ocorrencias` restrito a `ORIENTADOR` e `ADMIN`.

**Frontend (`web/`)**
- Criar Painel do Orientador listando sua respectiva turma.
- Tela de Avaliação do Orientador (similar à do avaliador, mas puxando o template específico do orientador).
- Formulário para submissão de Ocorrências e listagem do status (resolvido/pendente).

---

### Sprint 4: Resultados, Motor de Cálculo e Painel Admin

**Backend (`api/`)**
- Implementar `GET /api/resultados/campea` (Restrito a `ADMIN`). Média simples das avaliações dos visitantes. O critério booleano será tratado com peso 10 (se verdadeiro) ou 0 (se falso).
- Implementar `GET /api/resultados/consolidado` (Restrito a `ADMIN`). Cálculo da nota final cruzando visitantes e orientador.
- Implementar Endpoints CRUD básicos (Restritos a `ADMIN`):
  - `POST /api/turmas` e `PUT /api/turmas/:id`
  - `POST /api/alocacoes` e `DELETE /api/alocacoes/:id`
  - `PUT /api/templates/:id`

**Frontend (`web/`)**
- Painel Administrativo com Abas (Resultados, Turmas, Avaliadores, Ocorrências).
- Tela de Ranking: Exibir de forma visual a Turma Campeã e o consolidado.
- Interface CRUD: Listagens e formulários simplificados para gerenciar edições, turmas e alocações.

## Verification Plan

### Automated Tests
Não há testes unitários ou E2E definidos até o momento. A verificação primária será manual durante o desenvolvimento.

### Manual Verification
1. **Login e Rotas:** Tentar acessar rotas de Admin com login de Avaliador (deve ser bloqueado). Verificar permanência de sessão no Frontend ao recarregar a página.
2. **Avaliação:** Submeter avaliação com notas acima do peso permitido. Tentar submeter avaliações repetidas. Tentar avaliar uma turma para a qual não está alocado. Validar que as transações são revertidas em caso de falha.
3. **Cálculos:** Verificar manualmente se a soma da nota final considera corretamente o critério booleano valendo 10 e se a escala final respeita a faixa de 0 a 100%.
4. **CRUD:** Criar uma nova alocação pelo painel admin e verificar se a turma aparece imediatamente no painel do avaliador alvo.
