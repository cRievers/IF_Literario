import "dotenv/config";
import { PrismaClient, TipoCriterio } from '@prisma/client';
import process from 'node:process';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Iniciando o seed do banco de dados...');

  // 1. Cria a Edição de 2025
  const edicao2025 = await prisma.edicao.upsert({
    where: { ano: 2025 },
    update: {},
    create: { ano: 2025, ativo: true },
  });

  // 2. Cria o Template do Barema Geral
  const templateBarema = await prisma.templateAvaliacao.create({
    data: {
      nome: 'Barema Geral - IF Literário',
      descricao: 'Avaliação padrão para a exposição das turmas',
      criterios: {
        create: [
          // Critérios Numéricos (0 a 10) conforme documento
          { descricao: '1. Organização, ambientação e decoração da sala', pesoMaximo: 10, tipo: TipoCriterio.NUMERICO },
          { descricao: '2. Conteúdo apresentado', pesoMaximo: 10, tipo: TipoCriterio.NUMERICO },
          { descricao: '3. Contemplação dos itens solicitados', pesoMaximo: 10, tipo: TipoCriterio.NUMERICO },
          { descricao: '4. Produção artística', pesoMaximo: 10, tipo: TipoCriterio.NUMERICO },
          { descricao: '5. Contexto histórico e filosófico', pesoMaximo: 10, tipo: TipoCriterio.NUMERICO },
          { descricao: '6. Contexto geográfico', pesoMaximo: 10, tipo: TipoCriterio.NUMERICO },
          { descricao: '7. Contexto literário e cultural', pesoMaximo: 10, tipo: TipoCriterio.NUMERICO },
          { descricao: '8. Relação com as Ciências da Natureza, Exatas e/ou Sociais', pesoMaximo: 10, tipo: TipoCriterio.NUMERICO },
          { descricao: '9. Criatividade e integração da exposição', pesoMaximo: 10, tipo: TipoCriterio.NUMERICO },
          { descricao: '10. Adequação da linguagem e comunicação com o público', pesoMaximo: 10, tipo: TipoCriterio.NUMERICO },
          { descricao: '11. Gestão do tempo e percurso da exposição', pesoMaximo: 10, tipo: TipoCriterio.NUMERICO },
          
          // Critério Booleano
          { descricao: '12. Relação com o curso', tipo: TipoCriterio.BOOLEANO },
        ],
      },
    },
  });

  // 3. Cria algumas turmas fictícias vinculadas à Edição 2025
  await prisma.turma.createMany({
    data: [
      { nome: '1º Ano Informática', temaLivro: 'A Odisseia', edicaoId: edicao2025.id },
      { nome: '2º Ano Metalurgia', temaLivro: 'Dom Casmurro', edicaoId: edicao2025.id },
      { nome: '3º Ano Administration', temaLivro: 'Vidas Secas', edicaoId: edicao2025.id },
    ],
  });

  console.log('✅ Seed finalizado com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
