import { Router, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, AuthRequest } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/roles.js';

const router = Router();

// GET /api/usuarios - Restrito a ADMIN
// Retorna a lista de usuários, com suporte a filtro por role.
router.get('/', requireAuth, requireRole(['ADMIN']), async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { role } = req.query;

        const whereClause: any = {};
        if (role && typeof role === 'string') {
            whereClause.role = role.toUpperCase();
        }

        const usuarios = await prisma.user.findMany({
            where: whereClause,
            select: {
                id: true,
                nome: true,
                email: true,
                role: true,
                alocacoes: {
                    include: {
                        turma: { select: { id: true, nome: true, temaLivro: true } }
                    }
                },
                turmasOrientadas: {
                    select: { id: true, nome: true, temaLivro: true }
                }
            },
            orderBy: { nome: 'asc' }
        });

        return res.json(usuarios);
    } catch (error) {
        next(error);
    }
});

export default router;
