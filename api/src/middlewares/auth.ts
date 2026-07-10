import { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase.js';
import { prisma } from '../lib/prisma.js';

// Estendendo o Request do Express para incluir o usuário
// O generic P permite tipar req.params precisamente nos handlers (necessário no Express 5)
export interface AuthRequest<P extends Record<string, string> = Record<string, string>> extends Request<P> {
    user?: any;
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'Token de autenticação não fornecido' });
    }

    const token = authHeader.split(' ')[1]; // Formato: "Bearer <token>"

    // Verifica o JWT no Supabase
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
        return res.status(401).json({ error: 'Token inválido ou expirado' });
    }

    // Buscar usuário no Prisma — exclui usuários deletados (soft delete)
    const dbUser = await prisma.user.findFirst({
        where: { email: data.user.email, deletedAt: null }
    });

    if (!dbUser) {
        return res.status(401).json({ error: 'Usuário não encontrado ou inativo' });
    }

    // Anexa os dados do banco de dados na requisição para a rota usar
    req.user = dbUser;
    next();
};

export const requireRole = (roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Não autorizado' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Acesso negado' });
        }
        next();
    };
};