import React from 'react';

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: string;
  badgeColor?: 'emerald' | 'amber' | 'blue' | 'slate';
  variant?: 'default' | 'highlight' | 'secondary';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  badge,
  badgeColor = 'emerald',
  variant = 'default',
}) => {
  const badgeClasses = {
    emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    amber: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    blue: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    slate: 'bg-slate-800 text-slate-300 border-slate-700',
  }[badgeColor];

  if (variant === 'highlight') {
    return (
      <div className="bg-gradient-to-br from-[#0B132B] via-slate-900 to-[#043d26] text-white rounded-3xl p-5 border border-emerald-500/40 shadow-xl relative overflow-hidden theme-metric-highlight">
        {/* Glow de fundo */}
        <div className="absolute -right-6 -bottom-6 w-36 h-36 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between relative z-10">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{title}</span>
          </span>
          {icon && <div className="text-emerald-400">{icon}</div>}
        </div>
        <div className="mt-2 text-2xl font-extrabold tracking-tight text-white relative z-10">
          {value}
        </div>
        {subtitle && (
          <p className="mt-1.5 text-xs text-emerald-200/80 relative z-10">
            {subtitle}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 hover:border-slate-700/90 shadow-md text-slate-100 transition-all theme-metric-card">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400">{title}</span>
        {icon && <div className="text-slate-500">{icon}</div>}
      </div>
      <div className="mt-2 flex items-baseline justify-between">
        <span className="text-lg font-bold text-white tracking-tight">
          {value}
        </span>
        {badge && (
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${badgeClasses}`}>
            {badge}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="mt-1 text-[11px] text-slate-400 truncate">{subtitle}</p>
      )}
    </div>
  );
};
