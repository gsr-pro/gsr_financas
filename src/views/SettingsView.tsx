import React, { useState } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { useSubscription } from '../context/SubscriptionContext';
import { PLANS } from '../config/plans';
import { CreateCategoryModal } from '../components/category/CreateCategoryModal';
import { WorkspaceModal } from '../components/workspace/WorkspaceModal';
import { DeleteWorkspaceModal } from '../components/workspace/DeleteWorkspaceModal';
import { formatCurrency, formatDate } from '../lib/formatters';
import type { WorkspaceRow } from '../types/app';
import { PaywallView } from '../components/subscription/PaywallView';
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
} from 'lucide-react';

const TIPO_IMOVEL_LABELS: Record<string, string> = {
  terreno: 'Terreno / Lote',
  casa: 'Casa Residencial',
  apartamento: 'Apartamento',
  chacara: 'Chácara / Sítio',
  comercial: 'Comercial',
  reforma: 'Reforma',
  outro: 'Projeto',
};

export const SettingsView: React.FC = () => {
  const {
    currentEnvironment,
    currentWorkspace,
    workspaces,
    categories,
    selectWorkspace,
  } = useWorkspace();

  const { subscription, currentPlanTier, isTrialing, trialDaysRemaining } = useSubscription();
  const plan = PLANS[currentPlanTier];

  // Modais de Categoria e Workspace
  const [categoryModalOpen, setCategoryModalOpen] = useState<boolean>(false);
  const [workspaceModalOpen, setWorkspaceModalOpen] = useState<boolean>(false);
  const [workspaceToEdit, setWorkspaceToEdit] = useState<WorkspaceRow | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [workspaceToDelete, setWorkspaceToDelete] = useState<WorkspaceRow | null>(null);
  const [paywallModalOpen, setPaywallModalOpen] = useState<boolean>(false);

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

  return (
    <div className="space-y-6 pb-20 animate-fade-in max-w-4xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
        <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Configurações & Ambientes</h2>
          <p className="text-xs text-slate-400">
            Gerencie seus projetos, especificações de obras e imóveis, categorias e preferências.
          </p>
        </div>
      </div>

      {/* 1. Gestão de Ambientes / Workspaces (CRUD Completo) */}
      <section className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-emerald-400" />
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
                            : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        }`}
                      >
                        {isObra ? 'Custo de Obra' : 'Finanças Pessoais'}
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
      <section className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Tag className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">
              Categorias Dinâmicas ({currentEnvironment === 'obra' ? 'Obras' : 'Finanças Pessoais'})
            </h3>
          </div>
          <button
            onClick={() => setCategoryModalOpen(true)}
            className="px-3 py-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nova Categoria</span>
          </button>
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
      <section className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
        <div className="flex items-center space-x-2">
          <CreditCard className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white">Plano & Assinatura (SaaS)</h3>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-extrabold text-white">
                {plan?.name || 'Gestão Completa Pro'} • R$ 14,90/mês
              </span>
              <span
                className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded font-bold ${
                  subscription?.status === 'active'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}
              >
                {subscription?.status === 'active' ? 'Assinatura Ativa' : 'Fase de Testes'}
              </span>
            </div>

            {isTrialing ? (
              <div className="space-y-1 text-xs text-slate-300">
                <p className="flex items-center space-x-1.5 text-amber-300 font-semibold">
                  <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span>
                    Faltam <strong>{trialDaysRemaining} {trialDaysRemaining === 1 ? 'dia' : 'dias'}</strong> para a contratação.
                  </span>
                </p>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  Todos os módulos de Custo de Obra e Finanças Pessoais estão disponíveis para teste.
                  Caso a contratação não seja realizada até o fim do período, <strong>o acesso aos módulos será bloqueado</strong>.
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-400 leading-relaxed">
                Acesso total e irrestrito a todos os módulos de Obras, Finanças Pessoais e múltiplos ambientes.
              </p>
            )}
          </div>

          <div className="flex items-center space-x-3 flex-shrink-0 self-start md:self-center">
            {isTrialing && (
              <button
                type="button"
                onClick={() => setPaywallModalOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-95 flex items-center space-x-1.5 cursor-pointer"
              >
                <span>Contratar Plano Pro</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            <div className="text-right hidden lg:block border-l border-slate-800 pl-3">
              <span className="text-xs font-mono text-slate-500 block">Segurança</span>
              <span className="text-xs font-bold text-emerald-400">PostgreSQL RLS</span>
            </div>
          </div>
        </div>
      </section>

      {/* Modais */}
      <CreateCategoryModal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
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
            reason="feature_locked"
            lockedFeatureName="Gestão Completa Pro"
            onClose={() => setPaywallModalOpen(false)}
          />
        </div>
      )}
    </div>
  );
};
