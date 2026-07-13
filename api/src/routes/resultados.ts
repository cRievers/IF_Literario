import { Router, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, AuthRequest } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/roles.js';

const router = Router();

// GET /api/resultados/campea - Restrito a ADMIN
// Retorna o ranking decrescente das turmas com base nas notas dos avaliadores visitantes.
router.get('/campea', requireAuth, requireRole(['ADMIN']), async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
    try {
        const turmas = await prisma.turma.findMany({
            where: { edicao: { ativo: true } },
            include: {
                edicao: true,
                template: {
                    include: { criterios: true }
                },
                avaliacoes: {
                    include: {
                        avaliador: true,
                        notas: {
                            include: { criterio: true }
                        }
                    }
                }
            }
        });

        const ranking = turmas.map(turma => {
            const avaliacoesVisitantes = turma.avaliacoes.filter(a => a.avaliador.role === 'AVALIADOR');
            const totalAvaliacoes = avaliacoesVisitantes.length;

            let somaGeralAchieved = 0;
            let somaGeralMax = 0;

            if (totalAvaliacoes > 0) {
                for (const avaliacao of avaliacoesVisitantes) {
                    let achieved = 0;
                    let max = 0;

                    for (const nota of avaliacao.notas) {
                        if (nota.criterio.tipo === 'NUMERICO') {
                            achieved += nota.valorNumerico || 0;
                            max += nota.criterio.pesoMaximo || 10;
                        } else if (nota.criterio.tipo === 'BOOLEANO') {
                            const peso = nota.criterio.pesoMaximo || 10;
                            achieved += nota.valorBooleano ? peso : 0;
                            max += peso;
                        }
                    }
                    somaGeralAchieved += achieved;
                    somaGeralMax += max;
                }
            }

            // Média simples das avaliações dos visitantes
            const mediaAchieved = totalAvaliacoes > 0 ? somaGeralAchieved / totalAvaliacoes : 0;
            const mediaMax = totalAvaliacoes > 0 ? somaGeralMax / totalAvaliacoes : ((turma.template as any)?.criterios?.reduce((acc: number, c: any) => acc + (c.tipo === 'NUMERICO' ? (c.pesoMaximo || 10) : 10), 0) || 0);
            const percentual = mediaMax > 0 ? (mediaAchieved / mediaMax) * 100 : 0;

            return {
                id: turma.id,
                nome: turma.nome,
                temaLivro: turma.temaLivro,
                edicaoAno: turma.edicao.ano,
                totalAvaliacoes,
                mediaNota: parseFloat(mediaAchieved.toFixed(2)),
                maxNota: parseFloat(mediaMax.toFixed(2)),
                percentual: parseFloat(percentual.toFixed(2)),
                status: totalAvaliacoes >= 3 ? 'CONCLUIDO' : 'PENDENTE'
            };
        });

        // Ordena do maior para o menor (ranking da campeã)
        ranking.sort((a, b) => b.mediaNota - a.mediaNota);

        return res.json(ranking);
    } catch (error) {
        next(error);
    }
});

