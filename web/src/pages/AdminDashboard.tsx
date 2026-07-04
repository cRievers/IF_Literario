import React, { useState } from 'react';
import { ResultadosTab } from '../components/admin/ResultadosTab';
import { TurmasTab } from '../components/admin/TurmasTab';
import { AvaliadoresTab } from '../components/admin/AvaliadoresTab';
import { OcorrenciasTab } from '../components/admin/OcorrenciasTab';
import { BarChart3, Users, BookOpen, AlertTriangle } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'resultados' | 'turmas' | 'avaliadores' | 'ocorrencias'>('resultados');

  return (
    <div className="mt-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('resultados')}
            className={`${
              activeTab === 'resultados'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            } flex whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
          >
            <BarChart3 className="mr-2 h-5 w-5" />
            Resultados
          </button>

          <button
            onClick={() => setActiveTab('turmas')}
            className={`${
              activeTab === 'turmas'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            } flex whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
          >
            <BookOpen className="mr-2 h-5 w-5" />
            Turmas
          </button>

          <button
            onClick={() => setActiveTab('avaliadores')}
            className={`${
              activeTab === 'avaliadores'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            } flex whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
          >
            <Users className="mr-2 h-5 w-5" />
            Avaliadores (Alocações)
          </button>

          <button
            onClick={() => setActiveTab('ocorrencias')}
            className={`${
              activeTab === 'ocorrencias'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            } flex whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
          >
            <AlertTriangle className="mr-2 h-5 w-5" />
            Ocorrências
          </button>
        </nav>
      </div>

      <div className="py-6">
        {activeTab === 'resultados' && <ResultadosTab />}
        {activeTab === 'turmas' && <TurmasTab />}
        {activeTab === 'avaliadores' && <AvaliadoresTab />}
        {activeTab === 'ocorrencias' && <OcorrenciasTab />}
      </div>
    </div>
  );
};
