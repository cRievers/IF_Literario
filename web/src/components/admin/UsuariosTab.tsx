// web/src/components/admin/UsuariosTab.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../api/client';
import { UserPlus, Pencil, Trash2, X, Loader2, AlertCircle } from 'lucide-react';

type Role = 'AVALIADOR' | 'ORIENTADOR';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  role: Role;
}

interface FormState {
  nome: string;
  email: string;
  role: Role;
}

const EMPTY_FORM: FormState = { nome: '', email: '', role: 'AVALIADOR' };

const ROLE_LABEL: Record<Role, string> = {
  AVALIADOR: 'Avaliador',
  ORIENTADOR: 'Orientador',
};

const ROLE_BADGE: Record<Role, string> = {
  AVALIADOR: 'bg-blue-100 text-blue-800',
  ORIENTADOR: 'bg-emerald-100 text-emerald-800',
};

export const UsuariosTab: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchUsuarios = useCallback(async () => {
    try {
      setError(null);
      const data = await apiClient('/api/usuarios');
      setUsuarios(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsuarios(); }, [fetchUsuarios]);

  const openCreate = () => {
    setEditingUser(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowModal(true);
  };

  const openEdit = (u: Usuario) => {
    setEditingUser(u);
    setForm({ nome: u.nome, email: u.email, role: u.role });
    setFormError(null);
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditingUser(null); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      if (editingUser) {
        await apiClient(`/api/usuarios/${editingUser.id}`, {
          method: 'PUT',
          body: JSON.stringify(form),
        });
      } else {
        await apiClient('/api/usuarios', {
          method: 'POST',
          body: JSON.stringify(form),
        });
      }
      closeModal();
      fetchUsuarios();
    } catch (e: any) {
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (u: Usuario) => {
    if (!confirm(`Desativar "${u.nome}"?\n\nO histórico de avaliações será preservado.`)) return;
    try {
      await apiClient(`/api/usuarios/${u.id}`, { method: 'DELETE' });
      fetchUsuarios();
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Avaliadores e Orientadores</h3>
          <p className="text-sm text-gray-500 mt-1">
            Usuários criados recebem a senha padrão e podem acessar o sistema imediatamente.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          Novo Usuário
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-md bg-red-50 p-4 text-red-700 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
        </div>
      ) : (
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3.5 pl-4 pr-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Nome</th>
                <th className="py-3.5 px-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">E-mail</th>
                <th className="py-3.5 px-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Papel</th>
                <th className="py-3.5 px-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {usuarios.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-sm text-gray-400">
                    Nenhum usuário cadastrado.
                  </td>
                </tr>
              ) : (
                usuarios.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">{u.nome}</td>
                    <td className="whitespace-nowrap py-4 px-3 text-sm text-gray-500">{u.email}</td>
                    <td className="whitespace-nowrap py-4 px-3 text-sm">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_BADGE[u.role]}`}>
                        {ROLE_LABEL[u.role]}
                      </span>
                    </td>
                    <td className="whitespace-nowrap py-4 px-3 text-sm text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(u)}
                          className="rounded p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(u)}
                          className="rounded p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Desativar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <button
              onClick={closeModal}
              className="absolute right-4 top-4 rounded p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-lg font-semibold text-gray-900 mb-5">
              {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
            </h2>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
                <input
                  type="text"
                  required
                  value={form.nome}
                  onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="Ex: Prof. João Silva"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="usuario@ifmg.edu.br"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Papel</label>
                <select
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value as Role }))}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="AVALIADOR">Avaliador (visitante externo)</option>
                  <option value="ORIENTADOR">Orientador (professor da turma)</option>
                </select>
              </div>

              {!editingUser && (
                <p className="text-xs text-gray-500 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                  🔑 Senha padrão será enviada ao usuário. Ele poderá alterá-la no primeiro acesso.
                </p>
              )}

              {formError && (
                <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-red-700 text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {formError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingUser ? 'Salvar alterações' : 'Criar usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
