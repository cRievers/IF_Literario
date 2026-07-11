// web/src/components/TurmaCard.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import type { Turma } from '../contexts/AuthContext';

interface TurmaCardProps {
  turma: Turma;
}

interface TurmaStatus {
  turmaId: string;
  totalAvaliacoes: number;
  avisoMinimo: boolean;
  jaAvaliou: boolean;
  edicaoAtiva?: boolean;
}

export const TurmaCard: React.FC<TurmaCardProps> = ({ turma }) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<TurmaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await apiClient(`/api/avaliacoes/turma/${turma.id}`);
        setStatus(data);
      } catch (error) {
        console.error('Erro ao buscar status da turma:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [turma.id]);

  const handleAvaliar = () => {
    navigate(`/avaliar/${turma.id}`, {
      state: { templateId: turma.templateId }
    });
  };

  const isOrientador = user?.role === 'ORIENTADOR';
  const semTemplate = !turma.templateId;
  const avaliavel = !loading && !status?.jaAvaliou && status !== null && !semTemplate;
  const podeEditar = !loading && status?.jaAvaliou && status.edicaoAtiva && !semTemplate;
  const habilitado = avaliavel || podeEditar;

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center rounded border p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="mb-4 md:mb-0">
        <h3 className="text-lg font-semibold text-gray-800">{turma.nome}</h3>
        <p className="text-gray-600">Tema: <span className="font-medium">{turma.temaLivro}</span></p>
        {turma.edicao && (
          <p className="text-xs text-gray-400">Edição {turma.edicao.ano}</p>
        )}

        {!loading && status && (
          <div className="mt-2 flex flex-col gap-1 text-sm">
            {semTemplate ? (
              <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-red-800">
                Sem template de avaliação
              </span>
            ) : status.jaAvaliou ? (
              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-green-800">
                Avaliação Concluída
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-blue-800">
                {isOrientador ? 'Pendente' : `Pendente (${status.totalAvaliacoes} avaliações)`}
              </span>
            )}
            {/* Aviso informativo — não bloqueia */}
            {!isOrientador && status.avisoMinimo && !status.jaAvaliou && (
              <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-yellow-800">
                ⚠️ Mínimo de 3 avaliações não atingido
              </span>
            )}
          </div>
        )}
      </div>

      <div>
        <button
          onClick={handleAvaliar}
          disabled={!habilitado}
          className={`rounded px-4 py-2 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            podeEditar
              ? 'bg-emerald-600 hover:bg-emerald-700'
              : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {status?.jaAvaliou ? (status.edicaoAtiva ? 'Editar Avaliação' : 'Já Avaliada') : 'Avaliar Turma'}
        </button>
      </div>
    </div>
  );
};
