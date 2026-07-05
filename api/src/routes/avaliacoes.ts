import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, AuthRequest } from '../middlewares/auth.js';
import { logAudit } from '../lib/logger.js';

const router = Router();

// Progresso das avaliações de uma turma
router.get('/turma/:id', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const targetId = id as string;

        const turma = await prisma.turma.findUnique({
            where: { id: targetId },
            include: {
                edicao: true,
                avaliacoes: {
                    include: {
                        avaliador: true,
                        notas: true
                    }
                }
            }
        });

        if (!turma) {
            return res.status(404).json({ error: 'Turma não encontrada' });
        }

        const avaliacoesVisitantes = turma.avaliacoes.filter((a: any) => a.avaliador.role === 'AVALIADOR');
        const totalAvaliacoes = avaliacoesVisitantes.length;
        const maxAvaliacoes = 3;

        const minhaAvaliacao = turma.avaliacoes.find((a: any) => a.avaliadorId === userId);
        const jaAvaliou = !!minhaAvaliacao;

        let avaliacaoData = null;
        if (minhaAvaliacao) {
            avaliacaoData = {
                id: minhaAvaliacao.id,
                comentario: minhaAvaliacao.comentario,
                notas: minhaAvaliacao.notas.map((n: any) => ({
                    criterioId: n.criterioId,
                    valor: n.valorNumerico !== null ? n.valorNumerico : (n.valorBooleano !== null ? n.valorBooleano : n.valorTexto)
                }))
            };
        }

        return res.json({
            turmaId: id,
            totalAvaliacoes,
            maxAvaliacoes,
            jaAvaliou,
            edicaoAtiva: turma.edicao.ativo,
            avaliacao: avaliacaoData
        });
    } catch (error) {
        next(error);
    }
});

router.post('/', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { turmaId, templateId, notas, comentario } = req.body;
        const avaliadorId = req.user!.id;
        const role = req.user!.role;

        // Obter turma e edição correspondente
        const turma = await prisma.turma.findUnique({
            where: { id: turmaId },
            include: { edicao: true }
        });

        if (!turma) {
            return res.status(404).json({ error: 'Turma não encontrada.' });
        }

        if (!turma.edicao.ativo) {
            return res.status(400).json({ error: 'Esta edição do evento não está ativa. Avaliações não podem ser submetidas ou alteradas.' });
        }

        // 1. Validar Idempotência (Já avaliou essa turma?)
        const avaliacaoExistente = await prisma.avaliacao.findUnique({
            where: {
                turmaId_avaliadorId: {
                    turmaId,
                    avaliadorId
                }
            }
        });

        // 2. Validar se o usuário é ORIENTADOR e se é orientador da turma
        if (role === 'ORIENTADOR') {
            if (turma.orientadorId !== avaliadorId) {
                return res.status(403).json({ error: 'Você só pode avaliar a turma que você orienta.' });
            }
        }

        // 3. Validar limite de avaliações do avaliador (Regra 3x3) e limite por turma (somente para novas avaliações)
        if (!avaliacaoExistente && role === 'AVALIADOR') {
            const avaliacoesFeitas = await prisma.avaliacao.count({
                where: { avaliadorId }
            });

            if (avaliacoesFeitas >= 3) {
                return res.status(400).json({ error: 'Você já atingiu o limite de 3 avaliações.' });
            }

            // 3. Validar limite de avaliações da turma (Máximo 3 visitantes)
            const avaliacoesDaTurma = await prisma.avaliacao.count({
                where: {
                    turmaId,
                    avaliador: {
                        role: 'AVALIADOR'
                    }
                }
            });

            if (avaliacoesDaTurma >= 3) {
                return res.status(400).json({ error: 'Esta turma já recebeu o máximo de 3 avaliações de visitantes.' });
            }
        }

        // 4. Validar os critérios do template
        const template = await prisma.templateAvaliacao.findUnique({
            where: { id: Number(templateId) },
            include: { criterios: true }
        });

        if (!template) {
            return res.status(404).json({ error: 'Template não encontrado.' });
        }

        // Preparar notas
        const notasParaCriar: any[] = [];
        for (const criterio of template.criterios) {
            const notaEnviada = notas.find((n: any) => n.criterioId === criterio.id);
            if (!notaEnviada) {
                return res.status(400).json({ error: `Faltando nota para o critério ID ${criterio.id}.` });
            }

            let valorNumerico = null;
            let valorBooleano = null;
            let valorTexto = null;

            if (criterio.tipo === 'NUMERICO') {
                if (typeof notaEnviada.valor !== 'number') {
                    return res.status(400).json({ error: `O critério ID ${criterio.id} exige um valor numérico.` });
                }
                if (criterio.pesoMaximo && notaEnviada.valor > criterio.pesoMaximo) {
                    return res.status(400).json({ error: `A nota do critério ID ${criterio.id} não pode exceder ${criterio.pesoMaximo}.` });
                }
                valorNumerico = notaEnviada.valor;
            } else if (criterio.tipo === 'BOOLEANO') {
                if (typeof notaEnviada.valor !== 'boolean') {
                    return res.status(400).json({ error: `O critério ID ${criterio.id} exige um valor booleano.` });
                }
                valorBooleano = notaEnviada.valor;
            } else if (criterio.tipo === 'TEXTO') {
                if (typeof notaEnviada.valor !== 'string') {
                    return res.status(400).json({ error: `O critério ID ${criterio.id} exige um valor de texto.` });
                }
                valorTexto = notaEnviada.valor;
            }

            notasParaCriar.push({
                criterioId: criterio.id,
                valorNumerico,
                valorBooleano,
                valorTexto
            });
        }

        // 5. Transação ACID
        const novaAvaliacao = await prisma.$transaction(async (tx: any) => {
            if (avaliacaoExistente) {
                // Remove notas antigas
                await tx.notaCriterio.deleteMany({
                    where: { avaliacaoId: avaliacaoExistente.id }
                });

                // Atualiza a avaliacao existente
                const avaliacao = await tx.avaliacao.update({
                    where: { id: avaliacaoExistente.id },
                    data: {
                        comentario,
                        notas: {
                            create: notasParaCriar
                        }
                    }
                });
                return avaliacao;
            } else {
                // Criação normal
                const avaliacao = await tx.avaliacao.create({
                    data: {
                        turmaId,
                        avaliadorId,
                        templateId: Number(templateId),
                        finalizada: true,
                        comentario,
                        notas: {
                            create: notasParaCriar
                        }
                    }
                });
                return avaliacao;
            }
        });

        // Registrar auditoria
        const action = avaliacaoExistente ? 'ATUALIZAR_AVALIACAO' : 'CRIAR_AVALIACAO';
        await logAudit(action, { avaliacaoId: novaAvaliacao.id, turmaId, avaliadorId }, avaliadorId);

        return res.status(avaliacaoExistente ? 200 : 201).json(novaAvaliacao);
    } catch (error) {
        next(error);
    }
});

export default router;
