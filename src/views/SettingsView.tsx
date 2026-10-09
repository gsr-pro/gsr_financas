import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useWorkspace } from '../context/WorkspaceContext';
import { useSubscription } from '../context/SubscriptionContext';
import { PLANS } from '../config/plans';
import { CreateCategoryModal } from '../components/category/CreateCategoryModal';
import { ManageCategoriesModal } from '../components/category/ManageCategoriesModal';
import { WorkspaceModal } from '../components/workspace/WorkspaceModal';
import { DeleteWorkspaceModal } from '../components/workspace/DeleteWorkspaceModal';
import { formatCurrency, formatDate } from '../lib/formatters';
import type { WorkspaceRow } from '../types/app';
import { PaywallView } from '../components/subscription/PaywallView';
import { CancelSubscriptionModal } from '../components/subscription/CancelSubscriptionModal';
import {
  Settings,
  Building2,
  Tag,
  Plus,
  CreditCard,
  CheckCircle2,
  Pencil,
  Trash2,
  MapPin,
  Maximize2,
  DollarSign,
  Calendar,
  Layers,
  Clock,
  ArrowRight,
  User,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  Save,
  Loader2,
  AlertCircle,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

import { PROPERTY_TYPES } from '../config/businessRules';

const TIPO_IMOVEL_LABELS: Record<string, string> = PROPERTY_TYPES;

interface SettingsViewProps {
  onProfileUpdated?: (updated: { email: string; name: string }) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onProfileUpdated }) => {
  const {
    currentEnvironment,
    currentWorkspace,
    workspaces,
    categories,
    selectWorkspace,
  } = useWorkspace();

  const {
    subscription,
    currentPlanTier,
    isTrialing,
    trialDaysRemaining,
    reactivateSubscription,
  } = useSubscription();
  const plan = PLANS[currentPlanTier];

  // Modais de Categoria e Workspace
  const [categoryModalOpen, setCategoryModalOpen] = useState<boolean>(false);
  const [manageCategoriesModalOpen, setManageCategoriesModalOpen] = useState<boolean>(false);
  const [workspaceModalOpen, setWorkspaceModalOpen] = useState<boolean>(false);
  const [workspaceToEdit, setWorkspaceToEdit] = useState<WorkspaceRow | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [workspaceToDelete, setWorkspaceToDelete] = useState<WorkspaceRow | null>(null);
  const [paywallModalOpen, setPaywallModalOpen] = useState<boolean>(false);
  const [cancelModalOpen, setCancelModalOpen] = useState<boolean>(false);
  const [reactivateLoading, setReactivateLoading] = useState<boolean>(false);
  const [reactivateSuccessMessage, setReactivateSuccessMessage] = useState<string | null>(null);
  const [reactivateErrorMessage, setReactivateErrorMessage] = useState<string | null>(null);

  // Estados do Perfil e Credenciais da Conta
  const [profileName, setProfileName] = useState<string>('');
  const [profileEmail, setProfileEmail] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [profileLoading, setProfileLoading] = useState<boolean>(false);
  const [profileSuccessMessage, setProfileSuccessMessage] = useState<string | null>(null);
  const [profileErrorMessage, setProfileErrorMessage] = useState<string | null>(null);

  // Carrega dados do usuário atual autenticado
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const metadataName = (user.user_metadata?.nome || user.user_metadata?.full_name || '') as string;
          setProfileEmail(user.email || '');
          setProfileName(metadataName || (user.email ? user.email.split('@')[0] : ''));
        }
      } catch (err: unknown) {
        console.error('Erro ao obter usuário autenticado:', err);
      }
    };

    loadUserData();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileErrorMessage(null);
    setProfileSuccessMessage(null);

    if (!profileName.trim()) {
      setProfileErrorMessage('Por favor, informe seu nome de exibição.');
      return;
    }

    if (!profileEmail.trim() || !profileEmail.includes('@')) {
      setProfileErrorMessage('Por favor, informe um endereço de e-mail válido.');
      return;
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        setProfileErrorMessage('A nova senha deve ter no mínimo 6 caracteres.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setProfileErrorMessage('A confirmação de senha não confere com a nova senha.');
        return;
      }
    }

    setProfileLoading(true);

    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser) {
        throw new Error('Sessão expirada. Por favor, faça login novamente.');
      }

      const updates: {
        email?: string;
        password?: string;
        data?: { nome: string; full_name: string };
      } = {};

      const isEmailDifferent = profileEmail.trim().toLowerCase() !== (currentUser.email || '').toLowerCase();

      // Atualiza nome nos metadados
      updates.data = {
        nome: profileName.trim(),
        full_name: profileName.trim(),
      };

      // Atualiza e-mail se modificado
      if (isEmailDifferent) {
        updates.email = profileEmail.trim();
      }

      // Atualiza senha se preenchida
      if (newPassword) {
        updates.password = newPassword;
      }

      const { data, error } = await supabase.auth.updateUser(updates);
      if (error) throw error;

      const finalName = profileName.trim();
      const finalEmail = data.user?.email || profileEmail.trim();

      onProfileUpdated?.({
        name: finalName,
        email: finalEmail,
      });

      setNewPassword('');
      setConfirmPassword('');

      if (isEmailDifferent) {
        setProfileSuccessMessage('Perfil atualizado com sucesso! Um e-mail de confirmação pode ter sido enviado para validar o novo endereço.');
      } else if (newPassword) {
        setProfileSuccessMessage('Nome e nova senha atualizados com sucesso!');
      } else {
        setProfileSuccessMessage('Dados cadastrais atualizados com sucesso!');
      }

      setTimeout(() => {
        setProfileSuccessMessage(null);
      }, 5000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha ao atualizar dados cadastrais.';
      setProfileErrorMessage(message);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleOpenCreateWorkspace = () => {
    setWorkspaceToEdit(null);
    setWorkspaceModalOpen(true);
  };

  const handleOpenEditWorkspace = (w: WorkspaceRow) => {
    setWorkspaceToEdit(w);
    setWorkspaceModalOpen(true);
  };

  const handleOpenDeleteWorkspace = (w: WorkspaceRow) => {
    setWorkspaceToDelete(w);
    setDeleteModalOpen(true);
  };

  const handleReactivateSubscription = async () => {
    setReactivateLoading(true);
    setReactivateErrorMessage(null);
    setReactivateSuccessMessage(null);
    try {
      const res = await reactivateSubscription();
      if (res.success) {
        setReactivateSuccessMessage('Assinatura reativada com sucesso! As renovações automáticas continuam ativas.');
        setTimeout(() => setReactivateSuccessMessage(null), 5000);
      } else {
        setReactivateErrorMessage(res.error || 'Falha ao reativar assinatura.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao reativar assinatura.';
      setReactivateErrorMessage(msg);
    } finally {
      setReactivateLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in max-w-4xl mx-auto w-full max-w-full overflow-x-hidden min-w-0">
      {/* Cabeçalho */}
      <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
        <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
          <Settings className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-bold text-white truncate">Configurações & Ambientes</h2>
          <p className="text-xs text-slate-400">
            Gerencie seus projetos, especificações de obras e imóveis, categorias e preferências.
          </p>
        </div>
      </div>

      {/* 1. Gestão de Ambientes / Workspaces (CRUD Completo) */}
      <section className="bg-slate-900/80 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <h3 className="text-sm font-bold text-white">Ambientes & Projetos (Workspaces)</h3>
            <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
              {workspaces.length} cadastrados
            </span>
          </div>
          <button
            type="button"
            onClick={handleOpenCreateWorkspace}
            className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Ambiente</span>
          </button>
        </div>

        <p className="text-xs text-slate-400">
          Alterne entre seus projetos, edite as especificações técnicas e de custos ou crie novos ambientes.
        </p>

        <div className="grid grid-cols-1 gap-3.5 pt-1">
          {workspaces.map((w) => {
            const isActive = currentWorkspace?.id === w.id;
            const isObra = w.tipo === 'obra';
            const isNegocio = w.tipo === 'negocio';
            const imovelLabel = w.tipo_imovel ? TIPO_IMOVEL_LABELS[w.tipo_imovel] || w.tipo_imovel : 'Terreno';

            return (
              <div
                key={w.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isActive
                    ? 'bg-emerald-950/20 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  
                  {/* Informações Principais */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                          isObra
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : isNegocio
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                            : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        }`}
                      >
                        {isObra ? 'Custo de Obra' : isNegocio ? 'Negócios & PME' : 'Finanças Pessoais'}
                      </span>

                      {isObra && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {imovelLabel}
                        </span>
                      )}

                      {isActive && (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Ambiente Ativo</span>
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-extrabold text-white truncate">{w.nome}</h4>

                    {/* Detalhes Técnicos de Obra / Imóvel */}
                    {isObra ? (
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400 pt-1">
                        {w.dimensoes_terreno && (
                          <span className="flex items-center space-x-1 text-slate-300">
                            <Maximize2 className="w-3 h-3 text-emerald-400" />
                            <span>{w.dimensoes_terreno}</span>
                          </span>
                        )}
                        {w.valor_aquisicao !== undefined && w.valor_aquisicao > 0 && (
                          <span className="flex items-center space-x-1 text-slate-300">
                            <DollarSign className="w-3 h-3 text-emerald-400" />
                            <span>Aquisição: {formatCurrency(Number(w.valor_aquisicao))}</span>
                          </span>
                        )}
                        {w.localizacao && (
                          <span className="flex items-center space-x-1 text-slate-400">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            <span className="truncate max-w-[200px]">{w.localizacao}</span>
                          </span>
                        )}
                        {w.data_aquisicao && (
                          <span className="flex items-center space-x-1 text-slate-400">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            <span>{formatDate(w.data_aquisicao)}</span>
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400">
                        Controle orçamentário pessoal, contas fixas e variáveis.
                      </p>
                    )}
                  </div>

                  {/* Ações (Ativar, Editar, Excluir) */}
                  <div className="flex items-center space-x-1.5 self-end sm:self-center flex-shrink-0">
                    {!isActive && (
                      <button
                        type="button"
                        onClick={() => selectWorkspace(w.id)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 border border-slate-700 hover:border-emerald-500/40 text-xs font-semibold flex items-center space-x-1 transition-all cursor-pointer"
                        title="Tornar este o ambiente ativo no momento"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Ativar</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleOpenEditWorkspace(w)}
                      className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                      title="Editar informações do ambiente / imóvel"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenDeleteWorkspace(w)}
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 transition-colors cursor-pointer"
                      title="Excluir ambiente"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. Categorias do Ambiente Atual */}
      <section className="bg-slate-900/80 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Tag className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <h3 className="text-sm font-bold text-white">
              Categorias Dinâmicas ({currentEnvironment === 'obra' ? 'Obras' : currentEnvironment === 'negocio' ? 'Meu Negócio' : 'Finanças Pessoais'})
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setManageCategoriesModalOpen(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 border border-slate-700 transition-all cursor-pointer flex-shrink-0"
            >
              <Pencil className="w-3.5 h-3.5 text-cyan-400" />
              <span>Gerenciar & Excluir</span>
            </button>
            <button
              type="button"
              onClick={() => setCategoryModalOpen(true)}
              className="px-3 py-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer flex-shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Categoria</span>
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-400">
          As categorias abaixo se adaptam dinamicamente ao ambiente selecionado e ficam disponíveis para novos lançamentos.
        </p>

        <div className="flex flex-wrap gap-2 pt-2">
          {categories.map((c) => (
            <div
              key={c.id}
              className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs font-medium text-slate-200"
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: c.cor || '#10B981' }}
              />
              <span>{c.nome}</span>
              {currentEnvironment !== 'obra' && c.tipo_movimentacao && (
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                    c.tipo_movimentacao === 'receita'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {c.tipo_movimentacao}
                </span>
              )}
              {c.user_id && (
                <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1 rounded">
                  Personalizada
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 3. Status da Assinatura & Plano SaaS */}
      <section className="bg-slate-900/80 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <CreditCard className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <h3 className="text-sm font-bold text-white">Plano & Assinatura (SaaS)</h3>
          </div>
          <div className="inline-flex items-center space-x-1.5 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl self-start sm:self-auto">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Cancele a qualquer momento sem burocracia</span>
          </div>
        </div>

        {/* Mensagens de Reativação */}
        {reactivateSuccessMessage && (
          <div className="bg-emerald-500/15 border border-emerald-500/40 rounded-xl p-3 flex items-center space-x-2 text-emerald-300 text-xs font-semibold animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{reactivateSuccessMessage}</span>
          </div>
        )}

        {reactivateErrorMessage && (
          <div className="bg-rose-500/15 border border-rose-500/40 rounded-xl p-3 flex items-center space-x-2 text-rose-300 text-xs font-semibold animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{reactivateErrorMessage}</span>
          </div>
        )}

        {/* Banner de Cancelamento Agendado */}
        {subscription?.cancel_at_period_end && (
          <div className="p-3.5 sm:p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-fade-in">
            <div className="flex items-start space-x-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold text-amber-300">
                  Cancelamento programado para {subscription.current_period_end ? formatDate(subscription.current_period_end) : 'o fim do ciclo atual'}
                </p>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Seu acesso continuará 100% liberado até essa data e nenhuma nova cobrança será realizada. Se quiser continuar usando sem interrupções, você pode reativar com 1 clique.
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled={reactivateLoading}
              onClick={handleReactivateSubscription}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto active:scale-95"
            >
              {reactivateLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Reativando...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Reativar Minha Assinatura</span>
                </>
              )}
            </button>
          </div>
        )}

        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 theme-card-plano">
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-extrabold text-white">
                {plan?.name || (currentPlanTier === 'business' ? 'Plano Business' : 'Plano Lite')} • {formatCurrency(plan?.monthlyPrice || 14.9)}/mês
              </span>
              <span
                className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded font-bold ${
                  subscription?.status === 'active'
                    ? currentPlanTier === 'business'
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}
              >
                {subscription?.status === 'active'
                  ? currentPlanTier === 'business'
                    ? 'Business (3 Ambientes)'
                    : 'Lite (2 Ambientes)'
                  : 'Fase de Testes'}
              </span>

              {subscription?.cancel_at_period_end && (
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Cancelamento Agendado
                </span>
              )}
            </div>

            {isTrialing ? (
              <div className="space-y-1 text-xs text-slate-300">
                <p className="flex items-center space-x-1.5 text-amber-300 font-semibold">
                  <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse flex-shrink-0" />
                  <span>
                    Faltam <strong>{trialDaysRemaining} {trialDaysRemaining === 1 ? 'dia' : 'dias'}</strong> no seu período de testes gratuito.
                  </span>
                </p>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  Durante o teste, todos os 3 ambientes (Obra, Pessoal e Negócio) estão 100% liberados.
                  Após o término, selecione o <strong>Plano Lite</strong> para 2 ambientes ou <strong>Plano Business</strong> para todos os 3 ambientes.
                </p>
              </div>
            ) : currentPlanTier === 'business' ? (
              <p className="text-xs text-slate-400 leading-relaxed">
                Você possui acesso completo aos <strong>3 ambientes</strong>: Obras & Reformas, Finanças Pessoais e Gestão de Negócios & PME com cálculo de margens e insumos.
              </p>
            ) : (
              <p className="text-xs text-slate-400 leading-relaxed">
                Seu plano atual inclui <strong>2 ambientes</strong> (Obras e Finanças Pessoais). Para liberar o ambiente de <strong>Negócios & PME</strong>, faça upgrade para o Plano Business.
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-shrink-0 w-full md:w-auto">
            <button
              type="button"
              onClick={() => setPaywallModalOpen(true)}
              className="w-full sm:w-auto justify-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center space-x-1.5 cursor-pointer"
            >
              <span>
                {isTrialing
                  ? 'Assinar Plano'
                  : currentPlanTier === 'lite'
                  ? 'Upgrade para Business'
                  : 'Gerenciar / Trocar Plano'}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {/* Link para Cancelamento de Assinatura */}
            {!subscription?.cancel_at_period_end && subscription?.status !== 'canceled' && (
              <button
                type="button"
                onClick={() => setCancelModalOpen(true)}
                className="text-[11px] text-slate-400 hover:text-rose-400 transition-colors cursor-pointer py-1 px-2 rounded-lg hover:bg-slate-800 text-center underline underline-offset-4"
              >
                Cancelar Assinatura
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 4. Perfil & Credenciais de Acesso (Nome, E-mail e Senha) */}
      <section className="bg-slate-900/80 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4 overflow-hidden">
        <div className="flex items-center space-x-2">
          <User className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <h3 className="text-sm font-bold text-white">Meu Perfil & Credenciais da Conta</h3>
        </div>

        <p className="text-xs text-slate-400">
          Personalize seu nome exibido na barra superior e no logout, atualize seu e-mail de acesso ou redefina sua senha.
        </p>

        {/* Mensagens de Sucesso / Erro */}
        {profileSuccessMessage && (
          <div className="bg-emerald-500/15 border border-emerald-500/40 rounded-xl p-3 flex items-center space-x-2 text-emerald-300 text-xs font-semibold animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{profileSuccessMessage}</span>
          </div>
        )}

        {profileErrorMessage && (
          <div className="bg-rose-500/15 border border-rose-500/40 rounded-xl p-3 flex items-center space-x-2 text-rose-300 text-xs font-semibold animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{profileErrorMessage}</span>
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-4 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Nome de Exibição */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span>Nome de Exibição</span>
              </label>
              <input
                type="text"
                required
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Ex: Gabriel Rocha"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs font-medium text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Nome exibido no topo da página e junto ao botão de sair.
              </span>
            </div>

            {/* E-mail da Conta */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center space-x-1.5">
                <Mail className="w-3.5 h-3.5 text-sky-400" />
                <span>E-mail de Acesso</span>
              </label>
              <input
                type="email"
                required
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs font-medium text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Utilizado para login e notificações do sistema.
              </span>
            </div>
          </div>

          {/* Seção de Troca de Senha */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>Alterar Senha de Acesso</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Opcional</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Nova Senha */}
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Nova Senha (mínimo 6 caracteres)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Deixe em branco para manter a atual"
                    className="w-full pl-3 pr-8 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Confirmar Nova Senha */}
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Confirmar Nova Senha
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  disabled={!newPassword}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:opacity-40"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={profileLoading}
              className="w-full sm:w-auto px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl shadow-md shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {profileLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Salvando Dados...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Salvar Dados Cadastrais</span>
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      {/* Modais */}
      <CreateCategoryModal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
      />

      <ManageCategoriesModal
        isOpen={manageCategoriesModalOpen}
        onClose={() => setManageCategoriesModalOpen(false)}
      />

      <WorkspaceModal
        isOpen={workspaceModalOpen}
        onClose={() => {
          setWorkspaceModalOpen(false);
          setWorkspaceToEdit(null);
        }}
        workspaceToEdit={workspaceToEdit}
      />

      <DeleteWorkspaceModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setWorkspaceToDelete(null);
        }}
        workspace={workspaceToDelete}
      />

      {paywallModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <PaywallView
            reason={isTrialing ? 'trial_expired' : 'feature_locked'}
            lockedFeatureName="Planos GSR Finanças (Lite & Business)"
            onClose={() => setPaywallModalOpen(false)}
          />
        </div>
      )}

      <CancelSubscriptionModal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
      />
    </div>
  );
};
