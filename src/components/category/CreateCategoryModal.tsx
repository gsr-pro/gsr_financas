import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { Plus, X, Loader2, Tag, Check, Sparkles, TrendingUp, TrendingDown } from 'lucide-react';

interface CreateCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (categoryName: string) => void;
  defaultTipoMovimentacao?: 'despesa' | 'receita';
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
];

export const CreateCategoryModal: React.FC<CreateCategoryModalProps> = ({
  isOpen,
  onClose,
  onCreated,
  defaultTipoMovimentacao = 'despesa',
}) => {
  const { currentEnvironment, createCustomCategory } = useWorkspace();
  const [tipoMovimentacao, setTipoMovimentacao] = useState<'despesa' | 'receita'>(
    currentEnvironment === 'obra' ? 'despesa' : defaultTipoMovimentacao
  );
  const [nome, setNome] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>(
    tipoMovimentacao === 'receita'
      ? '#10B981'
      : currentEnvironment === 'obra'
      ? '#10B981'
      : '#3B82F6'
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Sincroniza tipo inicial e cor toda vez que o modal é aberto
  React.useEffect(() => {
    if (isOpen) {
      const initialTipo = currentEnvironment === 'obra' ? 'despesa' : defaultTipoMovimentacao;
      setTipoMovimentacao(initialTipo);
      setSelectedColor(initialTipo === 'receita' ? '#10B981' : currentEnvironment === 'obra' ? '#10B981' : '#3B82F6');
      setNome('');
      setError(null);
    }
  }, [isOpen, defaultTipoMovimentacao, currentEnvironment]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setError('Informe um nome para a categoria.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const created = await createCustomCategory(nome.trim(), selectedColor, tipoMovimentacao);
      setNome('');
      onCreated?.(created.nome);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao cadastrar categoria.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Nova Categoria</h3>
              <p className="text-[10px] text-slate-400">
                Ambiente: <span className="text-emerald-400 font-semibold uppercase">{currentEnvironment}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-2.5 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Seletor de Tipo (Despesa vs Receita) nos ambientes Pessoal e Negócio */}
          {currentEnvironment !== 'obra' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Classificação da Categoria
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTipoMovimentacao('despesa');
                    if (selectedColor === '#10B981') setSelectedColor('#EF4444');
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center space-x-1.5 transition-all ${
                    tipoMovimentacao === 'despesa'
                      ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 ring-1 ring-rose-500/40 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/60'
                  }`}
                >
                  <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                  <span>Despesa (Saída)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTipoMovimentacao('receita');
                    setSelectedColor('#10B981');
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center space-x-1.5 transition-all ${
                    tipoMovimentacao === 'receita'
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 ring-1 ring-emerald-500/40 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/60'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Receita (Entrada)</span>
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Nome da Categoria
            </label>
            <div className="relative">
              <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                autoFocus
                required
                placeholder={
                  tipoMovimentacao === 'receita'
                    ? 'Ex: Vendas Online, Comissões, Consultoria...'
                    : 'Ex: Paisagismo, Elétrica, Mercado...'
                }
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Cor de Identificação
            </label>
            <div className="flex items-center space-x-2">
              {PALETTE.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-95 border border-white/20"
                  style={{ backgroundColor: color }}
                >
                  {selectedColor === color && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg flex items-center justify-center space-x-1.5 transition-all disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Criar Categoria</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
