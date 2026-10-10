import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import {
  X,
  Mail,
  Lock,
  User,
  Briefcase,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  FileCheck,
} from 'lucide-react';
import type { UserRole } from './LoginModal';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (role?: UserRole) => void;
  initialRole?: UserRole;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialRole = 'usuario',
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole);
  const [nome, setNome] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [crcNumero, setCrcNumero] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [registeredSuccess, setRegisteredSuccess] = useState<boolean>(false);

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
            tipo_perfil: selectedRole,
            crc_numero: selectedRole === 'contador' ? crcNumero.trim() : null,
          },
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        throw error;
      }

      // Salva a persona de login escolhida
      localStorage.setItem('gsr_active_role', selectedRole);

      // Se a sessão já foi estabelecida imediatamente (sem confirmação obrigatória de e-mail)
      if (data.session) {
        // Atualiza a tabela pública de perfis
        await supabase.from('perfis').upsert({
          id: data.session.user.id,
          nome: nome.trim(),
          email: email.trim(),
          tipo_perfil: selectedRole === 'usuario' ? 'cliente' : 'contador',
          crc_numero: selectedRole === 'contador' ? crcNumero.trim() : null,
        });

        onSuccess(selectedRole);
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop com Blur suave e clique para fechar */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md cursor-pointer transition-opacity"
        aria-hidden="true"
      />

      {/* Caixa do Modal com max-h controlado e scroll interno inteligente */}
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 my-auto flex flex-col max-h-[min(92vh,740px)] animate-scale-up">
        
        {/* Faixa decorativa superior */}
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
          className="absolute right-3.5 top-3.5 z-30 w-8 h-8 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700/70 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
          title="Fechar"
          aria-label="Fechar"
        >
          <X className="w-4 h-4" />
        </button>

        {registeredSuccess ? (
          /* Estado de Sucesso: Instruções de Confirmação */
          <div className="p-5 sm:p-6 overflow-y-auto flex-1 text-center py-4 space-y-4 animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg sm:text-xl font-black text-white">
                Cadastro Realizado! 🎉
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                Enviamos um e-mail de confirmação para <strong className="text-emerald-400">{email}</strong>.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-left text-xs text-slate-300 space-y-1.5">
              <p className="font-bold text-emerald-300 flex items-center space-x-1.5 text-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Seus 7 Dias Gratuitos Estão Garantidos:</span>
              </p>
              <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
                <li>Abra sua caixa de entrada (ou pasta de spam)</li>
                <li>Clique no botão <strong>"Confirmar Meu E-mail"</strong></li>
                <li>
                  {selectedRole === 'contador'
                    ? 'Seu Workspace Contábil será liberado na hora!'
                    : 'O acesso a todos os módulos será liberado na hora!'}
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Fechar e Fazer Login
            </button>
          </div>
        ) : (
          /* Formulário de Cadastro com Scroll Interno */
          <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-3.5">
            {/* Topo do Modal */}
            <div className="pr-8">
              {selectedRole === 'contador' ? (
                <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                  <Briefcase className="w-3 h-3 text-amber-400" />
                  <span>Acesso Gratuito para Contadores</span>
                </div>
              ) : (
                <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Teste Grátis de 7 Dias • Acesso Total</span>
                </div>
              )}
              <h3 className="text-lg sm:text-xl font-black text-white leading-tight">
                {selectedRole === 'contador'
                  ? 'Ativar Acesso do Contador'
                  : 'Crie sua conta no GSR Finanças'}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                {selectedRole === 'contador'
                  ? 'Cadastre-se com o mesmo e-mail informado pelo seu cliente para ter acesso imediato à escrituração e relatórios.'
                  : 'Sem necessidade de cartão de crédito. Experimente sem compromisso.'}
              </p>
            </div>

            {/* Seletor de Tipo de Perfil */}
            <div className="p-1 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-2 gap-1 shadow-inner">
              <button
                type="button"
                onClick={() => setSelectedRole('usuario')}
                className={`py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                  selectedRole === 'usuario'
                    ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <User className={`w-3.5 h-3.5 ${selectedRole === 'usuario' ? 'text-emerald-400' : ''}`} />
                <span>Usuário / Empresa</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('contador')}
                className={`py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                  selectedRole === 'contador'
                    ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 shadow-sm border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Briefcase className={`w-3.5 h-3.5 ${selectedRole === 'contador' ? 'text-amber-400' : ''}`} />
                <span>Sou Contador ★</span>
              </button>
            </div>

            {errorMessage && (
              <div className="p-2.5 bg-rose-500/15 border border-rose-500/30 rounded-xl flex items-center space-x-2 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-2.5">
              {/* Nome Completo / Nome do Escritório */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-0.5">
                  {selectedRole === 'contador' ? 'Nome do Contador ou Escritório' : 'Nome Completo'}
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder={selectedRole === 'contador' ? 'Ex: Rocha Contabilidade' : 'Ex: Gabriel Rocha'}
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              {/* CRC se for Contador */}
              {selectedRole === 'contador' && (
                <div>
                  <label className="block text-[11px] font-semibold text-amber-300 mb-0.5 flex items-center space-x-1">
                    <FileCheck className="w-3 h-3 text-amber-400" />
                    <span>Registro CRC (Opcional - para relatórios oficiais)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: SP-123456/O"
                    value={crcNumero}
                    onChange={(e) => setCrcNumero(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-amber-500/30 rounded-xl text-xs text-amber-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                  <p className="text-[9px] text-slate-500 mt-0.5">
                    A vinculação aos seus clientes é realizada diretamente pelo seu e-mail.
                  </p>
                </div>
              )}

              {/* E-mail */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-0.5">
                  E-mail de Acesso
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    placeholder="seu.email@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              {/* Senha */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-0.5">
                  Senha (mínimo 6 caracteres)
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Sua senha secreta"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-8 pr-9 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-200"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Confirmar Senha */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-0.5">
                  Confirmar Senha
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Repita a senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              {/* Box de Vantagens e Oferta */}
              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-[10px] text-slate-400 space-y-0.5">
                <div className={`flex items-center space-x-1.5 font-semibold ${selectedRole === 'contador' ? 'text-amber-400' : 'text-emerald-400'}`}>
                  <ShieldCheck className="w-3 h-3" />
                  <span>
                    {selectedRole === 'contador'
                      ? 'Acesso 100% Gratuito para Contadores'
                      : '7 dias 100% grátis sem compromisso'}
                  </span>
                </div>
                <p className="leading-relaxed">
                  {selectedRole === 'contador'
                    ? 'Acesso irrestrito ao painel contábil, conciliação dos clientes via e-mail e exportação e-CAC.'
                    : 'Controle de obras, patrimônio pessoal e negócios PME com relatórios inclusos.'}
                </p>
              </div>

              {/* Botão Cadastrar */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-2.5 px-4 text-slate-950 text-xs font-black rounded-xl shadow-lg flex items-center justify-center space-x-2 transition-all active:scale-95 disabled:opacity-60 cursor-pointer ${
                  selectedRole === 'contador'
                    ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 shadow-amber-500/25'
                    : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 shadow-emerald-500/25'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" />
                    <span>Criando sua conta...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {selectedRole === 'contador'
                        ? 'Ativar Minha Conta Gratuita de Contador'
                        : 'Ativar Meus 7 Dias Grátis'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-950" />
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
