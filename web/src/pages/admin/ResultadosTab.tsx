// web/src/pages/admin/ResultadosTab.tsx
import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';

interface CampeaItem {
  id: string;
  nome: string;
  temaLivro: string;
  edicaoAno: number;
  totalAvaliacoes: number;
  mediaNota: number;
  maxNota: number;
  percentual: number;
  status: string;
}

interface ConsolidadoItem {
  id: string;
  nome: string;
  temaLivro: string;
  edicaoAno: number;
  orientadorNome: string;
  avaliacoesVisitantesCount: number;
  hasNotaOrientador: boolean;
  notaAvaliadoresBruta: number;
  maxAvaliadoresBruta: number;
  notaOrientadorBruta: number;
  maxOrientadorBruta: number;
  notaFinal: number;
  status: string;
}

// Agrupa array por chave string
function groupBy<T>(arr: T[], key: (item: T) => string): Record<string, T[]> {
  return arr.reduce<Record<string, T[]>>((acc, item) => {
    const k = key(item);
    (acc[k] ??= []).push(item);
    return acc;
  }, {});
}

export const ResultadosTab: React.FC = () => {
  const [campeaList, setCampeaList] = useState<CampeaItem[]>([]);
  const [consolidadoList, setConsolidadoList] = useState<ConsolidadoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResultados = async () => {
    setLoading(true);
    setError(null);
    try {
      const [campeaData, consolidadoData] = await Promise.all([
        apiClient('/api/resultados/campea'),
        apiClient('/api/resultados/consolidado'),
      ]);
      setCampeaList(campeaData);
      setConsolidadoList(consolidadoData);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar resultados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchResultados(); }, []);

  if (loading) return <div className="py-8 text-center text-gray-500">Carregando resultados...</div>;

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 text-red-700">
        <p className="font-bold">Erro</p>
        <p>{error}</p>
        <button onClick={fetchResultados} className="mt-2 rounded bg-red-600 px-4 py-1 text-white hover:bg-red-700">
          Tentar Novamente
        </button>
      </div>
    );
  }

  // Agrupamento por livro — feito no frontend, sem mudança de API
  const campeaPorLivro = groupBy(campeaList, (t) => t.temaLivro);
  const consolidadoPorLivro = groupBy(consolidadoList, (t) => t.temaLivro);

  return (
    <div className="space-y-10">
      {/* SEÇÃO 1: PLACAR POR LIVRO — Avaliadores Visitantes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">🏆 Placar por Livro — Avaliadores Visitantes</h2>
          <button onClick={fetchResultados} className="rounded bg-gray-100 px-3 py-1 text-sm text-gray-700 hover:bg-gray-200">
            🔄 Atualizar
          </button>
        </div>

        {Object.keys(campeaPorLivro).length === 0 && (
          <p className="text-gray-500">Nenhuma turma com avaliações encontrada.</p>
        )}

        <div className="space-y-6">
          {Object.entries(campeaPorLivro).map(([livro, turmas]) => {
            // Ordena: maior percentual primeiro
            const sorted = [...turmas].sort((a, b) => b.percentual - a.percentual);
            const campeaDoLivro = sorted[0];

            return (
              <div key={livro} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                {/* Cabeçalho do livro */}
                <div className="bg-indigo-50 border-b border-indigo-100 px-4 py-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-indigo-400">Livro</p>
                  <h3 className="text-base font-bold text-indigo-900">{livro}</h3>
                </div>

                <div className="p-4">
                  {/* Destaque campeã do livro */}
                  <div className="mb-3 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 p-4 text-white shadow">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                      <div>
                        <span className="inline-block rounded-full bg-yellow-200 px-2 py-0.5 text-xs font-bold text-yellow-900 mb-1">
                          🥇 1ª Colocada
                        </span>
                        <h4 className="text-xl font-extrabold">{campeaDoLivro.nome}</h4>
                      </div>
                      <div className="text-center md:text-right">
                        <div className="text-3xl font-black">
                          {campeaDoLivro.mediaNota}{' '}
                          <span className="text-base font-normal">/ {campeaDoLivro.maxNota} pts</span>
                        </div>
                        <p className="text-xs opacity-90">{campeaDoLivro.percentual}% de aproveitamento</p>
                        <span className={`mt-1 inline-block rounded px-2 py-0.5 text-xs font-bold ${
                          campeaDoLivro.status === 'CONCLUIDO' ? 'bg-green-600 text-white' : 'bg-amber-100 text-amber-900'
                        }`}>
                          {campeaDoLivro.status === 'CONCLUIDO' ? 'Concluído (3+ avaliações)' : `Pendente (${campeaDoLivro.totalAvaliacoes}/3 avaliações)`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Demais turmas do livro */}
                  {sorted.length > 1 && (
                    <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
                      <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="py-2 pl-3 text-left font-semibold text-gray-700">Pos.</th>
                            <th className="py-2 px-3 text-left font-semibold text-gray-700">Turma</th>
                            <th className="py-2 px-3 text-center font-semibold text-gray-700">Avaliações</th>
                            <th className="py-2 px-3 text-right font-semibold text-gray-700">Média (pts)</th>
                            <th className="py-2 px-3 text-right font-semibold text-gray-700">Aproveit.</th>
                            <th className="py-2 px-3 text-center font-semibold text-gray-700">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                          {sorted.slice(1).map((t, idx) => (
                            <tr key={t.id}>
                              <td className="py-3 pl-3 text-gray-500">{idx + 2}º</td>
                              <td className="py-3 px-3 font-medium text-gray-900 whitespace-nowrap">{t.nome}</td>
                              <td className="py-3 px-3 text-center text-gray-500 whitespace-nowrap">{t.totalAvaliacoes}</td>
                              <td className="py-3 px-3 text-right text-gray-900 whitespace-nowrap">{t.mediaNota} / {t.maxNota}</td>
                              <td className="py-3 px-3 text-right text-gray-500 whitespace-nowrap">{t.percentual}%</td>
                              <td className="py-3 px-3 text-center whitespace-nowrap">
                                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                                  t.status === 'CONCLUIDO' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {t.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SEÇÃO 2: RESULTADO CONSOLIDADO por livro */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">📊 Resultado Consolidado por Livro (Regra Escolar 0–100%)</h2>
        <p className="text-sm text-gray-600 mb-4">
          Cruzamento das notas dos avaliadores visitantes e da avaliação do orientador, convertidos na escala de 0 a 100%.
        </p>

        {Object.keys(consolidadoPorLivro).length === 0 && (
          <p className="text-gray-500">Nenhum resultado consolidado disponível.</p>
        )}

        <div className="space-y-6">
          {Object.entries(consolidadoPorLivro).map(([livro, turmas]) => {
            const sorted = [...turmas].sort((a, b) => b.notaFinal - a.notaFinal);

            return (
              <div key={livro} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-indigo-50 border-b border-indigo-100 px-4 py-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-indigo-400">Livro</p>
                  <h3 className="text-base font-bold text-indigo-900">{livro}</h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm bg-white">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="py-3 pl-4 pr-3 text-left font-semibold text-gray-700">Turma</th>
                        <th className="py-3 px-3 text-left font-semibold text-gray-700">Orientador</th>
                        <th className="py-3 px-3 text-center font-semibold text-gray-700">Média Visitantes</th>
                        <th className="py-3 px-3 text-center font-semibold text-gray-700">Nota Orientador</th>
                        <th className="py-3 px-3 text-right font-bold text-gray-700">Nota Final (0-100%)</th>
                        <th className="py-3 px-3 text-center font-semibold text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {sorted.map((t) => (
                        <tr key={t.id}>
                          <td className="py-3 pl-4 pr-3 font-semibold text-gray-900">{t.nome}</td>
                          <td className="py-3 px-3 text-gray-500">{t.orientadorNome}</td>
                          <td className="py-3 px-3 text-center">
                            <div className="font-medium text-gray-900">{t.notaAvaliadoresBruta} / {t.maxAvaliadoresBruta}</div>
                            <div className="text-xs text-gray-500">{t.avaliacoesVisitantesCount} avaliações</div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="font-medium text-gray-900">
                              {t.hasNotaOrientador ? `${t.notaOrientadorBruta} / ${t.maxOrientadorBruta}` : '—'}
                            </div>
                            <div className="text-xs text-gray-500">{t.hasNotaOrientador ? 'Enviada' : 'Pendente'}</div>
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-indigo-600 text-lg">{t.notaFinal}%</td>
                          <td className="py-3 px-3 text-center">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                              t.status === 'CONCLUIDO' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {t.status === 'CONCLUIDO' ? 'Concluído' : 'Pendente'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
