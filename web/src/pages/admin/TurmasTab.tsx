import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';

interface Edicao {
  id: number;
  ano: number;
  ativo: boolean;
  _count?: { turmas: number };
}

interface Turma {
  id: string;
  nome: string;
  temaLivro: string;
  edicaoId: number;
  orientadorId?: string | null;
  templateId?: number | null;
  edicao: Edicao;
  orientador?: { id: string; nome: string; email: string } | null;
  template?: { id: number; nome: string } | null;
}

interface Usuario {
  id: string;
  nome: string;
  email: string;
}

interface TemplateItem {
  id: number;
  nome: string;
}

export const TurmasTab: React.FC = () => {
  const [edicoes, setEdicoes] = useState<Edicao[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [orientadores, setOrientadores] = useState<Usuario[]>([]);
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados dos formulários modais
  const [showModalEdicao, setShowModalEdicao] = useState(false);
  const [formEdicaoAno, setFormEdicaoAno] = useState('');
  const [formEdicaoAtivo, setFormEdicaoAtivo] = useState(true);

  const [showModalTurma, setShowModalTurma] = useState(false);
  const [editandoTurmaId, setEditandoTurmaId] = useState<string | null>(null);
  const [formTurmaNome, setFormTurmaNome] = useState('');
  const [formTurmaTema, setFormTurmaTema] = useState('');
  const [formTurmaEdicaoId, setFormTurmaEdicaoId] = useState('');
  const [formTurmaOrientadorId, setFormTurmaOrientadorId] = useState('');
  const [formTurmaTemplateId, setFormTurmaTemplateId] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [edicoesData, turmasData, orientadoresData, templatesData] = await Promise.all([
        apiClient('/api/edicoes'),
        apiClient('/api/turmas'),
        apiClient('/api/usuarios?role=ORIENTADOR'),
        apiClient('/api/templates'),
      ]);
      setEdicoes(edicoesData);
      setTurmas(turmasData);
      setOrientadores(orientadoresData);
      setTemplates(templatesData);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCriarEdicao = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient('/api/edicoes', {
        method: 'POST',
        body: JSON.stringify({ ano: Number(formEdicaoAno), ativo: formEdicaoAtivo }),
      });
      setShowModalEdicao(false);
      setFormEdicaoAno('');
      setFormEdicaoAtivo(true);
      fetchData();
    } catch (err: any) {
      alert(`Erro ao criar edição: ${err.message}`);
    }
  };

  const handleAtivarEdicao = async (id: number) => {
    try {
      await apiClient(`/api/edicoes/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ ativo: true }),
      });
      fetchData();
    } catch (err: any) {
      alert(`Erro ao ativar edição: ${err.message}`);
    }
  };

  const handleOpenModalTurmaNova = () => {
    setEditandoTurmaId(null);
    setFormTurmaNome('');
    setFormTurmaTema('');
    const edicaoAtiva = edicoes.find(e => e.ativo);
    setFormTurmaEdicaoId(edicaoAtiva ? String(edicaoAtiva.id) : (edicoes[0] ? String(edicoes[0].id) : ''));
    setFormTurmaOrientadorId('');
    setFormTurmaTemplateId(templates[0] ? String(templates[0].id) : '');
    setShowModalTurma(true);
  };

  const handleOpenModalTurmaEditar = (turma: Turma) => {
    setEditandoTurmaId(turma.id);
    setFormTurmaNome(turma.nome);
    setFormTurmaTema(turma.temaLivro);
    setFormTurmaEdicaoId(String(turma.edicaoId));
    setFormTurmaOrientadorId(turma.orientadorId || '');
    setFormTurmaTemplateId(turma.templateId ? String(turma.templateId) : '');
    setShowModalTurma(true);
  };

  const handleSalvarTurma = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        nome: formTurmaNome,
        temaLivro: formTurmaTema,
        edicaoId: Number(formTurmaEdicaoId),
        orientadorId: formTurmaOrientadorId || null,
        templateId: formTurmaTemplateId ? Number(formTurmaTemplateId) : null,
      };

      if (editandoTurmaId) {
        await apiClient(`/api/turmas/${editandoTurmaId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiClient('/api/turmas', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      setShowModalTurma(false);
      fetchData();
    } catch (err: any) {
      alert(`Erro ao salvar turma: ${err.message}`);
    }
  };

  if (loading) {
    return <div className="py-8 text-center text-gray-500">Carregando turmas e edições...</div>;
  }

  if (error) {
    return <div className="rounded bg-red-50 p-4 text-red-700">{error}</div>;
  }

  return (
    <div className="space-y-10">
      {/* GESTÃO DE EDIÇÕES */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">📅 Edições do Evento</h2>
          <button
            onClick={() => setShowModalEdicao(true)}
            className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 shadow"
          >
            + Nova Edição
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {edicoes.map((ed) => (
            <div key={ed.id} className={`rounded-lg border p-5 shadow-sm bg-white ${ed.ativo ? 'border-green-500 ring-2 ring-green-200' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl font-extrabold text-gray-900">{ed.ano}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${ed.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                  {ed.ativo ? 'Edição Ativa' : 'Inativa'}
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-4">{ed._count?.turmas || 0} turmas cadastradas</p>
              {!ed.ativo && (
                <button
                  onClick={() => handleAtivarEdicao(ed.id)}
                  className="w-full rounded bg-gray-100 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200"
                >
                  Tornar Edição Ativa
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* GESTÃO DE TURMAS */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">🏫 Turmas Cadastradas</h2>
          <button
            onClick={handleOpenModalTurmaNova}
            className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 shadow"
          >
            + Nova Turma
          </button>
        </div>

        <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300 bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Nome da Turma</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Tema / Livro</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Orientador</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Barema (Template)</th>
                <th className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">Edição</th>
                <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {turmas.map((t) => (
                <tr key={t.id}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-semibold text-gray-900">{t.nome}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{t.temaLivro}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{t.orientador?.nome || '—'}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{t.template?.nome || '—'}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-center font-medium text-gray-900">{t.edicao.ano}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-right">
                    <button
                      onClick={() => handleOpenModalTurmaEditar(t)}
                      className="text-indigo-600 hover:text-indigo-900 font-medium"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL EDIÇÃO */}
      {showModalEdicao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Nova Edição do Evento</h3>
            <form onSubmit={handleCriarEdicao} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ano da Edição</label>
                <input
                  type="number"
                  required
                  value={formEdicaoAno}
                  onChange={(e) => setFormEdicaoAno(e.target.value)}
                  placeholder="Ex: 2026"
                  className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="ativoCheckbox"
                  checked={formEdicaoAtivo}
                  onChange={(e) => setFormEdicaoAtivo(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="ativoCheckbox" className="text-sm text-gray-700">Tornar esta a edição ativa</label>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModalEdicao(false)}
                  className="rounded bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  Criar Edição
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TURMA */}
      {showModalTurma && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{editandoTurmaId ? 'Editar Turma' : 'Nova Turma'}</h3>
            <form onSubmit={handleSalvarTurma} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Turma</label>
                <input
                  type="text"
                  required
                  value={formTurmaNome}
                  onChange={(e) => setFormTurmaNome(e.target.value)}
                  placeholder="Ex: 1º Ano Informática"
                  className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tema / Livro</label>
                <input
                  type="text"
                  required
                  value={formTurmaTema}
                  onChange={(e) => setFormTurmaTema(e.target.value)}
                  placeholder="Ex: A Odisseia"
                  className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Edição do Evento</label>
                <select
                  required
                  value={formTurmaEdicaoId}
                  onChange={(e) => setFormTurmaEdicaoId(e.target.value)}
                  className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">Selecione a edição...</option>
                  {edicoes.map(ed => (
                    <option key={ed.id} value={ed.id}>{ed.ano} {ed.ativo ? '(Ativa)' : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Professor Orientador (Opcional)</label>
                <select
                  value={formTurmaOrientadorId}
                  onChange={(e) => setFormTurmaOrientadorId(e.target.value)}
                  className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">Nenhum orientador atribuído</option>
                  {orientadores.map(or => (
                    <option key={or.id} value={or.id}>{or.nome} ({or.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Barema de Avaliação (Visitantes)</label>
                <select
                  value={formTurmaTemplateId}
                  onChange={(e) => setFormTurmaTemplateId(e.target.value)}
                  className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">Nenhum template atribuído</option>
                  {templates.map(tmp => (
                    <option key={tmp.id} value={tmp.id}>{tmp.nome}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModalTurma(false)}
                  className="rounded bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  {editandoTurmaId ? 'Salvar Alterações' : 'Criar Turma'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
