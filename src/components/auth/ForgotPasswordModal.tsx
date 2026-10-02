import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import {
  X,
  Mail,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  initialEmail = '',
}) => {
  const [email, setEmail] = useState<string>(initialEmail);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setEmail(initialEmail);
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [isOpen, initialEmail]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage('Por favor, informe seu endereço de e-mail.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const redirectUrl =
        typeof window !== 'undefined' && !window.location.origin.includes('localhost')
          ? `${window.location.origin}/`
          : 'https://gsr-financas.vercel.app/';

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl,
      });

      if (error) {
        throw error;
      }

      setSuccessMessage(
        `Link de recuperação enviado com sucesso para ${email.trim()}! Verifique sua caixa de entrada e pasta de spam.`
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message.includes('rate limit')
            ? 'Muitas tentativas em pouco tempo. Aguarde alguns minutos antes de tentar novamente.'
            : err.message
          : 'Não foi possível enviar o e-mail de recuperação. Tente novamente.';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-auto text-slate-100">
        
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
          aria-label="Fechar modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Cabeçalho */}
        <div className="space-y-2 text-left">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3 shadow-inner">
            <KeyRound className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-extrabold text-white tracking-tight">
            Recuperar Senha
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Digite o e-mail cadastrado na sua conta. Nós enviaremos um link seguro para você redefinir sua senha.
          </p>
        </div>

        {/* Alerta de Erro */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start space-x-2.5 text-xs text-rose-300 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* Estado de Sucesso */}
        {successMessage ? (
          <div className="space-y-5 animate-fade-in py-2">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start space-x-3 text-xs text-emerald-300 leading-relaxed">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-emerald-200 mb-1">
                  Verifique seu e-mail!
                </span>
                <span>{successMessage}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <span className="font-semibold text-slate-300 block">Dica de segurança:</span>
              <p>O link enviado expira em breve. Ao clicar nele, você será redirecionado para cadastrar sua nova senha com segurança.</p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Voltar ao Login
            </button>
          </div>
        ) : (
          /* Formulário de Envio */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                E-mail Cadastrado
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  autoFocus
                  placeholder="seu.email@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400 transition-all"
                />
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="order-2 sm:order-1 sm:w-1/3 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={loading}
                className="order-1 sm:order-2 flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 rounded-xl text-xs font-black shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2 transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Enviando link...</span>
                  </>
                ) : (
                  <>
                    <span>Enviar Link de Recuperação</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Rodapé de Segurança */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-center space-x-2 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Recuperação protegida por Supabase Auth & criptografia</span>
        </div>

      </div>
    </div>
  );
};
