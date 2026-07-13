import { Router, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, AuthRequest } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/roles.js';
import { logAudit } from '../lib/logger.js';

const router = Router();

// GET /api/turmas - Restrito a ADMIN
// Retorna a lista de todas as turmas com informações detalhadas.
router.get('/', requireAuth, requireRole(['ADMIN']), async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
    try {
        const turmas = await prisma.turma.findMany({
            include: {
                edicao: true,
                orientador: { select: { id: true, nome: true, email: true } },
                template: { select: { id: true, nome: true } },
                templateOrientador: { select: { id: true, nome: true } },
                alocacoes: {
                    include: {
                        avaliador: { select: { id: true, nome: true, email: true } }
                    }
                }
            },
            orderBy: { nome: 'asc' }
        });

        return res.json(turmas);
    } catch (error) {
        next(error);
    }
});

// POST /api/turmas - Restrito a ADMIN
// Cria uma nova turma no sistema.
router.post('/', requireAuth, requireRole(['ADMIN']), async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { nome, temaLivro, edicaoId, orientadorId, templateId, templateOrientadorId } = req.body;
        const adminId = req.user!.id;

        if (!nome || !temaLivro || !edicaoId) {
            return res.status(400).json({ error: 'Nome, tema do livro e ID da edição são obrigatórios.' });
        }

        const novaTurma = await prisma.turma.create({
            data: {
                nome,
                temaLivro,
                edicaoId: Number(edicaoId),
                orientadorId: orientadorId || null,
                templateId: templateId ? Number(templateId) : null,
                templateOrientadorId: templateOrientadorId ? Number(templateOrientadorId) : null
            },
            include: {
                edicao: true,
                orientador: { select: { id: true, nome: true, email: true } },
                template: { select: { id: true, nome: true } },
                templateOrientador: { select: { id: true, nome: true } }
            }
        });

        await logAudit('CRIAR_TURMA', { turmaId: novaTurma.id, nome, edicaoId }, adminId);

        return res.status(201).json(novaTurma);
    } catch (error) {
        next(error);
    }
});

// PUT /api/turmas/:id - Restrito a ADMIN
// Atualiza os dados de uma turma existente.
router.put('/:id', requireAuth, requireRole(['ADMIN']), async (req: AuthRequest<{ id: string }>, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { id } = req.params;
        const { nome, temaLivro, edicaoId, orientadorId, templateId, templateOrientadorId } = req.body;
        const adminId = req.user!.id;

        const turmaExistente = await prisma.turma.findUnique({ where: { id } });
        if (!turmaExistente) {
            return res.status(404).json({ error: 'Turma não encontrada.' });
        }

        const turmaAtualizada = await prisma.turma.update({
            where: { id },
            data: {
                nome: nome || turmaExistente.nome,
                temaLivro: temaLivro || turmaExistente.temaLivro,
                edicaoId: edicaoId ? Number(edicaoId) : turmaExistente.edicaoId,
                orientadorId: orientadorId !== undefined ? (orientadorId || null) : turmaExistente.orientadorId,
                templateId: templateId !== undefined ? (templateId ? Number(templateId) : null) : turmaExistente.templateId,
                templateOrientadorId: templateOrientadorId !== undefined ? (templateOrientadorId ? Number(templateOrientadorId) : null) : turmaExistente.templateOrientadorId
            },
            include: {
                edicao: true,
                orientador: { select: { id: true, nome: true, email: true } },
                template: { select: { id: true, nome: true } },
                templateOrientador: { select: { id: true, nome: true } }
            }
        });

        await logAudit('ATUALIZAR_TURMA', { turmaId: id, dadosNovos: req.body }, adminId);

        return res.json(turmaAtualizada);
    } catch (error) {
        next(error);
    }
});

export default router;
