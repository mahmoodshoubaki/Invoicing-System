'use client';

import { memo } from 'react';

function Card({ children, className = '', padding = true, hover = false, onClick }) {
  return (
    <div
      className={`
        card bg-white rounded-xl border border-gray-100
        ${padding ? 'p-5' : ''}
        ${hover ? 'hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export default memo(Card);

function CardHeaderImpl({ title, subtitle, action, icon: Icon, className = '' }) {
  return (
    <div className={`flex items-start justify-between gap-3 mb-4 ${className}`}>
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
            <Icon size={18} className="text-primary" />
          </div>
        )}
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-gray-800 truncate">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5 truncate">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export const CardHeader = memo(CardHeaderImpl);

function StatCardImpl({ title, value, change, changeType = 'positive', icon: Icon, color = 'primary', subtitle }) {
  const colorMap = {
    primary: { bg: 'bg-red-50', text: 'text-primary', icon: 'text-primary' },
    success: { bg: 'bg-green-50', text: 'text-green-700', icon: 'text-green-600' },
    warning: { bg: 'bg-yellow-50', text: 'text-yellow-700', icon: 'text-yellow-600' },
    danger: { bg: 'bg-red-50', text: 'text-red-700', icon: 'text-red-600' },
    info: { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'text-blue-600' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'text-purple-600' },
    dark: { bg: 'bg-gray-100', text: 'text-gray-800', icon: 'text-gray-700' },
  };
  const c = colorMap[color] || colorMap.primary;

  return (
    <Card className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className={`text-md font-bold mt-1 ${c.text}`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          {change !== undefined && (
            <p className={`text-xs mt-1.5 font-medium ${changeType === 'positive' ? 'text-green-600' : changeType === 'negative' ? 'text-red-500' : 'text-gray-500'}`}>
              {changeType === 'positive' ? '↑' : changeType === 'negative' ? '↓' : '→'} {change}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`w-11 h-11 rounded-xl ${c.bg} flex items-center justify-center shrink-0`}>
            <Icon size={22} className={c.icon} />
          </div>
        )}
      </div>
    </Card>
  );
}

export const StatCard = memo(StatCardImpl);
