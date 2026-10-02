import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import {
  X,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (newPassword.length < 6) {
      setErrorMessage('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('As senhas informadas não coincidem.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw error;
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1800);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Falha ao redefinir senha. O link pode ter expirado. Tente solicitar novamente.';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-auto text-slate-100">
        
        {/* Botão Fechar */}
        {!success && (
          <button
            onClick={onClose}
            type="button"
            className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
            aria-label="Fechar modal"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Cabeçalho */}
        <div className="space-y-2 text-left">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3 shadow-inner">
            <KeyRound className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-extrabold text-white tracking-tight">
            Criar Nova Senha
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Defina uma nova senha segura para acessar sua conta na GSR Finanças.
          </p>
        </div>

        {/* Mensagem de Erro */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start space-x-2.5 text-xs text-rose-300 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* Mensagem de Sucesso */}
        {success ? (
          <div className="space-y-4 animate-fade-in py-3 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">Senha Alterada com Sucesso!</h4>
              <p className="text-xs text-slate-400 mt-1">
                Redirecionando você para o painel principal...
              </p>
            </div>
          </div>
        ) : (
          /* Formulário de Redefinição */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nova Senha (mínimo 6 caracteres)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  placeholder="Digite sua nova senha"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-200"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Confirmar Nova Senha
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Repita sua nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400 transition-all"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-xl text-xs font-black shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Salvando nova senha...</span>
                  </>
                ) : (
                  <span>Definir Nova Senha e Entrar</span>
                )}
              </button>
            </div>
          </form>
        )}

        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-center space-x-2 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Sessão segura autenticada por Supabase</span>
        </div>

      </div>
    </div>
  );
};
