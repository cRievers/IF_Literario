// api/prisma/seed.ts
import "dotenv/config";
import { PrismaClient, TipoCriterio, Role } from '@prisma/client';
import process from 'node:process';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Iniciando o seed do banco de dados...');

  // 1. Limpeza de tabelas na ordem correta para evitar violações de chaves estrangeiras
  console.log('🧹 Limpando dados antigos...');
  await prisma.logAuditoria.deleteMany();
  await prisma.ocorrencia.deleteMany();
  await prisma.notaCriterio.deleteMany();
  await prisma.avaliacao.deleteMany();
  await prisma.alocacao.deleteMany();
  await prisma.turma.deleteMany();
  await prisma.criterio.deleteMany();
  await prisma.templateAvaliacao.deleteMany();
  await prisma.user.deleteMany();
  await prisma.edicao.deleteMany();

  // 2. Criação dos Usuários de Teste (UUIDs estáticos para testes consistentes)
  console.log('👤 Criando usuários de teste...');
  const admin = await prisma.user.create({
    data: {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      nome: 'Coordenação IF Literário',
      email: 'admin@ifmg.edu.br',
      role: Role.ADMIN
    }
  });

  const orientador = await prisma.user.create({
    data: {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
      nome: 'Prof. Roberto Silva',
      email: 'roberto.silva@ifmg.edu.br',
      role: Role.ORIENTADOR
    }
  });

  const avaliador1 = await prisma.user.create({
    data: {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a31',
      nome: 'Avaliador Externo 1',
      email: 'avaliador1@gmail.com',
      role: Role.AVALIADOR
    }
  });

  const avaliador2 = await prisma.user.create({
    data: {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a32',
      nome: 'Avaliador Externo 2',
      email: 'avaliador2@gmail.com',
      role: Role.AVALIADOR
    }
  });

  const avaliador3 = await prisma.user.create({
    data: {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
      nome: 'Avaliador Externo 3',
      email: 'avaliador3@gmail.com',
      role: Role.AVALIADOR
    }
  });

  const avaliador4 = await prisma.user.create({
    data: {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a34',
      nome: 'Avaliador Externo 4 (Excesso)',
      email: 'avaliador4@gmail.com',
      role: Role.AVALIADOR
    }
  });

  // 3. Cria a Edição de 2025
  console.log('📅 Criando edição...');
  const edicao2025 = await prisma.edicao.create({
    data: {
      ano: 2025,
      ativo: true
    }
  });

  // 4. Cria o Template do Barema Geral (Visitantes)
  console.log('📋 Criando template do Barema Geral (Avaliadores)...');
  const templateBarema = await prisma.templateAvaliacao.create({
    data: {
      nome: 'Barema Geral - IF Literário',
      descricao: 'Avaliação padrão para a exposição das turmas (Visitantes)',
      criterios: {
        create: [
          // Critérios Numéricos (0 a 10) conforme documento
          { 
            descricao: '1. Organização, ambientação e decoração da sala', 
            descricaoLonga: 'Ambientação física da sala temática, criatividade nos elementos decorativos e harmonia visual do espaço de exposição.',
            pesoMaximo: 10, 
            tipo: TipoCriterio.NUMERICO 
          },
          { 
            descricao: '2. Conteúdo apresentado', 
            descricaoLonga: 'Profundidade teórica, domínio do tema pelos expositores e exatidão nas informações passadas aos visitantes.',
            pesoMaximo: 10, 
            tipo: TipoCriterio.NUMERICO 
          },
          { 
            descricao: '3. Contemplação dos itens solicitados', 
            descricaoLonga: 'Verificação se os itens obrigatórios estipulados no regulamento do evento foram devidamente exibidos na sala.',
            pesoMaximo: 10, 
            tipo: TipoCriterio.NUMERICO 
          },
          { 
            descricao: '4. Produção artística', 
            descricaoLonga: 'Qualidade estética, capricho e relevância dos trabalhos manuais e artísticos confeccionados pelos próprios estudantes.',
            pesoMaximo: 10, 
            tipo: TipoCriterio.NUMERICO 
          },
          { 
            descricao: '5. Contexto histórico e filosófico', 
            descricaoLonga: 'Pontuação sobre a contextualização histórica da obra e as discussões filosóficas provocadas pelo autor e pelo enredo.',
            pesoMaximo: 10, 
            tipo: TipoCriterio.NUMERICO 
          },
          { 
            descricao: '6. Contexto geográfico', 
            descricaoLonga: 'Exposição e contextualização dos elementos geográficos associados ao cenário ou época da obra analisada.',
            pesoMaximo: 10, 
            tipo: TipoCriterio.NUMERICO 
          },
          { 
            descricao: '7. Contexto literário e cultural', 
            descricaoLonga: 'Detalhamento sobre o movimento literário do livro, a vida do autor e o contexto sociocultural da produção.',
            pesoMaximo: 10, 
            tipo: TipoCriterio.NUMERICO 
          },
          { 
            descricao: '8. Relação com as Ciências da Natureza, Exatas e/ou Sociais', 
            descricaoLonga: 'Integração interdisciplinar demonstrada entre a narrativa literária e áreas científicas, exatas ou sociais aplicadas.',
            pesoMaximo: 10, 
            tipo: TipoCriterio.NUMERICO 
          },
          { 
            descricao: '9. Criatividade e integração da exposição', 
            descricaoLonga: 'Originalidade da proposta da sala e a forma inovadora como os temas do livro foram conectados às apresentações.',
            pesoMaximo: 10, 
            tipo: TipoCriterio.NUMERICO 
          },
          { 
            descricao: '10. Adequação da linguagem e comunicação com o público', 
            descricaoLonga: 'Linguagem apropriada para os visitantes da exposição, clareza na oratória e nível de engajamento do público.',
            pesoMaximo: 10, 
            tipo: TipoCriterio.NUMERICO 
          },
          { 
            descricao: '11. Gestão do tempo e percurso da exposição', 
            descricaoLonga: 'Respeito ao cronograma de tempo da apresentação e organização do fluxo de percurso físico dos visitantes na sala.',
            pesoMaximo: 10, 
            tipo: TipoCriterio.NUMERICO 
          },
          
          // Critério Booleano
          { 
            descricao: '12. Relação com o curso', 
            descricaoLonga: 'Grau de integração entre a obra literária e as diretrizes ou disciplinas do curso técnico dos estudantes.',
            tipo: TipoCriterio.BOOLEANO 
          },
        ],
      },
    },
  });

  // 5. Cria o Template da Ficha do Orientador
  console.log('📋 Criando template do Barema do Orientador...');
  const templateOrientador = await prisma.templateAvaliacao.create({
    data: {
      nome: 'Barema do Orientador',
      descricao: 'Avaliação realizada pelo orientador da própria turma',
      criterios: {
        create: [
          { 
            descricao: 'Nota de Orientação Geral', 
            descricaoLonga: 'Avaliação do empenho geral da turma, dedicação durante os meses de desenvolvimento e a qualidade final do resultado apresentado.',
            pesoMaximo: 10, 
            tipo: TipoCriterio.NUMERICO 
          }
        ]
      }
    }
  });

  // 6. Cria as Turmas fictícias vinculadas à Edição 2025
  console.log('🏫 Criando turmas...');
  const turma1 = await prisma.turma.create({
    data: {
      id: 't1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01',
      nome: '1º Ano Informática',
      temaLivro: 'A Odisseia',
      edicaoId: edicao2025.id,
      orientadorId: orientador.id,
      templateId: templateBarema.id // Barema Geral para visitantes
    }
  });

  const turma2 = await prisma.turma.create({
    data: {
      id: 't1eebc99-9c0b-4ef8-bb6d-6bb9bd380a02',
      nome: '2º Ano Metalurgia',
      temaLivro: 'Dom Casmurro',
      edicaoId: edicao2025.id,
      templateId: templateBarema.id
    }
  });

  const turma3 = await prisma.turma.create({
    data: {
      id: 't1eebc99-9c0b-4ef8-bb6d-6bb9bd380a03',
      nome: '3º Ano Administração',
      temaLivro: 'Vidas Secas',
      edicaoId: edicao2025.id,
      templateId: templateBarema.id
    }
  });

  // 7. Criar Alocações de teste (Avaliadores 1, 2 e 3 alocados para as turmas 1, 2 e 3)
  console.log('🔗 Criando alocações de avaliadores visitantes...');
  const avaliadores = [avaliador1, avaliador2, avaliador3];
  const turmas = [turma1, turma2, turma3];

  for (const avaliador of avaliadores) {
    for (const turma of turmas) {
      await prisma.alocacao.create({
        data: {
          avaliadorId: avaliador.id,
          turmaId: turma.id
        }
      });
    }
  }

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
