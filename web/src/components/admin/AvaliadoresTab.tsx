// web/src/components/admin/AvaliadoresTab.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../api/client';
import { Loader2, Trash2, AlertCircle } from 'lucide-react';

interface Usuario { id: string; nome: string; email: string; role: string; }
interface Turma { id: string; nome: string; temaLivro: string; }
interface Alocacao {
  id: string;
  avaliadorId: string;
  turmaId: string;
  avaliador?: { nome: string; email: string };
  turma?: { nome: string };
}

export const AvaliadoresTab: React.FC = () => {
  const [avaliadores, setAvaliadores] = useState<Usuario[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [alocacoes, setAlocacoes] = useState<Alocacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({ avaliadorId: '', turmaId: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [usuariosData, meData, alocacoesData] = await Promise.all([
        apiClient('/api/usuarios'),
        apiClient('/api/me'),
        apiClient('/api/alocacoes'),
      ]);
      setAvaliadores((usuariosData as Usuario[]).filter(u => u.role === 'AVALIADOR'));
      setTurmas(meData.turmas || []);
      setAlocacoes(alocacoesData || []);
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
      await apiClient('/api/alocacoes', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setForm({ avaliadorId: '', turmaId: '' });
      fetchData();
    } catch (e: any) {
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm('Remover esta alocação?')) return;
    try {
      await apiClient(`/api/alocacoes/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Resolve nomes para exibição na tabela
  const resolveNome = (id: string, lista: { id: string; nome: string }[]) =>
    lista.find(i => i.id === id)?.nome ?? id;

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

      {/* Formulário de nova alocação */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Nova Alocação</h3>
        <p className="text-sm text-gray-500 mb-4">
          Vincule um avaliador a uma turma para que ele possa acessar o formulário de avaliação.
        </p>
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 sm:gap-x-4 bg-white p-6 shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Avaliador</label>
            <select
              required
              value={form.avaliadorId}
              onChange={e => setForm(f => ({ ...f, avaliadorId: e.target.value }))}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Selecione um avaliador...</option>
              {avaliadores.map(a => (
                <option key={a.id} value={a.id}>{a.nome} — {a.email}</option>
              ))}
            </select>
            {avaliadores.length === 0 && (
              <p className="mt-1 text-xs text-amber-600">
                Nenhum avaliador cadastrado. Crie um na aba "Usuários".
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Turma</label>
            <select
              required
              value={form.turmaId}
              onChange={e => setForm(f => ({ ...f, turmaId: e.target.value }))}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Selecione uma turma...</option>
              {turmas.map(t => (
                <option key={t.id} value={t.id}>{t.nome} — {t.temaLivro}</option>
              ))}
            </select>
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
              Confirmar Alocação
            </button>
          </div>
        </form>
      </div>

      {/* Tabela de alocações existentes */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Alocações Ativas</h3>
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3.5 pl-4 pr-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Avaliador</th>
                <th className="py-3.5 px-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Turma</th>
                <th className="py-3.5 px-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {alocacoes.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-10 text-center text-sm text-gray-400">
                    Nenhuma alocação cadastrada.
                  </td>
                </tr>
              ) : (
                alocacoes.map(al => (
                  <tr key={al.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                      {al.avaliador?.nome ?? resolveNome(al.avaliadorId, avaliadores)}
                    </td>
                    <td className="whitespace-nowrap py-4 px-3 text-sm text-gray-500">
                      {al.turma?.nome ?? resolveNome(al.turmaId, turmas)}
                    </td>
                    <td className="whitespace-nowrap py-4 px-3 text-right">
                      <button
                        onClick={() => handleRemove(al.id)}
                        className="rounded p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Remover alocação"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
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
