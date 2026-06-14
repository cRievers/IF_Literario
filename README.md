# 📚 APP IF Literário - Sistema de Avaliação

Um sistema web desenvolvido para automatizar, centralizar e processar as avaliações do projeto IF Literário do Instituto Federal de Minas Gerais (Campus Ouro Branco).

Criado com foco em reaproveitamento, o sistema utiliza formulários dinâmicos que permitem à administração modificar baremas, critérios e pesos a cada nova edição do evento, dispensando a necessidade de reescrever o código anualmente.

---

## 🚀 Tecnologias Utilizadas

**Backend:**
* Node.js com Express
* TypeScript
* Prisma ORM
* Banco de Dados: PostgreSQL (Supabase)
* ESModules

**Frontend (Em breve):**
* React + Vite
* Tailwind CSS
* Supabase Auth (Autenticação)

---

## ⚙️ Funcionalidades e Regras de Negócio (Spec-Driven)

O domínio da aplicação foi desenhado para resolver as seguintes dores:

1. **Gestão de Edições (Admin):** Inserção de turmas, temas literários e alocação de avaliadores.
2. **Motor de Avaliações Controlado:** Garante que cada avaliador passe por exatamente 3 turmas e que cada turma receba notas de 3 avaliadores.
3. **Cálculo de Notas em Tempo Real:**
   * **Turma Campeã (Avaliação 1):** Média extraída unicamente a partir dos avaliadores externos, apurada imediatamente ao fim da exposição.
   * **Nota Final no Sistema (Avaliação 2):** Processa a nota do aluno em porcentagem cruzando as notas externas com a do Orientador, usando a fórmula: `(Média da Nota dos Avaliadores + Nota do Orientador) / 2 * 100`.
4. **Relatório de Ocorrências:** Painel exclusivo para orientadores relatarem problemas de conduta ou organização diretamente à administração do evento de forma assíncrona.

---

## 🗄️ Modelagem do Banco (Prisma)

A estrutura relacional se baseia no conceito de **Templates de Avaliação**. Em vez de colunas engessadas, o aplicativo renderiza as fichas baseadas nas linhas do banco de dados. Isso suporta:
* Fichas com critérios de 1 a 10.
* Fichas de Sim/Não (ex: Relação com o curso).
* Comentários livres.

---

## 🛠️ Como rodar o Backend localmente

### 1. Pré-requisitos
* Node.js (v18+)
* Uma conta no Supabase com um projeto PostgreSQL criado.

### 2. Instalação

Clone o repositório e instale as dependências:

```bash
git clone https://github.com/seu-usuario/if-literario-app.git
cd if-literario-app
npm install