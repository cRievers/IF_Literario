// api/src/scripts/debug_export.ts
// Script de diagnóstico para investigar por que as notas aparecem vazias na exportação
import 'dotenv/config';
import { prisma } from '../lib/prisma.js';

const edicao = await prisma.edicao.findFirst({
  where: { ativo: true },
  include: {
    turmas: {
      include: {
        template: { include: { criterios: { where: { ativo: true } } } },
        avaliacoes: {
          include: {
            avaliador: { select: { nome: true, role: true } },
            template: { include: { criterios: true } },
            notas: { include: { criterio: true } }
          }
        }
      },
      orderBy: { nome: 'asc' }
    }
  }
});

if (!edicao) {
  console.log('Nenhuma edição ativa encontrada.');
  process.exit(0);
}

console.log(`\n=== Edição ${edicao.ano} ===\n`);

for (const turma of edicao.turmas) {
  console.log(`\n--- Turma: ${turma.nome} ---`);
  console.log(`  template da turma (templateId): ${turma.templateId}`);
  
  const criteriosDaTurma = turma.template?.criterios ?? [];
  console.log(`  critérios do template da turma: [${criteriosDaTurma.map((c: any) => c.id).join(', ')}]`);

  const avalVisitantes = turma.avaliacoes.filter((a: any) => a.avaliador.role === 'AVALIADOR');
  const avalOrientador = turma.avaliacoes.find((a: any) => a.avaliador.role === 'ORIENTADOR');

  for (const av of avalVisitantes) {
    console.log(`\n  Avaliador: ${av.avaliador.nome}`);
    console.log(`    templateId da avaliação: ${av.templateId}`);
    console.log(`    templateId da turma:     ${turma.templateId}`);
    console.log(`    IDs batem? ${av.templateId === turma.templateId}`);
    console.log(`    critérioIds nas notas:   [${av.notas.map((n: any) => n.criterioId).join(', ')}]`);
    console.log(`    critérioIds do template da turma: [${criteriosDaTurma.map((c: any) => c.id).join(', ')}]`);

    for (const n of av.notas) {
      const matchNoTurmaTemplate = criteriosDaTurma.some((c: any) => c.id === n.criterioId);
      console.log(`    nota criterioId=${n.criterioId} (${n.criterio.descricao}) | valor=${n.valorNumerico ?? n.valorBooleano ?? n.valorTexto} | está no template da turma? ${matchNoTurmaTemplate}`);
    }
  }

  if (avalOrientador) {
    console.log(`\n  Orientador: ${avalOrientador.avaliador.nome}`);
    console.log(`    templateId da avaliação: ${avalOrientador.templateId}`);
    for (const n of avalOrientador.notas) {
      console.log(`    nota criterioId=${n.criterioId} (${n.criterio.descricao}) | valor=${n.valorNumerico ?? n.valorBooleano ?? n.valorTexto}`);
    }
  } else {
    console.log(`\n  (Sem avaliação de orientador)`);
  }
}

await prisma.$disconnect();
