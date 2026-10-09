import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import type { CategoriaRow } from '../../types/app';
import {
  X,
  Tag,
  Plus,
  Pencil,
  Trash2,
  Check,
  Loader2,
  AlertCircle,
  Sparkles,
  Lock,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

interface ManageCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PALETTE = [
  '#10B981', // Verde Esmeralda
  '#38BDF8', // Azul Céu
  '#F59E0B', // Âmbar Ouro
  '#EF4444', // Vermelho Coral
  '#8B5CF6', // Roxo Violeta
  '#EC4899', // Rosa Pink
  '#14B8A6', // Ciano Teal
  '#F97316', // Laranja Obra
  '#64748B', // Ardósia
];

export const ManageCategoriesModal: React.FC<ManageCategoriesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    currentEnvironment,
    categories,
    createCustomCategory,
    updateCustomCategory,
    deleteCustomCategory,
  } = useWorkspace();

  // Modo de criação rápida no topo
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [newColor, setNewColor] = useState<string>('#10B981');
  const [newTipo, setNewTipo] = useState<'despesa' | 'receita'>('despesa');

  // Modo de edição de categoria existente
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editColor, setEditColor] = useState<string>('#10B981');
  const [editTipo, setEditTipo] = useState<'despesa' | 'receita'>('despesa');

  // Filtro por tipo de movimentação
  const [filterTab, setFilterTab] = useState<'todas' | 'despesa' | 'receita'>('todas');

  // Estados de feedback
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartEdit = (cat: CategoriaRow) => {
    setEditingId(cat.id);
    setEditName(cat.nome);
    setEditColor(cat.cor || '#10B981');
    setEditTipo((cat.tipo_movimentacao as 'despesa' | 'receita') || 'despesa');
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setError(null);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) {
      setError('O nome da categoria não pode estar em branco.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await updateCustomCategory(id, {
        nome: editName.trim(),
        cor: editColor,
        tipo_movimentacao: editTipo,
      });
      setEditingId(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha ao atualizar categoria.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (cat: CategoriaRow) => {
    if (!cat.user_id) {
      setError('Categorias padrão do sistema não podem ser excluídas.');
      return;
    }

    if (!window.confirm(`Deseja realmente excluir a categoria "${cat.nome}"?`)) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await deleteCustomCategory(cat.id);
      if (editingId === cat.id) {
        setEditingId(null);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha ao excluir categoria.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setError('Informe um nome para a nova categoria.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await createCustomCategory(newName.trim(), newColor, newTipo);
      setNewName('');
      setIsCreating(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha ao criar categoria.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const displayedCategories = categories.filter((c) => {
    if (currentEnvironment === 'obra' || filterTab === 'todas') return true;
    if (filterTab === 'receita') return c.tipo_movimentacao === 'receita';
    return c.tipo_movimentacao === 'despesa' || !c.tipo_movimentacao;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Cabeçalho */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Gerenciar Categorias</h3>
              <p className="text-[11px] text-slate-400">
                Ambiente ativo: <span className="font-semibold text-emerald-400 uppercase">{currentEnvironment}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback de Erro */}
        {error && (
          <div className="mx-5 mt-4 p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Barra de Ação Superior com Filtros de Abas */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {currentEnvironment !== 'obra' ? (
            <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start">
              <button
                type="button"
                onClick={() => setFilterTab('todas')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  filterTab === 'todas'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Todas ({categories.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('despesa')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1 ${
                  filterTab === 'despesa'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'text-slate-400 hover:text-rose-400'
                }`}
              >
                <TrendingDown className="w-3 h-3" />
                <span>Despesas</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('receita')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1 ${
                  filterTab === 'receita'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-emerald-400'
                }`}
              >
                <TrendingUp className="w-3 h-3" />
                <span>Receitas</span>
              </button>
            </div>
          ) : (
            <span className="text-xs text-slate-300 font-medium">
              {categories.length} {categories.length === 1 ? 'categoria disponível' : 'categorias disponíveis'}
            </span>
          )}

          {!isCreating && (
            <button
              type="button"
              onClick={() => {
                setIsCreating(true);
                setNewTipo(filterTab === 'receita' ? 'receita' : 'despesa');
              }}
              className="px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Categoria</span>
            </button>
          )}
        </div>

        {/* Formulário de Criação Rápida */}
        {isCreating && (
          <form onSubmit={handleCreate} className="p-4 bg-slate-950/80 border-b border-slate-800 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Adicionar Nova Categoria</span>
              </span>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Cancelar
              </button>
            </div>

            {currentEnvironment !== 'obra' && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNewTipo('despesa')}
                  className={`py-1.5 px-2 rounded-xl text-xs font-semibold border flex items-center justify-center space-x-1 ${
                    newTipo === 'despesa'
                      ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <TrendingDown className="w-3 h-3 text-rose-400" />
                  <span>Despesa</span>
                </button>
                <button
                  type="button"
                  onClick={() => setNewTipo('receita')}
                  className={`py-1.5 px-2 rounded-xl text-xs font-semibold border flex items-center justify-center space-x-1 ${
                    newTipo === 'receita'
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                  <span>Receita</span>
                </button>
              </div>
            )}

            <input
              type="text"
              autoFocus
              required
              placeholder="Nome da categoria..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                {PALETTE.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewColor(color)}
                    className="w-5 h-5 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                    style={{ backgroundColor: color }}
                  >
                    {newColor === color && <Check className="w-3 h-3 text-white" />}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center space-x-1 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Salvar</span>}
              </button>
            </div>
          </form>
        )}

        {/* Lista de Categorias com Rolagem */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {displayedCategories.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              Nenhuma categoria encontrada para este filtro.
            </div>
          ) : (
            displayedCategories.map((cat) => {
            const isEditingThis = editingId === cat.id;
            const isCustom = Boolean(cat.user_id);
            const isReceita = cat.tipo_movimentacao === 'receita';

            if (isEditingThis) {
              return (
                <div
                  key={cat.id}
                  className="p-3 bg-slate-950/90 border border-emerald-500/40 rounded-2xl space-y-2.5 shadow-md"
                >
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    />

                    {currentEnvironment !== 'obra' && (
                      <select
                        value={editTipo}
                        onChange={(e) => setEditTipo(e.target.value as 'despesa' | 'receita')}
                        className="px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                      >
                        <option value="despesa">Despesa</option>
                        <option value="receita">Receita</option>
                      </select>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      {PALETTE.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setEditColor(color)}
                          className="w-5 h-5 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                          style={{ backgroundColor: color }}
                        >
                          {editColor === color && <Check className="w-3 h-3 text-white" />}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="px-2.5 py-1 text-slate-400 hover:text-slate-200 text-xs"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(cat.id)}
                        disabled={loading}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center space-x-1"
                      >
                        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <span>Atualizar</span>}
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={cat.id}
                className="flex items-center justify-between p-2.5 bg-slate-950/60 hover:bg-slate-950 border border-slate-800/80 rounded-2xl transition-all"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cat.cor || '#10B981' }}
                  />
                  <span className="text-xs font-semibold text-white truncate">{cat.nome}</span>
                  
                  {currentEnvironment !== 'obra' && (
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                        isReceita
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                      }`}
                    >
                      {isReceita ? 'Receita' : 'Despesa'}
                    </span>
                  )}

                  {!isCustom && (
                    <span className="text-[9px] font-mono text-slate-400 flex items-center space-x-0.5 bg-slate-900 px-1.5 py-0.5 rounded">
                      <Lock className="w-2.5 h-2.5" />
                      <span>Padrão</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-1">
                  {isCustom ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleStartEdit(cat)}
                        className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="Editar categoria"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(cat)}
                        disabled={loading}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                        title="Excluir categoria"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <span className="text-[10px] text-slate-400 italic px-2">Sistema</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

        {/* Rodapé */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 text-center">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
