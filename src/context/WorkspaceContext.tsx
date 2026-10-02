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
  switchEnvironment: (tipo: WorkspaceType) => Promise<void>;
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

const DEFAULT_BUSINESS_CATEGORIES: CategoriaRow[] = [
  { id: 'cat-neg-1', nome: 'Insumos & Matéria-Prima', tipo_ambiente: 'negocio', cor: '#6366F1', icone: 'Boxes', user_id: null, created_at: '' },
  { id: 'cat-neg-2', nome: 'Embalagens', tipo_ambiente: 'negocio', cor: '#8B5CF6', icone: 'Package', user_id: null, created_at: '' },
  { id: 'cat-neg-3', nome: 'Custos Fixos / Operacional', tipo_ambiente: 'negocio', cor: '#F59E0B', icone: 'Building', user_id: null, created_at: '' },
  { id: 'cat-neg-4', nome: 'Equipamentos & Ferramentas', tipo_ambiente: 'negocio', cor: '#3B82F6', icone: 'Wrench', user_id: null, created_at: '' },
  { id: 'cat-neg-5', nome: 'Marketing & Anúncios', tipo_ambiente: 'negocio', cor: '#EC4899', icone: 'Megaphone', user_id: null, created_at: '' },
  { id: 'cat-neg-6', nome: 'Logística & Frete', tipo_ambiente: 'negocio', cor: '#06B6D4', icone: 'Truck', user_id: null, created_at: '' },
  { id: 'cat-neg-7', nome: 'Impostos & Tributos', tipo_ambiente: 'negocio', cor: '#EF4444', icone: 'Receipt', user_id: null, created_at: '' },
  { id: 'cat-neg-8', nome: 'Pró-Labore & Equipe', tipo_ambiente: 'negocio', cor: '#10B981', icone: 'Users', user_id: null, created_at: '' },
  { id: 'cat-neg-9', nome: 'Serviços Terceirizados', tipo_ambiente: 'negocio', cor: '#14B8A6', icone: 'Briefcase', user_id: null, created_at: '' },
  { id: 'cat-neg-10', nome: 'Outros Custos', tipo_ambiente: 'negocio', cor: '#64748B', icone: 'Tag', user_id: null, created_at: '' },
];

const DEFAULT_WORKSPACES_CONFIG: Record<
  WorkspaceType,
  {
    nome: string;
    valor_aquisicao: number;
    tipo_imovel: string | null;
    dimensoes_terreno: string | null;
  }
> = {
  obra: {
    nome: 'Controle de Obra Principal',
    valor_aquisicao: 0.0,
    tipo_imovel: 'terreno',
    dimensoes_terreno: null,
  },
  pessoal: {
    nome: 'Minhas Finanças Pessoais',
    valor_aquisicao: 0.0,
    tipo_imovel: null,
    dimensoes_terreno: null,
  },
  negocio: {
    nome: 'Meu Negócio & PME',
    valor_aquisicao: 0.0,
    tipo_imovel: null,
    dimensoes_terreno: null,
  },
};

