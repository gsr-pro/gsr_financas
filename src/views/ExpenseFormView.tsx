import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useWorkspace } from '../context/WorkspaceContext';
import { CreateCategoryModal } from '../components/category/CreateCategoryModal';
import type { StatusPagamento, TipoMovimentacao } from '../types/app';
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
  TrendingUp,
  TrendingDown,
  Repeat,
} from 'lucide-react';

interface ExpenseFormViewProps {
  onSuccess: () => void;
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

export const ExpenseFormView: React.FC<ExpenseFormViewProps> = ({ onSuccess }) => {
  const { currentEnvironment, currentWorkspace, categories } = useWorkspace();

  const [tipoMovimentacao, setTipoMovimentacao] = useState<TipoMovimentacao>('despesa');
  const [dataGasto, setDataGasto] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [categoria, setCategoria] = useState<string>('Materiais');
  const [descricao, setDescricao] = useState<string>('');
  const [valor, setValor] = useState<string>('');
  const [statusPagamento, setStatusPagamento] = useState<StatusPagamento>('Pago');
  const [observacoes, setObservacoes] = useState<string>('');

  // Recorrência
  const [isRecorrente, setIsRecorrente] = useState<boolean>(false);
  const [mesesRecorrencia, setMesesRecorrencia] = useState<number>(12);

  // Modal para inclusão dinâmica de categorias
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);

  // Estados de upload de foto/comprovante
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Estados de submissão
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [successMessageText, setSuccessMessageText] = useState<string>('');

  // Ajusta a categoria default ao alternar ambiente ou tipo de movimentação
  useEffect(() => {
    if (currentEnvironment === 'obra') {
      setTipoMovimentacao('despesa');
      if (categories.length > 0) {
        setCategoria(categories[0].nome);
      } else {
        setCategoria('Materiais');
      }
    } else {
      if (tipoMovimentacao === 'receita') {
        setCategoria(DEFAULT_RECEITA_CATEGORIES[0]);
      } else if (categories.length > 0) {
        setCategoria(categories[0].nome);
      } else {
        setCategoria('Moradia');
      }
    }
  }, [currentEnvironment, tipoMovimentacao, categories]);

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
        throw new Error('Usuário não autenticado. Faça login para registrar lançamentos.');
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

      // Preparação dos lançamentos (simples ou recorrente)
      const count = isRecorrente && mesesRecorrencia > 1 ? mesesRecorrencia : 1;
      const baseDate = new Date(dataGasto + 'T12:00:00');

      const rowsToInsert = [];
      for (let i = 0; i < count; i++) {
        const itemDate = new Date(baseDate);
        itemDate.setMonth(itemDate.getMonth() + i);
        const dateStr = itemDate.toISOString().split('T')[0];

        const itemDesc = count > 1
          ? `${descricao.trim()} (${i + 1}/${count})`
          : descricao.trim();

        // O primeiro mês usa o status selecionado ('Pago' ou 'Pendente')
        // Os meses seguintes futuros são programados como 'Pendente'
        const itemStatus = i === 0 ? statusPagamento : 'Pendente';

        rowsToInsert.push({
          user_id: user.id,
          workspace_id: currentWorkspace?.id || null,
          tipo_ambiente: currentEnvironment,
          tipo_movimentacao: tipoMovimentacao,
          data_gasto: dateStr,
          categoria: categoria,
          descricao: itemDesc,
          valor: parsedValor,
          status_pagamento: itemStatus,
          foto_comprovante_url: i === 0 ? fotoUrl : null,
          observacoes: observacoes.trim() || null,
        });
      }

      // Inserção com fallback defensivo para retrocompatibilidade
      let insertError = null;
      try {
        const { error } = await supabase.from('despesas').insert(rowsToInsert);
        insertError = error;
      } catch (err) {
        insertError = err;
      }

