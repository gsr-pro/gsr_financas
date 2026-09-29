import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { BrandLogo } from '../components/brand/BrandLogo';
import { Lock, Mail, Loader2, AlertCircle, ShieldCheck, Compass, Eye, EyeOff } from 'lucide-react';

interface AuthViewProps {
  onAuthSuccess: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onAuthSuccess }) => {
  const [email, setEmail] = useState<string>('gabrielsantosrocha.pro@gmail.com');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        throw error;
      }

      onAuthSuccess();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message === 'Invalid login credentials'
            ? 'Credenciais inválidas. Verifique seu e-mail e senha.'
            : err.message
          : 'Falha na autenticação. Verifique os dados e tente novamente.';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-blueprint-grid min-h-screen relative overflow-hidden flex items-center justify-center p-4 selection:bg-emerald-500 selection:text-white">
      {/* =================================================================== */}
      {/* 1. LUZES AMBIENTES & EFEITOS ESPECIAIS DE ENGENHARIA                */}
      {/* =================================================================== */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-500/15 blur-[120px] pointer-events-none animate-ambient-pulse" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-amber-500/10 blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-sky-500/5 blur-[160px] pointer-events-none" />

      {/* Marcas d'água técnicas de cota e topografia no fundo (CAD Style) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none opacity-40">
        <div className="absolute top-6 left-6 text-[10px] font-mono tracking-widest text-sky-400/70 uppercase">
          [PROJETO]: CHÁCARA • TERRENO 10.00m x 50.00m (500.00m²)
        </div>
        <div className="absolute top-6 right-6 text-[10px] font-mono tracking-widest text-emerald-400/70 uppercase hidden sm:block">
          CUSTO BASE: R$ 50.000,00 • QDO EM 10/04/2022
        </div>
        <div className="absolute bottom-6 left-6 text-[10px] font-mono tracking-widest text-slate-500 uppercase hidden sm:block">
          AUTH: POSTGRESQL RLS • ROW LEVEL SECURITY ATIVO
        </div>
        <div className="absolute bottom-6 right-6 text-[10px] font-mono tracking-widest text-amber-400/70 uppercase flex items-center space-x-1">
          <Compass className="w-3 h-3 text-amber-400" />
          <span>DATUM SIRGAS 2000 • ELEVAÇÃO ±0.00m</span>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 2. CARD PRINCIPAL (OBSIDIAN GLASSMORPHISM)                          */}
      {/* =================================================================== */}
      <div className="relative z-10 max-w-sm w-full bg-slate-900/80 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-slate-700/70 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] animate-fade-in">
        
        {/* Cabeçalho da Marca com o Novo Logotipo Animado */}
        <div className="text-center mb-6 flex flex-col items-center">
          {/* Componente do Logotipo Vetorial com Revelação Progressiva & Glow */}
          <div className="mb-2">
            <BrandLogo size={135} animated={true} />
          </div>

          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center justify-center space-x-1">
            <span>Obra</span>
            <span className="text-emerald-400">Chácara</span>
          </h1>

          <div className="mt-1.5 inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Acesso Restrito • Gabriel Rocha</span>
          </div>

          <p className="text-xs font-medium text-slate-400 mt-1.5 tracking-wide">
            Controle financeiro
          </p>
        </div>

        {/* Mensagem de Erro com Alto Contraste */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl flex items-start space-x-2 text-rose-300 text-xs animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span className="leading-snug">{errorMessage}</span>
          </div>
        )}

        {/* Formulário de Login Seguro */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              E-mail do Proprietário
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                placeholder="seu.email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-xs font-medium text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Senha de Acesso
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-xs font-medium text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 transition-colors"
                aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950/60 flex items-center justify-center space-x-2 transition-all disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Autenticando Acesso...</span>
              </>
            ) : (
              <span>Entrar no Sistema</span>
            )}
          </button>
        </form>

        {/* Rodapé Técnico & Criptografia */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 text-center space-y-1">
          <p className="text-[11px] font-mono text-slate-400">
            Segurança Supabase Auth • AES-256
          </p>
          <p className="text-[10px] text-slate-500">
            Isolamento de dados por Row Level Security no PostgreSQL.
          </p>
        </div>
      </div>
    </div>
  );
};