const createVirtualWorkspace = (tipo: WorkspaceType, userId = 'user-active'): WorkspaceRow => ({
  id: `virtual-${tipo}`,
  user_id: userId,
  nome: DEFAULT_WORKSPACES_CONFIG[tipo].nome,
  tipo,
  is_default: tipo === 'obra',
  valor_aquisicao: DEFAULT_WORKSPACES_CONFIG[tipo].valor_aquisicao,
  tipo_imovel: DEFAULT_WORKSPACES_CONFIG[tipo].tipo_imovel,
  dimensoes_terreno: DEFAULT_WORKSPACES_CONFIG[tipo].dimensoes_terreno,
  localizacao: null,
  data_aquisicao: null,
  configuracoes: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentEnvironment, setCurrentEnvironment] = useState<WorkspaceType>(() => {
    const saved = localStorage.getItem('gsr_selected_environment');
    return saved === 'pessoal' || saved === 'negocio' ? saved : 'obra';
  });

  const [workspaces, setWorkspaces] = useState<WorkspaceRow[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<WorkspaceRow | null>(() => {
    const saved = localStorage.getItem('gsr_selected_environment') as WorkspaceType | null;
    const initialEnv: WorkspaceType = saved === 'pessoal' || saved === 'negocio' ? saved : 'obra';
    return createVirtualWorkspace(initialEnv);
  });
  const [categories, setCategories] = useState<CategoriaRow[]>([]);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState<boolean>(true);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(true);

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
      setWorkspaces((prev) => [...prev.filter((w) => w.id !== `virtual-${tipo}`), created]);
      setCurrentWorkspace(created);
      setCurrentEnvironment(tipo);
      localStorage.setItem('gsr_selected_workspace_id', created.id);
      localStorage.setItem('gsr_selected_environment', tipo);
      return created;
    },
    []
  );

  // Orquestrador de Alternância de Ambientes: Instantâneo e Resiliente
  const switchEnvironment = useCallback(
    async (tipo: WorkspaceType) => {
      // 1. Atualização imediata do contexto e persistência local
      setCurrentEnvironment(tipo);
      localStorage.setItem('gsr_selected_environment', tipo);

      // 2. Busca se já existe um workspace carregado para o tipo
      let targetWorkspace = workspaces.find((w) => w.tipo === tipo && !w.id.startsWith('virtual-'));

      if (!targetWorkspace) {
        // Se ainda não existir registro persistido, usa o workspace de domínio padrão de imediato
        const virtual = createVirtualWorkspace(tipo);
        setCurrentWorkspace(virtual);
        localStorage.setItem('gsr_selected_workspace_id', virtual.id);

        // 3. Tenta persistir no Supabase em segundo plano
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const config = DEFAULT_WORKSPACES_CONFIG[tipo];
            const { data, error } = await supabase
              .from('workspaces')
              .insert({
                user_id: user.id,
                nome: config.nome,
                tipo,
                is_default: tipo === 'obra',
                valor_aquisicao: config.valor_aquisicao,
                tipo_imovel: config.tipo_imovel,
                dimensoes_terreno: config.dimensoes_terreno,
              })
              .select()
              .single();

            if (!error && data) {
              const created = data as WorkspaceRow;
              setWorkspaces((prev) => [...prev.filter((w) => w.id !== `virtual-${tipo}`), created]);
              setCurrentWorkspace(created);
              localStorage.setItem('gsr_selected_workspace_id', created.id);
            }
          }
        } catch (syncErr) {
          console.warn('Sincronização do workspace com o backend ocorrerá sob demanda:', syncErr);
        }
      } else {
        setCurrentWorkspace(targetWorkspace);
        localStorage.setItem('gsr_selected_workspace_id', targetWorkspace.id);
      }
    },
    [workspaces]
  );

  // Busca todos os workspaces do usuário atual sem reverter o ambiente ativo
  const fetchWorkspaces = useCallback(async () => {
    try {
      setLoadingWorkspaces(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let list: WorkspaceRow[] = [];

      // 1. Tenta orquestração atômica via procedure no backend
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('orquestrar_ambientes_usuario', {
          p_user_id: user.id,
        });
        if (!rpcError && Array.isArray(rpcData) && rpcData.length > 0) {
          list = rpcData as WorkspaceRow[];
        }
      } catch (_) {
        // Se a procedure ainda não estiver criada no banco, prossegue para consulta padrão
      }

      // 2. Se a procedure não retornou, consulta a tabela workspaces diretamente
      if (list.length === 0) {
        const { data, error } = await supabase
          .from('workspaces')
          .select('*')
          .order('created_at', { ascending: true });

        if (error) {
          console.warn('Aviso ao consultar tabela workspaces:', error.message);
        }

        list = (data as WorkspaceRow[]) || [];
      }

      // Se o usuário ainda não tiver workspaces criados no banco, inicializa os 3 ambientes nativos
      if (list.length === 0) {
        try {
          const { data: createdWorkspaces, error: createError } = await supabase
            .from('workspaces')
            .insert([
              {
                user_id: user.id,
                nome: DEFAULT_WORKSPACES_CONFIG.obra.nome,
                tipo: 'obra' as const,
                is_default: true,
                valor_aquisicao: DEFAULT_WORKSPACES_CONFIG.obra.valor_aquisicao,
                dimensoes_terreno: DEFAULT_WORKSPACES_CONFIG.obra.dimensoes_terreno,
              },
              {
                user_id: user.id,
                nome: DEFAULT_WORKSPACES_CONFIG.pessoal.nome,
                tipo: 'pessoal' as const,
                is_default: false,
                valor_aquisicao: 0.0,
              },
              {
                user_id: user.id,
                nome: DEFAULT_WORKSPACES_CONFIG.negocio.nome,
                tipo: 'negocio' as const,
                is_default: false,
                valor_aquisicao: 0.0,
              },
            ])
            .select();

          if (!createError && createdWorkspaces) {
            list = createdWorkspaces as WorkspaceRow[];
          }
        } catch (initErr) {
          console.warn('Inicialização automática dos workspaces será completada pelo backend:', initErr);
        }
      }

      // Garante que haja ao menos uma referência virtual para qualquer um dos 3 ambientes não retornados
      const completeList = [...list];
      (['obra', 'pessoal', 'negocio'] as WorkspaceType[]).forEach((t) => {
        if (!completeList.some((w) => w.tipo === t)) {
          completeList.push(createVirtualWorkspace(t, user.id));
        }
      });

      setWorkspaces(completeList);

      // Seleção do Workspace Ativo respeitando SEMPRE o ambiente selecionado pelo usuário
      const savedEnv = localStorage.getItem('gsr_selected_environment') as WorkspaceType | null;
      const targetEnv = savedEnv === 'pessoal' || savedEnv === 'negocio' || savedEnv === 'obra'
        ? savedEnv
        : currentEnvironment;

      const savedWorkspaceId = localStorage.getItem('gsr_selected_workspace_id');
      const foundSaved = savedWorkspaceId
        ? completeList.find((w) => w.id === savedWorkspaceId && w.tipo === targetEnv)
        : null;

      if (foundSaved) {
        setCurrentWorkspace(foundSaved);
        setCurrentEnvironment(foundSaved.tipo);
      } else {
        const matchingEnvWorkspace = completeList.find((w) => w.tipo === targetEnv) || completeList[0];
        if (matchingEnvWorkspace) {
          setCurrentWorkspace(matchingEnvWorkspace);
          setCurrentEnvironment(matchingEnvWorkspace.tipo);
          localStorage.setItem('gsr_selected_workspace_id', matchingEnvWorkspace.id);
          localStorage.setItem('gsr_selected_environment', matchingEnvWorkspace.tipo);
        }
      }
    } catch (err: unknown) {
      console.error('Erro ao orquestrar workspaces:', err);
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
      const loaded = (data as CategoriaRow[]) || [];

      // Se for ambiente de negócio e o banco não tiver categorias específicas cadastradas, provê as categorias padrão
      if (currentEnvironment === 'negocio') {
        const hasBusinessCats = loaded.some((c) => c.tipo_ambiente === 'negocio');
        if (!hasBusinessCats) {
          setCategories([...DEFAULT_BUSINESS_CATEGORIES, ...loaded.filter((c) => c.tipo_ambiente === 'geral')]);
          return;
        }
      }

      setCategories(loaded);
    } catch (err: unknown) {
      console.error('Erro ao carregar categorias:', err);
      if (currentEnvironment === 'negocio') {
        setCategories(DEFAULT_BUSINESS_CATEGORIES);
      }
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
