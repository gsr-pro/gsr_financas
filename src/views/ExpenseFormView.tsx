import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { CategoriaDespesa, StatusPagamento } from '../types/app';
import { Upload, CheckCircle2, AlertCircle, Loader2, Calendar, Tag, DollarSign, FileText, Image as ImageIcon, X } from 'lucide-react';

interface ExpenseFormViewProps {
  onSuccess: () => void;
}

const CATEGORIAS: CategoriaDespesa[] = [
  'Materiais',
  'Mão de Obra',
  'Documentação',
  'Ferramentas',
  'Outros',
];

export const ExpenseFormView: React.FC<ExpenseFormViewProps> = ({ onSuccess }) => {
  const [dataGasto, setDataGasto] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [categoria, setCategoria] = useState<CategoriaDespesa>('Materiais');
  const [descricao, setDescricao] = useState<string>('');
  const [valor, setValor] = useState<string>('');
  const [statusPagamento, setStatusPagamento] = useState<StatusPagamento>('Pago');
  const [observacoes, setObservacoes] = useState<string>('');

  // Estados de upload de foto/comprovante
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Estados de submissão
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

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
      // 1. Obtém o usuário autenticado atual
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Usuário não autenticado. Faça login para registrar despesas.');
      }

      let fotoUrl: string | null = null;

      // 2. Upload de comprovante para o Storage se houver arquivo
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

        // Obtém a URL pública do comprovante
        const { data: publicData } = supabase.storage
          .from('comprovantes')
          .getPublicUrl(filePath);

        fotoUrl = publicData.publicUrl;
      }

      // 3. Gravação da despesa no banco de dados
      const { error: insertError } = await supabase.from('despesas').insert({
        user_id: user.id,
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

      // Sucesso!
      setSuccess(true);
      // Limpa os campos
      setDescricao('');
      setValor('');
      setObservacoes('');
      setFile(null);
      setPreviewUrl(null);

      // Notifica o componente pai para atualizar contadores e listas
      setTimeout(() => {
        onSuccess();
      }, 1200);

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro inesperado ao salvar despesa.';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 pb-24 animate-fade-in">
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
        <div className="border-b border-slate-100 pb-3 mb-4">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Novo Lançamento
          </h2>
          <p className="text-xs text-slate-500">
            Cadastre os gastos de materiais, mão de obra e serviços da chácara.
          </p>
        </div>

        {/* Feedback de Sucesso */}
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center my-3 flex items-center justify-center space-x-2 text-emerald-800 text-xs font-semibold animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>Lançamento registrado com sucesso!</span>
          </div>
        )}

        {/* Feedback de Erro */}
        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 my-3 flex items-start space-x-2 text-rose-800 text-xs animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <span className="leading-snug">{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Data do Gasto */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Data do Gasto</span>
            </label>
            <input
              type="date"
              required
              value={dataGasto}
              onChange={(e) => setDataGasto(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center space-x-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <span>Categoria</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIAS.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategoria(cat)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border text-left transition-all ${
                    categoria === cat
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-semibold ring-1 ring-emerald-400'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center space-x-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Descrição da Despesa</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: 50 sacos de areia média, diária pedreiro..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
          </div>

          {/* Valor */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center space-x-1.5">
              <DollarSign className="w-3.5 h-3.5 text-slate-400" />
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
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Status do Pagamento */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Status do Pagamento
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStatusPagamento('Pago')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center space-x-1.5 transition-all ${
                  statusPagamento === 'Pago'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>Pago</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusPagamento('Pendente')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center space-x-1.5 transition-all ${
                  statusPagamento === 'Pendente'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>Pendente</span>
              </button>
            </div>
          </div>

          {/* Upload de Comprovante (Foto ou PDF) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center space-x-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>Foto do Comprovante ou Nota (Opcional)</span>
            </label>

            {!file ? (
              <label className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-emerald-50/20 transition-all">
                <Upload className="w-6 h-6 text-slate-400 mb-1.5" />
                <span className="text-xs font-semibold text-slate-700">
                  Tirar foto ou anexar recibo
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  PNG, JPG ou PDF (máx. 5MB)
                </span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="relative rounded-xl border border-slate-200 bg-slate-50 p-2.5 flex items-center justify-between">
                <div className="flex items-center space-x-3 overflow-hidden">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Prévia"
                      className="w-12 h-12 object-cover rounded-lg border border-slate-200"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <FileText className="w-6 h-6" />
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <p className="text-xs font-semibold text-slate-800 truncate">
                      {file.name}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {(file.size / 1024).toFixed(0)} KB
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={removeFile}
                  className="p-1 rounded-full text-slate-400 hover:text-rose-600 hover:bg-slate-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Observações Adicionais */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Observações (Opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Pagamento feito via PIX, parcelado em 3x..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
          </div>

          {/* Botão de Gravação */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-900/10 flex items-center justify-center space-x-2 transition-all disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Registrando Despesa...</span>
              </>
            ) : (
              <span>Salvar Lançamento</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
