'use client';

import { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { Table2, AreaChart as AreaIcon } from 'lucide-react';
import ChartTooltip from './ChartTooltip';
import { CHROME, SERIES_ROLE } from '@/theme/vizPalette';
import { formatCurrency } from '@/utils/formatters';

/** Series definitions, in the validated slot order (see theme/vizPalette.js). */
const SERIES = [
  { key: 'revenue', name: 'Revenue', color: SERIES_ROLE.revenue },
  { key: 'invoiced', name: 'Invoiced', color: SERIES_ROLE.invoiced },
  { key: 'collected', name: 'Collected', color: SERIES_ROLE.collected },
];

const compact = (v) => {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `${Math.round(v / 1_000)}K`;
  return String(v);
};

/**
 * Monthly revenue / invoiced / collected. One y-axis by design — these three
 * measures share a unit and scale, so they belong on one scale. (A second
 * y-axis would be the single most misleading thing this chart could do.)
 *
 * Ships a table view alongside the plot: three of the app's series colours
 * are fine on contrast, but a table is the honest fallback for anyone the
 * colour channel fails, and it doubles as the copy-paste path.
 */
export default function RevenueAreaChart({ data = [] }) {
  const currency = useSelector((s) => s.ui.currency);
  const [view, setView] = useState('chart');
  const money = (v) => formatCurrency(v, currency);

  return (
    <div>
      {/* Legend + view toggle share a row above the plot */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {SERIES.map((s) => (
            <li key={s.key} className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-[3px]"
                style={{ backgroundColor: s.color }}
                aria-hidden="true"
              />
              <span className="text-xs font-medium" style={{ color: CHROME.textSecondary }}>
                {s.name}
              </span>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-0.5 rounded-lg bg-[#f4f3f1] p-0.5">
          {[
            { id: 'chart', label: 'Chart', icon: AreaIcon },
            { id: 'table', label: 'Table', icon: Table2 },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setView(opt.id)}
              aria-pressed={view === opt.id}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                view === opt.id ? 'bg-white text-[#3c3c3a] shadow-sm' : 'text-[#898781] hover:text-[#52514e]'
              }`}
            >
              <opt.icon size={12} />
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {view === 'chart' ? (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{ top: 6, right: 12, left: 4, bottom: 0 }}>
            <defs>
              {SERIES.map((s) => (
                <linearGradient key={s.key} id={`fill-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.color} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={s.color} stopOpacity={0.01} />
                </linearGradient>
              ))}
            </defs>

            {/* Recessive chrome: solid horizontal hairlines only. Not dashed —
                a dashed grid reads as a threshold or projection line. */}
            <CartesianGrid stroke={CHROME.grid} vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: CHROME.textMuted }}
              axisLine={{ stroke: CHROME.axis }}
              tickLine={false}
              dy={8}
            />
            <YAxis
              tickFormatter={compact}
              tick={{ fontSize: 11, fill: CHROME.textMuted }}
              axisLine={false}
              tickLine={false}
              width={46}
            />
            <Tooltip
              content={<ChartTooltip format={money} />}
              cursor={{ stroke: CHROME.axis, strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            {SERIES.map((s) => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={s.color}
                strokeWidth={2}
                fill={`url(#fill-${s.key})`}
                dot={false}
                // ≥8px hit target, with a 2px surface ring so overlapping
                // points stay separable where the series converge.
                activeDot={{ r: 5, strokeWidth: 2, stroke: CHROME.surface }}
                animationDuration={900}
                animationEasing="ease-out"
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#e1e0d9]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#faf9f8]">
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: CHROME.textMuted }}>
                  Month
                </th>
                {SERIES.map((s) => (
                  <th
                    key={s.key}
                    className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide"
                    style={{ color: CHROME.textMuted }}
                  >
                    {s.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.month} className="border-t border-[#efeeec]">
                  <td className="px-4 py-2.5 font-medium" style={{ color: CHROME.textPrimary }}>
                    {row.month}
                  </td>
                  {SERIES.map((s) => (
                    <td
                      key={s.key}
                      className="px-4 py-2.5 text-right tabular-nums"
                      style={{ color: CHROME.textSecondary }}
                    >
                      {money(row[s.key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
