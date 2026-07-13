## 📄 Product Requirements Document (PRD) - API Backend IF Literário

### 1. Visão Geral do Produto

A API do IF Literário é um serviço *headless* projetado para gerenciar, de forma dinâmica e segura, o fluxo de avaliações do evento anual do campus. O sistema deve garantir a integridade da distribuição das avaliações, processar cálculos de notas em tempo real e fornecer formulários (baremas) adaptáveis a cada edição sem necessidade de alteração no código estrutural.

### 2. Atores e Controle de Acesso (RBAC)

A autenticação será delegada ao Supabase Auth via JWT, e a API validará os tokens e os papéis (Roles) dos usuários:

* **Administrador:** Acesso total. Pode criar edições, cadastrar turmas, definir avaliadores, editar templates de baremas e visualizar todos os resultados e ocorrências.
* **Avaliador:** Acesso restrito. Pode apenas buscar o template de avaliação e submeter notas **exclusivamente** para as turmas às quais foi previamente alocado.
* **Orientador:** Acesso restrito. Pode submeter a "Nota do Orientador" para suas respectivas turmas e registrar ocorrências (problemas de conduta/infraestrutura) no sistema.

### 3. Regras de Negócio (Core Engine)

#### 3.1. Restrições de Alocação e Submissão

* **Regra 3x3:** O sistema deve validar e garantir que um Avaliador não submeta mais (nem menos) que 3 avaliações no total.
* **Limite por Turma:** O sistema deve bloquear submissões adicionais caso uma turma já possua 3 avaliações concluídas de avaliadores visitantes.
* **Transacionalidade (ACID):** A submissão de uma ficha de avaliação deve ocorrer em bloco. Se a requisição contiver 11 notas, o banco salva as 11 ou rejeita tudo (*rollback*), evitando avaliações parciais por perda de conexão no celular.

#### 3.2. Motor de Cálculo

A API deve ser a única fonte da verdade para o processamento de notas.

* **Avaliação 1 (Turma Campeã):** Apurada em tempo real. O cálculo é a **soma/média simples** das notas dos n avaliadores visitantes.
* **Avaliação 2 (Nota no Sistema Escolar):** Calculada convertendo a pontuação bruta em porcentagem, utilizando a fórmula base:

$$Nota Final = \left( \frac{M\acute{e}dia\ Avaliadores + Nota\ Orientador}{2} \right) \times 100$$

*(Nota técnica: A API deve tratar os limites matemáticos para que o resultado final reflita com exatidão a escala de 0 a 100%).*

### 4. Arquitetura e Stack

* **Linguagem:** Node.js com TypeScript.
* **Framework:** Express.js.
* **ORM e Banco de Dados:** Prisma ORM conectado ao PostgreSQL (Supabase).
* **Padrão de API:** RESTful, com respostas em JSON.

### 5. Contratos de API (Endpoints Principais)

#### 🛡️ Autenticação & Usuários

* **Middleware `requireAuth`:** Intercepta o *Bearer Token*, valida no Supabase e anexa o usuário ao contexto da requisição (`req.user`).
* `GET /api/me`: Retorna os dados, a *role* e as turmas alocadas ao usuário logado.

#### 📋 Gestão de Avaliações (O Coração do Sistema)

* `GET /api/templates/:id`: Retorna o JSON dinâmico contendo todos os critérios (numéricos, booleanos, textos) de um barema específico para o frontend montar a tela.
* `POST /api/avaliacoes`: Endpoint transacional que recebe o *payload* de notas.
* *Validações:* Checa se o usuário é o avaliador correto, se a turma já foi avaliada por ele, e se os limites de nota (ex: peso máximo 10) foram respeitados.


* `GET /api/avaliacoes/turma/:id`: Retorna o status das avaliações de uma turma (ex: "2/3 avaliadores já preencheram").

#### 🏆 Resultados e Relatórios

* `GET /api/resultados/campea`: Retorna o ranking decrescente das turmas com base apenas nas notas dos avaliadores.
* `GET /api/resultados/consolidado`: Retorna as porcentagens finais de todos os alunos/turmas, cruzando com a nota do orientador.
* `POST /api/ocorrencias`: Recebe e armazena relatos de orientadores (ID do orientador, texto da ocorrência, timestamp).

### 6. Requisitos Não-Funcionais

* **Resiliência:** Como o evento ocorre presencialmente, a API deve tratar requisições duplicadas (Idempotência) caso o avaliador clique duas vezes no botão de enviar por conta de internet lenta no campus.
* **Logs:** Operações destrutivas ou recálculos devem ser registradas para auditoria (útil caso um professor questione uma nota do sistema).