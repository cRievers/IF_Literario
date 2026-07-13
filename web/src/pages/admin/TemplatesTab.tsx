import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';

interface Criterio {
  id?: number | null;
  descricao: string;
  descricaoLonga?: string | null;
  tipo: string;
  pesoMaximo?: number | null;
  faixasNota: string[];
}

interface TemplateAvaliacao {
  id: number;
  nome: string;
  descricao?: string | null;
  criterios: Criterio[];
  _count?: { turmas: number; avaliacoes: number };
}

export const TemplatesTab: React.FC = () => {
  const [templates, setTemplates] = useState<TemplateAvaliacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estado do formulário de edição
  const [editandoTemplate, setEditandoTemplate] = useState<TemplateAvaliacao | null>(null);
  const [formNome, setFormNome] = useState('');
  const [formDescricao, setFormDescricao] = useState('');
  const [formCriterios, setFormCriterios] = useState<Criterio[]>([]);
  const [salvando, setSalvando] = useState(false);

  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient('/api/templates');
      setTemplates(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleStartEdit = (tmpl: TemplateAvaliacao) => {
    setEditandoTemplate(tmpl);
    setFormNome(tmpl.nome);
    setFormDescricao(tmpl.descricao || '');
    setFormCriterios(tmpl.criterios.map(c => ({
      ...c,
      faixasNota: c.faixasNota ?? [],
    })));
  };

  const handleAddCriterio = () => {
    setFormCriterios([
      ...formCriterios,
      { id: null, descricao: '', descricaoLonga: '', tipo: 'NUMERICO', pesoMaximo: 10, faixasNota: [] }
    ]);
  };

  const handleRemoveCriterio = (index: number) => {
    setFormCriterios(formCriterios.filter((_, idx) => idx !== index));
  };

  const handleCriterioChange = (index: number, field: string, value: any) => {
    const updated = [...formCriterios];
    updated[index] = { ...updated[index], [field]: value };
    setFormCriterios(updated);
  };

  // Faixas de nota
  const handleAddFaixa = (criterioIdx: number) => {
    const updated = [...formCriterios];
    updated[criterioIdx] = {
      ...updated[criterioIdx],
      faixasNota: [...(updated[criterioIdx].faixasNota ?? []), ''],
    };
    setFormCriterios(updated);
  };

  const handleFaixaChange = (criterioIdx: number, faixaIdx: number, value: string) => {
    const updated = [...formCriterios];
    const faixas = [...(updated[criterioIdx].faixasNota ?? [])];
    faixas[faixaIdx] = value;
    updated[criterioIdx] = { ...updated[criterioIdx], faixasNota: faixas };
    setFormCriterios(updated);
  };

  const handleRemoveFaixa = (criterioIdx: number, faixaIdx: number) => {
    const updated = [...formCriterios];
    const faixas = (updated[criterioIdx].faixasNota ?? []).filter((_, i) => i !== faixaIdx);
    updated[criterioIdx] = { ...updated[criterioIdx], faixasNota: faixas };
    setFormCriterios(updated);
  };

  const handleSalvarTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editandoTemplate) return;
    setSalvando(true);

    try {
      await apiClient(`/api/templates/${editandoTemplate.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          nome: formNome,
          descricao: formDescricao,
          criterios: formCriterios,
        }),
      });
      alert('Template atualizado com sucesso!');
      setEditandoTemplate(null);
      fetchTemplates();
    } catch (err: any) {
      alert(`Erro ao salvar template: ${err.message}`);
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return <div className="py-8 text-center text-gray-500">Carregando templates...</div>;
  }

  if (error) {
    return <div className="rounded bg-red-50 p-4 text-red-700">{error}</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-800">📋 Baremas de Avaliação (Templates Dinâmicos)</h2>
        <p className="text-sm text-gray-600 mt-1">
          Gerencie os formulários utilizados pelos avaliadores visitantes e orientadores. Critérios com notas históricas
          são <strong>inativados</strong> (não excluídos) para preservar a integridade das avaliações.
        </p>
      </div>

      {editandoTemplate ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
            <h3 className="text-lg font-bold text-gray-900">Editando Barema: {editandoTemplate.nome}</h3>
            <button
              onClick={() => setEditandoTemplate(null)}
              className="rounded bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              Voltar para Listagem
            </button>
          </div>

          <form onSubmit={handleSalvarTemplate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Barema</label>
                <input
                  type="text"
                  required
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição / Instruções</label>
                <input
                  type="text"
                  value={formDescricao}
                  onChange={(e) => setFormDescricao(e.target.value)}
                  className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4 pt-4 border-t border-gray-100">
                <h4 className="font-bold text-gray-800">Critérios de Avaliação ({formCriterios.length})</h4>
                <button
                  type="button"
                  onClick={handleAddCriterio}
                  className="rounded bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 border border-indigo-200"
                >
                  + Adicionar Critério
                </button>
              </div>

              <div className="space-y-5">
                {formCriterios.map((crit, idx) => (
                  <div key={idx} className="rounded-lg border border-gray-200 p-4 bg-gray-50 relative">
                    {/* Linha 1: Descrição, Tipo, Peso */}
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                      <div className="w-full md:w-1/2">
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Descrição do Critério</label>
                        <input
                          type="text"
                          required
                          value={crit.descricao}
                          onChange={(e) => handleCriterioChange(idx, 'descricao', e.target.value)}
                          placeholder="Ex: 1. Organização e ambientação"
                          className="w-full rounded-md border border-gray-300 p-2 text-sm bg-white focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="w-full md:w-1/4">
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Tipo do Critério</label>
                        <select
                          value={crit.tipo}
                          onChange={(e) => handleCriterioChange(idx, 'tipo', e.target.value)}
                          className="w-full rounded-md border border-gray-300 p-2 text-sm bg-white focus:border-indigo-500 focus:ring-indigo-500"
                        >
                          <option value="NUMERICO">Numérico (0 a N)</option>
                          <option value="BOOLEANO">Booleano (Sim / Não)</option>
                          <option value="TEXTO">Texto Livre</option>
                        </select>
                      </div>
                      {(crit.tipo === 'NUMERICO' || crit.tipo === 'BOOLEANO') && (
                        <div className="w-full md:w-1/4">
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Peso / Nota Máxima</label>
                          <input
                            type="number"
                            required
                            value={crit.pesoMaximo || 10}
                            onChange={(e) => handleCriterioChange(idx, 'pesoMaximo', Number(e.target.value))}
                            className="w-full rounded-md border border-gray-300 p-2 text-sm bg-white focus:border-indigo-500 focus:ring-indigo-500"
                          />
                        </div>
                      )}
                    </div>

                    {/* Linha 2: Descrição Longa */}
                    <div className="mt-3">
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Instruções Detalhadas (Descrição Longa)</label>
                      <input
                        type="text"
                        value={crit.descricaoLonga || ''}
                        onChange={(e) => handleCriterioChange(idx, 'descricaoLonga', e.target.value)}
                        placeholder="Explicação das diretrizes deste critério para o avaliador..."
                        className="w-full rounded-md border border-gray-300 p-2 text-sm bg-white focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Linha 3: Faixas de Nota */}
                    <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-amber-800 uppercase tracking-wide">
                          🎯 Faixas de Nota — Orientação para o Avaliador
                        </label>
                        <button
                          type="button"
                          onClick={() => handleAddFaixa(idx)}
                          className="rounded bg-amber-100 border border-amber-300 px-2 py-0.5 text-xs font-bold text-amber-700 hover:bg-amber-200"
                        >
                          + Faixa
                        </button>
                      </div>
                      {(crit.faixasNota ?? []).length === 0 ? (
                        <p className="text-xs text-amber-600 italic">
                          Nenhuma faixa cadastrada. Clique em "+ Faixa" para adicionar orientações de nota.
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {(crit.faixasNota ?? []).map((faixa, faixaIdx) => (
                            <div key={faixaIdx} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={faixa}
                                onChange={(e) => handleFaixaChange(idx, faixaIdx, e.target.value)}
                                placeholder={`Ex: ${faixaIdx * 2} a ${faixaIdx * 2 + 1} — Descrição da faixa`}
                                className="flex-1 rounded border border-amber-300 bg-white p-1.5 text-xs focus:border-amber-500 focus:ring-amber-500"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveFaixa(idx, faixaIdx)}
                                className="text-xs text-red-500 hover:text-red-700 font-bold px-1"
                                title="Remover faixa"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Ação: Remover Critério */}
                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveCriterio(idx)}
                        className="text-xs font-bold text-red-600 hover:text-red-800"
                      >
                        {crit.id ? '⚠ Remover Critério' : 'Remover Critério'}
                      </button>
                    </div>
                    {crit.id && (
                      <p className="mt-1 text-right text-xs text-gray-400 italic">
                        Se houver notas históricas, será inativado em vez de excluído.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setEditandoTemplate(null)}
                disabled={salvando}
                className="rounded bg-gray-100 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={salvando}
                className="rounded bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 shadow disabled:opacity-60"
              >
                {salvando ? 'Salvando...' : 'Salvar Barema'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {templates.map((tmpl) => (
            <div key={tmpl.id} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-900 text-lg">{tmpl.nome}</h3>
                  <span className="rounded bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 border border-indigo-100">
                    ID: {tmpl.id}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-6">{tmpl.descricao || 'Sem descrição cadastrada.'}</p>

                <h4 className="font-semibold text-xs text-gray-700 uppercase tracking-wider mb-3">
                  Critérios ({tmpl.criterios.length}):
                </h4>
                <div className="space-y-2 mb-6 max-h-60 overflow-y-auto pr-2">
                  {tmpl.criterios.map((c) => (
                    <div key={c.id} className="rounded border border-gray-100 p-2.5 bg-gray-50 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-800">{c.descricao}</span>
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          {(c.faixasNota?.length ?? 0) > 0 && (
                            <span
                              title={`${c.faixasNota.length} faixa(s) de nota`}
                              className="font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200"
                            >
                              🎯 {c.faixasNota.length}
                            </span>
                          )}
                          <span className="font-bold text-gray-600 bg-white px-1.5 py-0.5 rounded border border-gray-200">
                            {c.tipo === 'NUMERICO' ? `Max: ${c.pesoMaximo} pts` : c.tipo}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  <span>{tmpl._count?.turmas || 0} turmas</span> • <span>{tmpl._count?.avaliacoes || 0} avaliações</span>
                </div>
                <button
                  onClick={() => handleStartEdit(tmpl)}
                  className="rounded bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 shadow"
                >
                  Editar Barema
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
