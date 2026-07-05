import { Router, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, AuthRequest } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/roles.js';
import { logAudit } from '../lib/logger.js';

const router = Router();

// GET /api/templates - Restrito a ADMIN
// Retorna a lista de todos os templates com seus critérios.
router.get('/', requireAuth, requireRole(['ADMIN']), async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
    try {
        const templates = await prisma.templateAvaliacao.findMany({
            include: {
                criterios: {
                    orderBy: { id: 'asc' }
                },
                _count: {
                    select: { turmas: true, avaliacoes: true }
                }
            },
            orderBy: { id: 'asc' }
        });

        return res.json(templates);
    } catch (error) {
        next(error);
    }
});

// GET /api/templates/:id - Buscar template e seus critérios dinâmicos
router.get('/:id', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
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

// PUT /api/templates/:id - Restrito a ADMIN
// Atualiza um template e seus critérios com travas de segurança.
router.put('/:id', requireAuth, requireRole(['ADMIN']), async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
    try {
        const templateId = Number(req.params.id);
        const { nome, descricao, criterios } = req.body;
        const adminId = req.user!.id;

        if (!nome || !criterios || !Array.isArray(criterios)) {
            return res.status(400).json({ error: 'Nome e lista de critérios são obrigatórios.' });
        }

        const templateExistente = await prisma.templateAvaliacao.findUnique({
            where: { id: templateId },
            include: {
                criterios: {
                    include: {
                        notas: { select: { id: true } }
                    }
                }
            }
        });

        if (!templateExistente) {
            return res.status(404).json({ error: 'Template não encontrado.' });
        }

        // Identificar critérios que o usuário tentou remover
        const incomingIds = criterios.filter((c: any) => c.id != null).map((c: any) => Number(c.id));
        const criteriosParaRemover = templateExistente.criterios.filter(c => !incomingIds.includes(c.id));

        // Trava de Segurança: verificar se algum critério a ser removido possui notas
        for (const crit of criteriosParaRemover) {
            if (crit.notas.length > 0) {
                return res.status(400).json({ 
                    error: `O critério "${crit.descricao}" não pode ser removido pois já possui notas vinculadas a ele em avaliações concluídas.` 
                });
            }
        }

        // Executar transação de atualização
        await prisma.$transaction(async (tx) => {
            // 1. Atualizar dados do template
            await tx.templateAvaliacao.update({
                where: { id: templateId },
                data: {
                    nome,
                    descricao: descricao || null
                }
            });

            // 2. Remover critérios permitidos
            if (criteriosParaRemover.length > 0) {
                const idsParaRemover = criteriosParaRemover.map(c => c.id);
                await tx.criterio.deleteMany({
                    where: { id: { in: idsParaRemover } }
                });
            }

            // 3. Atualizar ou Criar critérios
            for (const item of criterios) {
                const tipo = item.tipo || 'NUMERICO';
                const pesoMaximo = tipo === 'NUMERICO' ? (item.pesoMaximo ? parseFloat(item.pesoMaximo) : 10) : null;

                if (item.id != null) {
                    // Atualiza critério existente
                    await tx.criterio.update({
                        where: { id: Number(item.id) },
                        data: {
                            descricao: item.descricao,
                            descricaoLonga: item.descricaoLonga || null,
                            tipo,
                            pesoMaximo
                        }
                    });
                } else {
                    // Cria novo critério
                    await tx.criterio.create({
                        data: {
                            descricao: item.descricao,
                            descricaoLonga: item.descricaoLonga || null,
                            tipo,
                            pesoMaximo,
                            templateId
                        }
                    });
                }
            }
        });

        const templateAtualizado = await prisma.templateAvaliacao.findUnique({
            where: { id: templateId },
            include: {
                criterios: { orderBy: { id: 'asc' } }
            }
        });

        await logAudit('ATUALIZAR_TEMPLATE', { templateId, nome, alteracoesCriterios: criterios.length }, adminId);

        return res.json(templateAtualizado);
    } catch (error) {
        next(error);
    }
});

export default router;
