// web/src/pages/admin/UsuariosTab.tsx
import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';

type Role = 'AVALIADOR' | 'ORIENTADOR';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  role: Role;
}

const ROLE_LABELS: Record<Role, string> = {
  AVALIADOR: 'Avaliador',
  ORIENTADOR: 'Orientador',
};

const ROLE_BADGE: Record<Role, string> = {
  AVALIADOR: 'bg-blue-100 text-blue-800',
  ORIENTADOR: 'bg-purple-100 text-purple-800',
};

const EMPTY_FORM = { nome: '', email: '', role: 'AVALIADOR' as Role };

export const UsuariosTab: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchUsuarios = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient('/api/usuarios');
      setUsuarios(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsuarios(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowModal(true);
  };

  const openEdit = (u: Usuario) => {
    setEditingId(u.id);
    setForm({ nome: u.nome, email: u.email, role: u.role });
    setFormError(null);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      if (editingId) {
        await apiClient(`/api/usuarios/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(form),
        });
      } else {
        await apiClient('/api/usuarios', {
          method: 'POST',
          body: JSON.stringify(form),
        });
      }
      setShowModal(false);
      fetchUsuarios();
    } catch (err: any) {
      setFormError(err.message || 'Erro ao salvar usuário');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (u: Usuario) => {
    if (!window.confirm(`Deseja remover "${u.nome}" (${u.email})?\n\nO acesso ao sistema será revogado.`)) return;
    try {
      await apiClient(`/api/usuarios/${u.id}`, { method: 'DELETE' });
      fetchUsuarios();
    } catch (err: any) {
      alert(`Erro ao remover usuário: ${err.message}`);
    }
  };

  const avaliadores = usuarios.filter(u => u.role === 'AVALIADOR');
  const orientadores = usuarios.filter(u => u.role === 'ORIENTADOR');

  if (loading) {
    return <div className="py-8 text-center text-gray-500">Carregando usuários...</div>;
  }

  if (error) {
    return <div className="rounded bg-red-50 p-4 text-red-700">{error}</div>;
  }

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">👤 Gerenciar Usuários</h2>
          <p className="text-sm text-gray-500 mt-1">
            Cadastre avaliadores e orientadores. Senha padrão:{' '}
            <code className="bg-gray-100 px-1 rounded text-xs font-mono">IFLiterario@2025</code>
          </p>
        </div>
        <button
          onClick={openCreate}
          className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 shadow"
        >
          + Novo Usuário
        </button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-center">
          <p className="text-3xl font-black text-blue-600">{avaliadores.length}</p>
          <p className="text-sm font-medium text-blue-700 mt-1">Avaliadores</p>
        </div>
        <div className="rounded-lg border border-purple-100 bg-purple-50 p-4 text-center">
          <p className="text-3xl font-black text-purple-600">{orientadores.length}</p>
          <p className="text-sm font-medium text-purple-700 mt-1">Orientadores</p>
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300 bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Nome</th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">E-mail</th>
              <th className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">Perfil</th>
              <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {usuarios.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-semibold text-gray-900">{u.nome}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{u.email}</td>
                <td className="whitespace-nowrap px-3 py-4 text-center">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${ROLE_BADGE[u.role]}`}>
                    {ROLE_LABELS[u.role]}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-right text-sm space-x-3">
                  <button
                    onClick={() => openEdit(u)}
                    className="text-indigo-600 hover:text-indigo-900 font-medium"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(u)}
                    className="text-red-600 hover:text-red-900 font-medium"
                  >
                    Remover
                  </button>
                </td>
              </tr>
            ))}
            {usuarios.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-gray-500 text-sm">
                  Nenhum usuário cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Criar / Editar */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {editingId ? 'Editar Usuário' : 'Novo Usuário'}
            </h3>
            {!editingId && (
              <p className="text-xs text-gray-500 mb-4">
                Senha padrão gerada automaticamente:{' '}
                <code className="font-mono bg-gray-100 px-1 rounded">IFLiterario@2025</code>
              </p>
            )}
            {editingId && <div className="mb-4" />}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
                <input
                  required
                  type="text"
                  value={form.nome}
                  onChange={(e) => setForm(f => ({ ...f, nome: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Ex.: Prof. João Silva"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="usuario@exemplo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Perfil</label>
                <select
                  required
                  value={form.role}
                  onChange={(e) => setForm(f => ({ ...f, role: e.target.value as Role }))}
                  className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="AVALIADOR">Avaliador</option>
                  <option value="ORIENTADOR">Orientador</option>
                </select>
              </div>

              {formError && (
                <div className="rounded bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                  {formError}
                </div>
              )}

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Cadastrar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
