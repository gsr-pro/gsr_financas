import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useWorkspace } from '../context/WorkspaceContext';
import { CreateCategoryModal } from './category/CreateCategoryModal';
import type { DespesaRow, StatusPagamento, TipoMovimentacao } from '../types/app';
import type { Database } from '../types/database.types';
import {
  X,
  Calendar,
  Tag,
  DollarSign,
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  ExternalLink,
  Plus,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

interface EditExpenseModalProps {
  expense: DespesaRow | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedExpense: DespesaRow) => void;
}

const DEFAULT_RECEITA_CATEGORIES = [
  'Salário',
  'Pró-Labore',
  'Freelance / Serviços',
  'Rendimentos / Dividendos',
  'Venda de Ativos',
  'Reembolso',
  'Outras Receitas',
];

export const EditExpenseModal: React.FC<EditExpenseModalProps> = ({
  expense,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { categories, currentEnvironment } = useWorkspace();

  const [tipoMovimentacao, setTipoMovimentacao] = useState<TipoMovimentacao>('despesa');
  const [dataGasto, setDataGasto] = useState<string>('');
  const [categoria, setCategoria] = useState<string>('Materiais');
  const [descricao, setDescricao] = useState<string>('');
  const [valor, setValor] = useState<string>('');
  const [statusPagamento, setStatusPagamento] = useState<StatusPagamento>('Pago');
  const [observacoes, setObservacoes] = useState<string>('');
  const [existingFotoUrl, setExistingFotoUrl] = useState<string | null>(null);

  // Modal para inclusão dinâmica de categorias
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);

  // Novos arquivos para substituição
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Estados de feedback
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (expense) {
      const isRec = expense.tipo_movimentacao === 'receita' || expense.descricao.startsWith('[RECEITA]');
      setTipoMovimentacao(isRec ? 'receita' : 'despesa');
      setDataGasto(expense.data_gasto);
      setCategoria(expense.categoria);
      const cleanDesc = expense.descricao.replace(/^\[RECEITA\]\s*/i, '');
      setDescricao(cleanDesc);
      setValor(expense.valor.toString().replace('.', ','));
      setStatusPagamento(expense.status_pagamento);
      setObservacoes(expense.observacoes || '');
      setExistingFotoUrl(expense.foto_comprovante_url || null);
      setFile(null);
      setPreviewUrl(null);
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [expense, isOpen]);

  if (!isOpen || !expense) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.size > 5 * 1024 * 1024) {
      setErrorMessage('O arquivo excede o limite máximo de 5MB.');
      return;
    }

    setFile(selected);
    if (selected.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(selected);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleRemoveExistingPhoto = () => {
    setExistingFotoUrl(null);
  };

  const handleRemoveNewFile = () => {
    setFile(null);
    setPreviewUrl(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const parsedValor = parseFloat(valor.replace(',', '.'));
    if (isNaN(parsedValor) || parsedValor <= 0) {
      setErrorMessage('Informe um valor numérico válido maior que zero.');
      return;
    }

    if (descricao.trim().length < 3) {
      setErrorMessage('A descrição deve conter no mínimo 3 caracteres.');
      return;
    }

    setLoading(true);

    try {
      let finalFotoUrl = existingFotoUrl;

      if (file) {
        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `${Date.now()}_${crypto.randomUUID()}.${fileExt}`;
        const filePath = `comprovantes/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('comprovantes')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`Falha no upload do novo comprovante: ${uploadError.message}`);
        }

        const { data: publicData } = supabase.storage
          .from('comprovantes')
          .getPublicUrl(filePath);

        finalFotoUrl = publicData.publicUrl;
      }

      type DespesaUpdate = Database['public']['Tables']['despesas']['Update'];
      const updatePayload: DespesaUpdate = {
        data_gasto: dataGasto,
        categoria: categoria,
        descricao: descricao.trim(),
        valor: parsedValor,
        status_pagamento: statusPagamento,
        foto_comprovante_url: finalFotoUrl,
        observacoes: observacoes.trim() || null,
        updated_at: new Date().toISOString(),
      };

      if (currentEnvironment === 'pessoal') {
        updatePayload.tipo_movimentacao = tipoMovimentacao;
      }

      let data: DespesaRow | null = null;
      let updateError: unknown = null;

      try {
        const res = await supabase
          .from('despesas')
          .update(updatePayload)
          .eq('id', expense.id)
          .select()
          .single();
        data = res.data as DespesaRow;
        updateError = res.error;
      } catch (err) {
        updateError = err;
      }

      if (updateError && String((updateError as { message?: string }).message || '').includes('tipo_movimentacao')) {
        const fallbackDesc = tipoMovimentacao === 'receita'
          ? `[RECEITA] ${descricao.trim()}`
          : descricao.trim();
        const cleanPayload: DespesaUpdate = {
          ...updatePayload,
          descricao: fallbackDesc,
        };
        delete cleanPayload.tipo_movimentacao;

        const fallbackRes = await supabase
          .from('despesas')
          .update(cleanPayload)
          .eq('id', expense.id)
          .select()
          .single();

        if (fallbackRes.error) throw fallbackRes.error;
        data = fallbackRes.data as DespesaRow;
      } else if (updateError) {
        throw updateError;
      }

      setSuccessMessage('Lançamento atualizado com sucesso!');
      setTimeout(() => {
        if (data) onSuccess(data);
        onClose();
      }, 700);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar lançamento.';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl space-y-4">
        
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
              <span>Editar Lançamento</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Altere os detalhes ou atualize o status do pagamento.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mensagens de Sucesso / Erro */}
        {successMessage && (
          <div className="bg-emerald-500/15 border border-emerald-500/40 rounded-xl p-3 flex items-center space-x-2 text-emerald-300 text-xs font-semibold animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="bg-rose-500/15 border border-rose-500/40 rounded-xl p-3 flex items-center space-x-2 text-rose-300 text-xs font-semibold animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Seletor de Tipo no ambiente pessoal */}
          {currentEnvironment === 'pessoal' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Tipo de Movimentação
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTipoMovimentacao('despesa');
                    if (DEFAULT_RECEITA_CATEGORIES.includes(categoria)) {
                      setCategoria(categories[0]?.nome || 'Moradia');
                    }
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
                    setCategoria(DEFAULT_RECEITA_CATEGORIES[0]);
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

          {/* Data do Lançamento */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {currentEnvironment === 'pessoal'
                  ? tipoMovimentacao === 'receita'
                    ? 'Data da Receita'
                    : 'Data da Despesa'
                  : 'Data da Despesa'}
              </span>
            </label>
            <input
              type="date"
              required
              value={dataGasto}
              onClick={(e) => {
                try {
                  e.currentTarget.showPicker?.();
                } catch (_) {}
              }}
              onChange={(e) => setDataGasto(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all cursor-pointer"
            />
          </div>

          {/* Categoria Dinâmica + Botão "+ Nova Categoria" */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                <Tag className="w-3.5 h-3.5 text-emerald-400" />
                <span>Categoria</span>
              </label>

              {tipoMovimentacao !== 'receita' && (
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Nova Categoria</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {currentEnvironment === 'pessoal' && tipoMovimentacao === 'receita'
                ? DEFAULT_RECEITA_CATEGORIES.map((catNome) => (
                    <button
                      key={catNome}
                      type="button"
                      onClick={() => setCategoria(catNome)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium border text-left transition-all flex items-center space-x-1.5 ${
                        categoria === catNome
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-semibold ring-1 ring-emerald-400/40 shadow-sm'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full flex-shrink-0 bg-emerald-400" />
                      <span className="truncate">{catNome}</span>
                    </button>
                  ))
                : categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategoria(cat.nome)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium border text-left transition-all flex items-center space-x-1.5 ${
                        categoria === cat.nome
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-semibold ring-1 ring-emerald-400/40 shadow-sm'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: cat.cor || '#10B981' }}
                      />
                      <span className="truncate">{cat.nome}</span>
                    </button>
                  ))}
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1.5">
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              <span>
                {currentEnvironment === 'pessoal'
                  ? tipoMovimentacao === 'receita'
                    ? 'Descrição da Receita'
                    : 'Descrição da Despesa'
                  : 'Descrição da Despesa'}
              </span>
            </label>
            <input
              type="text"
              required
              placeholder={
                currentEnvironment === 'pessoal' && tipoMovimentacao === 'receita'
                  ? 'Ex: Salário mensal, Rendimentos CDB...'
                  : 'Ex: 50 sacos de areia média...'
              }
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-xs font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
            />
          </div>

          {/* Valor */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1.5">
              <DollarSign className="w-3.5 h-3.5 text-sky-400" />
              <span>Valor (R$)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">
                R$
              </span>
              <input
                type="text"
                inputMode="decimal"
                required
                placeholder="0,00"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
              />
            </div>
          </div>

          {/* Status do Pagamento / Recebimento */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {tipoMovimentacao === 'receita' ? 'Status do Recebimento' : 'Status do Pagamento'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStatusPagamento('Pago')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center space-x-1.5 transition-all ${
                  statusPagamento === 'Pago'
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 ring-1 ring-emerald-400/40'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/60'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>{tipoMovimentacao === 'receita' ? 'Recebido' : 'Pago / Quitado'}</span>
              </button>

              <button
                type="button"
                onClick={() => setStatusPagamento('Pendente')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center space-x-1.5 transition-all ${
                  statusPagamento === 'Pendente'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-1 ring-amber-400/40'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/60'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>{tipoMovimentacao === 'receita' ? 'A Receber' : 'Pendente / A Pagar'}</span>
              </button>
            </div>
          </div>

          {/* Comprovante */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1.5">
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span>Comprovante / Recibo</span>
            </label>

            {existingFotoUrl && !previewUrl && (
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2 truncate">
                  <ImageIcon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span className="text-xs text-slate-300 truncate">Comprovante atual anexado</span>
                </div>
                <div className="flex items-center space-x-2">
                  <a
                    href={existingFotoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 text-slate-400 hover:text-emerald-400"
                    title="Visualizar comprovante"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    type="button"
                    onClick={handleRemoveExistingPhoto}
                    className="p-1 text-slate-400 hover:text-rose-400"
                    title="Remover anexo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {!previewUrl ? (
              <label className="border-2 border-dashed border-slate-700/80 hover:border-emerald-400/80 rounded-2xl p-3 flex flex-col items-center justify-center cursor-pointer transition-all bg-slate-950/40 hover:bg-slate-900/60 group">
                <Upload className="w-5 h-5 text-slate-400 group-hover:text-emerald-400 mb-1 transition-colors" />
                <span className="text-[11px] font-medium text-slate-300 group-hover:text-white">
                  {existingFotoUrl ? 'Substituir comprovante' : 'Anexar novo comprovante'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 max-w-xs mx-auto">
                <img
                  src={previewUrl}
                  alt="Novo comprovante"
                  className="w-full h-36 object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemoveNewFile}
                  className="absolute top-2 right-2 p-1 bg-slate-950/80 hover:bg-rose-600 text-white rounded-full transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Observações Adicionais
            </label>
            <textarea
              rows={2}
              placeholder="Anotações sobre a despesa..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-950/70 border border-slate-700/80 rounded-xl text-xs font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all resize-none"
            />
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg flex items-center justify-center space-x-2 transition-all disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <span>Salvar Alterações</span>
              )}
            </button>
          </div>
        </form>
      </div>

      <CreateCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onCreated={(newCat) => setCategoria(newCat)}
      />
    </div>
  );
};
