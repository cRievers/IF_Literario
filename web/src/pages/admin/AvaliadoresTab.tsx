import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';

interface Alocacao {
  id: string;
  avaliadorId: string;
  turmaId: string;
  avaliador: { id: string; nome: string; email: string };
  turma: { id: string; nome: string; temaLivro: string; edicao: { ano: number; ativo: boolean } };
}

interface Avaliador {
  id: string;
  nome: string;
  email: string;
  alocacoes: { turma: { id: string; nome: string; temaLivro: string } }[];
}

interface TurmaItem {
  id: string;
  nome: string;
  temaLivro: string;
  edicao: { ano: number; ativo: boolean };
}

export const AvaliadoresTab: React.FC = () => {
  const [alocacoes, setAlocacoes] = useState<Alocacao[]>([]);
  const [avaliadores, setAvaliadores] = useState<Avaliador[]>([]);
  const [turmas, setTurmas] = useState<TurmaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estado do modal de nova alocação
  const [showModal, setShowModal] = useState(false);
  const [formAvaliadorId, setFormAvaliadorId] = useState('');
  const [formTurmaId, setFormTurmaId] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [alocacoesData, avaliadoresData, turmasData] = await Promise.all([
        apiClient('/api/alocacoes'),
        apiClient('/api/usuarios?role=AVALIADOR'),
        apiClient('/api/turmas'),
      ]);
      setAlocacoes(alocacoesData);
      setAvaliadores(avaliadoresData);
      // Filtra turmas apenas da edição ativa para facilitar a alocação
      setTurmas(turmasData.filter((t: any) => t.edicao.ativo));
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar avaliadores e alocações');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCriarAlocacao = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient('/api/alocacoes', {
        method: 'POST',
        body: JSON.stringify({ avaliadorId: formAvaliadorId, turmaId: formTurmaId }),
      });
      setShowModal(false);
      setFormAvaliadorId('');
      setFormTurmaId('');
      fetchData();
    } catch (err: any) {
      alert(`Erro ao criar alocação: ${err.message}`);
    }
  };

  const handleRemoverAlocacao = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja remover esta alocação?')) return;
    try {
      await apiClient(`/api/alocacoes/${id}`, {
        method: 'DELETE',
      });
      fetchData();
    } catch (err: any) {
      alert(`Erro ao remover alocação: ${err.message}`);
    }
  };

  if (loading) {
    return <div className="py-8 text-center text-gray-500">Carregando avaliadores e alocações...</div>;
  }

  if (error) {
    return <div className="rounded bg-red-50 p-4 text-red-700">{error}</div>;
  }

  return (
    <div className="space-y-10">
      {/* ALOCAÇÕES ATIVAS */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">🔗 Alocações Ativas (Avaliadores ↔ Turmas)</h2>
          <button
            onClick={() => {
              setFormAvaliadorId(avaliadores[0]?.id || '');
              setFormTurmaId(turmas[0]?.id || '');
              setShowModal(true);
            }}
            className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 shadow"
          >
            + Nova Alocação
          </button>
        </div>

        <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300 bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Avaliador Visitante</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Turma / Livro</th>
                <th className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">Edição</th>
                <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {alocacoes.map((al) => (
                <tr key={al.id}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm">
                    <div className="font-semibold text-gray-900">{al.avaliador.nome}</div>
                    <div className="text-gray-500">{al.avaliador.email}</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm">
                    <div className="font-semibold text-gray-900">{al.turma.nome}</div>
                    <div className="text-gray-500">{al.turma.temaLivro}</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-center font-medium text-gray-900">
                    {al.turma.edicao.ano}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-right">
                    <button
                      onClick={() => handleRemoverAlocacao(al.id)}
                      className="text-red-600 hover:text-red-900 font-medium"
                    >
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
              {alocacoes.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-500 text-sm">
                    Nenhuma alocação cadastrada no momento.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* AVALIADORES CADASTRADOS E CONTROLE DE REGRA 3x3 */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">👥 Quadro de Avaliadores</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {avaliadores.map((av) => {
            const count = av.alocacoes.length;
            return (
              <div key={av.id} className="rounded-lg border border-gray-200 p-5 bg-white shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{av.nome}</h3>
                  <p className="text-sm text-gray-500 mb-4">{av.email}</p>
                  <div className="mb-2">
                    <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Turmas Alocadas ({count}):</span>
                  </div>
                  {count > 0 ? (
                    <ul className="space-y-1 text-sm text-gray-600 mb-4">
                      {av.alocacoes.map((al, idx) => (
                        <li key={idx} className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-600"></span>
                          {al.turma.nome}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-400 italic mb-4">Nenhuma turma vinculada</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL NOVA ALOCAÇÃO */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Nova Alocação</h3>
            <form onSubmit={handleCriarAlocacao} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Avaliador Visitante</label>
                <select
                  required
                  value={formAvaliadorId}
                  onChange={(e) => setFormAvaliadorId(e.target.value)}
                  className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  {avaliadores.map(av => (
                    <option key={av.id} value={av.id}>{av.nome} ({av.alocacoes.length} alocadas)</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Turma (Edição Ativa)</label>
                <select
                  required
                  value={formTurmaId}
                  onChange={(e) => setFormTurmaId(e.target.value)}
                  className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  {turmas.map(t => (
                    <option key={t.id} value={t.id}>{t.nome} - {t.temaLivro}</option>
                  ))}
                </select>
              </div>
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
                  className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  Confirmar Alocação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
