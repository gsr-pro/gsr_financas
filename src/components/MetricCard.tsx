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
    emerald: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    amber: 'bg-amber-100 text-amber-800 border-amber-200',
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
  }[badgeColor];

  if (variant === 'highlight') {
    return (
      <div className="bg-gradient-to-br from-emerald-800 to-teal-900 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div className="absolute -right-4 -bottom-4 w-28 h-28 bg-emerald-700/30 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center justify-between relative z-10">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-200">
            {title}
          </span>
          {icon && <div className="text-emerald-200">{icon}</div>}
        </div>
        <div className="mt-2 text-2xl font-extrabold tracking-tight relative z-10">
          {value}
        </div>
        {subtitle && (
          <p className="mt-1 text-xs text-emerald-200/90 relative z-10">
            {subtitle}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm hover:border-slate-300 transition-all">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">{title}</span>
        {icon && <div className="text-slate-400">{icon}</div>}
      </div>
      <div className="mt-1.5 flex items-baseline justify-between">
        <span className="text-lg font-bold text-slate-900 tracking-tight">
          {value}
        </span>
        {badge && (
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badgeClasses}`}>
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
