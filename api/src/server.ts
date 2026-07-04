import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { prisma } from './lib/prisma.js';
import { requireAuth, AuthRequest } from './middlewares/auth.js';

const app = express();

// CORS Restrito (apenas frontend do projeto)
// FRONTEND_URL pode conter múltiplas origens separadas por vírgula
// Ex: https://app.run.app,http://localhost:5173
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map(url => url.trim());

app.use(cors({
    origin: (origin, callback) => {
        // Permite requisições sem origin (ex: curl, Postman, mobile)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`Origem não permitida pelo CORS: ${origin}`));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

import avaliacoesRoutes from './routes/avaliacoes.js';
import ocorrenciasRoutes from './routes/ocorrencias.js';
import resultadosRoutes from './routes/resultados.js';
import turmasRoutes from './routes/turmas.js';
import alocacoesRoutes from './routes/alocacoes.js';
import templatesRoutes from './routes/templates.js';

// --- ROTAS ---
app.use('/api/avaliacoes', avaliacoesRoutes);
app.use('/api/ocorrencias', ocorrenciasRoutes);
app.use('/api/resultados', resultadosRoutes);
app.use('/api/turmas', turmasRoutes);
app.use('/api/alocacoes', alocacoesRoutes);
app.use('/api/templates', templatesRoutes);


app.get('/api/me', requireAuth, async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Não autorizado' });
        }

        const userId = req.user.id;
        const role = req.user.role;

        // Campos selecionados de turma — inclui templateId para o frontend saber qual barema buscar
        const turmaSelect = {
            id: true,
            nome: true,
            temaLivro: true,
            templateId: true,
            edicao: { select: { ano: true, ativo: true } }
        };

        let turmas: any[] = [];

        if (role === 'AVALIADOR') {
            const alocacoes = await prisma.alocacao.findMany({
                where: {
                    avaliadorId: userId,
                    turma: { edicao: { ativo: true } } // Apenas edição ativa
                },
                include: { turma: { select: turmaSelect } }
            });
            turmas = alocacoes.map((a: any) => a.turma);
        } else if (role === 'ORIENTADOR') {
            turmas = await prisma.turma.findMany({
                where: { orientadorId: userId, edicao: { ativo: true } },
                select: turmaSelect
            });
        } else if (role === 'ADMIN') {
            turmas = await prisma.turma.findMany({
                select: turmaSelect
            });
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