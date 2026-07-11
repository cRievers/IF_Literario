import React, { useState } from 'react';
import { useAuth } from '../../../src/contexts/AuthContext';
import { TrocarSenhaModal } from '../../../src/components/TrocarSenhaModal';
import { ResultadosTab } from './ResultadosTab';
import { TurmasTab } from './TurmasTab';
import { AvaliadoresTab } from './AvaliadoresTab';
import { OcorrenciasTab } from './OcorrenciasTab';
import { TemplatesTab } from './TemplatesTab';
import { UsuariosTab } from './UsuariosTab';
import { AvaliacoesTab } from './AvaliacoesTab';

type TabType = 'RESULTADOS' | 'TURMAS' | 'AVALIADORES' | 'OCORRENCIAS' | 'TEMPLATES' | 'USUARIOS' | 'AVALIACOES';

export const AdminDashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const saved = localStorage.getItem('admin_dashboard_tab') as TabType;
    return saved && ['RESULTADOS', 'TURMAS', 'AVALIADORES', 'OCORRENCIAS', 'TEMPLATES', 'USUARIOS', 'AVALIACOES'].includes(saved)
      ? saved
      : 'RESULTADOS';
  });

  const [showTrocarSenha, setShowTrocarSenha] = useState(false);

  const handleTabChange = (tabId: TabType) => {
    setActiveTab(tabId);
    localStorage.setItem('admin_dashboard_tab', tabId);
  };

  const tabs = [
    { id: 'RESULTADOS', label: '🏆 Resultados & Ranking' },
    { id: 'TURMAS', label: '🏫 Turmas & Edições' },
    { id: 'AVALIADORES', label: '👥 Avaliadores & Alocações' },
    { id: 'OCORRENCIAS', label: '⚠️ Ocorrências' },
    { id: 'TEMPLATES', label: '📋 Baremas (Templates)' },
    { id: 'USUARIOS', label: '👤 Usuários' },
    { id: 'AVALIACOES', label: '📝 Avaliações' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* HEADER / NAVBAR */}
      <header className="bg-indigo-700 text-white shadow-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black tracking-wider">IF LITERÁRIO</span>
            <span className="rounded bg-indigo-500 px-2.5 py-0.5 text-xs font-bold uppercase tracking-widest text-indigo-100 shadow-inner">
              Portal Admin
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium hidden sm:inline-block">Olá, {user?.nome}</span>
            <button
              onClick={() => setShowTrocarSenha(true)}
              className="rounded bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 border border-indigo-500 shadow-sm"
            >
              Trocar Senha
            </button>
            <button
              onClick={signOut}
              className="rounded bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 shadow-sm"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {showTrocarSenha && <TrocarSenhaModal onClose={() => setShowTrocarSenha(false)} />}

      {/* NAVEGAÇÃO DE ABAS */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 overflow-x-auto py-3">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as TabType)}
                className={`whitespace-nowrap pb-2 text-sm font-bold border-b-2 transition-colors duration-150 ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL (ABA ATIVA) */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          {activeTab === 'RESULTADOS' && <ResultadosTab />}
          {activeTab === 'TURMAS' && <TurmasTab />}
          {activeTab === 'AVALIADORES' && <AvaliadoresTab />}
          {activeTab === 'OCORRENCIAS' && <OcorrenciasTab />}
          {activeTab === 'TEMPLATES' && <TemplatesTab />}
          {activeTab === 'USUARIOS' && <UsuariosTab />}
          {activeTab === 'AVALIACOES' && <AvaliacoesTab />}
        </div>
      </main>
    </div>
  );
};