// GET /api/resultados/consolidado - Restrito a ADMIN
// Cálculo da nota final cruzando visitantes e orientador.
router.get('/consolidado', requireAuth, requireRole(['ADMIN']), async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
    try {
        const turmas = await prisma.turma.findMany({
            where: { edicao: { ativo: true } },
            include: {
                edicao: true,
                orientador: { select: { id: true, nome: true } },
                template: {
                    include: { criterios: true }
                },
                avaliacoes: {
                    include: {
                        avaliador: true,
                        notas: {
                            include: { criterio: true }
                        }
                    }
                }
            }
        });

        const consolidado = turmas.map(turma => {
            const avaliacoesVisitantes = turma.avaliacoes.filter(a => a.avaliador.role === 'AVALIADOR');
            const avaliacaoOrientador = turma.avaliacoes.find(a => a.avaliador.role === 'ORIENTADOR');

            const totalVisitantes = avaliacoesVisitantes.length;
            const hasNotaOrientador = !!avaliacaoOrientador;

            // 1. Média Visitantes Normalizada [0, 1]
            let mediaVisitantesNorm = 0;
            let notaAvaliadoresBruta = 0;
            let maxAvaliadoresBruta = 0;

            if (totalVisitantes > 0) {
                let somaNorm = 0;
                let somaAchieved = 0;
                let somaMax = 0;

                for (const avaliacao of avaliacoesVisitantes) {
                    let achieved = 0;
                    let max = 0;

                    for (const nota of avaliacao.notas) {
                        if (nota.criterio.tipo === 'NUMERICO') {
                            achieved += nota.valorNumerico || 0;
                            max += nota.criterio.pesoMaximo || 10;
                        } else if (nota.criterio.tipo === 'BOOLEANO') {
                            const peso = nota.criterio.pesoMaximo || 10;
                            achieved += nota.valorBooleano ? peso : 0;
                            max += peso;
                        }
                    }

                    somaAchieved += achieved;
                    somaMax += max;
                    if (max > 0) {
                        somaNorm += achieved / max;
                    }
                }
                mediaVisitantesNorm = somaNorm / totalVisitantes;
                notaAvaliadoresBruta = somaAchieved / totalVisitantes;
                maxAvaliadoresBruta = somaMax / totalVisitantes;
            }

            // 2. Nota Orientador Normalizada [0, 1]
            let notaOrientadorNorm = 0;
            let notaOrientadorBruta = 0;
            let maxOrientadorBruta = 0;

            if (avaliacaoOrientador) {
                let achieved = 0;
                let max = 0;

                for (const nota of avaliacaoOrientador.notas) {
                    if (nota.criterio.tipo === 'NUMERICO') {
                        achieved += nota.valorNumerico || 0;
                        max += nota.criterio.pesoMaximo || 10;
                    } else if (nota.criterio.tipo === 'BOOLEANO') {
                        const peso = nota.criterio.pesoMaximo || 10;
                        achieved += nota.valorBooleano ? peso : 0;
                        max += peso;
                    }
                }

                notaOrientadorBruta = achieved;
                maxOrientadorBruta = max;
                if (max > 0) {
                    notaOrientadorNorm = achieved / max;
                }
            }

            // 3. Fórmula Dinâmica da Nota Final (Escala 0 a 100%)
            let notaFinal = 0;
            if (totalVisitantes > 0 && hasNotaOrientador) {
                notaFinal = ((mediaVisitantesNorm + notaOrientadorNorm) / 2) * 100;
            } else if (totalVisitantes > 0 && !hasNotaOrientador) {
                notaFinal = mediaVisitantesNorm * 100;
            } else if (totalVisitantes === 0 && hasNotaOrientador) {
                notaFinal = notaOrientadorNorm * 100;
            } else {
                notaFinal = 0;
            }

            const isConcluido = totalVisitantes >= 3 && hasNotaOrientador;

            return {
                id: turma.id,
                nome: turma.nome,
                temaLivro: turma.temaLivro,
                edicaoAno: turma.edicao.ano,
                orientadorNome: turma.orientador?.nome || 'Não atribuído',
                avaliacoesVisitantesCount: totalVisitantes,
                hasNotaOrientador,
                notaAvaliadoresBruta: parseFloat(notaAvaliadoresBruta.toFixed(2)),
                maxAvaliadoresBruta: parseFloat(maxAvaliadoresBruta.toFixed(2)),
                notaOrientadorBruta: parseFloat(notaOrientadorBruta.toFixed(2)),
                maxOrientadorBruta: parseFloat(maxOrientadorBruta.toFixed(2)),
                notaFinal: parseFloat(notaFinal.toFixed(2)),
                status: isConcluido ? 'CONCLUIDO' : 'PENDENTE'
            };
        });

        // Ordena por nota final
        consolidado.sort((a, b) => b.notaFinal - a.notaFinal);

        return res.json(consolidado);
    } catch (error) {
        next(error);
    }
});

export default router;
