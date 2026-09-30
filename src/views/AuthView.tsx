import React, { useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { BrandLogo } from '../components/brand/BrandLogo';
import { RemotionLogoShowcase } from '../components/remotion/RemotionLogoShowcase';
import { RegisterModal } from '../components/auth/RegisterModal';
import {
  Lock,
  Mail,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Building2,
  Wallet,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Layers,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

interface AuthViewProps {
  onAuthSuccess: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onAuthSuccess }) => {
  const [email, setEmail] = useState<string>('gabrielsantosrocha.pro@gmail.com');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mobileLoginOpen, setMobileLoginOpen] = useState<boolean>(false);
  const [registerModalOpen, setRegisterModalOpen] = useState<boolean>(false);

  const emailInputRef = useRef<HTMLInputElement>(null);

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

  const focusLoginInput = () => {
    setMobileLoginOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      emailInputRef.current?.focus();
    }, 300);
  };

  return (
    <div className="bg-blueprint-grid min-h-screen text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white relative overflow-x-hidden">
      {/* Luzes de Fundo e Atmosfera de Engenharia */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-500/15 blur-[120px] pointer-events-none animate-ambient-pulse" />
      <div className="absolute top-1/3 -right-32 w-96 h-96 rounded-full bg-cyan-500/10 blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-amber-500/5 blur-[180px] pointer-events-none" />

      {/* =================================================================== */}
      {/* 1. TOP BAR / HEADER COM LOGIN SUPERIOR INTEGRADO                   */}
      {/* =================================================================== */}
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800/90 shadow-2xl transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
          
          {/* Marca / Identidade: Gestão Financeira */}
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center shadow-inner overflow-hidden flex-shrink-0">
              <BrandLogo size={32} compact={true} animated={false} />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-base font-extrabold text-white tracking-tight">Gestão</span>
                <span className="text-base font-extrabold text-emerald-400">Financeira</span>
              </div>
              <p className="text-[10px] font-medium text-slate-400 tracking-wide">
                Controle financeiro de obras & finanças pessoais
              </p>
            </div>
          </div>

          {/* Botão de Toggle para Mobile */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setMobileLoginOpen(!mobileLoginOpen)}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center space-x-1.5 active:scale-95 transition-all"
            >
              <span>Acessar Conta</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${mobileLoginOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Formulário de Login Superior Inline (Desktop) */}
          <form
            onSubmit={handleLogin}
            className="hidden lg:flex items-center space-x-2.5"
          >
            {/* Campo E-mail */}
            <div className="relative">
              <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                ref={emailInputRef}
                type="email"
                required
                placeholder="seu.email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-56 pl-8 pr-3 py-1.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs font-medium text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400 transition-all"
              />
            </div>

            {/* Campo Senha */}
            <div className="relative">
              <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-44 pl-8 pr-8 py-1.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs font-medium text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-200"
                tabIndex={-1}
                aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Botão Entrar */}
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 hover:text-white rounded-xl text-xs font-bold border border-slate-700 flex items-center space-x-1.5 transition-all disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>Entrando...</span>
                </>
              ) : (
                <span>Entrar</span>
              )}
            </button>

            {/* Botão Destacado: Criar Conta Gratuita */}
            <button
              type="button"
              onClick={() => setRegisterModalOpen(true)}
              className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-xl text-xs font-black shadow-md shadow-emerald-500/20 flex items-center space-x-1.5 transition-all cursor-pointer active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
              <span>Criar Conta (7 Dias Grátis)</span>
            </button>
          </form>
        </div>

        {/* Gaveta Superior de Login para Mobile / Telas Menores */}
        {mobileLoginOpen && (
          <div className="lg:hidden border-t border-slate-800 bg-slate-900/98 p-4 animate-fade-in shadow-2xl space-y-3">
            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  E-mail de Acesso
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    placeholder="seu.email@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-9 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400"
                    aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all disabled:opacity-60 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Entrando...</span>
                    </>
                  ) : (
                    <span>Entrar</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMobileLoginOpen(false);
                    setRegisterModalOpen(true);
                  }}
                  className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 rounded-xl text-xs font-black flex items-center justify-center space-x-1.5 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
                  <span>7 Dias Grátis</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Mensagem de Erro Superior */}
        {errorMessage && (
          <div className="bg-rose-500/15 border-b border-rose-500/30 px-4 py-2 flex items-center justify-center space-x-2 text-rose-300 text-xs animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </header>

      {/* =================================================================== */}
      {/* 2. HERO SECTION COM REMOTION ENGINE SHOWCASE                       */}
      {/* =================================================================== */}
      <main className="flex-1 flex flex-col justify-center">
        <section className="relative pt-12 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Coluna Esquerda: Texto de Impacto SaaS */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              
              {/* Badge de Destaque */}
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold shadow-inner">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Teste Gratuito de 7 Dias Liberado • Sem Cobrança Imediata</span>
              </div>

              {/* Título Principal */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
                A inteligência financeira definitiva para suas <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">obras e patrimônio.</span>
              </h1>

              {/* Subtítulo */}
              <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Diga adeus a planilhas confusas e perdas financeiras invisíveis. Centralize custos de construção, reformas, notas fiscais e finanças pessoais em um único painel em tempo real.
              </p>

              {/* Ações / Botões Rápidos */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start space-y-3 sm:space-y-0 sm:space-x-4 pt-2">
                <button
                  type="button"
                  onClick={() => setRegisterModalOpen(true)}
                  className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold rounded-2xl shadow-xl shadow-emerald-500/25 flex items-center justify-center space-x-2 text-sm transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 fill-slate-950" />
                  <span>Experimentar 7 Dias Grátis</span>
                  <ArrowRight className="w-4 h-4 text-slate-950" />
                </button>

                <a
                  href="#planos"
                  className="w-full sm:w-auto px-6 py-3.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-slate-200 font-bold rounded-2xl flex items-center justify-center space-x-2 text-sm transition-all"
                >
                  <span>Ver Planos & Recursos</span>
                </a>
              </div>

              {/* Selos de Confiança Técnica */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-slate-400">
                <div className="flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Segurança PostgreSQL RLS</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  <span>Ambientes Multi-Tenant</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>Mobile-First & Desktop</span>
                </div>
              </div>
            </div>

            {/* Coluna Direita: Showcase com Efeito Especial REMOTION */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center">
              <div className="relative w-full max-w-md bg-slate-900/60 backdrop-blur-2xl rounded-3xl p-6 border border-slate-800/80 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)]">
                
                {/* Cabeçalho do Card */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-300 font-semibold">
                      Ambientes Integrados • Obra & Pessoal
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                    Tempo Real
                  </span>
                </div>

                {/* Componente Remotion que calcula interpolações frame a frame */}
                <RemotionLogoShowcase size={280} autoPlay={true} />

                {/* Legenda Alinhada ao Sistema */}
                <div className="mt-4 pt-4 border-t border-slate-800/80 text-center space-y-1">
                  <p className="text-xs font-bold text-slate-200">
                    Controle Total de Obras & Finanças
                  </p>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Gerencie custos de materiais, mão de obra e seu orçamento diário em um só lugar, com clareza e previsibilidade financeira.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* =================================================================== */}
        {/* 3. RECURSOS PRINCIPAIS: OS TRÊS PILARES                             */}
        {/* =================================================================== */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full border-t border-slate-800/80">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Projetado para quem constrói e investe
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Um ecossistema dinâmico que se molda à sua rotina, no canteiro de obras ou no escritório.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Pilar 1: Custo de Obra */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 hover:border-emerald-500/40 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4 text-emerald-400 group-hover:scale-110 transition-transform">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Custo de Obra & Reformas</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Separe cada etapa da construção: fundação, alvenaria, acabamento e mão de obra. Calcule o custo real por metro quadrado e antecipe desvios de orçamento.
              </p>
              <ul className="text-xs space-y-1.5 text-slate-300">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>Anexo de fotos e recibos</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>Evolução física do terreno</span>
                </li>
              </ul>
            </div>

            {/* Pilar 2: Finanças Pessoais */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 hover:border-cyan-500/40 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-4 text-cyan-400 group-hover:scale-110 transition-transform">
                <Wallet className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Finanças Pessoais Dinâmicas</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Alterne instantaneamente para o controle financeiro diário, gastos fixos, cartões e projetos específicos sem misturar as contas da obra.
              </p>
              <ul className="text-xs space-y-1.5 text-slate-300">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                  <span>Categorias criadas na hora</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                  <span>Separação de múltiplos orçamentos</span>
                </li>
              </ul>
            </div>

            {/* Pilar 3: Arquitetura SaaS */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 hover:border-amber-500/40 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4 text-amber-400 group-hover:scale-110 transition-transform">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">SaaS Multi-Ambiente</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Isolamento estrito com PostgreSQL Row Level Security (RLS). Seus dados são criptografados, protegidos e acessíveis de qualquer dispositivo móvel ou desktop.
              </p>
              <ul className="text-xs space-y-1.5 text-slate-300">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span>Isolamento total por usuário</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span>Sincronização instantânea na nuvem</span>
                </li>
              </ul>
            </div>

          </div>
        </section>

        {/* =================================================================== */}
        {/* 4. PLANOS E MODELO 7-DAY FREE TRIAL                                */}
        {/* =================================================================== */}
        <section id="planos" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full border-t border-slate-800/80">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
              Plano Único Completo • Sem Pegadinhas
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-3">
              Um valor acessível. Todos os recursos liberados.
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Comece com 7 dias grátis. Tenha controle simultâneo de obras, reformas e finanças pessoais.
            </p>
          </div>

          <div className="max-w-xl mx-auto pt-4">
            {/* Card do Plano Único Gestão Completa Pro */}
            <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-emerald-500/70 rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_-10px_rgba(16,185,129,0.3)] relative">
              <div className="absolute -top-3.5 right-6 z-20 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-[10px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-lg shadow-emerald-950/60 flex items-center space-x-1 border border-emerald-300/40">
                <Zap className="w-3 h-3 fill-slate-950" />
                <span>Tudo Incluso • Sem Limites</span>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl sm:text-2xl font-black text-white">Gestão Completa Pro</h3>
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
                    Multi-Ambiente
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Ideal para quem constrói, reforma ou quer manter as contas pessoais e investimentos em ordem no mesmo app.
                </p>
              </div>

              {/* Preço de R$ 14,90 com 50% OFF nos 2 primeiros meses */}
              <div className="mb-6 p-4 rounded-2xl bg-slate-950/60 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold tracking-wide uppercase border border-emerald-500/40 mb-2">
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    <span>50% OFF nos 2 primeiros meses</span>
                  </div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-3xl sm:text-4xl font-black text-emerald-400">R$ 7,45</span>
                    <span className="text-xs text-slate-400">/mês</span>
                    <span className="text-xs text-slate-500 line-through">R$ 14,90</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono block mt-1">
                    A partir do 3º mês: R$ 14,90/mês • Cancele quando quiser
                  </span>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded-full font-bold inline-block">
                    7 Dias Grátis
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">Acesso completo imediato</span>
                </div>
              </div>

              {/* Lista Completa de Recursos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-8 text-xs text-slate-300">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Ambientes de <strong>Custo de Obra</strong></span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Ambientes de <strong>Finanças Pessoais</strong></span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Crie <strong>múltiplos projetos</strong></span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span><strong>Categorias na hora</strong> no lançamento</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Upload de <strong>recibos e fotos</strong></span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Custo por m² e evolução física</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Dashboard e relatórios em tempo real</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Segurança PostgreSQL RLS</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setRegisterModalOpen(true)}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black rounded-2xl shadow-xl shadow-emerald-500/25 flex items-center justify-center space-x-2 text-sm transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 fill-slate-950" />
                <span>Começar 7 Dias Grátis Agora</span>
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </button>

              <div className="mt-4 text-center">
                <span className="text-xs text-slate-400">Já possui uma conta ativa? </span>
                <button
                  type="button"
                  onClick={focusLoginInput}
                  className="text-xs font-bold text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition-colors cursor-pointer"
                >
                  Fazer Login
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* =================================================================== */}
      {/* 5. RODAPÉ INSTITUCIONAL & ENGENHARIA DE SEGURANÇA                   */}
      {/* =================================================================== */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-400">Gestão Financeira</span>
            <span>•</span>
            <span>Segurança Supabase Auth & PostgreSQL RLS</span>
          </div>

          <div className="flex items-center space-x-4 text-[11px] font-mono">
            <span>Nuvem em Tempo Real</span>
            <span>•</span>
            <span>Criptografia AES-256</span>
            <span>•</span>
            <span>Conformidade LGPD</span>
          </div>
        </div>
      </footer>

      {/* Modal de Cadastro com 7 Dias Grátis */}
      <RegisterModal
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        onSuccess={onAuthSuccess}
      />
    </div>
  );
};
