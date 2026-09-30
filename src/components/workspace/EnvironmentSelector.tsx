import React, { useState, useRef, useEffect } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import type { WorkspaceType } from '../../types/app';
import { Building2, Wallet, ChevronDown, Check, Plus, FolderPlus } from 'lucide-react';

interface EnvironmentSelectorProps {
  compact?: boolean;
}

export const EnvironmentSelector: React.FC<EnvironmentSelectorProps> = ({ compact = false }) => {
  const {
    currentEnvironment,
    currentWorkspace,
    workspaces,
    switchEnvironment,
    selectWorkspace,
    createWorkspace,
  } = useWorkspace();

  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [creatingNew, setCreatingNew] = useState<boolean>(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState<string>('');
  const [newWorkspaceType, setNewWorkspaceType] = useState<WorkspaceType>(currentEnvironment);

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

  const handleSwitchType = (tipo: WorkspaceType) => {
    switchEnvironment(tipo);
    setNewWorkspaceType(tipo);
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
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
  const workspaceTitle = currentWorkspace?.nome || (isObra ? 'Controle de Obra' : 'Finanças Pessoais');

  return (
    <div className="relative inline-flex items-center" ref={dropdownRef}>
      
      {/* Botão Principal do Seletor: Exibe Modo + Nome do Projeto Ativo */}
      <button
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center space-x-1.5 sm:space-x-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-slate-950/70 hover:bg-slate-950 border border-slate-800 hover:border-slate-700 shadow-sm transition-all group max-w-full"
        title="Clique para alternar entre Obra, Finanças Pessoais ou selecionar outro projeto"
      >
        {/* Ícone e Badge do Tipo de Ambiente */}
        <span
          className={`flex items-center space-x-1 px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-black uppercase tracking-wider flex-shrink-0 ${
            isObra
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
          }`}
        >
          {isObra ? <Building2 className="w-3 h-3" /> : <Wallet className="w-3 h-3" />}
          <span>{isObra ? 'Obra' : 'Pessoal'}</span>
        </span>

        {/* Nome do Projeto / Ambiente em Destaque */}
        <div className="text-left flex flex-col justify-center min-w-0">
          <span className="text-[11px] sm:text-xs font-bold text-white group-hover:text-emerald-300 transition-colors max-w-[70px] min-[360px]:max-w-[95px] min-[390px]:max-w-[125px] sm:max-w-[190px] truncate leading-tight">
            {workspaceTitle}
          </span>
          {!compact && (
            <span className="text-[9px] text-slate-400 leading-none hidden sm:inline">
              Toque para alternar
            </span>
          )}
        </div>

        {/* Seta do Dropdown */}
        <ChevronDown
          className={`w-3 sm:w-3.5 h-3 sm:h-3.5 text-slate-400 group-hover:text-white transition-transform duration-200 flex-shrink-0 ${
            dropdownOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu Completo */}
      {dropdownOpen && (
        <div className="absolute top-full left-0 mt-2 w-[calc(100vw-1.5rem)] max-w-xs sm:w-80 bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-2xl z-50 animate-fade-in space-y-3">
          
          {/* Seletor de Modo / Tipo (Obra vs Pessoal) */}
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
              <span>Alternar Modo</span>
              <span className="text-[9px] text-slate-500">2 Ambientes Nativos</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800">
              <button
                type="button"
                onClick={() => handleSwitchType('obra')}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
                  isObra
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Custo de Obra</span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchType('pessoal')}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
                  !isObra
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Finanças Pessoais</span>
              </button>
            </div>
          </div>

          {/* Lista de Projetos do Modo Ativo */}
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
              <span>Projetos em {isObra ? 'Obras & Reformas' : 'Finanças Pessoais'}</span>
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
                          ? 'bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30'
                          : 'text-slate-300 hover:bg-slate-800/80 border border-transparent'
                      }`}
                    >
                      <div className="truncate mr-2">
                        <span className="block truncate font-semibold">{w.nome}</span>
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
                <span className="text-[11px] font-bold text-white flex items-center space-x-1">
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
    </div>
  );
};
