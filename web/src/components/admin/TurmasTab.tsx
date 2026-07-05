// web/src/components/admin/TurmasTab.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../api/client';
import { Loader2, AlertCircle } from 'lucide-react';

interface Turma { id: string; nome: string; temaLivro: string; }
interface Orientador { id: string; nome: string; email: string; }

export const TurmasTab: React.FC = () => {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [orientadores, setOrientadores] = useState<Orientador[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    nome: '',
    temaLivro: '',
    edicaoId: '1',
    templateId: '1',
    orientadorId: '',
  });

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [meData, usuariosData] = await Promise.all([
        apiClient('/api/me'),
        apiClient('/api/usuarios'),
      ]);
      setTurmas(meData.turmas || []);
      setOrientadores((usuariosData as any[]).filter(u => u.role === 'ORIENTADOR'));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      await apiClient('/api/turmas', {
        method: 'POST',
        body: JSON.stringify({
          nome: form.nome,
          temaLivro: form.temaLivro,
          edicaoId: Number(form.edicaoId),
          templateId: Number(form.templateId),
          orientadorId: form.orientadorId || null,
        }),
      });
      setForm({ nome: '', temaLivro: '', edicaoId: '1', templateId: '1', orientadorId: '' });
      fetchData();
    } catch (e: any) {
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-12">
      <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
    </div>
  );

  return (
    <div className="space-y-8">
      {error && (
        <div className="flex items-center gap-2 rounded-md bg-red-50 p-4 text-red-700 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* Formulário */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Nova Turma</h3>
        <p className="text-sm text-gray-500 mb-4">
          Crie uma turma e vincule um orientador responsável (opcional).
        </p>
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 sm:gap-x-4 bg-white p-6 shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome da turma</label>
            <input
              type="text"
              required
              value={form.nome}
              onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
              placeholder="Ex: 1º Ano Informática"
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tema / Livro</label>
            <input
              type="text"
              required
              value={form.temaLivro}
              onChange={e => setForm(f => ({ ...f, temaLivro: e.target.value }))}
              placeholder="Ex: A Odisseia"
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Orientador (opcional)</label>
            <select
              value={form.orientadorId}
              onChange={e => setForm(f => ({ ...f, orientadorId: e.target.value }))}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Sem orientador definido</option>
              {orientadores.map(o => (
                <option key={o.id} value={o.id}>{o.nome} — {o.email}</option>
              ))}
            </select>
            {orientadores.length === 0 && (
              <p className="mt-1 text-xs text-amber-600">
                Nenhum orientador cadastrado. Crie um na aba "Usuários".
              </p>
            )}
          </div>

          {formError && (
            <div className="sm:col-span-2 flex items-center gap-2 rounded-md bg-red-50 p-3 text-red-700 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" /> {formError}
            </div>
          )}

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Criar Turma
            </button>
          </div>
        </form>
      </div>

      {/* Listagem */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Turmas Cadastradas</h3>
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3.5 pl-4 pr-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Nome</th>
                <th className="py-3.5 px-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Livro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {turmas.length === 0 ? (
                <tr>
                  <td colSpan={2} className="py-10 text-center text-sm text-gray-400">
                    Nenhuma turma cadastrada.
                  </td>
                </tr>
              ) : (
                turmas.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">{t.nome}</td>
                    <td className="whitespace-nowrap py-4 px-3 text-sm text-gray-500">{t.temaLivro}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
