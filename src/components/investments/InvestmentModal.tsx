import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useWorkspace } from '../../context/WorkspaceContext';
import type { InvestimentoItem, TipoInvestimento } from '../../types/app';
import type { Json } from '../../types/database.types';
import { parseBrazilianNumber, formatCurrencyInput } from '../../lib/formatters';
import {
  X,
  PiggyBank,
  DollarSign,
  Percent,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface InvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  investmentToEdit?: InvestimentoItem | null;
}

const TIPOS_INVESTIMENTO: TipoInvestimento[] = [
  'CDB',
  'Poupança',
  'Tesouro Direto',
  'LCI/LCA',
  'Ações/FIIs',
  'Cripto',
  'Outro',
];

export const InvestmentModal: React.FC<InvestmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  investmentToEdit,
}) => {
  const { currentWorkspace, refreshWorkspaces } = useWorkspace();

  const [nome, setNome] = useState<string>(investmentToEdit?.nome || '');
  const [tipo, setTipo] = useState<TipoInvestimento>(investmentToEdit?.tipo || 'CDB');
  const [instituicao, setInstituicao] = useState<string>(investmentToEdit?.instituicao || '');
  const [valor, setValor] = useState<string>(investmentToEdit ? formatCurrencyInput(investmentToEdit.valor) : '');
  const [rentabilidade, setRentabilidade] = useState<string>(investmentToEdit?.rentabilidade || '');
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedValor = parseBrazilianNumber(valor);
    if (isNaN(parsedValor) || parsedValor < 0) {
      setError('Informe um valor de investimento válido.');
      return;
    }

    if (nome.trim().length < 2) {
      setError('O nome do investimento deve ter pelo menos 2 caracteres.');
      return;
    }

    if (!currentWorkspace?.id) {
      setError('Nenhum ambiente de finanças pessoais selecionado.');
      return;
    }

    setLoading(true);

    try {
      // 1. Obtém a lista atual de investimentos das configurações do workspace
      const currentConfig = (currentWorkspace.configuracoes as { [key: string]: Json | undefined }) || {};
      const currentList = Array.isArray(currentConfig.investimentos)
        ? (currentConfig.investimentos as unknown as InvestimentoItem[])
        : [];

      let updatedList: InvestimentoItem[];

      if (investmentToEdit) {
        // Atualiza item existente
        updatedList = currentList.map((item) =>
          item.id === investmentToEdit.id
            ? {
                ...item,
                nome: nome.trim(),
                tipo,
                instituicao: instituicao.trim() || 'Geral',
                valor: parsedValor,
                rentabilidade: rentabilidade.trim() || undefined,
                atualizado_em: new Date().toISOString(),
              }
            : item
        );
      } else {
        // Cria novo item
        const newItem: InvestimentoItem = {
          id: crypto.randomUUID(),
          nome: nome.trim(),
          tipo,
          instituicao: instituicao.trim() || 'Geral',
          valor: parsedValor,
          rentabilidade: rentabilidade.trim() || undefined,
          atualizado_em: new Date().toISOString(),
        };
        updatedList = [newItem, ...currentList];
      }

      // 2. Salva no banco de dados Supabase na coluna configuracoes do workspace
      const updatedConfig: { [key: string]: Json | undefined } = {
        ...currentConfig,
        investimentos: updatedList,
      };

      const { error: updateError } = await supabase
        .from('workspaces')
        .update({
          configuracoes: updatedConfig,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentWorkspace.id);

      if (updateError) throw updateError;

      // 3. Tenta salvar na tabela dedicada public.investimentos caso ela exista no PostgreSQL
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          if (investmentToEdit) {
            await supabase
              .from('investimentos')
              .update({
                nome: nome.trim(),
                tipo,
                instituicao: instituicao.trim() || 'Geral',
                valor: parsedValor,
                rentabilidade: rentabilidade.trim() || null,
                updated_at: new Date().toISOString(),
              })
              .eq('id', investmentToEdit.id);
          } else {
            await supabase.from('investimentos').insert({
              id: updatedList[0].id,
              user_id: user.id,
              workspace_id: currentWorkspace.id,
              nome: nome.trim(),
              tipo,
              instituicao: instituicao.trim() || 'Geral',
              valor: parsedValor,
              rentabilidade: rentabilidade.trim() || null,
            });
          }
        }
      } catch (tableErr) {
        // Se a tabela ainda não existir, o armazenamento em configuracoes já garantiu o funcionamento!
        console.info('Armazenado com segurança em workspace.configuracoes.');
      }

      await refreshWorkspaces();
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao salvar investimento.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative text-slate-100">
        
        {/* Cabeçalho */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
              <PiggyBank className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                {investmentToEdit ? 'Editar Investimento' : 'Novo Investimento / Aplicação'}
              </h3>
              <p className="text-xs text-slate-400">
                Acompanhe CDB, Poupança e reservas no seu painel pessoal.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Nome / Descrição */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">
              Nome do Investimento *
            </label>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: CDB Sofisa 110%, Reserva Nubank, Poupança Caixa"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Tipo e Instituição (2 colunas) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Tipo *
              </label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TipoInvestimento)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500 transition-colors"
              >
                {TIPOS_INVESTIMENTO.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Banco / Corretora
              </label>
              <input
                type="text"
                value={instituicao}
                onChange={(e) => setInstituicao(e.target.value)}
                placeholder="Ex: Nubank, Sofisa, XP"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Valor Investido e Rentabilidade (2 colunas) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>Saldo Atual (R$) *</span>
              </label>
              <input
                type="text"
                inputMode="decimal"
                required
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                onBlur={() => {
                  if (valor.trim()) {
                    setValor(formatCurrencyInput(valor));
                  }
                }}
                placeholder="0,00"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-bold text-emerald-400 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1">
                <Percent className="w-3.5 h-3.5 text-cyan-400" />
                <span>Rendimento</span>
              </label>
              <input
                type="text"
                value={rentabilidade}
                onChange={(e) => setRentabilidade(e.target.value)}
                placeholder="Ex: 100% CDI, 110%"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Botões */}
          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center space-x-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{investmentToEdit ? 'Atualizar Saldo' : 'Salvar Investimento'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
