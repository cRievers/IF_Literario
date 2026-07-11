// api/src/routes/ocorrencias.ts
import { Router, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, AuthRequest } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/roles.js';

const router = Router();

// GET /api/ocorrencias/minhas - Retorna as ocorrências do orientador logado
router.get('/minhas', requireAuth, requireRole(['ORIENTADOR', 'AVALIADOR']), async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
    try {
        const userId = req.user!.id;
        
        const ocorrencias = await prisma.ocorrencia.findMany({
            where: { orientadorId: userId },
            include: {
                turma: { select: { id: true, nome: true } }
            },
            orderBy: { dataRegistro: 'desc' }
        });

        return res.json(ocorrencias);
    } catch (error) {
        next(error);
    }
});

// POST /api/ocorrencias - Cria uma nova ocorrência
router.post('/', requireAuth, requireRole(['ORIENTADOR', 'AVALIADOR', 'ADMIN']), async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { descricao, turmaId } = req.body;
        const orientadorId = req.user!.id;

        if (!descricao || typeof descricao !== 'string') {
            return res.status(400).json({ error: 'A descrição da ocorrência é obrigatória.' });
        }

        const ocorrencia = await prisma.ocorrencia.create({
            data: {
                descricao,
                turmaId: turmaId || null,
                orientadorId
            }
        });

        return res.status(201).json(ocorrencia);
    } catch (error) {
        next(error);
    }
});

// GET /api/ocorrencias - Retorna todas as ocorrências (apenas ADMIN)
router.get('/', requireAuth, requireRole(['ADMIN']), async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
    try {
        const ocorrencias = await prisma.ocorrencia.findMany({
            include: {
                orientador: { select: { id: true, nome: true, email: true } },
                turma: { select: { id: true, nome: true, temaLivro: true } }
            },
            orderBy: { dataRegistro: 'desc' }
        });

        return res.json(ocorrencias);
    } catch (error) {
        next(error);
    }
});

// PUT /api/ocorrencias/:id/resolver - Marca uma ocorrência como resolvida (apenas ADMIN)
router.put('/:id/resolver', requireAuth, requireRole(['ADMIN']), async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { id } = req.params;
        const ocorrencia = await prisma.ocorrencia.update({
            where: { id },
            data: { resolvida: true }
        });
        return res.json(ocorrencia);
    } catch (error) {
        next(error);
    }
});

export default router;
