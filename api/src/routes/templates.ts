import { Router, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, AuthRequest } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/roles.js';
import { logAudit } from '../lib/logger.js';

const router = Router();

// GET /api/templates - Restrito a ADMIN
// Retorna a lista de todos os templates com seus critérios ativos.
router.get('/', requireAuth, requireRole(['ADMIN']), async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
    try {
        const templates = await prisma.templateAvaliacao.findMany({
            include: {
                criterios: {
                    where: { ativo: true }, // Apenas critérios ativos
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

// GET /api/templates/:id - Buscar template e seus critérios dinâmicos (apenas ativos)
router.get('/:id', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { id } = req.params;

        const template = await prisma.templateAvaliacao.findUnique({
            where: { id: Number(id) },
            include: {
                criterios: {
                    where: { ativo: true }, // Apenas critérios ativos
                    orderBy: { id: 'asc' }
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
// Atualiza um template e seus critérios com soft delete seguro.
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
                    where: { ativo: true }, // Só considera ativos para efeito de remoção
                    include: {
                        notas: { select: { id: true } }
                    }
                }
            }
        });

        if (!templateExistente) {
            return res.status(404).json({ error: 'Template não encontrado.' });
        }

        // Identificar critérios ativos que o admin removeu do formulário
        const incomingIds = criterios
            .filter((c: any) => c.id != null)
            .map((c: any) => Number(c.id));

        const criteriosParaRemover = templateExistente.criterios.filter(
            c => !incomingIds.includes(c.id)
        );

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

            // 2. Tratar critérios removidos:
            //    - Com notas → inativar (soft delete) para preservar integridade histórica
            //    - Sem notas → deletar fisicamente (limpeza)
            for (const crit of criteriosParaRemover) {
                if (crit.notas.length > 0) {
                    // Soft delete: inativa o critério sem perder referências
                    await tx.criterio.update({
                        where: { id: crit.id },
                        data: { ativo: false }
                    });
                } else {
                    // Sem histórico: remoção física segura
                    await tx.criterio.delete({
                        where: { id: crit.id }
                    });
                }
            }

            // 3. Atualizar ou criar critérios
            for (const item of criterios) {
                const tipo = item.tipo || 'NUMERICO';
                const pesoMaximo = (tipo === 'NUMERICO' || tipo === 'BOOLEANO')
                    ? (item.pesoMaximo ? parseFloat(item.pesoMaximo) : 10)
                    : null;
                const faixasNota: string[] = Array.isArray(item.faixasNota)
                    ? item.faixasNota.filter((f: string) => f.trim() !== '')
                    : [];

                if (item.id != null) {
                    // Atualiza critério existente
                    await tx.criterio.update({
                        where: { id: Number(item.id) },
                        data: {
                            descricao: item.descricao,
                            descricaoLonga: item.descricaoLonga || null,
                            tipo,
                            pesoMaximo,
                            faixasNota
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
                            faixasNota,
                            templateId
                        }
                    });
                }
            }
        });

        const templateAtualizado = await prisma.templateAvaliacao.findUnique({
            where: { id: templateId },
            include: {
                criterios: {
                    where: { ativo: true },
                    orderBy: { id: 'asc' }
                }
            }
        });

        await logAudit(
            'ATUALIZAR_TEMPLATE',
            {
                templateId,
                nome,
                criteriosAtualizados: criterios.length,
                criteriosInativados: criteriosParaRemover.filter(c => c.notas.length > 0).length,
                criteriosDeletados: criteriosParaRemover.filter(c => c.notas.length === 0).length,
            },
            adminId
        );

        return res.json(templateAtualizado);
    } catch (error) {
        next(error);
    }
});

export default router;
