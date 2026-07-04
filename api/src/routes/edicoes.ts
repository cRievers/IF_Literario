import { Router, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, AuthRequest } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/roles.js';
import { logAudit } from '../lib/logger.js';

const router = Router();

// GET /api/edicoes - Restrito a ADMIN
// Retorna a lista de edições cadastradas.
router.get('/', requireAuth, requireRole(['ADMIN']), async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
    try {
        const edicoes = await prisma.edicao.findMany({
            include: {
                _count: {
                    select: { turmas: true }
                }
            },
            orderBy: { ano: 'desc' }
        });

        return res.json(edicoes);
    } catch (error) {
        next(error);
    }
});

// POST /api/edicoes - Restrito a ADMIN
// Cria uma nova edição do evento.
router.post('/', requireAuth, requireRole(['ADMIN']), async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { ano, ativo } = req.body;
        const adminId = req.user!.id;

        if (!ano || isNaN(Number(ano))) {
            return res.status(400).json({ error: 'O ano da edição é obrigatório e deve ser um número.' });
        }

        const anoNum = Number(ano);

        const edicaoExistente = await prisma.edicao.findUnique({ where: { ano: anoNum } });
        if (edicaoExistente) {
            return res.status(400).json({ error: 'Já existe uma edição cadastrada para este ano.' });
        }

        // Se a nova edição for ativa, desativa as outras para manter apenas uma edição ativa por vez
        if (ativo) {
            await prisma.edicao.updateMany({
                where: { ativo: true },
                data: { ativo: false }
            });
        }

        const novaEdicao = await prisma.edicao.create({
            data: {
                ano: anoNum,
                ativo: ativo !== undefined ? Boolean(ativo) : true
            },
            include: {
                _count: { select: { turmas: true } }
            }
        });

        await logAudit('CRIAR_EDICAO', { edicaoId: novaEdicao.id, ano: anoNum, ativo: novaEdicao.ativo }, adminId);

        return res.status(201).json(novaEdicao);
    } catch (error) {
        next(error);
    }
});

// PUT /api/edicoes/:id - Restrito a ADMIN
// Atualiza o status ou ano de uma edição.
router.put('/:id', requireAuth, requireRole(['ADMIN']), async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
    try {
        const id = Number(req.params.id);
        const { ano, ativo } = req.body;
        const adminId = req.user!.id;

        const edicaoExistente = await prisma.edicao.findUnique({ where: { id } });
        if (!edicaoExistente) {
            return res.status(404).json({ error: 'Edição não encontrada.' });
        }

        if (ativo === true && !edicaoExistente.ativo) {
            // Se ativou essa edição, desativa as outras
            await prisma.edicao.updateMany({
                where: { id: { not: id }, ativo: true },
                data: { ativo: false }
            });
        }

        const edicaoAtualizada = await prisma.edicao.update({
            where: { id },
            data: {
                ano: ano ? Number(ano) : edicaoExistente.ano,
                ativo: ativo !== undefined ? Boolean(ativo) : edicaoExistente.ativo
            },
            include: {
                _count: { select: { turmas: true } }
            }
        });

        await logAudit('ATUALIZAR_EDICAO', { edicaoId: id, ano: edicaoAtualizada.ano, ativo: edicaoAtualizada.ativo }, adminId);

        return res.json(edicaoAtualizada);
    } catch (error) {
        next(error);
    }
});

export default router;
