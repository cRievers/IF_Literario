import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';

const router = Router();

// Função auxiliar para calcular a nota de uma avaliação (soma das notas dos critérios)
const calcularNotaAvaliacao = (avaliacao: any) => {
    let total = 0;
    for (const nota of avaliacao.notas) {
        if (nota.criterio.tipo === 'NUMERICO' && nota.valorNumerico !== null) {
            total += nota.valorNumerico;
        } else if (nota.criterio.tipo === 'BOOLEANO' && nota.valorBooleano !== null) {
            total += nota.valorBooleano ? 10 : 0;
        }
    }
    return total;
};

// GET /api/resultados/campea - Ranking baseado apenas nos avaliadores
router.get('/campea', requireAuth, requireRole(['ADMIN']), async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const turmas = await prisma.turma.findMany({
            include: {
                avaliacoes: {
                    where: { finalizada: true, avaliador: { role: 'AVALIADOR' } },
                    include: {
                        notas: {
                            include: { criterio: true }
                        }
                    }
                }
            }
        });

        const resultados = turmas.map(turma => {
            const avaliacoesAvaliadores = turma.avaliacoes;
            const qtdeAvaliacoes = avaliacoesAvaliadores.length;
            
            let somaNotas = 0;
            let mediaAvaliadores = 0;

            if (qtdeAvaliacoes > 0) {
                for (const av of avaliacoesAvaliadores) {
                    somaNotas += calcularNotaAvaliacao(av);
                }
                mediaAvaliadores = somaNotas / qtdeAvaliacoes;
            }

            return {
                turmaId: turma.id,
                nome: turma.nome,
                temaLivro: turma.temaLivro,
                mediaAvaliadores,
                qtdeAvaliacoes
            };
        });

        // Ordenar do maior para o menor
        resultados.sort((a, b) => b.mediaAvaliadores - a.mediaAvaliadores);

        return res.json(resultados);
    } catch (error) {
        next(error);
    }
});

// GET /api/resultados/consolidado - Ranking final (Avaliadores + Orientador)
router.get('/consolidado', requireAuth, requireRole(['ADMIN']), async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const turmas = await prisma.turma.findMany({
            include: {
                avaliacoes: {
                    where: { finalizada: true },
                    include: {
                        avaliador: true,
                        notas: {
                            include: { criterio: true }
                        }
                    }
                }
            }
        });

        const resultados = turmas.map(turma => {
            const avaliacoesAvaliadores = turma.avaliacoes.filter(a => a.avaliador.role === 'AVALIADOR');
            const avaliacaoOrientador = turma.avaliacoes.find(a => a.avaliador.role === 'ORIENTADOR');

            let mediaAvaliadores = 0;
            if (avaliacoesAvaliadores.length > 0) {
                const somaAvaliadores = avaliacoesAvaliadores.reduce((acc, av) => acc + calcularNotaAvaliacao(av), 0);
                mediaAvaliadores = somaAvaliadores / avaliacoesAvaliadores.length;
            }

            const notaOrientador = avaliacaoOrientador ? calcularNotaAvaliacao(avaliacaoOrientador) : 0;

            // Fórmula: ((Media Avaliadores + Nota Orientador) / (MaxMediaAvaliadores + MaxNotaOrientador)) * 100
            // Assumindo que ambas as notas (Média e Orientador) têm o mesmo peso na soma bruta.
            // Para garantir a precisão do PRD: "Nota Final = ((Média Avaliadores + Nota Orientador) / 2) * 100"
            // Se as notas são na escala 0-10, o cálculo seria: ((Media + Orientador)/2) * 10 (para dar max 100%)
            const notaFinal = ((mediaAvaliadores + notaOrientador) / 2) * 10;

            return {
                turmaId: turma.id,
                nome: turma.nome,
                temaLivro: turma.temaLivro,
                mediaAvaliadores,
                notaOrientador,
                notaFinal,
                qtdeAvaliacoesAvaliadores: avaliacoesAvaliadores.length,
                temNotaOrientador: !!avaliacaoOrientador
            };
        });

        // Ordenar por nota final decrescente
        resultados.sort((a, b) => b.notaFinal - a.notaFinal);

        return res.json(resultados);
    } catch (error) {
        next(error);
    }
});

export default router;
