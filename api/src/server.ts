import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { prisma } from './lib/prisma.js';
import { requireAuth, AuthRequest } from './middlewares/auth.js';

const app = express();

// CORS Restrito (apenas frontend do projeto)
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// --- ROTAS ---

// Rota para buscar o template de avaliação e seus critérios dinâmicos
app.get('/api/templates/:id', async (req: Request, res: Response, next: NextFunction): Promise<any> => {
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

app.get('/api/me', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Não autorizado' });
        }

        const userId = req.user.id;
        const role = req.user.role;

        let turmas: any[] = [];

        if (role === 'AVALIADOR') {
            const alocacoes = await prisma.alocacao.findMany({
                where: { avaliadorId: userId },
                include: { turma: true }
            });
            turmas = alocacoes.map(a => a.turma);
        } else if (role === 'ORIENTADOR') {
            turmas = await prisma.turma.findMany({
                where: { orientadorId: userId }
            });
        } else if (role === 'ADMIN') {
            turmas = await prisma.turma.findMany();
        }

        return res.json({
            user: req.user,
            turmas
        });
    } catch (error) {
        next(error);
    }
});

// Middleware de tratamento de erros global
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err);
    res.status(500).json({ error: 'Erro interno no servidor' });
});

// Inicialização do Servidor
const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
    console.log(`🚀 Servidor do IF Literário rodando na porta ${PORT}`);
});