      // Se der erro por ausência da coluna tipo_movimentacao, realiza fallback transparente
      if (insertError && String((insertError as { message?: string }).message || '').includes('tipo_movimentacao')) {
        const fallbackRows = rowsToInsert.map((r) => {
          const { tipo_movimentacao: _, ...rest } = r;
          const prefix = tipoMovimentacao === 'receita' ? '[RECEITA] ' : '';
          return {
            ...rest,
            descricao: `${prefix}${r.descricao}`,
          };
        });
        const { error: fallbackError } = await supabase.from('despesas').insert(fallbackRows);
        if (fallbackError) throw fallbackError;
      } else if (insertError) {
        throw insertError;
      }

      setSuccess(true);
      setSuccessMessageText(
        count > 1
          ? `${count} lançamentos mensais programados com sucesso!`
          : `${tipoMovimentacao === 'receita' ? 'Receita' : 'Despesa'} registrada com sucesso!`
      );
      setDescricao('');
      setValor('');
      setObservacoes('');
      setFile(null);
      setPreviewUrl(null);
      setIsRecorrente(false);

      setTimeout(() => {
        onSuccess();
      }, 1200);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro inesperado ao salvar lançamento.';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  // Lista de categorias a exibir dependendo se é receita ou despesa
  const availableCategories = tipoMovimentacao === 'receita'
    ? DEFAULT_RECEITA_CATEGORIES.map((name) => ({ id: name, nome: name, cor: '#10B981' }))
    : categories;

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
                : 'Cadastre receitas, salários, despesas e pagamentos recorrentes.'}
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

        {/* Seletor Receita vs Despesa (Exclusivo para Finanças Pessoais) */}
        {currentEnvironment === 'pessoal' && (
          <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-slate-950 border border-slate-800 mb-5">
            <button
              type="button"
              onClick={() => setTipoMovimentacao('despesa')}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                tipoMovimentacao === 'despesa'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TrendingDown className="w-4 h-4 text-rose-400" />
              <span>Despesa (Saída)</span>
            </button>

            <button
              type="button"
              onClick={() => setTipoMovimentacao('receita')}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                tipoMovimentacao === 'receita'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Receita (Entrada)</span>
            </button>
          </div>
        )}

        {/* Feedback de Sucesso */}
        {success && (
          <div className="bg-emerald-500/15 border border-emerald-500/40 rounded-xl p-3.5 text-center my-3 flex items-center justify-center space-x-2 text-emerald-300 text-xs font-semibold animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>{successMessageText} Redirecionando...</span>
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
          
          {/* Data do Lançamento */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {tipoMovimentacao === 'receita' ? 'Data do Recebimento' : 'Data da Despesa'}
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
              className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all cursor-pointer"
            />
          </div>

          {/* Seleção Dinâmica de Categoria */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                <Tag className="w-3.5 h-3.5 text-emerald-400" />
                <span>Categoria</span>
              </label>

              {tipoMovimentacao === 'despesa' && (
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Nova Categoria</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {availableCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoria(cat.nome)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border text-left transition-all flex items-center space-x-2 cursor-pointer ${
                    categoria === cat.nome
                      ? tipoMovimentacao === 'receita'
                        ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200 font-semibold ring-1 ring-emerald-400/40 shadow-sm'
                        : 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-semibold ring-1 ring-emerald-400/40 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cat.cor || (tipoMovimentacao === 'receita' ? '#10B981' : '#38BDF8') }}
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
              <span>Descrição do Lançamento</span>
            </label>
            <input
              type="text"
              required
              placeholder={
                currentEnvironment === 'obra'
                  ? 'Ex: 50 sacos de cimento CP-II, diária pedreiro...'
                  : tipoMovimentacao === 'receita'
                  ? 'Ex: Salário mensal, consultoria freelance, dividendos...'
                  : 'Ex: Aluguel, compras supermercado, conta de luz...'
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
              <span>{tipoMovimentacao === 'receita' ? 'Valor da Receita (R$)' : 'Valor da Despesa (R$)'}</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400 font-mono">
                R$
              </span>
              <input
                type="text"
                inputMode="decimal"
                required
                placeholder="0,00"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className={`w-full pl-9 pr-3.5 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm font-bold placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-all font-mono ${
                  tipoMovimentacao === 'receita'
                    ? 'text-emerald-400 focus:ring-emerald-400 focus:border-emerald-400'
                    : 'text-white focus:ring-emerald-400 focus:border-emerald-400'
                }`}
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
                className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
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
                className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
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

          {/* Bloco de Recorrência / Parcelamento Programado */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                  <Repeat className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">
                    {currentEnvironment === 'obra' ? 'Lançamento Recorrente / Parcelado' : 'Lançamento Recorrente'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {currentEnvironment === 'obra'
                      ? 'Repetir automaticamente nos próximos meses (empreiteiro, parcelas de materiais, aluguel de caçamba/máquinas)'
                      : 'Repetir automaticamente nos próximos meses (salário, contas, aluguel)'}
                  </span>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRecorrente}
                  onChange={(e) => setIsRecorrente(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            {isRecorrente && (
              <div className="pt-3 border-t border-slate-900 space-y-3 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <span className="text-slate-300 font-medium">Repetir por quantos meses?</span>
                  
                  {/* Atalhos Rápidos */}
                  <div className="flex items-center space-x-1.5">
                    {[3, 6, 12, 24].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMesesRecorrencia(m)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                          mesesRecorrencia === m
                            ? 'bg-emerald-500 text-slate-950 shadow-sm'
                            : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {m} meses
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    min="2"
                    max="60"
                    value={mesesRecorrencia}
                    onChange={(e) => setMesesRecorrencia(Math.max(2, Math.min(60, parseInt(e.target.value) || 2)))}
                    className="w-24 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm font-bold text-emerald-400 font-mono focus:outline-none focus:border-emerald-500 text-center"
                  />
                  <p className="text-[11px] text-slate-400 leading-tight">
                    Serão gerados <strong>{mesesRecorrencia} lançamentos automáticos</strong> (1 por mês). O mês atual segue o status acima; os meses futuros serão criados como "Pendente".
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Upload de Comprovante */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1.5">
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span>Comprovante / Recibo (Opcional)</span>
            </label>

            {!previewUrl ? (
              <label className="border-2 border-dashed border-slate-700/80 hover:border-emerald-400/80 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all bg-slate-950/40 hover:bg-slate-900/60 group">
                <ImageIcon className="w-7 h-7 text-slate-400 group-hover:text-emerald-400 mb-2 transition-colors" />
                <span className="text-xs font-medium text-slate-300 group-hover:text-white">
                  Tirar foto ou anexar comprovante
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
                  className="absolute top-2 right-2 p-1.5 bg-slate-950/80 hover:bg-rose-600 text-white rounded-full transition-colors cursor-pointer"
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
              placeholder="Ex: Pagamento referente a março, transferência bancária..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-xs font-medium text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all resize-none"
            />
          </div>

          {/* Botão de Envio */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 text-slate-950 rounded-2xl text-xs font-black shadow-lg flex items-center justify-center space-x-2 transition-all active:scale-[0.99] disabled:opacity-60 cursor-pointer ${
              tipoMovimentacao === 'receita'
                ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 hover:from-emerald-300 hover:to-teal-300 shadow-emerald-500/25'
                : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 hover:from-emerald-400 hover:to-teal-300 shadow-emerald-500/20'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>Gravando lançamento...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-slate-950" />
                <span>
                  {isRecorrente && mesesRecorrencia > 1
                    ? `Confirmar e Criar ${mesesRecorrencia} Lançamentos Mensais`
                    : tipoMovimentacao === 'receita'
                    ? 'Confirmar e Salvar Receita'
                    : 'Confirmar e Salvar Despesa'}
                </span>
              </>
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
