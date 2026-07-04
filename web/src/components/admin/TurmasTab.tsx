import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export const TurmasTab: React.FC = () => {
  const [turmas, setTurmas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    nome: '',
    temaLivro: '',
    edicaoId: '1',
    templateId: '1',
    orientadorId: ''
  });

  const fetchTurmas = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('http://localhost:3333/api/me', {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      const data = await res.json();
      setTurmas(data.turmas || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTurmas();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch('http://localhost:3333/api/turmas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          nome: formData.nome,
          temaLivro: formData.temaLivro,
          edicaoId: Number(formData.edicaoId),
          templateId: Number(formData.templateId),
          orientadorId: formData.orientadorId || null
        })
      });
      fetchTurmas();
      setFormData({ nome: '', temaLivro: '', edicaoId: '1', templateId: '1', orientadorId: '' });
      alert('Turma criada com sucesso!');
    } catch (error) {
      console.error(error);
      alert('Erro ao criar turma');
    }
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Nova Turma</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4 bg-white p-6 shadow sm:rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nome</label>
            <input
              type="text"
              required
              value={formData.nome}
              onChange={e => setFormData({...formData, nome: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              placeholder="Ex: Info 1A"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Tema/Livro</label>
            <input
              type="text"
              required
              value={formData.temaLivro}
              onChange={e => setFormData({...formData, temaLivro: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
            >
              Criar Turma
            </button>
          </div>
        </form>
      </div>

      <div>
        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Turmas Cadastradas</h3>
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">ID</th>
                <th className="py-3.5 px-3 text-left text-sm font-semibold text-gray-900">Nome</th>
                <th className="py-3.5 px-3 text-left text-sm font-semibold text-gray-900">Tema</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {turmas.map(turma => (
                <tr key={turma.id}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-500">{turma.id}</td>
                  <td className="whitespace-nowrap py-4 px-3 text-sm font-medium text-gray-900">{turma.nome}</td>
                  <td className="whitespace-nowrap py-4 px-3 text-sm text-gray-500">{turma.temaLivro}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
