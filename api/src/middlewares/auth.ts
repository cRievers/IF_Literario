import { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase.js';
import { prisma } from '../lib/prisma.js';

// Estendendo o Request do Express para incluir o usuário
export interface AuthRequest extends Request {
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

    // Buscar usuário no Prisma usando o e-mail, pois o ID do Supabase pode ser diferente em ambiente de dev
    const dbUser = await prisma.user.findUnique({
        where: { email: data.user.email }
    });

    if (!dbUser) {
        return res.status(401).json({ error: 'Usuário não encontrado no banco de dados' });
    }

    // Anexa os dados do banco de dados na requisição para a rota usar
    req.user = dbUser;
    next();
};