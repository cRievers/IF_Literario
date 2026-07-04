import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

export const AvaliadoresTab: React.FC = () => {
  const [formData, setFormData] = useState({
    avaliadorId: '',
    turmaId: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('http://localhost:3333/api/alocacoes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao criar alocação');
      }

      alert('Avaliador alocado com sucesso!');
      setFormData({ avaliadorId: '', turmaId: '' });
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Alocar Avaliador a Turma</h3>
        <p className="text-sm text-gray-500 mb-4">Insira o ID do Usuário (Avaliador) e o ID da Turma.</p>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4 bg-white p-6 shadow sm:rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700">ID do Avaliador</label>
            <input
              type="text"
              required
              value={formData.avaliadorId}
              onChange={e => setFormData({...formData, avaliadorId: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              placeholder="UUID do avaliador"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">ID da Turma</label>
            <input
              type="text"
              required
              value={formData.turmaId}
              onChange={e => setFormData({...formData, turmaId: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              placeholder="UUID da turma"
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Alocando...' : 'Confirmar Alocação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
