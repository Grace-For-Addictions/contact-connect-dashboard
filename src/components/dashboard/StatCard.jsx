import React from 'react';
import { cn } from '@/lib/utils';

export default function StatCard({ title, value, subtitle, icon: Icon, trend, trendUp, color = 'teal' }) {
  const colorClasses = {
    teal: 'bg-[#5B9A9A]/10 text-[#5B9A9A]',
    gold: 'bg-[#C9A962]/10 text-[#C9A962]',
    green: 'bg-emerald-50 text-emerald-600',
    purple: 'bg-purple-50 text-purple-600',
    blue: 'bg-blue-50 text-blue-600',
    rose: 'bg-rose-50 text-rose-600',
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-slate-900">{value}</p>
          {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
          {trend && (
            <div className={cn(
              "flex items-center gap-1 mt-2 text-sm font-medium",
              trendUp ? "text-emerald-600" : "text-rose-600"
            )}>
              <span>{trendUp ? '↑' : '↓'}</span>
              <span>{trend}</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn("p-3 rounded-xl", colorClasses[color])}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
}