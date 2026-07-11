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

  useEffect(() => {
    fetchResultados();
  }, []);

  if (loading) {
    return <div className="py-8 text-center text-gray-500">Carregando resultados...</div>;
  }

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

  const campea = campeaList[0];

  return (
    <div className="space-y-8">
      {/* SEÇÃO 1: TURMA CAMPEÃ (Avaliadores Visitantes) */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">🏆 Apuração: Turma Campeã (Avaliadores Visitantes)</h2>
        {campea ? (
          <div className="mb-6 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 p-6 text-white shadow-lg">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <span className="inline-block rounded-full bg-yellow-200 px-3 py-1 text-xs font-bold text-yellow-900 mb-2">
                  1º Colocado - Campeã Geral
                </span>
                <h3 className="text-3xl font-extrabold">{campea.nome}</h3>
                <p className="text-lg opacity-90">Tema / Livro: {campea.temaLivro}</p>
                <p className="text-sm mt-1 opacity-80">Edição: {campea.edicaoAno}</p>
              </div>
              <div className="text-center md:text-right">
                <div className="text-4xl font-black">{campea.mediaNota} <span className="text-lg font-normal">/ {campea.maxNota} pts</span></div>
                <p className="text-sm opacity-90">{campea.percentual}% de aproveitamento</p>
                <div className="mt-2">
                  <span className={`inline-block rounded px-2 py-1 text-xs font-bold ${campea.status === 'CONCLUIDO' ? 'bg-green-600 text-white' : 'bg-amber-100 text-amber-900'}`}>
                    {campea.status === 'CONCLUIDO' ? 'Concluído (3+ avaliações)' : `⚠️ Aviso: ${campea.totalAvaliacoes}/3 avaliações mínimas`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">Nenhuma turma com avaliações ativas encontrada.</p>
        )}

        {/* Demais colocações da Campeã */}
        {campeaList.length > 1 && (
          <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300 bg-white">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Posição</th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Turma</th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Tema/Livro</th>
                  <th className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">Avaliações</th>
                  <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Média (Pontos)</th>
                  <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Aproveitamento</th>
                  <th className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {campeaList.slice(1).map((t, index) => (
                  <tr key={t.id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">{index + 2}º</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm font-semibold text-gray-900">{t.nome}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{t.temaLivro}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-center text-gray-500">{t.totalAvaliacoes}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-right font-medium text-gray-900">{t.mediaNota} / {t.maxNota}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-right text-gray-500">{t.percentual}%</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-center">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${t.status === 'CONCLUIDO' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                        {t.status === 'CONCLUIDO' ? 'Concluído' : `⚠️ ${t.totalAvaliacoes}/3`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SEÇÃO 2: RESULTADO CONSOLIDADO (Regra Escolar 0 a 100%) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">📊 Resultado Consolidado (Regra Escolar 0 a 100%)</h2>
          <button onClick={fetchResultados} className="rounded bg-gray-100 px-3 py-1 text-sm text-gray-700 hover:bg-gray-200">
            🔄 Atualizar
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Cruzamento das notas dos avaliadores visitantes e da avaliação do orientador da turma, convertidos na escala padronizada de 0 a 100%.
        </p>

        <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300 bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Turma / Livro</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Orientador</th>
                <th className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">Média Visitantes</th>
                <th className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">Nota Orientador</th>
                <th className="px-3 py-3.5 text-right text-sm font-bold text-gray-900">Nota Final (0-100%)</th>
                <th className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">Status Apuração</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {consolidadoList.map((t) => (
                <tr key={t.id}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm">
                    <div className="font-semibold text-gray-900">{t.nome}</div>
                    <div className="text-gray-500">{t.temaLivro}</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{t.orientadorNome}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-center">
                    <div className="font-medium text-gray-900">{t.notaAvaliadoresBruta} / {t.maxAvaliadoresBruta}</div>
                    <div className="text-xs text-gray-500">{t.avaliacoesVisitantesCount} avaliações</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-center">
                    <div className="font-medium text-gray-900">{t.hasNotaOrientador ? `${t.notaOrientadorBruta} / ${t.maxOrientadorBruta}` : '—'}</div>
                    <div className="text-xs text-gray-500">{t.hasNotaOrientador ? 'Enviada' : 'Pendente'}</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-right font-bold text-indigo-600 text-lg">
                    {t.notaFinal}%
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-center">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${t.status === 'CONCLUIDO' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                      {t.status === 'CONCLUIDO' ? 'Concluído' : `⚠️ ${t.avaliacoesVisitantesCount}/3 avaliações`}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
