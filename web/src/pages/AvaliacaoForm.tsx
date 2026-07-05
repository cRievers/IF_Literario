// web/src/pages/AvaliacaoForm.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { apiClient } from '../api/client';

interface Criterio {
  id: number;
  descricao: string;
  descricaoLonga: string | null;
  tipo: 'NUMERICO' | 'BOOLEANO' | 'TEXTO';
  pesoMaximo: number | null;
  faixasNota: string[];
}


interface Template {
  id: number;
  nome: string;
  descricao: string | null;
  criterios: Criterio[];
}

export const AvaliacaoForm: React.FC = () => {
  const { id: turmaId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // templateId vem do navigation state — nunca hardcoded
  const templateId = (location.state as { templateId?: number } | null)?.templateId;

  const [template, setTemplate] = useState<Template | null>(null);
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notas, setNotas] = useState<Record<number, any>>({});
  const [comentario, setComentario] = useState('');

  useEffect(() => {
    if (!templateId) {
      setError('Esta turma não possui um template de avaliação configurado. Contate o administrador.');
      setLoading(false);
      return;
    }

    const fetchTemplateAndStatus = async () => {
      try {
        const [templateData, statusData] = await Promise.all([
          apiClient(`/api/templates/${templateId}`),
          apiClient(`/api/avaliacoes/turma/${turmaId}`)
        ]);

        setTemplate(templateData);
        setStatus(statusData);

        // Inicializa notas com valores padrão por tipo
        const initialNotas: Record<number, any> = {};
        templateData.criterios.forEach((c: Criterio) => {
          if (c.tipo === 'NUMERICO') {
            initialNotas[c.id] = c.pesoMaximo ? c.pesoMaximo / 2 : 0;
          } else if (c.tipo === 'BOOLEANO') {
            initialNotas[c.id] = false;
          } else {
            initialNotas[c.id] = '';
          }
        });

        // Preenche com a avaliação existente se houver
        if (statusData.jaAvaliou && statusData.avaliacao) {
          if (statusData.avaliacao.comentario) {
            setComentario(statusData.avaliacao.comentario);
          }
          statusData.avaliacao.notas.forEach((n: { criterioId: number; valor: any }) => {
            initialNotas[n.criterioId] = n.valor;
          });
        }

        setNotas(initialNotas);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar o template de avaliação.');
      } finally {
        setLoading(false);
      }
    };

    if (turmaId) fetchTemplateAndStatus();
  }, [turmaId, templateId]);

  const handleNotaChange = (criterioId: number, valor: any) => {
    setNotas(prev => ({ ...prev, [criterioId]: valor }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const payloadNotas = Object.keys(notas).map(key => {
        const critId = Number(key);
        const crit = template?.criterios.find(c => c.id === critId);
        let val = notas[critId];
        if (crit?.tipo === 'NUMERICO') {
          val = parseFloat(val);
          if (isNaN(val)) {
            val = 0;
          }
        }
        return {
          criterioId: critId,
          valor: val
        };
      });

      await apiClient('/api/avaliacoes', {
        method: 'POST',
        body: JSON.stringify({
          turmaId,
          templateId,
          comentario,
          notas: payloadNotas
        })
      });

      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Erro ao submeter avaliação.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Carregando formulário...</div>;
  }

  if (error && !template) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={() => navigate('/')} className="text-indigo-600 underline">Voltar</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-3xl rounded-lg bg-white p-6 shadow">
        <div className="mb-6">
          <button onClick={() => navigate('/')} className="text-sm text-gray-500 hover:text-gray-800 mb-2">
            &larr; Voltar
          </button>
          <h1 className="text-2xl font-bold">{template?.nome}</h1>
          {template?.descricao && <p className="text-gray-600 mt-1">{template.descricao}</p>}
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4 text-red-700">{error}</div>
        )}

        {status?.jaAvaliou && !status?.edicaoAtiva && (
          <div className="mb-6 rounded-md bg-yellow-50 p-4 text-yellow-700">
            Esta avaliação foi concluída e a edição do evento está inativa. Não é possível fazer alterações.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {template?.criterios.map((criterio) => (
            <div key={criterio.id} className="rounded border p-4">
              <label className="block font-medium text-gray-800 mb-2">
                {criterio.descricao}
                {criterio.tipo === 'NUMERICO' && (
                  <span className="text-sm text-gray-500 ml-2">(Máx: {criterio.pesoMaximo})</span>
                )}
              </label>

              {criterio.descricaoLonga && (
                <p className="text-sm text-gray-500 mb-4 bg-gray-50 p-2 rounded border border-gray-100 italic">
                  {criterio.descricaoLonga}
                </p>
              )}

              {criterio.tipo === 'NUMERICO' && (
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="0"
                    max={criterio.pesoMaximo || 10}
                    step="0.05"
                    value={notas[criterio.id] === '' ? 0 : (parseFloat(notas[criterio.id]) || 0)}
                    onChange={(e) => handleNotaChange(criterio.id, parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <input
                    type="number"
                    min="0"
                    max={criterio.pesoMaximo || 10}
                    step="0.05"
                    value={notas[criterio.id]}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) {
                        const clamped = Math.min(Math.max(0, val), criterio.pesoMaximo || 10);
                        if (e.target.value.endsWith('.') || e.target.value.endsWith('.0')) {
                          handleNotaChange(criterio.id, e.target.value);
                        } else {
                          handleNotaChange(criterio.id, clamped);
                        }
                      } else {
                        handleNotaChange(criterio.id, '');
                      }
                    }}
                    onBlur={(e) => {
                      const val = parseFloat(e.target.value);
                      if (isNaN(val)) {
                        handleNotaChange(criterio.id, 0);
                      } else {
                        const clamped = Math.min(Math.max(0, val), criterio.pesoMaximo || 10);
                        handleNotaChange(criterio.id, clamped);
                      }
                    }}
                    className="w-20 text-center font-semibold bg-gray-50 rounded py-1 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              )}

              {criterio.tipo === 'BOOLEANO' && (
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name={`criterio-${criterio.id}`}
                      checked={notas[criterio.id] === true}
                      onChange={() => handleNotaChange(criterio.id, true)}
                      className="mr-2"
                    />
                    Sim
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name={`criterio-${criterio.id}`}
                      checked={notas[criterio.id] === false}
                      onChange={() => handleNotaChange(criterio.id, false)}
                      className="mr-2"
                    />
                    Não
                  </label>
                </div>
              )}

              {criterio.tipo === 'TEXTO' && (
                <textarea
                  className="w-full rounded border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  rows={3}
                  value={notas[criterio.id]}
                  onChange={(e) => handleNotaChange(criterio.id, e.target.value)}
                  placeholder="Escreva sua avaliação aqui..."
                />
              )}
            </div>
          ))}

          <div className="rounded border p-4 bg-gray-50">
            <label className="block font-medium text-gray-800 mb-2">
              Comentário Geral (Opcional)
            </label>
            <textarea
              className="w-full rounded border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              rows={4}
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Algum comentário adicional sobre a turma?"
            />
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={submitting || (status?.jaAvaliou && !status?.edicaoAtiva)}
              className="rounded bg-indigo-600 px-6 py-3 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {submitting
                ? 'Enviando...'
                : status?.jaAvaliou
                ? 'Atualizar Avaliação'
                : 'Submeter Avaliação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
