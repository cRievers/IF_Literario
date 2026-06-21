import { prisma } from './prisma.js';

export async function logAudit(acao: string, detalhes: any, usuarioId?: string) {
    try {
        await prisma.logAuditoria.create({
            data: {
                acao,
                detalhes: JSON.stringify(detalhes),
                usuarioId,
            }
        });
    } catch (error) {
        console.error('Falha ao salvar log de auditoria:', error);
    }
}
