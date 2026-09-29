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
      const { data: { user }, error: userError } = await supabase.auth.getUser();
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
      }, 1100);

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro inesperado ao salvar despesa.';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 pb-24 animate-fade-in text-slate-100">
      <div className="bg-slate-900/90 rounded-3xl p-5 border border-slate-800 shadow-xl">
        <div className="border-b border-slate-800 pb-3 mb-4">
          <h2 className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
            <span>Novo Lançamento</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Cadastre os gastos de materiais, mão de obra e serviços da chácara.
          </p>
        </div>

        {/* Feedback de Sucesso */}
        {success && (
          <div className="bg-emerald-500/15 border border-emerald-500/40 rounded-xl p-3.5 text-center my-3 flex items-center justify-center space-x-2 text-emerald-300 text-xs font-semibold animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>Lançamento registrado com sucesso!</span>
          </div>
        )}

        {/* Feedback de Erro */}
        {errorMessage && (
          <div className="bg-rose-500/15 border border-rose-500/40 rounded-xl p-3.5 my-3 flex items-start space-x-2 text-rose-300 text-xs animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span className="leading-snug">{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Data do Gasto */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-sky-400" />
              <span>Data do Gasto</span>
            </label>
            <input
              type="date"
              required
              value={dataGasto}
              onChange={(e) => setDataGasto(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-xs font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all"
            />
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1.5">
              <Tag className="w-3.5 h-3.5 text-sky-400" />
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
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-semibold ring-1 ring-emerald-400/40 shadow-sm'
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
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1.5">
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              <span>Descrição da Despesa</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: 50 sacos de areia média, diária pedreiro..."
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
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm ring-2 ring-emerald-500/20'
                    : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800/60'
                }`}
              >
                <span>Pago</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusPagamento('Pendente')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center space-x-1.5 transition-all ${
                  statusPagamento === 'Pendente'
                    ? 'bg-amber-600 text-white border-amber-500 shadow-sm ring-2 ring-amber-500/20'
                    : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800/60'
                }`}
              >
                <span>Pendente</span>
              </button>
            </div>
          </div>

          {/* Upload de Comprovante (Foto ou PDF) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
              <span>Foto do Comprovante ou Nota (Opcional)</span>
            </label>

            {!file ? (
              <label className="border-2 border-dashed border-slate-700 hover:border-emerald-400 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer bg-slate-950/50 hover:bg-emerald-500/5 transition-all">
                <Upload className="w-6 h-6 text-slate-400 mb-1.5" />
                <span className="text-xs font-semibold text-slate-200">
                  Tirar foto ou anexar recibo
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5">
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
              <div className="relative rounded-xl border border-slate-700 bg-slate-950/80 p-2.5 flex items-center justify-between">
                <div className="flex items-center space-x-3 overflow-hidden">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Prévia"
                      className="w-12 h-12 object-cover rounded-lg border border-slate-700"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                      <FileText className="w-6 h-6" />
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <p className="text-xs font-semibold text-white truncate">
                      {file.name}
                    </p>
                    <p className="text-[10px] font-mono text-slate-400">
                      {(file.size / 1024).toFixed(0)} KB
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={removeFile}
                  className="p-1 rounded-full text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Observações Adicionais */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Observações (Opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Pagamento feito via PIX, parcelado em 3x..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-950/70 border border-slate-700/80 rounded-xl text-xs font-medium text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all"
            />
          </div>

          {/* Botão de Gravação */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950/60 flex items-center justify-center space-x-2 transition-all disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
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
