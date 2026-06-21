import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';

export const requireRole = (roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user || !req.user.role) {
            return res.status(403).json({ error: 'Acesso negado: Perfil de usuário incompleto' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Acesso negado: Permissão insuficiente' });
        }

        next();
    };
};
