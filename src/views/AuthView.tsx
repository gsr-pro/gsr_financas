import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Trees, Lock, Mail, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AuthViewProps {
  onAuthSuccess: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onAuthSuccess }) => {
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [nome, setNome] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      if (isSignUp) {
        if (!nome.trim()) {
          throw new Error('Informe o seu nome completo.');
        }

        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              nome: nome.trim(),
            },
          },
        });

        if (error) throw error;
        setInfoMessage('Cadastro realizado com sucesso! Se necessário, confirme seu e-mail ou efetue login.');
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;
        onAuthSuccess();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha na autenticação.';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('teste_chacara@exemplo.com');
    setPassword('SenhaTeste123!');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100">
      <div className="max-w-sm w-full bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 animate-fade-in">
        {/* Logotipo da Obra */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-emerald-800 rounded-2xl mx-auto flex items-center justify-center text-emerald-200 shadow-md mb-3">
            <Trees className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Obra Chácara
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Gestão financeira e controle de construção (500m²)
          </p>
        </div>

        {/* Mensagens de Feedback */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2 text-rose-800 text-xs animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {infoMessage && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start space-x-2 text-emerald-800 text-xs animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span>{infoMessage}</span>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-3.5">
          {isSignUp && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome Completo
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Gabriel Engenheiro"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              E-mail
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Senha
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-900/10 flex items-center justify-center space-x-2 transition-all disabled:opacity-60 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Autenticando...</span>
              </>
            ) : (
              <span>{isSignUp ? 'Criar Conta na Obra' : 'Entrar no Aplicativo'}</span>
            )}
          </button>
        </form>

        {/* Alternar Login / Cadastro */}
        <div className="mt-5 text-center space-y-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMessage(null);
            }}
            className="text-xs font-semibold text-emerald-700 hover:underline"
          >
            {isSignUp
              ? 'Já tem conta? Entrar'
              : 'Primeiro acesso? Crie seu perfil de proprietário'}
          </button>

          {/* Atalho para preenchimento de teste rápido */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleFillDemo}
              className="text-[11px] text-slate-400 hover:text-slate-600 underline"
            >
              Usar credenciais de teste da homologação
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
