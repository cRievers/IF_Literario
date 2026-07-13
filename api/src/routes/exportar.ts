// api/src/routes/exportar.ts
import { Router, Response, NextFunction } from 'express';
import * as XLSX from 'xlsx';
import { prisma } from '../lib/prisma.js';
import { requireAuth, AuthRequest } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/roles.js';

const router = Router();

// Resolve o valor numérico de uma nota para fins de soma/média
function resolveValorNumerico(nota: any): number {
  if (nota.criterio.tipo === 'NUMERICO') return nota.valorNumerico ?? 0;
  if (nota.criterio.tipo === 'BOOLEANO') {
    const peso = nota.criterio.pesoMaximo ?? 10;
    return nota.valorBooleano ? peso : 0;
  }
  return 0;
}

// Normaliza pontuação bruta de uma avaliação para [0, 1]
function normalizarAvaliacao(notas: any[]): { achieved: number; max: number; norm: number } {
  let achieved = 0;
  let max = 0;

  for (const nota of notas) {
    if (nota.criterio.tipo === 'NUMERICO') {
      achieved += nota.valorNumerico ?? 0;
      max += nota.criterio.pesoMaximo ?? 10;
    } else if (nota.criterio.tipo === 'BOOLEANO') {
      const peso = nota.criterio.pesoMaximo ?? 10;
      achieved += nota.valorBooleano ? peso : 0;
      max += peso;
    }
  }

  const norm = max > 0 ? achieved / max : 0;
  return { achieved, max, norm };
}

/**
 * GET /api/exportar/xlsx
 * Exporta os dados da edição ativa em formato .xlsx com 3 abas:
 *  - Aba 1: Barema Avaliadores (nota de cada avaliador por critério, por turma)
 *  - Aba 2: Barema Orientadores (nota do orientador por critério, por turma)
 *  - Aba 3: Consolidado (nota final calculada conforme a fórmula do PRD)
 */
