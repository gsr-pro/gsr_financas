import React, { useState } from 'react';
import { BrandLogo } from '../components/brand/BrandLogo';
import { RemotionLogoShowcase } from '../components/remotion/RemotionLogoShowcase';
import { RegisterModal } from '../components/auth/RegisterModal';
import { LoginModal, type UserRole } from '../components/auth/LoginModal';
import { ForgotPasswordModal } from '../components/auth/ForgotPasswordModal';
import { PaywallView } from '../components/subscription/PaywallView';
import {
  Lock,
  Building2,
  Wallet,
  Briefcase,
  FileSpreadsheet,
  Calendar,
  Repeat,
  CheckCircle2,
  ArrowRight,
  ArrowDown,
  FileDown,
  ShieldCheck,
  Zap,
  Sparkles,
} from 'lucide-react';
import { exportCommercialPlansPDF } from '../lib/exportCommercialPlansPDF';

interface AuthViewProps {
  onAuthSuccess: (role?: UserRole) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onAuthSuccess }) => {
  const [loginModalOpen, setLoginModalOpen] = useState<boolean>(false);
  const [activeLoginRole, setActiveLoginRole] = useState<UserRole>('usuario');
  const [registerModalOpen, setRegisterModalOpen] = useState<boolean>(false);
  const [forgotPasswordModalOpen, setForgotPasswordModalOpen] = useState<boolean>(false);
  const [plansModalOpen, setPlansModalOpen] = useState<boolean>(false);

  const handleOpenLogin = (role: UserRole = 'usuario') => {
    setActiveLoginRole(role);
    setLoginModalOpen(true);
  };

  const handleOpenRegister = (role: UserRole = 'usuario') => {
    setActiveLoginRole(role);
    setRegisterModalOpen(true);
  };

  return (
    <div className="bg-blueprint-grid min-h-screen text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white relative overflow-x-hidden">
      {/* Luzes de Fundo e Atmosfera de Engenharia */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-500/15 blur-[120px] pointer-events-none animate-ambient-pulse" />
      <div className="absolute top-1/3 -right-32 w-96 h-96 rounded-full bg-cyan-500/10 blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-amber-500/5 blur-[180px] pointer-events-none" />

      {/* =================================================================== */}
      {/* 1. TOP BAR / HEADER MODERNO DA LANDING PAGE                         */}
      {/* =================================================================== */}
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800/90 shadow-2xl transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          
          {/* Marca / Identidade: Gestão Financeira */}
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center shadow-inner overflow-hidden flex-shrink-0">
              <BrandLogo size={28} compact={true} animated={false} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="text-base font-extrabold text-white tracking-tight">GSR</span>
                <span className="text-base font-extrabold text-emerald-400">Finanças</span>
              </div>
              <p className="text-[10px] font-medium text-slate-400 tracking-wide hidden sm:block">
                Gestão Financeira Facilitada • Obras, Negócios & Escrituração Fiscal
              </p>
            </div>
          </div>

          {/* Links e Botões de Ação na Direita */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Atalho para Área do Contador */}
            <button
              type="button"
              onClick={() => handleOpenLogin('contador')}
              className="hidden md:inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:text-amber-200 text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
              title="Acesso gratuito para contadores outorgados por clientes via e-mail"
            >
              <Briefcase className="w-3.5 h-3.5 text-amber-400" />
              <span>Área do Contador ★</span>
            </button>

            {/* Botão Acessar Sistema (Login) */}
            <button
              type="button"
              onClick={() => handleOpenLogin('usuario')}
              className="px-3.5 sm:px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 hover:text-white transition-all shadow-sm active:scale-95 cursor-pointer flex items-center space-x-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Acessar Sistema</span>
            </button>

            {/* Botão Começar 7 Dias Grátis */}
            <button
              type="button"
              onClick={() => handleOpenRegister('usuario')}
              className="px-3.5 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black shadow-md shadow-emerald-500/20 transition-all cursor-pointer active:scale-95 flex items-center space-x-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
              <span className="hidden sm:inline">Começar 7 Dias Grátis</span>
              <span className="sm:hidden">7 Dias Grátis</span>
            </button>
          </div>

        </div>
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
                <span>Teste Gratuito de 7 Dias • Obras, Negócios, Pessoal & Carnê-Leão</span>
              </div>

              {/* Título Principal */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
                Gestão financeira facilitada para suas <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">obras, negócios e escrituração fiscal.</span>
              </h1>

              {/* Subtítulo */}
              <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Centralize custos de construção, controle de insumos e precificação de produtos para pequenas empresas, finanças pessoais e exportação automática para o Carnê-Leão Web e-CAC em um único painel inteligente.
              </p>

              {/* Ações / Botões Rápidos */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleOpenRegister('usuario')}
                  className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold rounded-2xl shadow-xl shadow-emerald-500/25 flex items-center justify-center space-x-2 text-sm transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 fill-slate-950" />
                  <span>Experimentar 7 Dias Grátis</span>
                  <ArrowRight className="w-4 h-4 text-slate-950" />
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenLogin('usuario')}
                  className="w-full sm:w-auto px-5 py-3.5 bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-slate-200 hover:text-white font-bold rounded-2xl flex items-center justify-center space-x-2 text-sm transition-all cursor-pointer active:scale-95"
                >
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <span>Acessar Sistema</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const section = document.getElementById('planos');
                    if (section) {
                      section.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="w-full sm:w-auto px-4 py-3.5 bg-slate-900/60 hover:bg-slate-800/60 border border-slate-800 text-slate-400 hover:text-slate-200 font-semibold rounded-2xl flex items-center justify-center space-x-2 text-sm transition-all cursor-pointer"
                >
                  <span>Ver Planos</span>
                  <ArrowDown className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              {/* Callout Especial: Área do Contador (Concessão por E-mail) */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">É Contador ou Escritório Contábil?</span>
                    <span className="text-[11px] text-amber-200/90">
                      Seu cliente concede acesso pelo seu <strong>e-mail</strong>. Acesse ou ative sua conta gratuita para auditar e exportar para o e-CAC.
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-stretch sm:self-auto">
                  <button
                    type="button"
                    onClick={() => handleOpenLogin('contador')}
                    className="flex-1 sm:flex-initial px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer active:scale-95 whitespace-nowrap text-center"
                  >
                    Entrar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenRegister('contador')}
                    className="flex-1 sm:flex-initial px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-bold text-xs transition-all cursor-pointer active:scale-95 whitespace-nowrap text-center"
                    title="Seu cliente já informou seu e-mail? Ative sua conta gratuita"
                  >
                    Primeiro Acesso
                  </button>
                </div>
              </div>

              {/* Selos de Confiança Técnica */}
              <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-slate-400">
                <div className="flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Segurança PostgreSQL RLS</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  <span>3 Ambientes Integrados</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>Carnê-Leão Web Oficial</span>
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
                      Obra • Negócio • Pessoal • Fiscal
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
                    GSR Finanças • Gestão Financeira Facilitada
                  </p>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Custos de construção, precificação por insumos para pequenos negócios e orçamento pessoal em uma única plataforma fluida.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* =================================================================== */}
        {/* 3. RECURSOS PRINCIPAIS: OS TRÊS AMBIENTES NATIVOS                   */}
        {/* =================================================================== */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full border-t border-slate-800/80">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
              Três Ambientes em Um Só App
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-3">
              Projetado para quem constrói, empreende e investe
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Alterne em 1 clique entre o canteiro de obras, a gestão do seu pequeno negócio e o orçamento diário da família.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Pilar 1: Custo de Obra & Reformas */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 hover:border-emerald-500/40 transition-all group flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4 text-emerald-400 group-hover:scale-110 transition-transform">
                  <Building2 className="w-6 h-6" />
                </div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-[10px] font-mono uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    Ambiente de Obra
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Custos de Obra & Terreno</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Controle cada centavo da construção ou reforma: materiais, fundação, acabamento e mão de obra. Calcule o custo real por metro quadrado e anexe comprovantes.
                </p>
              </div>
              <ul className="text-xs space-y-1.5 text-slate-300 pt-2 border-t border-slate-800/60">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>Anexo de notas e recibos de pagamento</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>Valor de aquisição de terreno e evolução</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>Contas quitadas vs pendentes em tempo real</span>
                </li>
              </ul>
            </div>

            {/* Pilar 2: Negócios & PME */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 hover:border-indigo-500/40 transition-all group flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mb-4 text-indigo-400 group-hover:scale-110 transition-transform">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-[10px] font-mono uppercase font-bold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded">
                    Ambiente Negócio
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Gestão de Negócio & PME</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Perfeito para pequenas empresas, marcenarias, oficinas, ateliês e prestadores. Precifique produtos por insumos, mão de obra e embalagens com margem líquida precisa.
                </p>
              </div>
              <ul className="text-xs space-y-1.5 text-slate-300 pt-2 border-t border-slate-800/60">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                  <span>Calculadora de Precificação & Markup Divisor</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                  <span>Ficha técnica de insumos e ponto de equilíbrio</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                  <span>Separação de vendas, custos fixos e impostos</span>
                </li>
              </ul>
            </div>

            {/* Pilar 3: Finanças Pessoais */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 hover:border-cyan-500/40 transition-all group flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-4 text-cyan-400 group-hover:scale-110 transition-transform">
                  <Wallet className="w-6 h-6" />
                </div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-[10px] font-mono uppercase font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">
                    Ambiente Pessoal
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Finanças Pessoais & Investimentos</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Controle receitas, salários, despesas diárias, cartões e projetos familiares. Conte com painel dedicado para investimentos e reserva de emergência.
                </p>
              </div>
              <ul className="text-xs space-y-1.5 text-slate-300 pt-2 border-t border-slate-800/60">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                  <span>Acompanhamento de CDB, Poupança e Tesouro</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                  <span>Fluxo de caixa de receitas vs despesas</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                  <span>Categorias dinâmicas criadas em segundos</span>
                </li>
              </ul>
            </div>

          </div>
        </section>

        {/* =================================================================== */}
        {/* 4. RECURSOS EXCLUSIVOS: RELATÓRIOS, FILTROS E AUTOMAÇÃO            */}
        {/* =================================================================== */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full border-t border-slate-800/80 bg-slate-950/40">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Recursos Avançados para Produtividade Máxima
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Funcionalidades pensadas para você economizar horas de trabalho burocrático e tomar decisões com segurança.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Feature 1: Exportação Carnê-Leão e-CAC */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 transition-all space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white">Carnê-Leão Web Oficial</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Exportação em lote de Rendimentos e Pagamentos (Livro Caixa) homologada no padrão oficial da Receita Federal (e-CAC).
              </p>
            </div>

            {/* Feature 2: Filtro de Período Inteligente */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 transition-all space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Calendar className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white">Filtro de Período Dinâmico</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Navegue mês a mês e ano a ano nos lançamentos e no dashboard com atalhos ágeis como "Mês Atual" e "Histórico Completo".
              </p>
            </div>

            {/* Feature 3: Lançamentos Recorrentes */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 transition-all space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Repeat className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white">Lançamentos Recorrentes</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Cadastre despesas e receitas fixas com agendamento automático para até 12 meses futuros, com status programado para auditoria.
              </p>
            </div>

            {/* Feature 4: Segurança Bancária PostgreSQL */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 transition-all space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white">Segurança PostgreSQL RLS</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Seus dados isolados por usuário com políticas rígidas de Row Level Security, criptografia em trânsito e conformidade total com a LGPD.
              </p>
            </div>
          </div>
        </section>

        {/* =================================================================== */}
        {/* 5. PLANOS E MODELO 7-DAY FREE TRIAL                                */}
        {/* =================================================================== */}
        <section id="planos" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full border-t border-slate-800/80 scroll-mt-12">

          {/* Banner de Destaque Executivo & Download para o Time Comercial / Clientes */}
          <div className="mb-8 p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center space-x-3.5 text-center sm:text-left">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
                <FileDown className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center justify-center sm:justify-start space-x-2">
                  <span>Apresentação Comercial & Tabela de Recursos</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold">
                    PDF Oficial
                  </span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Baixe o material executivo completo com a matriz técnica de todos os recursos para apresentar a clientes, sócios ou equipe.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => exportCommercialPlansPDF()}
              className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs flex items-center justify-center space-x-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer flex-shrink-0"
            >
              <FileDown className="w-4 h-4 fill-slate-950" />
              <span>Baixar Material dos Planos (PDF)</span>
            </button>
          </div>

          <PaywallView
            reason="landing_page"
            isInline={true}
            onSelectPlan={() => handleOpenRegister('usuario')}
          />

          <div className="mt-8 text-center space-y-2">
            <div>
              <span className="text-xs text-slate-400">Já possui uma conta ativa? </span>
              <button
                type="button"
                onClick={() => handleOpenLogin('usuario')}
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition-colors cursor-pointer"
              >
                Acessar o Sistema
              </button>
            </div>
            <div>
              <span className="text-xs text-slate-500">É profissional contábil outorgado por cliente? </span>
              <button
                type="button"
                onClick={() => handleOpenLogin('contador')}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 underline underline-offset-2 transition-colors cursor-pointer"
              >
                Acessar Área do Contador (Concessão por E-mail)
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* =================================================================== */}
      {/* 6. RODAPÉ INSTITUCIONAL & ENGENHARIA DE SEGURANÇA                   */}
      {/* =================================================================== */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-400">GSR Finanças SaaS</span>
            <span>•</span>
            <span>Segurança Supabase Auth & PostgreSQL RLS</span>
          </div>

          <div className="flex items-center space-x-4 text-[11px] font-mono">
            <span>Nuvem em Tempo Real</span>
            <span>•</span>
            <span>Criptografia AES-256</span>
            <span>•</span>
            <span>Conformidade e-CAC & LGPD</span>
          </div>
        </div>
      </footer>

      {/* Modal de Login com Persona (Usuário vs Contador) */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onSuccess={(role) => onAuthSuccess(role)}
        initialRole={activeLoginRole}
        onOpenRegister={(role) => handleOpenRegister(role)}
        onOpenForgotPassword={() => setForgotPasswordModalOpen(true)}
      />

      {/* Modal de Cadastro com 7 Dias Grátis */}
      <RegisterModal
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        onSuccess={(role) => onAuthSuccess(role)}
        initialRole={activeLoginRole}
      />

      {/* Modal de Recuperação de Senha */}
      <ForgotPasswordModal
        isOpen={forgotPasswordModalOpen}
        onClose={() => setForgotPasswordModalOpen(false)}
      />

      {/* Modal de Planos */}
      {plansModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fade-in">
          <PaywallView
            reason="landing_page"
            onClose={() => setPlansModalOpen(false)}
            onSelectPlan={() => {
              setPlansModalOpen(false);
              handleOpenRegister('usuario');
            }}
          />
        </div>
      )}
    </div>
  );
};
