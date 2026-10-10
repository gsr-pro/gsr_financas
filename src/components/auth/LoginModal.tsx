import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import {
  X,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Briefcase,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { BrandLogo } from '../brand/BrandLogo';

export type UserRole = 'usuario' | 'contador';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (role: UserRole) => void;
  initialRole?: UserRole;
  onOpenRegister: (role?: UserRole) => void;
  onOpenForgotPassword: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialRole = 'usuario',
  onOpenRegister,
  onOpenForgotPassword,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedRole(initialRole);
      setErrorMessage(null);
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, initialRole, onClose]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        throw error;
      }

      // Salva a persona de login escolhida para restauração de sessão
      localStorage.setItem('gsr_active_role', selectedRole);

      // Se for contador, podemos verificar se o perfil já possui o tipo preenchido ou atualizar
      if (data.user) {
        if (selectedRole === 'contador') {
          // Garante no metadata/perfil a intenção de acesso contábil
          await supabase
            .from('perfis')
            .update({ tipo_perfil: 'contador' })
            .eq('id', data.user.id);
        }
      }

      onSuccess(selectedRole);
      onClose();
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop com Blur suave */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md cursor-pointer transition-opacity"
        aria-hidden="true"
      />

      {/* Modal Dialog com max-h controlado e flex-col */}
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 my-auto flex flex-col max-h-[min(92vh,740px)] animate-scale-up">
        
        {/* Faixa decorativa superior correspondente ao papel */}
        <div
          className={`h-1.5 w-full flex-shrink-0 transition-all duration-300 ${
            selectedRole === 'contador'
              ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-400'
              : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500'
          }`}
        />

        {/* Botão de Fechar com posição fixa e alto contraste */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-30 w-8 h-8 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700/70 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
          title="Fechar"
          aria-label="Fechar"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* Logo e Cabeçalho */}
          <div className="text-center space-y-1.5">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center mx-auto shadow-inner mb-2">
              <BrandLogo size={32} compact={true} animated={false} />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Acessar o GSR Finanças
            </h2>
            <p className="text-xs text-slate-400">
              Escolha seu tipo de perfil para continuar
            </p>
          </div>

          {/* =============================================================== */}
          {/* SELETOR DE PERSONA / PERFIL DE ACESSO (Abas Elegantes)           */}
          {/* =============================================================== */}
          <div className="p-1 rounded-2xl bg-slate-950 border border-slate-800 grid grid-cols-2 gap-1 shadow-inner">
            <button
              type="button"
              onClick={() => {
                setSelectedRole('usuario');
                setErrorMessage(null);
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                selectedRole === 'usuario'
                  ? 'bg-slate-800 text-white shadow-md border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className={`w-3.5 h-3.5 ${selectedRole === 'usuario' ? 'text-emerald-400' : ''}`} />
              <span>Sou Usuário</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedRole('contador');
                setErrorMessage(null);
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                selectedRole === 'contador'
                  ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 shadow-md border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Briefcase className={`w-3.5 h-3.5 ${selectedRole === 'contador' ? 'text-amber-400' : ''}`} />
              <span>Sou Contador ★</span>
            </button>
          </div>

          {/* Informação contextual do perfil selecionado */}
          <div
            className={`p-3 rounded-2xl border text-[11px] leading-relaxed transition-all ${
              selectedRole === 'contador'
                ? 'bg-amber-500/10 border-amber-500/25 text-amber-200/90'
                : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-200/90'
            }`}
          >
            {selectedRole === 'contador' ? (
              <div className="flex items-start space-x-2">
                <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">Acesso Contábil Concedido por E-mail</span>
                  Seu cliente informou seu e-mail no GSR Finanças. Faça login ou, se for seu primeiro acesso, ative sua conta gratuita com esse mesmo e-mail.
                </div>
              </div>
            ) : (
              <div className="flex items-start space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">Finanças Pessoais, Obras & Negócios</span>
                  Acesso completo aos seus ambientes de controle financeiro, custos de construção e precificação PME.
                </div>
              </div>
            )}
          </div>

          {/* Mensagem de Erro */}
          {errorMessage && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-2xl flex items-center space-x-2 text-rose-300 text-xs animate-shake">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Formulário de Login */}
          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* Campo E-mail */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                E-mail de Acesso
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  autoFocus
                  placeholder={selectedRole === 'contador' ? 'contador@escritorio.com.br' : 'seu.email@exemplo.com'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs sm:text-sm font-medium text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-300">
                  Senha
                </label>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenForgotPassword();
                  }}
                  className="text-[11px] text-slate-400 hover:text-emerald-400 hover:underline cursor-pointer"
                >
                  Esqueceu a senha?
                </button>
              </div>

              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Sua senha secreta"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs sm:text-sm font-medium text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-200 cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Botão de Entrar */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center space-x-2 ${
                selectedRole === 'contador'
                  ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-amber-500/25'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/25'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <>
                  <span>
                    {selectedRole === 'contador'
                      ? 'Entrar no Workspace Contábil'
                      : 'Entrar no GSR Finanças'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Rodapé: Link para Cadastro / Primeiro Acesso */}
          <div className="pt-3 border-t border-slate-800 text-center">
            {selectedRole === 'contador' ? (
              <div className="space-y-2">
                <p className="text-xs text-slate-300">
                  Primeiro acesso? Seu cliente te convidou por e-mail?
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenRegister('contador');
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  Ativar Minha Conta Gratuita de Contador
                </button>
                <p className="text-[10px] text-slate-500">
                  Acesso contábil para conciliação dos clientes é 100% gratuito.
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                Ainda não possui uma conta?{' '}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenRegister('usuario');
                  }}
                  className="font-bold text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer ml-1"
                >
                  Comece 7 dias grátis
                </button>
              </p>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
