import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { DespesaRow, CategoriaDespesa, StatusPagamento } from '../types/app';
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
} from 'lucide-react';

interface EditExpenseModalProps {
  expense: DespesaRow | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedExpense: DespesaRow) => void;
}

const CATEGORIAS: CategoriaDespesa[] = [
  'Materiais',
  'Mão de Obra',
  'Documentação',
  'Ferramentas',
  'Outros',
];

export const EditExpenseModal: React.FC<EditExpenseModalProps> = ({
  expense,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [dataGasto, setDataGasto] = useState<string>('');
  const [categoria, setCategoria] = useState<CategoriaDespesa>('Materiais');
  const [descricao, setDescricao] = useState<string>('');
  const [valor, setValor] = useState<string>('');
  const [statusPagamento, setStatusPagamento] = useState<StatusPagamento>('Pago');
  const [observacoes, setObservacoes] = useState<string>('');
  const [existingFotoUrl, setExistingFotoUrl] = useState<string | null>(null);

  // Novos arquivos para substituição
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Estados de feedback
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (expense) {
      setDataGasto(expense.data_gasto);
      setCategoria(expense.categoria);
      setDescricao(expense.descricao);
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

      const { data: updatedRows, error: updateError } = await supabase
        .from('despesas')
        .update({
          data_gasto: dataGasto,
          categoria,
          descricao: descricao.trim(),
          valor: parsedValor,
          status_pagamento: statusPagamento,
          foto_comprovante_url: finalFotoUrl,
          observacoes: observacoes.trim() || null,
        })
        .eq('id', expense.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      setSuccessMessage('Lançamento atualizado com sucesso!');
      setTimeout(() => {
        if (updatedRows) {
          onSuccess(updatedRows);
        }
        onClose();
      }, 700);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar o lançamento.';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col text-slate-100">
        {/* Header do Modal */}
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-md z-10 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center space-x-1.5">
              <span>Editar Lançamento</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Modifique os dados da despesa na chácara
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo do Formulário */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {successMessage && (
            <div className="bg-emerald-500/15 border border-emerald-500/40 rounded-xl p-3 flex items-center space-x-2 text-emerald-300 text-xs font-semibold animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="bg-rose-500/15 border border-rose-500/40 rounded-xl p-3 flex items-start space-x-2 text-rose-300 text-xs animate-fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Data */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-sky-400" />
              <span>Data do Gasto</span>
            </label>
            <input
              type="date"
              required
              value={dataGasto}
              onChange={(e) => setDataGasto(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950/70 border border-slate-700/80 rounded-xl text-xs font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all"
            />
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center space-x-1.5">
              <Tag className="w-3.5 h-3.5 text-sky-400" />
              <span>Categoria</span>
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {CATEGORIAS.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategoria(cat)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border text-left transition-all ${
                    categoria === cat
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-semibold ring-1 ring-emerald-400/40'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center space-x-1.5">
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              <span>Descrição</span>
            </label>
            <input
              type="text"
              required
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950/70 border border-slate-700/80 rounded-xl text-xs font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all"
            />
          </div>

          {/* Valor */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center space-x-1.5">
              <DollarSign className="w-3.5 h-3.5 text-sky-400" />
              <span>Valor (R$)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">
                R$
              </span>
              <input
                type="text"
                inputMode="decimal"
                required
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Status do Pagamento
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStatusPagamento('Pago')}
                className={`py-1.5 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center space-x-1.5 transition-all ${
                  statusPagamento === 'Pago'
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                    : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <span>Pago</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusPagamento('Pendente')}
                className={`py-1.5 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center space-x-1.5 transition-all ${
                  statusPagamento === 'Pendente'
                    ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                    : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <span>Pendente</span>
              </button>
            </div>
          </div>

          {/* Comprovante */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center space-x-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
              <span>Comprovante / Recibo</span>
            </label>

            {existingFotoUrl && !file && (
              <div className="mb-2 p-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 truncate">
                  <a
                    href={existingFotoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 font-semibold hover:underline flex items-center space-x-1"
                  >
                    <span>Comprovante Anexado</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveExistingPhoto}
                  className="text-rose-400 hover:text-rose-300 text-[11px] font-semibold"
                >
                  Remover
                </button>
              </div>
            )}

            {file && (
              <div className="mb-2 p-2 rounded-xl border border-slate-700 bg-slate-950/80 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 truncate">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Prévia"
                      className="w-8 h-8 rounded object-cover border border-slate-700"
                    />
                  ) : (
                    <FileText className="w-6 h-6 text-emerald-400" />
                  )}
                  <span className="truncate text-white font-medium">
                    {file.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveNewFile}
                  className="text-slate-400 hover:text-rose-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <label className="border border-dashed border-slate-700 hover:border-emerald-400 rounded-xl p-2.5 flex items-center justify-center cursor-pointer bg-slate-950/50 hover:bg-emerald-500/5 transition-all text-xs text-slate-300 font-medium space-x-2">
              <Upload className="w-4 h-4 text-slate-400" />
              <span>{existingFotoUrl ? 'Substituir comprovante' : 'Anexar comprovante'}</span>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Observações
            </label>
            <textarea
              rows={2}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950/70 border border-slate-700/80 rounded-xl text-xs font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all"
            />
          </div>

          {/* Ações */}
          <div className="pt-2 flex space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950/60 flex items-center justify-center space-x-1.5 transition-all disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Salvando...</span>
                </>
              ) : (
                <span>Salvar Alterações</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
