import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export const OcorrenciasTab: React.FC = () => {
  const [ocorrencias, setOcorrencias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOcorrencias = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      // O endpoint GET /api/ocorrencias precisaria existir e retornar todas se for ADMIN.
      // Assumindo que a rota base suporte listagem.
      const res = await fetch('http://localhost:3333/api/ocorrencias', {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOcorrencias(data);
      } else {
        setOcorrencias([]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOcorrencias();
  }, []);

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Ocorrências Registradas</h3>
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Data</th>
                <th className="py-3.5 px-3 text-left text-sm font-semibold text-gray-900">Orientador (ID)</th>
                <th className="py-3.5 px-3 text-left text-sm font-semibold text-gray-900">Turma (ID)</th>
                <th className="py-3.5 px-3 text-left text-sm font-semibold text-gray-900">Descrição</th>
                <th className="py-3.5 px-3 text-left text-sm font-semibold text-gray-900">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {ocorrencias.map(o => (
                <tr key={o.id}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-500">
                    {new Date(o.dataRegistro).toLocaleString('pt-BR')}
                  </td>
                  <td className="whitespace-nowrap py-4 px-3 text-sm text-gray-500">{o.orientadorId}</td>
                  <td className="whitespace-nowrap py-4 px-3 text-sm text-gray-500">{o.turmaId || 'Geral'}</td>
                  <td className="py-4 px-3 text-sm text-gray-900">{o.descricao}</td>
                  <td className="whitespace-nowrap py-4 px-3 text-sm">
                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${o.resolvida ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {o.resolvida ? 'Resolvida' : 'Pendente'}
                    </span>
                  </td>
                </tr>
              ))}
              {ocorrencias.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-sm text-gray-500">Nenhuma ocorrência encontrada.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
