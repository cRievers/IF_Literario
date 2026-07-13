import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { apiClient } from '../api/client';
import type { Session } from '@supabase/supabase-js';

export type Turma = {
  id: string;
  nome: string;
  temaLivro: string;
  templateId: number | null;
  templateOrientadorId: number | null;
  edicao?: { ano: number; ativo: boolean };
};

type UserProfile = {
  id: string;
  nome: string;
  email: string;
  role: 'ADMIN' | 'AVALIADOR' | 'ORIENTADOR';
};

type AuthContextType = {
  session: Session | null;
  user: UserProfile | null;
  turmas: Turma[];
  isLoading: boolean;
  authError: string | null;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const fetchProfile = async () => {
    try {
      const data = await apiClient('/api/me');
      setUser(data.user);
      setTurmas(data.turmas);
      setAuthError(null);
    } catch (error: any) {
      console.error('Erro ao buscar perfil:', error);
      setAuthError(error.message || 'Erro ao buscar perfil');
      setUser(null);
      setTurmas([]);
      // Se não tem perfil no banco, faz logoff no Supabase para não ficar travado
      await supabase.auth.signOut();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile();
      else setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchProfile().finally(() => setIsLoading(false));
      } else {
        setUser(null);
        setTurmas([]);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, turmas, isLoading, authError, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
