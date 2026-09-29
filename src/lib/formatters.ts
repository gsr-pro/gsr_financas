export const formatCurrency = (val: number | null | undefined): string => {
  const amount = Number(val) || 0;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '-';
  const parts = dateString.split('T')[0].split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  return new Date(dateString).toLocaleDateString('pt-BR');
};

export const getCategoryBadgeStyle = (category: string): { bg: string; text: string; border: string } => {
  switch (category) {
    case 'Materiais':
      return { bg: 'bg-sky-500/15', text: 'text-sky-400', border: 'border-sky-500/30' };
    case 'Mão de Obra':
      return { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' };
    case 'Documentação':
      return { bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30' };
    case 'Ferramentas':
      return { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30' };
    case 'Outros':
    default:
      return { bg: 'bg-slate-800', text: 'text-slate-300', border: 'border-slate-700' };
  }
};
