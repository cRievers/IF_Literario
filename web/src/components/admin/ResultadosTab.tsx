import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import * as XLSX from 'xlsx';

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
  const [campea, setCampea] = useState<CampeaItem[]>([]);
  const [consolidado, setConsolidado] = useState<ConsolidadoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchResultados();
  }, []);

  const fetchResultados = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dataCampea, dataConsol] = await Promise.all([
        apiClient('/api/resultados/campea'),
        apiClient('/api/resultados/consolidado'),
      ]);
      setCampea(dataCampea);
      setConsolidado(dataConsol);
    } catch (err: any) {
      console.error('Erro ao buscar resultados', err);
      setError(err.message || 'Erro ao carregar resultados');
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      consolidado.map((item, index) => ({
        Ranking: index + 1,
        Turma: item.nome,
        'Tema/Livro': item.temaLivro,
        Orientador: item.orientadorNome,
        'Media Avaliadores (bruta)': item.notaAvaliadoresBruta?.toFixed(2),
        'Nota Orientador (bruta)': item.hasNotaOrientador ? item.notaOrientadorBruta?.toFixed(2) : '-',
        'Nota Final (0-100%)': item.notaFinal?.toFixed(2) + '%',
        Status: item.status,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Resultados Consolidados');
    XLSX.writeFile(wb, 'resultados_if_literario.xlsx');
  };

  if (loading) return <div className="py-8 text-center text-gray-500">Carregando resultados...</div>;

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 text-red-700">
        <p className="font-bold">Erro ao carregar resultados</p>
        <p>{error}</p>
        <button onClick={fetchResultados} className="mt-2 rounded bg-red-600 px-4 py-1 text-white hover:bg-red-700">
          Tentar Novamente
        </button>
      </div>
    );
  }

  const campeaTurma = campea[0];

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Turma Campea (Avaliadores Visitantes)</h3>
        {campeaTurma ? (
          <div className="mb-6 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 p-6 text-white shadow-lg">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <span className="inline-block rounded-full bg-yellow-200 px-3 py-1 text-xs font-bold text-yellow-900 mb-2">
                  1 Colocado - Campea Geral
                </span>
                <h4 className="text-3xl font-extrabold">{campeaTurma.nome}</h4>
                <p className="text-lg opacity-90">Tema / Livro: {campeaTurma.temaLivro}</p>
                <p className="text-sm mt-1 opacity-80">Edicao: {campeaTurma.edicaoAno}</p>
              </div>
              <div className="text-center md:text-right">
                <div className="text-4xl font-black">
                  {campeaTurma.mediaNota} <span className="text-lg font-normal">/ {campeaTurma.maxNota} pts</span>
                </div>
                <p className="text-sm opacity-90">{campeaTurma.percentual}% de aproveitamento</p>
                <div className="mt-2">
                  <span className={`inline-block rounded px-2 py-1 text-xs font-bold ${campeaTurma.status === 'CONCLUIDO' ? 'bg-green-600 text-white' : 'bg-amber-100 text-amber-900'}`}>
                    {campeaTurma.status === 'CONCLUIDO' ? 'Concluido (3+ avaliacoes)' : `Pendente (${campeaTurma.totalAvaliacoes}/3 avaliacoes)`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">Nenhuma turma com avaliacoes ativas encontrada.</p>
        )}
        <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300 bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Posicao</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Turma</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Tema/Livro</th>
                <th className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">Avaliacoes</th>
                <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Media (pts)</th>
                <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Aproveitamento</th>
                <th className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {campea.map((t, idx) => (
                <tr key={t.id} className={idx === 0 ? 'bg-yellow-50' : ''}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">{idx + 1}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm font-semibold text-gray-900">{t.nome}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{t.temaLivro}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-center text-gray-500">{t.totalAvaliacoes}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-right font-medium text-gray-900">{t.mediaNota} / {t.maxNota}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-right text-gray-500">{t.percentual}%</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-center">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${t.status === 'CONCLUIDO' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                      {t.status === 'CONCLUIDO' ? 'Concluido' : 'Pendente'}
                    </span>
                  </td>
                </tr>
              ))}
              {campea.length === 0 && (
                <tr><td colSpan={7} className="py-6 text-center text-sm text-gray-500">Nenhum resultado ainda.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Resultado Consolidado (0 a 100%)</h3>
          <div className="flex gap-2">
            <button onClick={fetchResultados} className="rounded bg-gray-100 px-3 py-1 text-sm text-gray-700 hover:bg-gray-200">
              Atualizar
            </button>
            <button onClick={exportToExcel} className="inline-flex items-center rounded bg-green-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-green-700">
              Exportar XLSX
            </button>
          </div>
        </div>
        <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300 bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Turma / Livro</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Orientador</th>
                <th className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">Media Visitantes</th>
                <th className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">Nota Orientador</th>
                <th className="px-3 py-3.5 text-right text-sm font-bold text-gray-900">Nota Final (0-100%)</th>
                <th className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {consolidado.map((t) => (
                <tr key={t.id}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm">
                    <div className="font-semibold text-gray-900">{t.nome}</div>
                    <div className="text-gray-500">{t.temaLivro}</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{t.orientadorNome}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-center">
                    <div className="font-medium text-gray-900">{t.notaAvaliadoresBruta} / {t.maxAvaliadoresBruta}</div>
                    <div className="text-xs text-gray-500">{t.avaliacoesVisitantesCount} avaliacao(oes)</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-center">
                    <div className="font-medium text-gray-900">
                      {t.hasNotaOrientador ? `${t.notaOrientadorBruta} / ${t.maxOrientadorBruta}` : '-'}
                    </div>
                    <div className="text-xs text-gray-500">{t.hasNotaOrientador ? 'Enviada' : 'Pendente'}</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-right font-bold text-indigo-600 text-lg">
                    {t.notaFinal}%
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-center">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${t.status === 'CONCLUIDO' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                      {t.status === 'CONCLUIDO' ? 'Concluido' : 'Pendente'}
                    </span>
                  </td>
                </tr>
              ))}
              {consolidado.length === 0 && (
                <tr><td colSpan={6} className="py-6 text-center text-sm text-gray-500">Nenhum resultado ainda.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
