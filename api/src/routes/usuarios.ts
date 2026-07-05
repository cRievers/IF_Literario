import { Router, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, AuthRequest } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/roles.js';
import { createClient } from '@supabase/supabase-js';
import { Role } from '@prisma/client';

const router = Router();

// Admin Supabase client — usa service_role para criar/deletar usuários em auth.users
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const SENHA_PADRAO = process.env.SENHA_PADRAO_USUARIOS || 'IFLiterario@2025';

const ROLES_GERENCIAVEIS: Role[] = [Role.AVALIADOR, Role.ORIENTADOR];

// GET /api/usuarios - Restrito a ADMIN
// Retorna a lista de usuários, com suporte a filtro por role.
router.get('/', requireAuth, requireRole(['ADMIN']), async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { role } = req.query;

        const whereClause: any = {
            deletedAt: null,
        };
        if (role && typeof role === 'string') {
            whereClause.role = role.toUpperCase();
        } else {
            whereClause.role = { in: ROLES_GERENCIAVEIS };
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
            orderBy: [{ role: 'asc' }, { nome: 'asc' }]
        });

        return res.json(usuarios);
    } catch (error) {
        next(error);
    }
});

// POST /api/usuarios — cria usuário em auth.users + public.users
router.post('/', requireAuth, requireRole(['ADMIN']), async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { nome, email, role } = req.body as { nome: string; email: string; role: Role };

    if (!nome || !email || !role) {
      return res.status(400).json({ error: 'Campos obrigatórios: nome, email, role' });
    }
    if (!ROLES_GERENCIAVEIS.includes(role)) {
      return res.status(400).json({ error: 'Role inválida. Use AVALIADOR ou ORIENTADOR' });
    }

    // 1. Verificar se já existe no auth.users (evita duplicata)
    const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
    const existing = listData?.users?.find(u => u.email === email);

    let authUserId: string;

    if (existing) {
      // Reativar se estava deletado (soft delete)
      authUserId = existing.id;
    } else {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: SENHA_PADRAO,
        email_confirm: true,
      });
      if (error || !data.user) {
        throw new Error(`Falha ao criar auth user: ${error?.message}`);
      }
      authUserId = data.user.id;
    }

    // 2. Upsert em public.users reativando se estava deletado
    const usuario = await prisma.user.upsert({
      where: { email },
      update: { nome, role, id: authUserId, deletedAt: null },
      create: { id: authUserId, email, nome, role },
      select: { id: true, nome: true, email: true, role: true },
    });

    return res.status(201).json(usuario);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'E-mail já cadastrado' });
    }
    next(error);
  }
});

// PUT /api/usuarios/:id — atualiza nome, email e role
router.put('/:id', requireAuth, requireRole(['ADMIN']), async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { id } = req.params;
    const { nome, email, role } = req.body as { nome?: string; email?: string; role?: Role };

    if (role && !ROLES_GERENCIAVEIS.includes(role)) {
      return res.status(400).json({ error: 'Role inválida. Use AVALIADOR ou ORIENTADOR' });
    }

    // 1. Atualizar email no Supabase Auth se foi alterado
    if (email) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(id, { email });
      if (error) throw new Error(`Falha ao atualizar auth user: ${error.message}`);
    }

    // 2. Atualizar public.users
    const usuario = await prisma.user.update({
      where: { id },
      data: { nome, email, role },
      select: { id: true, nome: true, email: true, role: true },
    });

    return res.json(usuario);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    next(error);
  }
});

// DELETE /api/usuarios/:id — soft delete: marca deletedAt, desativa no auth.users
router.delete('/:id', requireAuth, requireRole(['ADMIN']), async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { id } = req.params;

    // 1. Soft delete em public.users (preserva histórico de avaliações)
    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // 2. Banir no Supabase Auth para impedir login (não deleta o registro)
    await supabaseAdmin.auth.admin.updateUserById(id, {
      ban_duration: '876600h', // ~100 anos = efetivamente permanente
    });

    return res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    next(error);
  }
});

export default router;
