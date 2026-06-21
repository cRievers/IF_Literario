import React from 'react';
import { Link } from 'react-router-dom';

export const Unauthorized: React.FC = () => {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-gray-100 text-center">
      <h1 className="mb-4 text-4xl font-bold text-red-600">Acesso Negado</h1>
      <p className="mb-8 text-gray-600">Você não tem permissão para acessar esta página.</p>
      <Link to="/" className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
        Voltar para o Início
      </Link>
    </div>
  );
};
