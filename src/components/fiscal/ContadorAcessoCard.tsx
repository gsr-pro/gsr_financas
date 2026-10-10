import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Mail,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Plus,
  Loader2,
  AlertCircle,
  Sparkles,
  Copy,
  Check,
  Share2,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import type { ContadorVinculoRow } from '../../types/fiscal.types';
import { useSubscription } from '../../context/SubscriptionContext';
import { PaywallView } from '../subscription/PaywallView';

export const ContadorAcessoCard: React.FC = () => {
  const { canAccessFiscal } = useSubscription();

  const [vinculos, setVinculos] = useState<ContadorVinculoRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [contadorEmail, setContadorEmail] = useState<string>('');
  const [permissao, setPermissao] = useState<'leitura' | 'auditoria_completa'>('leitura');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [paywallOpen, setPaywallOpen] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopiarConvite = (emailContador: string, id: string) => {
    const texto = `Olá! Concedi acesso contábil aos meus lançamentos no GSR Finanças para conferência e exportação do Carnê-Leão Web.\n\nPara acessar:\n1. Acesse https://gsrfinancas.com.br\n2. Clique em 'Área do Contador' e selecione 'Primeiro Acesso'\n3. Crie sua senha gratuita usando este e-mail: ${emailContador}\n\nO acesso para o escritório é 100% gratuito!`;
    navigator.clipboard.writeText(texto);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  const handleEnviarWhatsApp = (emailContador: string) => {
    const texto = encodeURIComponent(`Olá! Concedi acesso contábil aos meus lançamentos no GSR Finanças para conferência e exportação do Carnê-Leão Web.\n\nPara acessar:\n1. Acesse https://gsrfinancas.com.br\n2. Clique em 'Área do Contador' e selecione 'Primeiro Acesso'\n3. Crie sua senha gratuita usando este e-mail: ${emailContador}\n\nO acesso para o escritório é 100% gratuito!`);
    window.open(`https://api.whatsapp.com/send?text=${texto}`, '_blank');
  };

  const fetchVinculos = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('contador_vinculos')
        .select('*')
        .eq('cliente_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Erro ao carregar vínculos com contadores:', error.message);
        setVinculos([]);
      } else {
        setVinculos((data as ContadorVinculoRow[]) || []);
      }
    } catch (err) {
      console.warn('Falha na busca de contadores:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVinculos();
  }, [fetchVinculos]);

  const handleConcederAcesso = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!canAccessFiscal) {
      setPaywallOpen(true);
      return;
    }

    const emailLimpo = contadorEmail.trim().toLowerCase();
    if (!emailLimpo || !emailLimpo.includes('@')) {
      setErrorMessage('Por favor, informe um endereço de e-mail válido.');
      return;
    }

    try {
      setSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado.');

      if (user.email && user.email.toLowerCase() === emailLimpo) {
        setErrorMessage('Você não pode conceder acesso ao seu próprio endereço de e-mail.');
        return;
      }

      // Procura se o contador já tem conta em perfis
      const { data: contadorPerfil } = await supabase
        .from('perfis')
        .select('id')
        .eq('email', emailLimpo)
        .maybeSingle();

      const { error } = await supabase
        .from('contador_vinculos')
        .insert({
          cliente_id: user.id,
          contador_email: emailLimpo,
          contador_id: contadorPerfil?.id || null,
          status: 'ativo', // Ativa diretamente para facilitar conciliação imediata
          permissao,
        } as any);

      if (error) {
        if (error.code === '23505') {
          throw new Error('Você já concedeu acesso a este e-mail de contador.');
        }
        throw error;
      }

      setSuccessMessage(`Acesso concedido com sucesso para ${emailLimpo}!`);
      setContadorEmail('');
      fetchVinculos();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao conceder acesso ao contador.';
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevogarAcesso = async (id: string, email: string) => {
    if (!confirm(`Deseja revogar o acesso do contador ${email}? Ele não poderá mais visualizar seus lançamentos.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('contador_vinculos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setSuccessMessage(`Acesso de ${email} revogado.`);
      fetchVinculos();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao revogar acesso.';
      setErrorMessage(msg);
    }
  };

  return (
    <section className="bg-slate-900/80 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <h3 className="text-sm font-bold text-white">Meu Contador & Acesso Contábil</h3>
        </div>
        <div className="inline-flex items-center space-x-1.5 text-[11px] font-medium text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-xl self-start sm:self-auto">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Plano Contador + Carnê-Leão</span>
        </div>
      </div>

      <p className="text-xs text-slate-400">
        Conceda acesso direto ao seu escritório ou profissional contábil informando apenas o <strong>e-mail dele</strong> (não é necessário saber o CRC). O contador poderá acessar gratuitamente a Área do Contador para auditar seus lançamentos mensais, verificar notas fiscais e baixar o arquivo do Carnê-Leão Web com 1 clique.
      </p>

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

      {/* Formulário de Concessão de Acesso */}
      <form onSubmit={handleConcederAcesso} className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
        <span className="text-xs font-bold text-white block">Convidar Novo Profissional Contábil por E-mail:</span>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          <div className="sm:col-span-7">
            <div className="relative">
              <input
                type="email"
                required
                value={contadorEmail}
                onChange={(e) => setContadorEmail(e.target.value)}
                placeholder="email.do.contador@escritorio.com"
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            </div>
          </div>

          <div className="sm:col-span-3">
            <select
              value={permissao}
              onChange={(e) => setPermissao(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer"
            >
              <option value="leitura">Somente Leitura</option>
              <option value="auditoria_completa">Auditoria Completa</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2 px-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-1 cursor-pointer"
            >
              {submitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Conceder</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Lista de Contadores com Acesso */}
      <div className="space-y-2 pt-1">
        <span className="text-xs font-semibold text-slate-300 block">
          Profissionais com Acesso ({vinculos.length}):
        </span>

        {loading ? (
          <div className="py-4 text-center text-xs text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1 text-emerald-400" />
            Carregando permissões contábeis...
          </div>
        ) : vinculos.length === 0 ? (
          <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
            Nenhum contador conectado até o momento. Digite o e-mail do seu contador acima para autorizar o acesso.
          </div>
        ) : (
          <div className="space-y-2">
            {vinculos.map((v) => (
              <div
                key={v.id}
                className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-white block truncate">{v.contador_email}</span>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      Permissão: {v.permissao === 'auditoria_completa' ? 'Auditoria Completa' : 'Leitura'} • Status: {v.status}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-end sm:self-auto">
                  {/* Botão Copiar Instruções */}
                  <button
                    type="button"
                    onClick={() => handleCopiarConvite(v.contador_email, v.id)}
                    className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] font-medium text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm"
                    title="Copiar mensagem explicativa com link e instruções para enviar ao contador"
                  >
                    {copiedId === v.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Copiar Convite</span>
                      </>
                    )}
                  </button>

                  {/* Botão Enviar WhatsApp */}
                  <button
                    type="button"
                    onClick={() => handleEnviarWhatsApp(v.contador_email)}
                    className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-[11px] font-bold text-emerald-300 transition-all cursor-pointer shadow-sm"
                    title="Abrir WhatsApp com as instruções de primeiro acesso para o contador"
                  >
                    <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>WhatsApp</span>
                  </button>

                  {/* Botão Revogar */}
                  <button
                    type="button"
                    onClick={() => handleRevogarAcesso(v.id, v.contador_email)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                    title="Revogar acesso do contador"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {paywallOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <PaywallView
            reason="feature_locked"
            lockedFeatureName="Conexão Direta com Contador & Carnê-Leão Web"
            onClose={() => setPaywallOpen(false)}
          />
        </div>
      )}
    </section>
  );
};
