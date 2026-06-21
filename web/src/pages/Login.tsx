import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Mail, Lock, BookOpen, AlertCircle, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';

export const Login: React.FC = () => {
  const { user, authError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

  React.useEffect(() => {
    if (authError) {
      setErrorMsg(authError);
      setSuccessMsg(null);
      setLoading(false);
    }
  }, [authError]);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessMsg('Conectado com sucesso! Carregando painel...');
        console.log('Logado com sucesso!', data);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Ocorreu um erro ao tentar fazer login.');
    } finally {
      setLoading(false);
    }
  };

  // Envia link de reset de senha para o email informado no campo
  const handleEsqueciSenha = async () => {
    if (!email) {
      setErrorMsg('Digite seu e-mail no campo acima antes de solicitar a redefinição.');
      return;
    }
    setResetLoading(true);
    setErrorMsg(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/trocar-senha`,
    });
    setResetLoading(false);
    if (error) {
      setErrorMsg(error.message);
    } else {
      setSuccessMsg('Link de redefinição enviado! Verifique sua caixa de entrada.');
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-50 flex items-center justify-center p-4 overflow-hidden font-sans">
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-ifmg-green/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-ifmg-red/5 blur-3xl pointer-events-none" />

      <div className="relative max-w-md w-full bg-white/95 backdrop-blur-md rounded-2xl border border-slate-100 shadow-2xl shadow-slate-200/60 p-8 transition-all duration-300">
        
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-ifmg-green/10 text-ifmg-green rounded-2xl flex items-center justify-center shadow-inner mb-4 transition-transform hover:scale-105 duration-300">
            <BookOpen className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            IF Literário
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Sistema de Avaliação • IFMG Ouro Branco
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-ifmg-red rounded-xl flex items-start gap-3 text-sm leading-relaxed">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 text-ifmg-green rounded-xl flex items-start gap-3 text-sm leading-relaxed">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              E-mail do Avaliador
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-ifmg-green transition-colors">
                <Mail className="w-5 h-5" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-ifmg-green/10 focus:border-ifmg-green outline-none transition-all placeholder:text-slate-400 text-slate-700 text-base"
                placeholder="nome.sobrenome@ifmg.edu.br"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Senha
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-ifmg-green transition-colors">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-ifmg-green/10 focus:border-ifmg-green outline-none transition-all placeholder:text-slate-400 text-slate-700 text-base"
                placeholder="Digite sua senha"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 relative overflow-hidden bg-ifmg-green hover:bg-emerald-700 text-white font-semibold py-3.5 px-6 rounded-xl transition duration-200 flex items-center justify-center gap-2 group disabled:opacity-75 shadow-lg shadow-ifmg-green/10 hover:shadow-emerald-700/20 active:scale-[0.98] cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Entrando...</span>
              </>
            ) : (
              <>
                <span>Entrar no Sistema</span>
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleEsqueciSenha}
            disabled={resetLoading}
            className="w-full text-center text-sm text-slate-500 hover:text-ifmg-green disabled:opacity-60 transition-colors mt-1"
          >
            {resetLoading ? 'Enviando link...' : 'Esqueci minha senha'}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-slate-400">
          <p>© {new Date().getFullYear()} IFMG Campus Ouro Branco</p>
          <p className="mt-1">Projeto Pedagógico & Cultural</p>
        </div>
      </div>
    </div>
  );
};
