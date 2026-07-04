import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';

const router = Router();

// GET /api/alocacoes - Listar alocações (Apenas ADMIN)
router.get('/', requireAuth, requireRole(['ADMIN']), async (_req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const alocacoes = await prisma.alocacao.findMany({
            include: {
                avaliador: { select: { nome: true, email: true } },
                turma: { select: { nome: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        return res.json(alocacoes);
    } catch (error) {
        next(error);
    }
});

// POST /api/alocacoes - Criar alocação (Apenas ADMIN)
router.post('/', requireAuth, requireRole(['ADMIN']), async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { avaliadorId, turmaId } = req.body;

        if (!avaliadorId || !turmaId) {
            return res.status(400).json({ error: 'Campos obrigatórios: avaliadorId, turmaId' });
        }

        // Verificar se já existe (unique constraint cuidaria disso, mas podemos validar antes se quiser, 
        // ou só tratar o erro do prisma)
        const alocacao = await prisma.alocacao.create({
            data: {
                avaliadorId,
                turmaId
            }
        });

        return res.status(201).json(alocacao);
    } catch (error) {
        if ((error as any).code === 'P2002') {
            return res.status(400).json({ error: 'Avaliador já alocado nesta turma' });
        }
        next(error);
    }
});

// DELETE /api/alocacoes/:id - Remover alocação (Apenas ADMIN)
router.delete('/:id', requireAuth, requireRole(['ADMIN']), async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { id } = req.params;

        await prisma.alocacao.delete({
            where: { id }
        });

        return res.status(204).send();
    } catch (error) {
        if ((error as any).code === 'P2025') {
            return res.status(404).json({ error: 'Alocação não encontrada' });
        }
        next(error);
    }
});

export default router;
