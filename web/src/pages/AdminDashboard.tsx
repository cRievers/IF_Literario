// web/src/pages/AdminDashboard.tsx
import React, { useState } from 'react';
import { ResultadosTab } from '../components/admin/ResultadosTab';
import { TurmasTab } from '../components/admin/TurmasTab';
import { AvaliadoresTab } from '../components/admin/AvaliadoresTab';
import { OcorrenciasTab } from '../components/admin/OcorrenciasTab';
import { UsuariosTab } from '../components/admin/UsuariosTab';
import { BarChart3, Users, BookOpen, AlertTriangle, UserPlus } from 'lucide-react';

type Tab = 'resultados' | 'turmas' | 'usuarios' | 'avaliadores' | 'ocorrencias';

const TABS: { id: Tab; label: string; Icon: React.FC<{ className?: string }> }[] = [
  { id: 'resultados',  label: 'Resultados',         Icon: BarChart3 },
  { id: 'turmas',      label: 'Turmas',              Icon: BookOpen },
  { id: 'usuarios',    label: 'Usuários',            Icon: UserPlus },
  { id: 'avaliadores', label: 'Alocações',           Icon: Users },
  { id: 'ocorrencias', label: 'Ocorrências',         Icon: AlertTriangle },
];

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('resultados');

  return (
    <div className="mt-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6 overflow-x-auto">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`${
                activeTab === id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              } flex items-center whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors`}
            >
              <Icon className="mr-2 h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      <div className="py-6">
        {activeTab === 'resultados'  && <ResultadosTab />}
        {activeTab === 'turmas'      && <TurmasTab />}
        {activeTab === 'usuarios'    && <UsuariosTab />}
        {activeTab === 'avaliadores' && <AvaliadoresTab />}
        {activeTab === 'ocorrencias' && <OcorrenciasTab />}
      </div>
    </div>
  );
};
