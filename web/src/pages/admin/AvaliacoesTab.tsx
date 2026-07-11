// web/src/pages/admin/AvaliacoesTab.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';

interface Avaliacao {
  id: string;
  comentario: string | null;
  templateId: number;
  turmaId: string;
  finalizada: boolean;
  turma: {
    nome: string;
    temaLivro: string;
    edicao: {
      ano: number;
      ativo: boolean;
    };
  };
  avaliador: {
    id: string;
    nome: string;
    email: string;
    role: 'ADMIN' | 'AVALIADOR' | 'ORIENTADOR';
  };
}

export const AvaliacoesTab: React.FC = () => {
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const fetchAvaliacoes = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient('/api/avaliacoes');
      setAvaliacoes(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar avaliações');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvaliacoes();
  }, []);

  const handleExcluir = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta avaliação permanentemente? Esta ação é irreversível.')) {
      return;
    }
    try {
      await apiClient(`/api/avaliacoes/${id}`, {
        method: 'DELETE',
      });
      fetchAvaliacoes();
    } catch (err: any) {
      alert(`Erro ao excluir avaliação: ${err.message}`);
    }
  };

  const handleVer = (av: Avaliacao) => {
    navigate(`/avaliar/${av.turmaId}`, {
      state: {
        templateId: av.templateId,
        avaliacaoId: av.id,
        readOnly: true
      }
    });
  };

  const filteredAvaliacoes = avaliacoes.filter((av) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      av.avaliador.nome.toLowerCase().includes(searchLower) ||
      av.avaliador.email.toLowerCase().includes(searchLower) ||
      av.turma.nome.toLowerCase().includes(searchLower) ||
      (av.turma.temaLivro && av.turma.temaLivro.toLowerCase().includes(searchLower))
    );
  });

  if (loading) {
    return <div className="py-8 text-center text-gray-500">Carregando avaliações...</div>;
  }

  if (error) {
    return <div className="rounded bg-red-50 p-4 text-red-700">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">📝 Gerenciamento de Avaliações</h2>
          <p className="text-sm text-gray-600 mt-1">
            Visualize e remova avaliações de avaliadores e orientadores.
          </p>
        </div>
        <button
          onClick={fetchAvaliacoes}
          className="rounded bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200 transition-colors self-start sm:self-auto"
        >
          🔄 Atualizar
        </button>
      </div>

      {/* Barra de pesquisa */}
      <div className="flex max-w-md">
        <input
          type="text"
          placeholder="Buscar por avaliador ou turma..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
        />
      </div>

      <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300 bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Avaliador</th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Turma / Livro</th>
              <th className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">Edição</th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Comentário Geral</th>
              <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredAvaliacoes.map((av) => (
              <tr key={av.id} className="hover:bg-gray-50 transition-colors">
                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm">
                  <div className="font-semibold text-gray-900 flex items-center gap-2">
                    {av.avaliador.nome}
                    <span
                      className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${
                        av.avaliador.role === 'ORIENTADOR'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {av.avaliador.role === 'ORIENTADOR' ? 'Orientador' : 'Avaliador'}
                    </span>
                  </div>
                  <div className="text-gray-500 text-xs">{av.avaliador.email}</div>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm">
                  <div className="font-semibold text-gray-900">{av.turma.nome}</div>
                  <div className="text-gray-500 text-xs">{av.turma.temaLivro}</div>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-center font-medium text-gray-700">
                  {av.turma.edicao.ano}
                </td>
                <td className="px-3 py-4 text-sm text-gray-600 max-w-xs truncate">
                  {av.comentario || <span className="italic text-gray-400">Nenhum</span>}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-right font-medium">
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => handleVer(av)}
                      className="text-indigo-600 hover:text-indigo-900 font-semibold"
                    >
                      Ver
                    </button>
                    <button
                      onClick={() => handleExcluir(av.id)}
                      className="text-red-600 hover:text-red-900 font-semibold"
                    >
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredAvaliacoes.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-500 text-sm">
                  Nenhuma avaliação encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
