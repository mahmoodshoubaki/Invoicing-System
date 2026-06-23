'use client';

import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function PageHeader({ title, subtitle, breadcrumbs, actions, children }) {
  return (
    <div className="mb-6">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex  justify-start gap-1 text-xs text-gray-400 mb-2">
          {breadcrumbs.map((crumb, idx) => (
            <span key={idx} className="flex items-center gap-1">
              {idx > 0 && <ChevronRight size={12} className="shrink-0" />}
              {crumb.href ? (
                <Link href={crumb.href} className="hover:text-primary transition-colors">
                  {crumb.label}
                </Link>
              ) : (
                <span className={idx === breadcrumbs.length - 1 ? 'text-gray-600 font-medium' : ''}>
                  {crumb.label}
                </span>
              )}
            </span>
          ))}
        </nav>
      )}

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        {(actions || children) && (
          <div className="flex items-center gap-2 flex-wrap">
            {actions}
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
