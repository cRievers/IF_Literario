Vamos estruturar o projeto Node.js + TypeScript, instalar o Prisma e modelar o esquema relacional pensando na dinamicidade dos formulários e nas regras de negócio.

### 1. Inicialização do Projeto

Abra seu terminal na pasta do projeto e rode os comandos abaixo para inicializar o ambiente e instalar as dependências essenciais:

```bash
# Inicializa o package.json
npm init -y

# Instala as dependências de produção
npm install express cors dotenv @prisma/client

# Instala as dependências de desenvolvimento
npm install -D typescript @types/node @types/express @types/cors ts-node-dev prisma

# Inicializa o arquivo de configuração do TypeScript
npx tsc --init

# Inicializa o Prisma (cria a pasta prisma e o arquivo .env)
npx prisma init

```

### 2. Configurando o Banco (Supabase)

No arquivo `.env` gerado na raiz do projeto, você vai colar a string de conexão do PostgreSQL fornecida pelo Supabase (na aba *Project Settings > Database*). Deve ficar parecido com isso:

```env
DATABASE_URL="postgresql://postgres.[SEU_PROJETO]:[SUA_SENHA]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[SEU_PROJETO]:[SUA_SENHA]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres"

```

> **Nota técnica:** O Supabase fornece uma URL de pooler (porta 6543) ideal para conexões rápidas e uma URL direta (porta 5432) que o Prisma exige para rodar as migrations.

---

### 3. O Schema do Prisma (`prisma/schema.prisma`)

Abra o arquivo `prisma/schema.prisma`. O pulo do gato aqui é o campo `tipo` no `Criterio`. Como algumas avaliações exigem notas de 1 a 10 e outras exigem "Sim ou Não" (como a Relação com o curso), o tipo dinâmico permite que o frontend saiba exatamente qual componente renderizar (um *slider* numérico ou um *radio button*).

Substitua o conteúdo por este código:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// --- ENUMS ---
enum Role {
  ADMIN
  AVALIADOR
  ORIENTADOR
}

enum TipoCriterio {
  NUMERICO
  BOOLEANO
  TEXTO
}

// --- USUÁRIOS E PAPÉIS ---
model User {
  id              String       @id @default(uuid()) // Será o mesmo UUID gerado pelo Supabase Auth
  nome            String
  email           String       @unique
  role            Role         @default(AVALIADOR)
  
  // Relacionamentos
  avaliacoesFeitas Avaliacao[]
  turmasOrientadas Turma[]
  ocorrencias      Ocorrencia[]

  @@map("users")
}

// --- ESTRUTURA DO EVENTO ---
model Edicao {
  id        Int      @id @default(autoincrement())
  ano       Int      @unique
  ativo     Boolean  @default(true)
  turmas    Turma[]

  @@map("edicoes")
}

model Turma {
  id           String      @id @default(uuid())
  nome         String
  temaLivro    String
  edicaoId     Int
  orientadorId String?
  
  edicao       Edicao      @relation(fields: [edicaoId], references: [id])
  orientador   User?       @relation(fields: [orientadorId], references: [id])
  avaliacoes   Avaliacao[]
  ocorrencias  Ocorrencia[]

  @@map("turmas")
}

// --- TEMPLATES DINÂMICOS (BAREMAS) ---
model TemplateAvaliacao {
  id          Int        @id @default(autoincrement())
  nome        String     // Ex: "Ficha Orientador", "Barema IF Literário", "Primeiro Ano"
  descricao   String?
  criterios   Criterio[]
  avaliacoes  Avaliacao[]

  @@map("templates_avaliacao")
}

model Criterio {
  id          Int               @id @default(autoincrement())
  descricao   String            // Ex: "Acessibilidade e Inclusão", "Criatividade"
  tipo        TipoCriterio      @default(NUMERICO)
  pesoMaximo  Float?            // Usado se for NUMERICO (ex: 10)
  templateId  Int
  
  template    TemplateAvaliacao @relation(fields: [templateId], references: [id], onDelete: Cascade)
  notas       NotaCriterio[]

  @@map("criterios")
}

// --- EXECUÇÃO DAS AVALIAÇÕES ---
model Avaliacao {
  id          String         @id @default(uuid())
  turmaId     String
  avaliadorId String
  templateId  Int
  finalizada  Boolean        @default(false)
  comentario  String?        [cite_start]// Comentário livre da ficha [cite: 5, 82]
  
  turma       Turma          @relation(fields: [turmaId], references: [id])
  avaliador   User           @relation(fields: [avaliadorId], references: [id])
  template    TemplateAvaliacao @relation(fields: [templateId], references: [id])
  notas       NotaCriterio[]

  @@unique([turmaId, avaliadorId]) // Um avaliador só avalia a mesma turma uma vez
  @@map("avaliacoes")
}

model NotaCriterio {
  id             Int        @id @default(autoincrement())
  avaliacaoId    String
  criterioId     Int
  
  // Apenas um desses campos será preenchido dependendo do TipoCriterio
  valorNumerico  Float?     
  valorBooleano  Boolean?   
  valorTexto     String?    

  avaliacao      Avaliacao  @relation(fields: [avaliacaoId], references: [id], onDelete: Cascade)
  criterio       Criterio   @relation(fields: [criterioId], references: [id])

  @@unique([avaliacaoId, criterioId]) // Impede notas duplicadas para o mesmo critério na mesma avaliação
  @@map("notas_criterios")
}

// --- CANAL DE OCORRÊNCIAS ---
model Ocorrencia {
  id           String   @id @default(uuid())
  [cite_start]descricao    String   // Problemas relatados [cite: 98]
  dataRegistro DateTime @default(now())
  resolvida    Boolean  @default(false)
  
  orientadorId String
  turmaId      String?  // Opcional, caso a ocorrência seja geral e não de uma turma específica

  orientador   User     @relation(fields: [orientadorId], references: [id])
  turma        Turma?   @relation(fields: [turmaId], references: [id])

  @@map("ocorrencias")
}

```

### 4. Gerando e Aplicando no Banco

Com o schema pronto, execute o comando abaixo para gerar os tipos locais do TypeScript e criar as tabelas no seu banco de dados Supabase:

```bash
npx prisma db push

```

*(Se estiver em um ambiente mais maduro ou quiser controle de versionamento do banco, use `npx prisma migrate dev --name init` ao invés de `db push`).*

---

A estrutura está montada com restrições (`@@unique`) que impedem a mesma pessoa de avaliar a mesma turma duas vezes, e tabelas dinâmicas que suportam edições anuais.