router.get('/xlsx', requireAuth, requireRole(['ADMIN']), async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
  try {
    // Busca a edição ativa com todas as turmas e avaliações
    const edicao = await prisma.edicao.findFirst({
      where: { ativo: true },
      include: {
        turmas: {
          include: {
            orientador: { select: { id: true, nome: true } },
            template: { include: { criterios: { where: { ativo: true } } } },
            avaliacoes: {
              include: {
                avaliador: { select: { id: true, nome: true, role: true } },
                notas: {
                  include: { criterio: true }
                }
              }
            }
          },
          orderBy: { nome: 'asc' }
        }
      }
    });

    if (!edicao) {
      return res.status(404).json({ error: 'Nenhuma edição ativa encontrada.' });
    }

    const workbook = XLSX.utils.book_new();

    // ─────────────────────────────────────────────
    // ABA 1: BAREMA DOS AVALIADORES
    // Estrutura: cada linha é uma turma × avaliador
    // Colunas: Turma | Tema | Avaliador | [Critério 1] | [Critério 2] | ... | Soma | Soma Máx | % Norm
    // ─────────────────────────────────────────────

    // Coleta os critérios diretamente das notas das avaliações de AVALIADOR
    // (não do template da turma, pois avaliacao.templateId pode diferir de turma.templateId)
    const criteriosAvaliadorMap = new Map<number, { id: number; descricao: string; pesoMaximo: number | null; tipo: string }>();
    for (const turma of edicao.turmas) {
      for (const avaliacao of turma.avaliacoes) {
        if ((avaliacao.avaliador as any).role !== 'AVALIADOR') continue;
        for (const nota of avaliacao.notas) {
          const c = nota.criterio as any;
          if (!criteriosAvaliadorMap.has(c.id) && c.tipo !== 'TEXTO') {
            criteriosAvaliadorMap.set(c.id, {
              id: c.id,
              descricao: c.descricao,
              pesoMaximo: c.pesoMaximo,
              tipo: c.tipo
            });
          }
        }
      }
    }
    // Ordena por ID para consistência de colunas
    const criteriosAvaliador = Array.from(criteriosAvaliadorMap.values()).sort((a, b) => a.id - b.id);

    // Cabeçalho da aba 1
    const headerAvaliador = [
      'Turma', 'Tema do Livro', 'Avaliador',
      ...criteriosAvaliador.map(c => `${c.descricao} (max ${c.pesoMaximo ?? 10})`),
      'Soma Obtida', 'Soma Máxima', 'Percentual (%)'
    ];

    const rowsAvaliador: any[][] = [headerAvaliador];

    for (const turma of edicao.turmas) {
      const avaliacoesVisitantes = turma.avaliacoes.filter(
        (a: any) => a.avaliador.role === 'AVALIADOR'
      );

      if (avaliacoesVisitantes.length === 0) {
        // Linha indicando que não há avaliações ainda
        rowsAvaliador.push([turma.nome, turma.temaLivro, '(sem avaliações)', ...criteriosAvaliador.map(() => ''), '', '', '']);
        continue;
      }

      for (const avaliacao of avaliacoesVisitantes) {
        const notasMap = new Map(avaliacao.notas.map((n: any) => [n.criterioId, n]));

        const valoresCriterios = criteriosAvaliador.map(c => {
          const nota = notasMap.get(c.id) as any;
          if (!nota) return '';
          if (nota.criterio.tipo === 'NUMERICO') return nota.valorNumerico ?? '';
          if (nota.criterio.tipo === 'BOOLEANO') {
            const peso = nota.criterio.pesoMaximo ?? 10;
            return nota.valorBooleano ? peso : 0;
          }
          return '';
        });

        const { achieved, max, norm } = normalizarAvaliacao(avaliacao.notas);

        rowsAvaliador.push([
          turma.nome,
          turma.temaLivro,
          avaliacao.avaliador.nome,
          ...valoresCriterios,
          parseFloat(achieved.toFixed(2)),
          parseFloat(max.toFixed(2)),
          parseFloat((norm * 100).toFixed(2))
        ]);
      }
    }

    const wsAvaliador = XLSX.utils.aoa_to_sheet(rowsAvaliador);
    XLSX.utils.book_append_sheet(workbook, wsAvaliador, 'Barema Avaliadores');

    // ─────────────────────────────────────────────
    // ABA 2: BAREMA DOS ORIENTADORES
    // Estrutura: cada linha é uma turma (orientador)
    // Colunas: Turma | Tema | Orientador | [Critério 1] | ... | Soma | Soma Máx | % Norm
    // ─────────────────────────────────────────────

    // Critérios do barema do orientador (template do orientador é diferente — filtramos avaliações de ORIENTADOR)
    const criteriosOrientadorMap = new Map<number, { id: number; descricao: string; pesoMaximo: number | null; tipo: string }>();
    for (const turma of edicao.turmas) {
      const avaliacaoOrientador = turma.avaliacoes.find((a: any) => a.avaliador.role === 'ORIENTADOR');
      if (avaliacaoOrientador) {
        for (const nota of avaliacaoOrientador.notas) {
          const c = nota.criterio as any;
          if (!criteriosOrientadorMap.has(c.id) && c.tipo !== 'TEXTO') {
            criteriosOrientadorMap.set(c.id, {
              id: c.id,
              descricao: c.descricao,
              pesoMaximo: c.pesoMaximo,
              tipo: c.tipo
            });
          }
        }
      }
    }
    const criteriosOrientador = Array.from(criteriosOrientadorMap.values());

    const headerOrientador = [
      'Turma', 'Tema do Livro', 'Orientador',
      ...criteriosOrientador.map(c => `${c.descricao} (max ${c.pesoMaximo ?? 10})`),
      'Soma Obtida', 'Soma Máxima', 'Percentual (%)'
    ];

    const rowsOrientador: any[][] = [headerOrientador];

    for (const turma of edicao.turmas) {
      const avaliacaoOrientador = turma.avaliacoes.find((a: any) => a.avaliador.role === 'ORIENTADOR');

      if (!avaliacaoOrientador) {
        rowsOrientador.push([
          turma.nome,
          turma.temaLivro,
          turma.orientador?.nome ?? 'Não atribuído',
          ...criteriosOrientador.map(() => ''),
          '', '', ''
        ]);
        continue;
      }

      const notasMap = new Map(avaliacaoOrientador.notas.map((n: any) => [n.criterioId, n]));

      const valoresCriterios = criteriosOrientador.map(c => {
        const nota = notasMap.get(c.id) as any;
        if (!nota) return '';
        if (nota.criterio.tipo === 'NUMERICO') return nota.valorNumerico ?? '';
        if (nota.criterio.tipo === 'BOOLEANO') {
          const peso = nota.criterio.pesoMaximo ?? 10;
          return nota.valorBooleano ? peso : 0;
        }
        return '';
      });

      const { achieved, max, norm } = normalizarAvaliacao(avaliacaoOrientador.notas);

      rowsOrientador.push([
        turma.nome,
        turma.temaLivro,
        turma.orientador?.nome ?? 'Não atribuído',
        ...valoresCriterios,
        parseFloat(achieved.toFixed(2)),
        parseFloat(max.toFixed(2)),
        parseFloat((norm * 100).toFixed(2))
      ]);
    }

    const wsOrientador = XLSX.utils.aoa_to_sheet(rowsOrientador);
    XLSX.utils.book_append_sheet(workbook, wsOrientador, 'Barema Orientadores');

    // ─────────────────────────────────────────────
    // ABA 3: CONSOLIDADO
    // Nota Final = ((Média Avaliadores [0,1] + Nota Orientador [0,1]) / 2) × 100
    // ─────────────────────────────────────────────

    const headerConsolidado = [
      'Turma',
      'Tema do Livro',
      'Orientador',
      'Nº Avaliadores',
      'Média Avaliadores (bruta)',
      'Máx. Avaliadores (bruta)',
      'Média Avaliadores (%)',
      'Nota Orientador (bruta)',
      'Máx. Orientador (bruta)',
      'Nota Orientador (%)',
      'NOTA FINAL (%)',
      'Status'
    ];

    const rowsConsolidado: any[][] = [headerConsolidado];

    // Ordena por nota final decrescente
    const turmasComCalculo = edicao.turmas.map(turma => {
      const avaliacoesVisitantes = turma.avaliacoes.filter((a: any) => a.avaliador.role === 'AVALIADOR');
      const avaliacaoOrientador = turma.avaliacoes.find((a: any) => a.avaliador.role === 'ORIENTADOR');

      const totalVisitantes = avaliacoesVisitantes.length;
      const hasOrientador = !!avaliacaoOrientador;

      // Média normalizada dos avaliadores
      let mediaAvaliadoresNorm = 0;
      let somaAchievedAval = 0;
      let somaMaxAval = 0;

      if (totalVisitantes > 0) {
        let somaNorm = 0;
        for (const av of avaliacoesVisitantes) {
          const { achieved, max, norm } = normalizarAvaliacao(av.notas);
          somaAchievedAval += achieved;
          somaMaxAval += max;
          somaNorm += norm;
        }
        mediaAvaliadoresNorm = somaNorm / totalVisitantes;
        somaAchievedAval = somaAchievedAval / totalVisitantes; // média bruta
        somaMaxAval = somaMaxAval / totalVisitantes;
      }

      // Nota orientador normalizada
      let notaOrientadorNorm = 0;
      let notaOrientadorBruta = 0;
      let maxOrientadorBruta = 0;

      if (avaliacaoOrientador) {
        const { achieved, max, norm } = normalizarAvaliacao((avaliacaoOrientador as any).notas);
        notaOrientadorBruta = achieved;
        maxOrientadorBruta = max;
        notaOrientadorNorm = norm;
      }

      // Fórmula do PRD: Nota Final = ((Média Avaliadores + Nota Orientador) / 2) × 100
      let notaFinal = 0;
      if (totalVisitantes > 0 && hasOrientador) {
        notaFinal = ((mediaAvaliadoresNorm + notaOrientadorNorm) / 2) * 100;
      } else if (totalVisitantes > 0) {
        notaFinal = mediaAvaliadoresNorm * 100;
      } else if (hasOrientador) {
        notaFinal = notaOrientadorNorm * 100;
      }

      const status = totalVisitantes >= 3 && hasOrientador ? 'CONCLUÍDO' : 'PENDENTE';

      return {
        nome: turma.nome,
        temaLivro: turma.temaLivro,
        orientadorNome: (turma.orientador as any)?.nome ?? 'Não atribuído',
        totalVisitantes,
        somaAchievedAval: parseFloat(somaAchievedAval.toFixed(2)),
        somaMaxAval: parseFloat(somaMaxAval.toFixed(2)),
        mediaAvaliadoresPct: parseFloat((mediaAvaliadoresNorm * 100).toFixed(2)),
        notaOrientadorBruta: parseFloat(notaOrientadorBruta.toFixed(2)),
        maxOrientadorBruta: parseFloat(maxOrientadorBruta.toFixed(2)),
        notaOrientadorPct: parseFloat((notaOrientadorNorm * 100).toFixed(2)),
        notaFinal: parseFloat(notaFinal.toFixed(2)),
        status
      };
    });

    turmasComCalculo.sort((a, b) => b.notaFinal - a.notaFinal);

    for (const t of turmasComCalculo) {
      rowsConsolidado.push([
        t.nome,
        t.temaLivro,
        t.orientadorNome,
        t.totalVisitantes,
        t.somaAchievedAval,
        t.somaMaxAval,
        t.mediaAvaliadoresPct,
        t.notaOrientadorBruta,
        t.maxOrientadorBruta,
        t.notaOrientadorPct,
        t.notaFinal,
        t.status
      ]);
    }

    const wsConsolidado = XLSX.utils.aoa_to_sheet(rowsConsolidado);
    XLSX.utils.book_append_sheet(workbook, wsConsolidado, 'Consolidado');

    // ─────────────────────────────────────────────
    // Gera o buffer e envia como download
    // ─────────────────────────────────────────────
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    const nomeArquivo = `IF_Literario_${edicao.ano}_resultados.xlsx`;

    res.setHeader('Content-Disposition', `attachment; filename="${nomeArquivo}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Length', buffer.length);

    return res.send(buffer);
  } catch (error) {
    next(error);
  }
});

export default router;
