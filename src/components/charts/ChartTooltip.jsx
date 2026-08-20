'use client';

import { motion } from 'motion/react';
import { CHROME } from '@/theme/vizPalette';

/**
 * Shared Recharts tooltip. Values are right-aligned with tabular figures so
 * the numbers line up as the pointer moves between points, and each row
 * carries a colour chip beside a text label — identity never rides on colour
 * alone. Text stays in ink tokens, never the series colour.
 */
export default function ChartTooltip({ active, payload, label, format = (v) => v, total = false }) {
  if (!active || !payload?.length) return null;

  const sum = payload.reduce((acc, p) => acc + (Number(p.value) || 0), 0);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
      className="min-w-[190px] rounded-xl border border-[#e1e0d9] bg-white/95 p-3 shadow-[0_18px_38px_-12px_rgb(60_60_58/0.22)] backdrop-blur-sm"
    >
      <p className="mb-2 text-xs font-semibold" style={{ color: CHROME.textPrimary }}>
        {label}
      </p>
      <div className="flex flex-col gap-1.5">
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center gap-2 text-xs">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
              style={{ backgroundColor: entry.color }}
              aria-hidden="true"
            />
            <span className="flex-1" style={{ color: CHROME.textSecondary }}>
              {entry.name}
            </span>
            <span
              className="font-semibold tabular-nums"
              style={{ color: CHROME.textPrimary }}
            >
              {format(entry.value)}
            </span>
          </div>
        ))}
      </div>
      {total && payload.length > 1 && (
        <div className="mt-2 flex items-center justify-between border-t border-[#e1e0d9] pt-2 text-xs">
          <span style={{ color: CHROME.textMuted }}>Total</span>
          <span className="font-bold tabular-nums" style={{ color: CHROME.textPrimary }}>
            {format(sum)}
          </span>
        </div>
      )}
    </motion.div>
  );
}
