import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { TurmaCard } from '../components/TurmaCard';

export const Dashboard: React.FC = () => {
  const { user, turmas, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl rounded-lg bg-white p-6 shadow">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Painel IF Literário</h1>
          <button
            onClick={signOut}
            className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
          >
            Sair
          </button>
        </div>
        
        <div className="mb-6 rounded-md bg-blue-50 p-4">
          <p><strong>Usuário:</strong> {user?.nome}</p>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Perfil:</strong> {user?.role}</p>
        </div>

        <h2 className="mb-4 text-xl font-semibold">Minhas Turmas ({turmas.length})</h2>
        {turmas.length > 0 ? (
          <div className="space-y-4">
            {turmas.map((t) => (
              <TurmaCard key={t.id} turma={t} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500">Nenhuma turma alocada.</p>
        )}
      </div>
    </div>
  );
};
