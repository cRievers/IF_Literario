import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../api/client';

export const OcorrenciaForm: React.FC = () => {
  const { turmas } = useAuth();
  const navigate = useNavigate();
  const [descricao, setDescricao] = useState('');
  const [turmaId, setTurmaId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao.trim()) {
      setError('A descrição é obrigatória.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await apiClient('/api/ocorrencias', {
        method: 'POST',
        body: JSON.stringify({
          descricao,
          turmaId: turmaId || null
        })
      });
      navigate('/ocorrencias');
    } catch (err: any) {
      setError(err.message || 'Erro ao criar ocorrência.');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-2xl rounded-lg bg-white p-6 shadow">
        <button onClick={() => navigate('/ocorrencias')} className="text-sm text-gray-500 hover:text-gray-800 mb-4">
          &larr; Voltar
        </button>
        <h1 className="mb-6 text-2xl font-bold">Nova Ocorrência</h1>

        {error && <div className="mb-4 rounded bg-red-50 p-4 text-red-700">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium text-gray-700 mb-1">Turma Relacionada (Opcional)</label>
            <select
              value={turmaId}
              onChange={(e) => setTurmaId(e.target.value)}
              className="w-full rounded border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border"
            >
              <option value="">Nenhuma / Ocorrência Geral</option>
              {turmas.map(t => (
                <option key={t.id} value={t.id}>{t.nome}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1">Descrição</label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              required
              rows={6}
              placeholder="Descreva o problema ou situação ocorrida..."
              className="w-full rounded border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border"
            />
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={submitting || !descricao.trim()}
              className="rounded bg-indigo-600 px-6 py-2 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? 'Enviando...' : 'Registrar Ocorrência'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
