'use client';

import Link from 'next/link';
import { AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import Badge from '@/components/common/Badge';

/**
 * Returns the badge variant and label colour based on SLA level.
 */
function getLevelConfig(level) {
  if (level >= 3) {
    return { variant: 'danger', label: `Level ${level}`, dotClass: 'bg-red-700' };
  }
  if (level === 2) {
    return { variant: 'danger', label: `Level ${level}`, dotClass: 'bg-red-500' };
  }
  return { variant: 'warning', label: `Level ${level}`, dotClass: 'bg-yellow-500' };
}

/**
 * SLAViolationWidget — shows a compact list of active SLA violations.
 *
 * @param {{
 *   violations: Array<{
 *     id: string,
 *     projectName: string,
 *     boqItem: string,
 *     daysOverdue: number,
 *     level: number
 *   }>,
 *   viewAllHref?: string
 * }} props
 */
export default function SLAViolationWidget({ violations = [], viewAllHref = '/projects' }) {
  const visible = violations.slice(0, 5);

  if (violations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
        <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
          <CheckCircle size={20} className="text-green-500" />
        </div>
        <p className="text-sm font-medium text-green-700">No active violations</p>
        <p className="text-xs text-gray-400">All projects are within SLA thresholds.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {visible.map((v) => {
        const { variant, label } = getLevelConfig(v.level);
        return (
          <div
            key={v.id}
            className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 hover:bg-red-50 hover:border-red-100 transition-colors"
          >
            <AlertTriangle
              size={15}
              className={`shrink-0 mt-0.5 ${v.level >= 2 ? 'text-red-500' : 'text-yellow-500'}`}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">{v.projectName}</p>
              <p className="text-xs text-gray-500 truncate mt-0.5">{v.boqItem}</p>
              <p className={`text-xs font-medium mt-0.5 ${v.level >= 2 ? 'text-red-600' : 'text-yellow-700'}`}>
                {v.daysOverdue} {v.daysOverdue === 1 ? 'day' : 'days'} overdue
              </p>
            </div>
            <Badge variant={variant} size="sm">
              {label}
            </Badge>
          </div>
        );
      })}

      {violations.length > 5 && (
        <Link
          href={viewAllHref}
          className="flex items-center justify-center gap-1.5 text-xs font-medium text-primary hover:opacity-80 transition-opacity mt-1 py-1"
        >
          View all {violations.length} violations
          <ArrowRight size={13} />
        </Link>
      )}
    </div>
  );
}
