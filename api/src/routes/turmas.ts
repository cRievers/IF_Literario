import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';

const router = Router();

// POST /api/turmas - Criar turma (Apenas ADMIN)
router.post('/', requireAuth, requireRole(['ADMIN']), async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { nome, temaLivro, edicaoId, orientadorId, templateId } = req.body;

        if (!nome || !temaLivro || !edicaoId) {
            return res.status(400).json({ error: 'Campos obrigatórios: nome, temaLivro, edicaoId' });
        }

        const turma = await prisma.turma.create({
            data: {
                nome,
                temaLivro,
                edicaoId,
                orientadorId: orientadorId || null,
                templateId: templateId || null
            }
        });

        return res.status(201).json(turma);
    } catch (error) {
        next(error);
    }
});

// PUT /api/turmas/:id - Atualizar turma (Apenas ADMIN)
router.put('/:id', requireAuth, requireRole(['ADMIN']), async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { id } = req.params;
        const { nome, temaLivro, edicaoId, orientadorId, templateId } = req.body;

        const turma = await prisma.turma.update({
            where: { id },
            data: {
                nome,
                temaLivro,
                edicaoId,
                orientadorId,
                templateId
            }
        });

        return res.json(turma);
    } catch (error) {
        if ((error as any).code === 'P2025') {
            return res.status(404).json({ error: 'Turma não encontrada' });
        }
        next(error);
    }
});

export default router;
