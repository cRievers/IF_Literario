import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';

interface Ocorrencia {
  id: string;
  descricao: string;
  dataRegistro: string;
  resolvida: boolean;
  turma?: {
    id: string;
    nome: string;
  };
}

export const Ocorrencias: React.FC = () => {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOcorrencias = async () => {
      try {
        const data = await apiClient('/api/ocorrencias/minhas');
        setOcorrencias(data);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar ocorrências.');
      } finally {
        setLoading(false);
      }
    };

    fetchOcorrencias();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl rounded-lg bg-white p-6 shadow">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <button onClick={() => navigate('/')} className="text-sm text-gray-500 hover:text-gray-800 mb-2">
              &larr; Voltar
            </button>
            <h1 className="text-2xl font-bold">Minhas Ocorrências</h1>
          </div>
          <button
            onClick={() => navigate('/ocorrencias/nova')}
            className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
          >
            Nova Ocorrência
          </button>
        </div>

        {error && <div className="mb-4 rounded bg-red-50 p-4 text-red-700">{error}</div>}

        {loading ? (
          <p className="text-gray-500">Carregando...</p>
        ) : ocorrencias.length === 0 ? (
          <p className="text-gray-500">Nenhuma ocorrência registrada.</p>
        ) : (
          <div className="space-y-4">
            {ocorrencias.map(oc => (
              <div key={oc.id} className="rounded border p-4 shadow-sm">
                <div className="mb-2 flex justify-between">
                  <span className="font-semibold text-gray-700">
                    {new Date(oc.dataRegistro).toLocaleDateString('pt-BR')} às {new Date(oc.dataRegistro).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className={`rounded px-2 py-1 text-sm font-semibold ${oc.resolvida ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {oc.resolvida ? 'Resolvida' : 'Pendente'}
                  </span>
                </div>
                {oc.turma && (
                  <p className="mb-2 text-sm text-gray-600">
                    <strong>Turma:</strong> {oc.turma.nome}
                  </p>
                )}
                <p className="text-gray-800 whitespace-pre-wrap">{oc.descricao}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
