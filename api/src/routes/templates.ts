import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';

const router = Router();

// GET /api/templates/:id - Buscar template e seus critérios dinâmicos
router.get('/:id', async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { id } = req.params;

        const template = await prisma.templateAvaliacao.findUnique({
            where: { id: Number(id) },
            include: {
                criterios: {
                    orderBy: { id: 'asc' } // Mantém a ordem correta dos critérios
                }
            }
        });

        if (!template) {
            return res.status(404).json({ error: 'Template não encontrado' });
        }

        return res.json(template);
    } catch (error) {
        next(error);
    }
});

// PUT /api/templates/:id - Atualizar template e critérios (Apenas ADMIN)
router.put('/:id', requireAuth, requireRole(['ADMIN']), async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { id } = req.params;
        const { nome, descricao, criterios } = req.body;

        if (!nome) {
            return res.status(400).json({ error: 'Nome do template é obrigatório' });
        }

        // Executando em transação para garantir que a atualização dos critérios seja atômica
        const template = await prisma.$transaction(async (prisma) => {
            // Atualiza os dados básicos do template
            const updatedTemplate = await prisma.templateAvaliacao.update({
                where: { id: Number(id) },
                data: { nome, descricao }
            });

            // Se critérios foram enviados, vamos substituir (apagar antigos e criar novos)
            // Cuidado: isso apaga notas associadas devido ao onDelete: Cascade, 
            // no mundo real, se o template já tem avaliações, talvez não deva ser atualizado assim.
            // Para efeitos de CRUD básico do Sprint 4, implementaremos a deleção + recriação.
            if (criterios && Array.isArray(criterios)) {
                await prisma.criterio.deleteMany({
                    where: { templateId: Number(id) }
                });

                await prisma.criterio.createMany({
                    data: criterios.map((c: any) => ({
                        descricao: c.descricao,
                        descricaoLonga: c.descricaoLonga,
                        tipo: c.tipo || 'NUMERICO',
                        pesoMaximo: c.pesoMaximo,
                        templateId: Number(id)
                    }))
                });
            }

            return prisma.templateAvaliacao.findUnique({
                where: { id: Number(id) },
                include: {
                    criterios: {
                        orderBy: { id: 'asc' }
                    }
                }
            });
        });

        return res.json(template);
    } catch (error) {
        if ((error as any).code === 'P2025') {
            return res.status(404).json({ error: 'Template não encontrado' });
        }
        next(error);
    }
});

export default router;
