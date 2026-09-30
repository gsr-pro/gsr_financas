import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { WorkspaceRow, CategoriaRow, WorkspaceType } from '../types/app';

interface WorkspaceContextType {
  currentEnvironment: WorkspaceType;
  currentWorkspace: WorkspaceRow | null;
  workspaces: WorkspaceRow[];
  categories: CategoriaRow[];
  loadingWorkspaces: boolean;
  loadingCategories: boolean;
  switchEnvironment: (tipo: WorkspaceType) => void;
  selectWorkspace: (workspaceId: string) => void;
  createWorkspace: (
    nome: string,
    tipo: WorkspaceType,
    details?: Partial<WorkspaceRow>
  ) => Promise<WorkspaceRow>;
  updateWorkspace: (
    workspaceId: string,
    updates: Partial<WorkspaceRow>
  ) => Promise<WorkspaceRow>;
  deleteWorkspace: (workspaceId: string) => Promise<void>;
  createCustomCategory: (nome: string, cor?: string) => Promise<CategoriaRow>;
  refreshWorkspaces: () => Promise<void>;
  refreshCategories: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentEnvironment, setCurrentEnvironment] = useState<WorkspaceType>(() => {
    const saved = localStorage.getItem('gsr_selected_environment');
    return saved === 'pessoal' ? 'pessoal' : 'obra';
  });

  const [workspaces, setWorkspaces] = useState<WorkspaceRow[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<WorkspaceRow | null>(null);
  const [categories, setCategories] = useState<CategoriaRow[]>([]);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState<boolean>(true);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(true);

  // Busca todos os workspaces do usuário atual
  const fetchWorkspaces = useCallback(async () => {
    try {
      setLoadingWorkspaces(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      const list: WorkspaceRow[] = (data as WorkspaceRow[]) || [];

      // Se o usuário ainda não tiver workspaces criados, cria os dois ambientes padrões
      if (list.length === 0) {
        const { data: createdWorkspaces, error: createError } = await supabase
          .from('workspaces')
          .insert([
            {
              user_id: user.id,
              nome: 'Controle de Obra Principal',
              tipo: 'obra' as const,
              is_default: true,
              valor_aquisicao: 50000.0,
              dimensoes_terreno: 'Terreno Principal',
            },
            {
              user_id: user.id,
              nome: 'Minhas Finanças Pessoais',
              tipo: 'pessoal' as const,
              is_default: false,
              valor_aquisicao: 0.0,
            },
          ])
          .select();

        if (!createError && createdWorkspaces) {
          const freshList = createdWorkspaces as WorkspaceRow[];
          setWorkspaces(freshList);
          const active = freshList.find((w) => w.tipo === currentEnvironment) || freshList[0];
          setCurrentWorkspace(active || null);
          if (active) {
            localStorage.setItem('gsr_selected_workspace_id', active.id);
            localStorage.setItem('gsr_selected_environment', active.tipo);
          }
          return;
        }
      }

      setWorkspaces(list);

      // Prioridade 1: Tenta recuperar o workspace específico salvo no localStorage
      const savedWorkspaceId = localStorage.getItem('gsr_selected_workspace_id');
      const foundSaved = savedWorkspaceId ? list.find((w) => w.id === savedWorkspaceId) : null;

      if (foundSaved) {
        setCurrentWorkspace(foundSaved);
        setCurrentEnvironment(foundSaved.tipo);
        localStorage.setItem('gsr_selected_environment', foundSaved.tipo);
      } else {
        // Prioridade 2: Primeiro workspace compatível com o ambiente ativo
        const active = list.find((w) => w.tipo === currentEnvironment) || list[0];
        setCurrentWorkspace(active || null);
        if (active) {
          localStorage.setItem('gsr_selected_workspace_id', active.id);
        }
      }
    } catch (err: unknown) {
      console.error('Erro ao carregar workspaces:', err);
    } finally {
      setLoadingWorkspaces(false);
    }
  }, [currentEnvironment]);

  // Busca as categorias do ambiente selecionado (Globais onde user_id é NULL ou Próprias do usuário)
  const fetchCategories = useCallback(async () => {
    try {
      setLoadingCategories(true);
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .or(`tipo_ambiente.eq.${currentEnvironment},tipo_ambiente.eq.geral`)
        .order('nome', { ascending: true });

      if (error) throw error;
      setCategories((data as CategoriaRow[]) || []);
    } catch (err: unknown) {
      console.error('Erro ao carregar categorias:', err);
    } finally {
      setLoadingCategories(false);
    }
  }, [currentEnvironment]);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Alterna o tipo de ambiente ativo ('obra' | 'pessoal')
  const switchEnvironment = useCallback(
    (tipo: WorkspaceType) => {
      setCurrentEnvironment(tipo);
      localStorage.setItem('gsr_selected_environment', tipo);

      // Seleciona o workspace daquele tipo
      const targetWorkspace = workspaces.find((w) => w.tipo === tipo);
      if (targetWorkspace) {
        setCurrentWorkspace(targetWorkspace);
        localStorage.setItem('gsr_selected_workspace_id', targetWorkspace.id);
      }
    },
    [workspaces]
  );

  // Seleciona um workspace específico por ID
  const selectWorkspace = useCallback(
    (workspaceId: string) => {
      const found = workspaces.find((w) => w.id === workspaceId);
      if (found) {
        setCurrentWorkspace(found);
        setCurrentEnvironment(found.tipo);
        localStorage.setItem('gsr_selected_workspace_id', found.id);
        localStorage.setItem('gsr_selected_environment', found.tipo);
      }
    },
    [workspaces]
  );

  // Cria um novo workspace e já o ativa imediatamente
  const createWorkspace = useCallback(
    async (
      nome: string,
      tipo: WorkspaceType,
      details?: Partial<WorkspaceRow>
    ): Promise<WorkspaceRow> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado.');

      const insertPayload = {
        user_id: user.id,
        nome: nome.trim(),
        tipo,
        is_default: false,
        valor_aquisicao: details?.valor_aquisicao !== undefined ? Number(details.valor_aquisicao) : 0.0,
        tipo_imovel: details?.tipo_imovel ?? (tipo === 'obra' ? 'terreno' : null),
        dimensoes_terreno: details?.dimensoes_terreno ?? null,
        localizacao: details?.localizacao ?? null,
        data_aquisicao: details?.data_aquisicao ?? null,
        configuracoes: details?.configuracoes ?? null,
      };

      const { data, error } = await supabase
        .from('workspaces')
        .insert(insertPayload)
        .select()
        .single();

      if (error || !data) throw error || new Error('Falha ao criar ambiente.');

      const created = data as WorkspaceRow;
      setWorkspaces((prev) => [...prev, created]);
      setCurrentWorkspace(created);
      setCurrentEnvironment(tipo);
      localStorage.setItem('gsr_selected_workspace_id', created.id);
      localStorage.setItem('gsr_selected_environment', tipo);
      return created;
    },
    []
  );

  // Atualiza um workspace existente
  const updateWorkspace = useCallback(
    async (
      workspaceId: string,
      updates: Partial<WorkspaceRow>
    ): Promise<WorkspaceRow> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado.');

      const cleanUpdates: Partial<WorkspaceRow> = { ...updates };
      delete cleanUpdates.id;
      delete cleanUpdates.user_id;
      delete cleanUpdates.created_at;

      const { data, error } = await supabase
        .from('workspaces')
        .update({
          ...cleanUpdates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', workspaceId)
        .select()
        .single();

      if (error || !data) throw error || new Error('Falha ao atualizar o ambiente.');

      const updated = data as WorkspaceRow;
      setWorkspaces((prev) => prev.map((w) => (w.id === workspaceId ? updated : w)));

      // Se o workspace atual for o alterado, sincroniza
      setCurrentWorkspace((curr) => {
        if (curr?.id === workspaceId) {
          if (updated.tipo !== curr.tipo) {
            setCurrentEnvironment(updated.tipo);
            localStorage.setItem('gsr_selected_environment', updated.tipo);
          }
          return updated;
        }
        return curr;
      });

      return updated;
    },
    []
  );

  // Exclui um workspace com salvaguardas
  const deleteWorkspace = useCallback(
    async (workspaceId: string): Promise<void> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado.');

      if (workspaces.length <= 1) {
        throw new Error('Não é possível excluir o único ambiente ativo.');
      }

      const { error } = await supabase
        .from('workspaces')
        .delete()
        .eq('id', workspaceId);

      if (error) throw error;

      const remaining = workspaces.filter((w) => w.id !== workspaceId);
      setWorkspaces(remaining);

      // Se o workspace excluído era o selecionado atualmente:
      if (currentWorkspace?.id === workspaceId) {
        const nextWorkspace = remaining.find((w) => w.tipo === currentEnvironment) || remaining[0];
        if (nextWorkspace) {
          setCurrentWorkspace(nextWorkspace);
          setCurrentEnvironment(nextWorkspace.tipo);
          localStorage.setItem('gsr_selected_workspace_id', nextWorkspace.id);
          localStorage.setItem('gsr_selected_environment', nextWorkspace.tipo);
        } else {
          setCurrentWorkspace(null);
          localStorage.removeItem('gsr_selected_workspace_id');
        }
      }
    },
    [workspaces, currentWorkspace, currentEnvironment]
  );

  // Cria uma categoria customizada na hora (com o tenant_id do usuário)
  const createCustomCategory = useCallback(
    async (nome: string, cor?: string): Promise<CategoriaRow> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado.');

      const hexColor = cor || (currentEnvironment === 'obra' ? '#10B981' : '#3B82F6');

      const { data, error } = await supabase
        .from('categorias')
        .insert({
          user_id: user.id,
          nome: nome.trim(),
          tipo_ambiente: currentEnvironment,
          cor: hexColor,
          icone: 'Tag',
        })
        .select()
        .single();

      if (error || !data) throw error || new Error('Falha ao criar categoria.');

      const created = data as CategoriaRow;
      setCategories((prev) => [...prev, created].sort((a, b) => a.nome.localeCompare(b.nome)));
      return created;
    },
    [currentEnvironment]
  );

  return (
    <WorkspaceContext.Provider
      value={{
        currentEnvironment,
        currentWorkspace,
        workspaces,
        categories,
        loadingWorkspaces,
        loadingCategories,
        switchEnvironment,
        selectWorkspace,
        createWorkspace,
        updateWorkspace,
        deleteWorkspace,
        createCustomCategory,
        refreshWorkspaces: fetchWorkspaces,
        refreshCategories: fetchCategories,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = (): WorkspaceContextType => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace deve ser utilizado dentro de um WorkspaceProvider.');
  }
  return context;
};
