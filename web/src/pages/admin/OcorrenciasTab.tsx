import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';

interface Ocorrencia {
  id: string;
  descricao: string;
  dataRegistro: string;
  resolvida: boolean;
  orientador: { id: string; nome: string; email: string };
  turma?: { id: string; nome: string; temaLivro: string } | null;
}

export const OcorrenciasTab: React.FC = () => {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOcorrencias = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient('/api/ocorrencias');
      setOcorrencias(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar ocorrências');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOcorrencias();
  }, []);

  const handleResolver = async (id: string) => {
    try {
      await apiClient(`/api/ocorrencias/${id}/resolver`, {
        method: 'PUT',
      });
      fetchOcorrencias();
    } catch (err: any) {
      alert(`Erro ao marcar ocorrência como resolvida: ${err.message}`);
    }
  };

  if (loading) {
    return <div className="py-8 text-center text-gray-500">Carregando ocorrências...</div>;
  }

  if (error) {
    return <div className="rounded bg-red-50 p-4 text-red-700">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">⚠️ Canal de Ocorrências</h2>
          <p className="text-sm text-gray-600 mt-1">
            Relatos de problemas de infraestrutura ou conduta enviados pelos orientadores durante o evento.
          </p>
        </div>
        <button onClick={fetchOcorrencias} className="rounded bg-gray-100 px-3 py-1 text-sm text-gray-700 hover:bg-gray-200">
          🔄 Atualizar
        </button>
      </div>

      <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300 bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Orientador</th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Turma Relacionada</th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Descrição da Ocorrência</th>
              <th className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">Data / Hora</th>
              <th className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">Status</th>
              <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {ocorrencias.map((oc) => (
              <tr key={oc.id} className={oc.resolvida ? 'bg-gray-50' : 'bg-white'}>
                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm">
                  <div className="font-semibold text-gray-900">{oc.orientador.nome}</div>
                  <div className="text-gray-500">{oc.orientador.email}</div>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600">
                  {oc.turma ? `${oc.turma.nome} (${oc.turma.temaLivro})` : 'Geral (Sem turma)'}
                </td>
                <td className="px-3 py-4 text-sm text-gray-700 max-w-xs whitespace-normal">
                  {oc.descricao}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-center text-gray-500">
                  {new Date(oc.dataRegistro).toLocaleString('pt-BR')}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-center">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${oc.resolvida ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {oc.resolvida ? 'Resolvida' : 'Pendente'}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-right">
                  {!oc.resolvida && (
                    <button
                      onClick={() => handleResolver(oc.id)}
                      className="rounded bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700 shadow"
                    >
                      Resolver
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {ocorrencias.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-500 text-sm">
                  Nenhuma ocorrência registrada no sistema.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
