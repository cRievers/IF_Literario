import { Router, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, AuthRequest } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/roles.js';
import { logAudit } from '../lib/logger.js';

const router = Router();

// GET /api/alocacoes - Restrito a ADMIN
// Retorna a lista de todas as alocações ativas.
router.get('/', requireAuth, requireRole(['ADMIN']), async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
    try {
        const alocacoes = await prisma.alocacao.findMany({
            include: {
                avaliador: { select: { id: true, nome: true, email: true, role: true } },
                turma: {
                    include: {
                        edicao: { select: { id: true, ano: true, ativo: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return res.json(alocacoes);
    } catch (error) {
        next(error);
    }
});

// POST /api/alocacoes - Restrito a ADMIN
// Cria uma nova alocação de avaliador para uma turma.
router.post('/', requireAuth, requireRole(['ADMIN']), async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { avaliadorId, turmaId } = req.body;
        const adminId = req.user!.id;

        if (!avaliadorId || !turmaId) {
            return res.status(400).json({ error: 'Os IDs do avaliador e da turma são obrigatórios.' });
        }

        // Verifica se o avaliador existe
        const avaliador = await prisma.user.findUnique({ where: { id: avaliadorId } });
        if (!avaliador) {
            return res.status(404).json({ error: 'Avaliador não encontrado.' });
        }

        // Verifica se a turma existe
        const turma = await prisma.turma.findUnique({ where: { id: turmaId } });
        if (!turma) {
            return res.status(404).json({ error: 'Turma não encontrada.' });
        }

        // Verifica duplicidade
        const alocacaoExistente = await prisma.alocacao.findUnique({
            where: {
                avaliadorId_turmaId: {
                    avaliadorId,
                    turmaId
                }
            }
        });

        if (alocacaoExistente) {
            return res.status(400).json({ error: 'Este avaliador já está alocado para esta turma.' });
        }

        const novaAlocacao = await prisma.alocacao.create({
            data: {
                avaliadorId,
                turmaId
            },
            include: {
                avaliador: { select: { id: true, nome: true, email: true, role: true } },
                turma: {
                    include: {
                        edicao: { select: { id: true, ano: true, ativo: true } }
                    }
                }
            }
        });

        await logAudit('CRIAR_ALOCACAO', { alocacaoId: novaAlocacao.id, avaliadorId, turmaId }, adminId);

        return res.status(201).json(novaAlocacao);
    } catch (error) {
        next(error);
    }
});

// DELETE /api/alocacoes/:id - Restrito a ADMIN
// Remove uma alocação.
router.delete('/:id', requireAuth, requireRole(['ADMIN']), async (req: AuthRequest<{ id: string }>, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { id } = req.params;
        const adminId = req.user!.id;

        const alocacaoExistente = await prisma.alocacao.findUnique({ where: { id } });
        if (!alocacaoExistente) {
            return res.status(404).json({ error: 'Alocação não encontrada.' });
        }

        await prisma.alocacao.delete({
            where: { id }
        });

        await logAudit('EXCLUIR_ALOCACAO', { alocacaoId: id, avaliadorId: alocacaoExistente.avaliadorId, turmaId: alocacaoExistente.turmaId }, adminId);

        return res.status(204).send();
    } catch (error) {
        next(error);
    }
});

export default router;
