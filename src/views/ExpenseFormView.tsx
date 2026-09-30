import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useWorkspace } from '../context/WorkspaceContext';
import { CreateCategoryModal } from '../components/category/CreateCategoryModal';
import type { StatusPagamento } from '../types/app';
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  Tag,
  DollarSign,
  FileText,
  Image as ImageIcon,
  X,
  Plus,
  Building2,
  Wallet,
} from 'lucide-react';

interface ExpenseFormViewProps {
  onSuccess: () => void;
}

export const ExpenseFormView: React.FC<ExpenseFormViewProps> = ({ onSuccess }) => {
  const { currentEnvironment, currentWorkspace, categories } = useWorkspace();

  const [dataGasto, setDataGasto] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [categoria, setCategoria] = useState<string>('Materiais');
  const [descricao, setDescricao] = useState<string>('');
  const [valor, setValor] = useState<string>('');
  const [statusPagamento, setStatusPagamento] = useState<StatusPagamento>('Pago');
  const [observacoes, setObservacoes] = useState<string>('');

  // Modal para inclusão dinâmica de categorias
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);

  // Estados de upload de foto/comprovante
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Estados de submissão
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  // Ajusta a categoria default quando as categorias do ambiente carregarem
  useEffect(() => {
    if (categories.length > 0 && !categories.some((c) => c.nome === categoria)) {
      setCategoria(categories[0].nome);
    }
  }, [categories, categoria]);

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

  const removeFile = () => {
    setFile(null);
    setPreviewUrl(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const parsedValor = parseFloat(valor.replace(',', '.'));
    if (isNaN(parsedValor) || parsedValor <= 0) {
      setErrorMessage('Informe um valor numérico válido maior que zero.');
      return;
    }

    if (descricao.trim().length < 3) {
      setErrorMessage('A descrição deve conter pelo menos 3 caracteres.');
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Usuário não autenticado. Faça login para registrar despesas.');
      }

      let fotoUrl: string | null = null;

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
          throw new Error(`Falha no upload do comprovante: ${uploadError.message}`);
        }

        const { data: publicData } = supabase.storage
          .from('comprovantes')
          .getPublicUrl(filePath);

        fotoUrl = publicData.publicUrl;
      }

      const { error: insertError } = await supabase.from('despesas').insert({
        user_id: user.id,
        workspace_id: currentWorkspace?.id || null,
        tipo_ambiente: currentEnvironment,
        data_gasto: dataGasto,
        categoria: categoria,
        descricao: descricao.trim(),
        valor: parsedValor,
        status_pagamento: statusPagamento,
        foto_comprovante_url: fotoUrl,
        observacoes: observacoes.trim() || null,
      });

      if (insertError) {
        throw insertError;
      }

      setSuccess(true);
      setDescricao('');
      setValor('');
      setObservacoes('');
      setFile(null);
      setPreviewUrl(null);

      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro inesperado ao salvar despesa.';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 pb-24 animate-fade-in text-slate-100 max-w-2xl mx-auto">
      <div className="bg-slate-900/90 rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-xl">
        
        {/* Cabeçalho do Formulário com indicação do ambiente ativo */}
        <div className="border-b border-slate-800 pb-3 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
              <span>Novo Lançamento</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {currentEnvironment === 'obra'
                ? 'Cadastre os gastos de materiais, mão de obra e serviços da obra.'
                : 'Cadastre despesas pessoais, contas, alimentação e investimentos.'}
            </p>
          </div>

          {/* Badge do Ambiente Ativo */}
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 self-start sm:self-center">
            {currentEnvironment === 'obra' ? (
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Wallet className="w-3.5 h-3.5 text-cyan-400" />
            )}
            <span className="text-[11px] font-bold text-slate-200">
              {currentWorkspace?.nome || (currentEnvironment === 'obra' ? 'Custo de Obra' : 'Finanças Pessoais')}
            </span>
          </div>
        </div>

        {/* Feedback de Sucesso */}
        {success && (
          <div className="bg-emerald-500/15 border border-emerald-500/40 rounded-xl p-3.5 text-center my-3 flex items-center justify-center space-x-2 text-emerald-300 text-xs font-semibold animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>Lançamento registrado com sucesso! Redirecionando...</span>
          </div>
        )}

        {/* Feedback de Erro */}
        {errorMessage && (
          <div className="bg-rose-500/15 border border-rose-500/40 rounded-xl p-3.5 text-center my-3 flex items-center justify-center space-x-2 text-rose-300 text-xs font-semibold animate-fade-in">
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Data do Gasto */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>Data da Despesa</span>
            </label>
            <input
              type="date"
              required
              value={dataGasto}
              onChange={(e) => setDataGasto(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-xs font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all"
            />
          </div>

          {/* Seleção Dinâmica de Categoria + Botão "+ Nova Categoria" */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                <Tag className="w-3.5 h-3.5 text-emerald-400" />
                <span>Categoria</span>
              </label>

              {/* Botão de Inclusão Dinâmica de Categoria */}
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(true)}
                className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>+ Nova Categoria</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoria(cat.nome)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border text-left transition-all flex items-center space-x-2 ${
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
              <span>Descrição da Despesa</span>
            </label>
            <input
              type="text"
              required
              placeholder={
                currentEnvironment === 'obra'
                  ? 'Ex: 50 sacos de cimento CP-II, diária pedreiro...'
                  : 'Ex: Compras supermercado, conta de luz, farmácia...'
              }
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-xs font-medium text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all"
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
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm font-bold text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all"
              />
            </div>
          </div>

          {/* Status do Pagamento */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Status do Pagamento
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
                <span>Pago / Quitado</span>
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
                <span>Pendente / A Pagar</span>
              </button>
            </div>
          </div>

          {/* Upload de Comprovante */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1.5">
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span>Foto do Recibo / Cupom Fiscal (Opcional)</span>
            </label>

            {!previewUrl ? (
              <label className="border-2 border-dashed border-slate-700/80 hover:border-emerald-400/80 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all bg-slate-950/40 hover:bg-slate-900/60 group">
                <ImageIcon className="w-7 h-7 text-slate-400 group-hover:text-emerald-400 mb-2 transition-colors" />
                <span className="text-xs font-medium text-slate-300 group-hover:text-white">
                  Tirar foto ou selecionar comprovante
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5">
                  PNG, JPG ou WEBP até 5MB
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
                  alt="Pré-visualização do comprovante"
                  className="w-full h-44 object-cover"
                />
                <button
                  type="button"
                  onClick={removeFile}
                  className="absolute top-2 right-2 p-1.5 bg-slate-950/80 hover:bg-rose-600 text-white rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
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
              placeholder="Ex: Nota fiscal nº 4501, entregue na obra pelo fornecedor..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-xs font-medium text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all resize-none"
            />
          </div>

          {/* Botão de Envio */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950/60 flex items-center justify-center space-x-2 transition-all active:scale-[0.99] disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Gravando lançamento...</span>
              </>
            ) : (
              <span>Confirmar e Salvar Lançamento</span>
            )}
          </button>
        </form>
      </div>

      {/* Modal de Nova Categoria Dinâmica */}
      <CreateCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onCreated={(newCat) => setCategoria(newCat)}
      />
    </div>
  );
};
