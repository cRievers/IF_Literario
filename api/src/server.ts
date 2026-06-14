import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { requireAuth, AuthRequest } from './middlewares/auth.js';

const app = express();

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

app.use(cors());
app.use(express.json());

// --- ROTAS ---

// Rota para buscar o template de avaliação e seus critérios dinâmicos
app.get('/api/templates/:id', async (req, res) => {
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
        console.error(error);
        return res.status(500).json({ error: 'Erro interno no servidor' });
    }
});

app.get('/api/perfil', requireAuth, (req: AuthRequest, res) => {
    // Se chegou aqui, o middleware deixou passar!
    return res.json({
        mensagem: 'Acesso autorizado ao IF Literário!',
        usuario: req.user
    });
});

// Inicialização do Servidor
const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
    console.log(`🚀 Servidor do IF Literário rodando na porta ${PORT}`);
});