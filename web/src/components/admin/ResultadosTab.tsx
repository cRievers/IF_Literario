import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import * as XLSX from 'xlsx';

export const ResultadosTab: React.FC = () => {
  const [campea, setCampea] = useState<any[]>([]);
  const [consolidado, setConsolidado] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResultados();
  }, []);

  const fetchResultados = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const [resCampea, resConsol] = await Promise.all([
        fetch('http://localhost:3333/api/resultados/campea', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('http://localhost:3333/api/resultados/consolidado', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const dataCampea = await resCampea.json();
      const dataConsol = await resConsol.json();

      setCampea(dataCampea);
      setConsolidado(dataConsol);
    } catch (error) {
      console.error('Erro ao buscar resultados', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      consolidado.map((item, index) => ({
        Ranking: index + 1,
        'Turma': item.nome,
        'Tema/Livro': item.temaLivro,
        'Média Avaliadores': item.mediaAvaliadores?.toFixed(2),
        'Nota Orientador': item.notaOrientador?.toFixed(2),
        'Nota Final (100%)': item.notaFinal?.toFixed(2)
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Resultados Consolidados');
    XLSX.writeFile(wb, 'resultados_ifl_literario.xlsx');
  };

  if (loading) return <div>Carregando resultados...</div>;

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Turma Campeã (Apenas Avaliadores)</h3>
        </div>
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Posição</th>
                <th className="py-3.5 px-3 text-left text-sm font-semibold text-gray-900">Turma</th>
                <th className="py-3.5 px-3 text-left text-sm font-semibold text-gray-900">Média (Avaliadores)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {campea.map((turma, idx) => (
                <tr key={turma.turmaId} className={idx === 0 ? "bg-yellow-50" : ""}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                    {idx + 1}º
                  </td>
                  <td className="whitespace-nowrap py-4 px-3 text-sm text-gray-500">
                    {turma.nome} - {turma.temaLivro}
                  </td>
                  <td className="whitespace-nowrap py-4 px-3 text-sm text-gray-500">
                    {turma.mediaAvaliadores.toFixed(2)}
                  </td>
                </tr>
              ))}
              {campea.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-4 text-center text-sm text-gray-500">Nenhum resultado ainda.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Resultado Consolidado</h3>
          <button
            onClick={exportToExcel}
            className="inline-flex items-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700"
          >
            Exportar XLSX
          </button>
        </div>
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Posição</th>
                <th className="py-3.5 px-3 text-left text-sm font-semibold text-gray-900">Turma</th>
                <th className="py-3.5 px-3 text-left text-sm font-semibold text-gray-900">Nota Final</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {consolidado.map((turma, idx) => (
                <tr key={turma.turmaId}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                    {idx + 1}º
                  </td>
                  <td className="whitespace-nowrap py-4 px-3 text-sm text-gray-500">
                    {turma.nome} - {turma.temaLivro}
                  </td>
                  <td className="whitespace-nowrap py-4 px-3 text-sm font-bold text-indigo-600">
                    {turma.notaFinal.toFixed(2)}
                  </td>
                </tr>
              ))}
              {consolidado.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-4 text-center text-sm text-gray-500">Nenhum resultado ainda.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
