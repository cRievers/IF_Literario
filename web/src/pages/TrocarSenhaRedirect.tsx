// web/src/pages/TrocarSenhaRedirect.tsx
// Página de destino do link de reset enviado por e-mail.
// O Supabase processa o token do hash da URL de forma assíncrona — disparando o
// evento PASSWORD_RECOVERY no onAuthStateChange. O formulário só é exibido
// após esse evento, garantindo que a sessão de recuperação já está ativa.
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Lock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export const TrocarSenhaRedirect: React.FC = () => {
  const [pronto, setPronto] = useState(false); // true quando sessão de recovery estiver ativa
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Aguarda o Supabase SDK processar o token de recovery do hash da URL
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setPronto(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (novaSenha.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (novaSenha !== confirmar) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    setError('');

    // Sessão de recovery já está ativa graças ao evento PASSWORD_RECOVERY
    const { error: supabaseError } = await supabase.auth.updateUser({ password: novaSenha });

    if (supabaseError) {
      setError(supabaseError.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
      setTimeout(() => navigate('/'), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Nova Senha</h1>
        <p className="text-sm text-gray-500 mb-6">Defina a nova senha para sua conta.</p>

        {success ? (
          <div className="flex flex-col items-center gap-3 py-4 text-emerald-600">
            <CheckCircle2 className="w-10 h-10" />
            <p className="font-semibold">Senha alterada! Redirecionando...</p>
          </div>
        ) : !pronto ? (
          // Aguardando o evento PASSWORD_RECOVERY — token ainda sendo processado
          <div className="flex flex-col items-center gap-3 py-6 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-sm">Validando link de recuperação...</p>
            <p className="text-xs text-gray-400 mt-2">
              Se esta tela não avançar, o link pode ter expirado.{' '}
              <button
                onClick={() => navigate('/login')}
                className="underline text-indigo-500"
              >
                Solicite um novo.
              </button>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                Nova Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  value={novaSenha}
                  onChange={e => setNovaSenha(e.target.value)}
                  required
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                Confirmar Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  value={confirmar}
                  onChange={e => setConfirmar(e.target.value)}
                  required
                  placeholder="Repita a nova senha"
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-60 transition-colors"
            >
              {loading ? 'Salvando...' : 'Salvar Nova Senha'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
