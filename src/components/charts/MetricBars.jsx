'use client';

import { motion } from 'motion/react';
import { CHROME, SERIES } from '@/theme/vizPalette';

/**
 * @param {{items: Array<{label: string, value: number}>, format?: Function, color?: string}} props
 */
export default function MetricBars({ items = [], format = (v) => v, color = SERIES[0], emptyMessage = 'Nothing to show.' }) {
  const withValues = items.filter((i) => Number(i.value) > 0);
  const max = Math.max(...withValues.map((i) => i.value), 1);
  const ranked = [...withValues].sort((a, b) => b.value - a.value);

  if (ranked.length === 0) {
    return <p className="py-8 text-center text-sm" style={{ color: CHROME.textMuted }}>{emptyMessage}</p>;
  }

  return (
    <motion.ul
      data-motion
      className="flex flex-col gap-3"
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
    >
      {ranked.map((item) => (
        <motion.li
          key={item.label}
          variants={{
            hidden: { opacity: 0, x: -6 },
            show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
          }}
        >
          <div className="mb-1.5 flex items-baseline justify-between gap-3">
            <span className="truncate text-xs font-medium" style={{ color: CHROME.textSecondary }}>
              {item.label}
            </span>
            <span className="shrink-0 text-xs font-semibold tabular-nums" style={{ color: CHROME.textPrimary }}>
              {format(item.value)}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[#f1f0ee]">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: color }}
              initial={{ width: 0 }}
              whileInView={{ width: `${(item.value / max) * 100}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </motion.li>
      ))}
    </motion.ul>
  );
}
