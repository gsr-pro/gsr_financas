import React, { useState, useRef, useEffect } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useSubscription } from '../../context/SubscriptionContext';
import type { WorkspaceType } from '../../types/app';
import { Building2, Wallet, ChevronDown, Check, Plus, FolderPlus, Briefcase, Lock } from 'lucide-react';
import { PaywallView } from '../subscription/PaywallView';

interface EnvironmentSelectorProps {
  compact?: boolean;
  fullWidth?: boolean;
}

export const EnvironmentSelector: React.FC<EnvironmentSelectorProps> = ({
  compact = false,
  fullWidth = false,
}) => {
  const {
    currentEnvironment,
    currentWorkspace,
    workspaces,
    switchEnvironment,
    selectWorkspace,
    createWorkspace,
  } = useWorkspace();

  const { canAccessNegocio } = useSubscription();

  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [creatingNew, setCreatingNew] = useState<boolean>(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState<string>('');
  const [newWorkspaceType, setNewWorkspaceType] = useState<WorkspaceType>(currentEnvironment);
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
        setCreatingNew(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleSelect = (workspaceId: string) => {
    selectWorkspace(workspaceId);
    setDropdownOpen(false);
  };

  const handleSwitchType = async (tipo: WorkspaceType) => {
    if (tipo === 'negocio' && !canAccessNegocio) {
      setDropdownOpen(false);
      setShowUpgradeModal(true);
      return;
    }
    setNewWorkspaceType(tipo);
    await switchEnvironment(tipo);
    setDropdownOpen(false);
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    if (newWorkspaceType === 'negocio' && !canAccessNegocio) {
      setDropdownOpen(false);
      setShowUpgradeModal(true);
      return;
    }
    try {
      await createWorkspace(newWorkspaceName.trim(), newWorkspaceType);
      setNewWorkspaceName('');
      setCreatingNew(false);
      setDropdownOpen(false);
    } catch (err: unknown) {
      console.error(err);
    }
  };

  const isObra = currentEnvironment === 'obra';
  const isNegocio = currentEnvironment === 'negocio';
  const workspaceTitle =
    currentWorkspace?.nome ||
    (isObra ? 'Controle de Obra' : isNegocio ? 'Gestão de Negócio' : 'Finanças Pessoais');

  return (
    <div className={`relative ${fullWidth ? 'flex w-full' : 'inline-flex items-center'}`} ref={dropdownRef}>
      
      {/* Botão Principal do Seletor: Exibe Modo + Nome do Projeto Ativo */}
      <button
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className={`flex items-center space-x-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-slate-950/80 hover:bg-slate-950 border border-slate-800 hover:border-slate-700 shadow-sm transition-all group theme-environment-trigger ${
          fullWidth ? 'w-full justify-between' : 'max-w-full'
        }`}
        title="Clique para alternar entre Obra, Negócio ou Finanças Pessoais"
      >
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          {/* Ícone e Badge do Tipo de Ambiente */}
          <span
            className={`flex items-center space-x-1 px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-black uppercase tracking-wider flex-shrink-0 ${
              isObra
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : isNegocio
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
            }`}
          >
            {isObra ? (
              <Building2 className="w-3 h-3" />
            ) : isNegocio ? (
              <Briefcase className="w-3 h-3" />
            ) : (
              <Wallet className="w-3 h-3" />
            )}
            <span>{isObra ? 'Obra' : isNegocio ? 'Negócio' : 'Pessoal'}</span>
          </span>

          {/* Nome do Projeto / Ambiente em Destaque */}
          <div className="text-left flex flex-col justify-center min-w-0 flex-1">
            <span
              className={`text-xs font-bold text-[var(--text-primary)] theme-environment-title group-hover:text-emerald-500 transition-colors leading-tight ${
                fullWidth
                  ? 'truncate block max-w-[150px] sm:max-w-[185px]'
                  : 'max-w-[70px] min-[360px]:max-w-[95px] min-[390px]:max-w-[125px] sm:max-w-[190px] truncate'
              }`}
            >
              {workspaceTitle}
            </span>
            {!compact && (
              <span className="text-[9px] text-slate-400 leading-none hidden sm:inline">
                Toque para alternar
              </span>
            )}
          </div>
        </div>

        {/* Seta do Dropdown */}
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 group-hover:text-[var(--text-primary)] transition-transform duration-200 flex-shrink-0 ${
            dropdownOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu Completo */}
      {dropdownOpen && (
        <div
          className={`absolute top-full left-0 mt-2 ${
            fullWidth ? 'w-full' : 'w-[calc(100vw-1.5rem)] max-w-xs sm:w-80'
          } bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-2xl z-50 animate-fade-in space-y-3 theme-environment-dropdown`}
        >
          
          {/* Seletor de Modo / Tipo (Obra vs Pessoal vs Negócio) */}
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
              <span>Alternar Modo</span>
              <span className="text-[9px] text-slate-500">3 Ambientes Nativos</span>
            </div>

            <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800 theme-environment-type-pills">
              <button
                type="button"
                onClick={() => handleSwitchType('obra')}
                className={`py-1.5 px-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center space-x-1 transition-all ${
                  isObra
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Building2 className="w-3 h-3 flex-shrink-0" />
                <span>Obra</span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchType('pessoal')}
                className={`py-1.5 px-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center space-x-1 transition-all ${
                  currentEnvironment === 'pessoal'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Wallet className="w-3 h-3 flex-shrink-0" />
                <span>Pessoal</span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchType('negocio')}
                className={`py-1.5 px-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center space-x-1 transition-all relative ${
                  isNegocio
                    ? 'bg-indigo-500 text-slate-950 shadow-md shadow-indigo-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title={!canAccessNegocio ? 'Disponível no Plano Business' : 'Ambiente de Negócios'}
              >
                <Briefcase className="w-3 h-3 flex-shrink-0" />
                <span>Negócio</span>
                {!canAccessNegocio && (
                  <Lock className="w-2.5 h-2.5 text-amber-400 flex-shrink-0" />
                )}
              </button>
            </div>
          </div>

          {/* Lista de Projetos do Modo Ativo */}
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
              <span>Projetos em {isObra ? 'Obras & Reformas' : isNegocio ? 'Negócios & PME' : 'Finanças Pessoais'}</span>
              <span className="text-[9px] font-bold text-emerald-400">
                {workspaces.filter((w) => w.tipo === currentEnvironment).length} ativo(s)
              </span>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
              {workspaces
                .filter((w) => w.tipo === currentEnvironment)
                .map((w) => {
                  const isSelected = currentWorkspace?.id === w.id;
                  return (
                    <button
                      key={w.id}
                      onClick={() => handleSelect(w.id)}
                      className={`w-full text-left p-2 rounded-xl text-xs flex items-center justify-between transition-all ${
                        isSelected
                          ? 'bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30'
                          : 'text-[var(--text-primary)] hover:bg-slate-800/80 border border-transparent'
                      }`}
                    >
                      <div className="truncate mr-2">
                        <span className="block truncate font-semibold text-[var(--text-primary)]">{w.nome}</span>
                        {w.tipo === 'obra' && w.dimensoes_terreno && (
                          <span className="text-[10px] text-slate-400 block truncate">
                            {w.dimensoes_terreno}
                          </span>
                        )}
                      </div>
                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-emerald-400" />
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500 opacity-0 group-hover:opacity-100">
                          Selecionar
                        </span>
                      )}
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Formulário de Criação de Novo Ambiente */}
          {creatingNew ? (
            <form onSubmit={handleCreateWorkspace} className="pt-2 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[var(--text-primary)] flex items-center space-x-1">
                  <FolderPlus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Novo Projeto</span>
                </span>
                <select
                  value={newWorkspaceType}
                  onChange={(e) => setNewWorkspaceType(e.target.value as WorkspaceType)}
                  className="text-[10px] bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-slate-200"
                >
                  <option value="obra">Tipo: Obra</option>
                  <option value="pessoal">Tipo: Pessoal</option>
                  <option value="negocio">
                    Tipo: Negócio {!canAccessNegocio ? '(Plano Business 🔒)' : ''}
                  </option>
                </select>
              </div>

              <input
                type="text"
                autoFocus
                required
                placeholder="Ex: Reforma Cozinha, Viagem 2026..."
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />

              <div className="flex items-center space-x-1.5">
                <button
                  type="submit"
                  className="flex-1 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Salvar e Ativar
                </button>
                <button
                  type="button"
                  onClick={() => setCreatingNew(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs rounded-xl"
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setCreatingNew(true)}
              className="w-full pt-2 border-t border-slate-800/80 px-2 py-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 hover:bg-slate-800/50 rounded-xl flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Criar Novo Projeto / Ambiente</span>
            </button>
          )}

        </div>
      )}

      {/* Modal Paywall caso usuário tente acessar Negócio sem Plano Business */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <PaywallView
            reason="feature_locked"
            lockedFeatureName="Ambiente de Negócios & PME"
            onClose={() => setShowUpgradeModal(false)}
          />
        </div>
      )}
    </div>
  );
};
