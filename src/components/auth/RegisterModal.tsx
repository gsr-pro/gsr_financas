import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import {
  X,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [nome, setNome] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [registeredSuccess, setRegisteredSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password.length < 6) {
      setErrorMessage('A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('As senhas informadas não coincidem.');
      return;
    }

    setLoading(true);

    try {
      const redirectUrl =
        typeof window !== 'undefined' && !window.location.origin.includes('localhost')
          ? `${window.location.origin}/`
          : 'https://gsr-financas.vercel.app/';

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            nome: nome.trim(),
          },
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        throw error;
      }

      // Se a sessão já foi estabelecida imediatamente (sem confirmação obrigatória de e-mail)
      if (data.session) {
        onSuccess();
        onClose();
        return;
      }

      // Caso exija confirmação por e-mail
      setRegisteredSuccess(true);
    } catch (err: unknown) {
      console.error('Erro ao realizar cadastro:', err);
      let message = 'Falha ao realizar cadastro. Tente novamente.';
      if (err instanceof Error) {
        if (err.message.includes('already registered')) {
          message = 'Este endereço de e-mail já está cadastrado. Tente entrar.';
        } else {
          message = err.message;
        }
      }
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative my-8">
        
        {/* Botão de Fechar */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {registeredSuccess ? (
          /* Estado de Sucesso: Instruções de Confirmação */
          <div className="text-center py-4 space-y-4 animate-fade-in">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-white">
                Cadastro Realizado! 🎉
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                Enviamos um e-mail de confirmação para <strong className="text-emerald-400">{email}</strong> com o visual oficial da plataforma.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-left text-xs text-slate-300 space-y-2">
              <p className="font-bold text-emerald-300 flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Seus 7 Dias Gratuitos Estão Garantidos:</span>
              </p>
              <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
                <li>Abra sua caixa de entrada (ou pasta de spam)</li>
                <li>Clique no botão <strong>"Confirmar Meu E-mail"</strong></li>
                <li>O acesso a todos os módulos será liberado na hora!</li>
              </ul>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Fechar e Fazer Login
            </button>
          </div>
        ) : (
          /* Formulário de Cadastro */
          <div className="space-y-5">
            {/* Topo do Modal */}
            <div>
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Teste Grátis de 7 Dias • Acesso Total</span>
              </div>
              <h3 className="text-xl font-black text-white">
                Crie sua conta gratuita
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Sem necessidade de cartão de crédito. Teste todas as funções de obras e finanças por 7 dias.
              </p>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl flex items-center space-x-2 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Nome Completo */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome Completo
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: Gabriel Rocha"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              {/* E-mail */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  E-mail de Acesso
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="seu.email@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              {/* Senha */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Senha (mínimo 6 caracteres)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Sua senha secreta"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirmar Senha */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Confirmar Senha
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Repita a senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              {/* Box de Vantagens e Oferta */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                <div className="flex items-center space-x-1.5 text-emerald-400 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>7 dias 100% grátis sem compromisso</span>
                </div>
                <p>
                  Depois do teste, aproveite a oferta de lançamento: <strong>50% OFF nos 2 primeiros meses</strong> (R$ 7,45/mês).
                </p>
              </div>

              {/* Botão Cadastrar */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2 transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Criando sua conta...</span>
                  </>
                ) : (
                  <>
                    <span>Ativar Meus 7 Dias Grátis</span>
                    <ArrowRight className="w-4 h-4 text-slate-950" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};
