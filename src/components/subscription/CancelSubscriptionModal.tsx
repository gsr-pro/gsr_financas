import React, { useState } from 'react';
import { useSubscription } from '../../context/SubscriptionContext';
import { CANCELLATION_REASONS, RETENTION_OFFER } from '../../config/cancellationRules';
import { formatDate } from '../../lib/formatters';
import type { CancellationReasonOption } from '../../types/subscription.types';
import {
  X,
  AlertCircle,
  HelpCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Calendar,
  BadgePercent,
  Headphones,
  ShieldCheck,
  Loader2,
  HeartHandshake,
} from 'lucide-react';

interface CancelSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type ModalStep = 'survey' | 'retention' | 'confirm' | 'success_retained' | 'success_cancelled';

export const CancelSubscriptionModal: React.FC<CancelSubscriptionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { subscription, cancelSubscription } = useSubscription();

  const [step, setStep] = useState<ModalStep>('survey');
  const [selectedReasonId, setSelectedReasonId] = useState<string>('');
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedReason = CANCELLATION_REASONS.find((r) => r.id === selectedReasonId);

  const formattedPeriodEnd = subscription?.current_period_end
    ? formatDate(subscription.current_period_end)
    : subscription?.trial_ends_at
    ? formatDate(subscription.trial_ends_at)
    : 'o final do ciclo atual';

  const handleReset = () => {
    setStep('survey');
    setSelectedReasonId('');
    setFeedbackText('');
    setErrorMessage(null);
    setLoading(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  // Avança do Step 1 (Survey) para Retenção ou Confirmação
  const handleProceedFromSurvey = () => {
    if (!selectedReason) {
      setErrorMessage('Por favor, selecione o motivo do cancelamento.');
      return;
    }
    setErrorMessage(null);

    // Se houver ação de retenção (desconto ou suporte), apresenta oferta; caso contrário, vai para confirmação direta
    if (selectedReason.retentionAction === 'discount' || selectedReason.retentionAction === 'support') {
      setStep('retention');
    } else {
      setStep('confirm');
    }
  };

  // Aceitou a oferta de retenção (fica na plataforma com benefício)
  const handleAcceptRetention = async () => {
    if (!selectedReason) return;
    setLoading(true);
    setErrorMessage(null);

    try {
      const result = await cancelSubscription({
        reasonId: selectedReason.id,
        reasonLabel: selectedReason.label,
        feedbackText,
        retentionOffered: true,
        retentionAccepted: true,
      });

      if (result.success) {
        setStep('success_retained');
        onSuccess?.();
      } else {
        setErrorMessage(result.error || 'Falha ao registrar oferta de retenção.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao processar oferta.';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  // Recusou a oferta de retenção -> vai para confirmação transparente
  const handleDeclineRetention = () => {
    setStep('confirm');
  };

  // Confirmação final do cancelamento
  const handleConfirmCancellation = async () => {
    if (!selectedReason) return;
    setLoading(true);
    setErrorMessage(null);

    try {
      const result = await cancelSubscription({
        reasonId: selectedReason.id,
        reasonLabel: selectedReason.label,
        feedbackText,
        retentionOffered:
          selectedReason.retentionAction === 'discount' || selectedReason.retentionAction === 'support',
        retentionAccepted: false,
      });

      if (result.success) {
        setStep('success_cancelled');
        onSuccess?.();
      } else {
        setErrorMessage(result.error || 'Falha ao programar o cancelamento.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao cancelar assinatura.';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-5 relative my-auto">
        
        {/* Botão de Fechar no Topo */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Mensagem de Erro Global */}
        {errorMessage && (
          <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ETAPA 1: DIAGNÓSTICO / FORMULÁRIO DE FEEDBACK (SURVEY) */}
        {/* ========================================================================= */}
        {step === 'survey' && (
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div className="min-w-0 pr-6">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                  Pesquisa de Satisfação
                </span>
                <h3 className="text-base font-bold text-white mt-1">
                  Gerenciar ou Cancelar Assinatura
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Lamentamos ver você partir! Poderia nos dizer o principal motivo da sua decisão para continuarmos evoluindo?
                </p>
              </div>
            </div>

            {/* Lista de Motivos com Seleção Visual Clara */}
            <div className="space-y-2 pt-1 max-h-60 overflow-y-auto pr-1">
              {CANCELLATION_REASONS.map((reason: CancellationReasonOption) => {
                const isSelected = selectedReasonId === reason.id;
                return (
                  <button
                    key={reason.id}
                    type="button"
                    onClick={() => {
                      setSelectedReasonId(reason.id);
                      setErrorMessage(null);
                    }}
                    className={`w-full text-left p-3 rounded-xl border text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500/50 text-white shadow-sm shadow-emerald-500/10'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/60 hover:border-slate-700'
                    }`}
                  >
                    <span className="pr-2">{reason.label}</span>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                        isSelected
                          ? 'border-emerald-400 bg-emerald-500'
                          : 'border-slate-600 bg-slate-900'
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Campo Opcional de Comentário Adicional */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-[11px] font-semibold text-slate-300">
                Gostaria de detalhar ou deixar uma sugestão? (Opcional)
              </label>
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Conte-nos o que faltou ou como poderíamos melhorar a sua experiência..."
                rows={2}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>

            {/* Ações da Etapa 1 */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Voltar e Manter Plano
              </button>

              <button
                type="button"
                disabled={!selectedReasonId}
                onClick={handleProceedFromSurvey}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:hover:bg-emerald-500 text-slate-950 text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <span>Avançar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ETAPA 2: OFERTA DE RETENÇÃO CONTEXTUAL (DESCONTO OU SUPORTE VIP) */}
        {/* ========================================================================= */}
        {step === 'retention' && selectedReason && (
          <div className="space-y-4 animate-fade-in">
            {selectedReason.retentionAction === 'discount' ? (
              /* Card de Oferta de Desconto */
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-teal-950/30 border border-emerald-500/40 space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <BadgePercent className="w-5 h-5 animate-bounce" />
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                    <Sparkles className="w-3 h-3 text-emerald-300" />
                    <span>{RETENTION_OFFER.badge}</span>
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-extrabold text-white">
                    {RETENTION_OFFER.title}: {RETENTION_OFFER.highlightText}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {RETENTION_OFFER.description}
                  </p>
                </div>

                <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1 text-[11px] text-slate-300">
                  <p className="flex items-center space-x-1.5 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Sem burocracia ou contrato de fidelidade</span>
                  </p>
                  <p className="text-slate-400">
                    Você continuará com acesso irrestrito aos seus projetos, estoque, precificação e relatórios.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={loading}
                  onClick={handleAcceptRetention}
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-black rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Registrando benefício...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Aceitar 30% OFF e Manter Minha Assinatura</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              /* Card de Suporte VIP e Atendimento Prioritário */
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-sky-950/30 border border-indigo-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                    <Headphones className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-300 bg-indigo-500/20 border border-indigo-500/30 px-2.5 py-0.5 rounded-full">
                    Consultoria VIP Gratuita
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-extrabold text-white">
                    Podemos te ajudar com a configuração ou dúvidas técnicas?
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Identificamos que você teve dúvidas ou precisa de funcionalidades sob medida. Nosso time de especialistas pode realizar uma consultoria rápida no WhatsApp para ajustar o GSR Finanças exatamente ao fluxo do seu negócio ou obra.
                  </p>
                </div>

                <a
                  href={RETENTION_OFFER.supportContactUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Headphones className="w-4 h-4" />
                  <span>Falar com Especialista no WhatsApp Agora</span>
                </a>
              </div>
            )}

            {/* Ações da Etapa 2 */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStep('survey')}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar</span>
              </button>

              <button
                type="button"
                onClick={handleDeclineRetention}
                className="text-xs text-slate-400 hover:text-rose-400 font-semibold underline underline-offset-4 transition-colors cursor-pointer"
              >
                Não quero o benefício, prosseguir com cancelamento
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ETAPA 3: GARANTIAS LEGAIS & CONFIRMAÇÃO TRANSPARENTE */}
        {/* ========================================================================= */}
        {step === 'confirm' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 flex-shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0 pr-6">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                  Política Cancele a Qualquer Momento
                </span>
                <h3 className="text-base font-bold text-white mt-1">
                  Confirmação Transparente de Cancelamento
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Aqui não há pegadinhas ou cobranças ocultas. Conheça suas garantias:
                </p>
              </div>
            </div>

            {/* Card com Garantias e Transparência */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5 text-xs">
              <div className="flex items-start space-x-2 text-slate-200">
                <Calendar className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Acesso mantido:</strong> Você continuará com acesso total e irrestrito ao seu plano até{' '}
                  <strong className="text-emerald-300">{formattedPeriodEnd}</strong>.
                </span>
              </div>

              <div className="flex items-start space-x-2 text-slate-200">
                <Clock className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Zero cobranças futuras:</strong> Nenhuma renovação automática será processada após essa data.
                </span>
              </div>

              <div className="flex items-start space-x-2 text-slate-200">
                <ShieldCheck className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Seus dados continuam salvos:</strong> Suas obras, categorias, despesas e estoque ficarão armazenados com segurança caso queira reativar no futuro.
                </span>
              </div>

              <div className="flex items-start space-x-2 text-slate-200">
                <HeartHandshake className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Reativação com 1 clique:</strong> Mudou de ideia? Você poderá reativar seu plano a qualquer momento nesta mesma tela de Configurações.
                </span>
              </div>
            </div>

            {/* Ações da Etapa 3 */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handleClose}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Desistir e Manter Minha Assinatura Ativa</span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={handleConfirmCancellation}
                className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:text-rose-200 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processando cancelamento...</span>
                  </>
                ) : (
                  <span>Sim, Confirmar Cancelamento Programado</span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUCESSO: RETENÇÃO ACEITA */}
        {/* ========================================================================= */}
        {step === 'success_retained' && (
          <div className="text-center py-4 space-y-4 animate-fade-in">
            <div className="w-14 h-14 rounded-3xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto">
              <Sparkles className="w-7 h-7 animate-pulse" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">
                Ficamos felizes em continuar com você!
              </h3>
              <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                Seu feedback e a oferta de retenção foram registrados. Seu plano segue ativo sem nenhuma interrupção ou perda de dados.
              </p>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
            >
              Continuar Usando o GSR Finanças
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUCESSO: CANCELAMENTO AGENDADO */}
        {/* ========================================================================= */}
        {step === 'success_cancelled' && (
          <div className="text-center py-4 space-y-4 animate-fade-in">
            <div className="w-14 h-14 rounded-3xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 mx-auto">
              <Calendar className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">
                Cancelamento Programado com Sucesso
              </h3>
              <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                Você continuará com acesso total aos seus recursos até <strong>{formattedPeriodEnd}</strong>.
                Não haverá novas cobranças em seu cartão. Se desejar reativar antes dessa data, basta 1 clique em Configurações.
              </p>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Entendido
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
