import React from 'react';
import { formatCurrency } from '../lib/formatters';

interface CategoryItem {
  name: string;
  amount: number;
  color: string;
}

interface CategoryProgressProps {
  categories: CategoryItem[];
  totalExpenses: number;
}

export const CategoryProgress: React.FC<CategoryProgressProps> = ({
  categories,
  totalExpenses,
}) => {
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3.5">
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
        Distribuição por Categoria
      </h3>

      {/* Barra segmentada consolidada */}
      {totalExpenses > 0 ? (
        <div className="w-full h-3 bg-slate-100 rounded-full flex overflow-hidden shadow-inner">
          {categories.map((cat) => {
            const percentage = (cat.amount / totalExpenses) * 100;
            if (percentage <= 0) return null;
            return (
              <div
                key={cat.name}
                style={{ width: `${percentage}%` }}
                className={`${cat.color} transition-all duration-500`}
                title={`${cat.name}: ${percentage.toFixed(1)}%`}
              />
            );
          })}
        </div>
      ) : (
        <div className="w-full h-2.5 bg-slate-100 rounded-full" />
      )}

      {/* Lista detalhada das categorias */}
      <div className="space-y-2 pt-1">
        {categories.map((cat) => {
          const percentage = totalExpenses > 0 ? (cat.amount / totalExpenses) * 100 : 0;
          return (
            <div key={cat.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <span className={`w-2.5 h-2.5 rounded-full ${cat.color}`} />
                <span className="text-slate-600 font-medium">{cat.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-slate-800">
                  {formatCurrency(cat.amount)}
                </span>
                <span className="text-[11px] text-slate-400 w-11 text-right">
                  {percentage.toFixed(0)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
