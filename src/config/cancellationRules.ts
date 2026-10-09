import type { CancellationReasonOption } from '../types/subscription.types';

export const CANCELLATION_REASONS: CancellationReasonOption[] = [
  {
    id: 'preco_alto',
    label: 'Achei o valor elevado para o meu momento atual',
    category: 'price',
    retentionAction: 'discount',
  },
  {
    id: 'baixo_uso',
    label: 'Não estou utilizando com a frequência necessária',
    category: 'usage',
    retentionAction: 'discount',
  },
  {
    id: 'falta_funcionalidades',
    label: 'Faltam funcionalidades ou relatórios específicos que preciso',
    category: 'features',
    retentionAction: 'support',
  },
  {
    id: 'concorrente',
    label: 'Encontrei outra solução ou software concorrente',
    category: 'competitor',
    retentionAction: 'none',
  },
  {
    id: 'pausa_temporaria',
    label: 'Vou pausar ou encerrar minhas atividades temporariamente',
    category: 'pause',
    retentionAction: 'pause',
  },
  {
    id: 'duvidas_dificuldades',
    label: 'Tive dificuldades técnicas ou dúvidas no uso da plataforma',
    category: 'support',
    retentionAction: 'support',
  },
  {
    id: 'outro',
    label: 'Outro motivo não listado',
    category: 'other',
    retentionAction: 'none',
  },
];

export const RETENTION_OFFER = {
  discountPercent: 30,
  durationMonths: 2,
  title: 'Oferta Especial de Retenção',
  highlightText: '30% de desconto nos próximos 2 meses',
  description:
    'Entendemos que gerenciar custos é prioridade. Para que você continue organizando suas obras, finanças e estoque sem pesar no orçamento, aplicamos 30% OFF direto nas suas próximas 2 faturas.',
  badge: 'Oportunidade Exclusiva',
  supportContactUrl: 'https://wa.me/5511999999999?text=Ol%C3%A1%2C%20preciso%20de%20ajuda%20com%20o%20GSR%20Finan%C3%A7as',
};
