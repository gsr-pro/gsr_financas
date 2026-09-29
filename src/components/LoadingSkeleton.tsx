import React from 'react';

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Card Destaque Terreno */}
      <div className="h-28 bg-slate-200/80 rounded-2xl" />
      {/* Métricas em grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="h-20 bg-slate-200/80 rounded-xl" />
        <div className="h-20 bg-slate-200/80 rounded-xl" />
        <div className="h-20 bg-slate-200/80 rounded-xl" />
        <div className="h-20 bg-slate-200/80 rounded-xl" />
      </div>
      {/* Progresso */}
      <div className="h-44 bg-slate-200/80 rounded-2xl" />
    </div>
  );
};

export const ListSkeleton: React.FC = () => {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-10 bg-slate-200/80 rounded-xl" />
      <div className="flex space-x-2">
        <div className="h-8 w-20 bg-slate-200/80 rounded-full" />
        <div className="h-8 w-24 bg-slate-200/80 rounded-full" />
        <div className="h-8 w-20 bg-slate-200/80 rounded-full" />
      </div>
      <div className="space-y-2.5 pt-2">
        <div className="h-20 bg-slate-200/80 rounded-xl" />
        <div className="h-20 bg-slate-200/80 rounded-xl" />
        <div className="h-20 bg-slate-200/80 rounded-xl" />
      </div>
    </div>
  );
};
