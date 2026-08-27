'use client';

import { motion } from 'motion/react';
import { CHROME } from '@/theme/vizPalette';

/**
 * Ranked horizontal bars for a status distribution.
 *
 * A 6-slice donut was the obvious move here and the wrong one: angles are far
 * harder to compare than aligned bar lengths, and small slices can't hold a
 * label. Ranked bars compare exactly, direct-label every row, and pair each
 * status with an icon + text so meaning never rides on hue alone.
 *
 * @param {{data: Array<{name: string, value: number, color: string, icon: Function}>}} props
 */
export default function StatusBreakdown({ data = [] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const max = Math.max(...data.map((d) => d.value), 1);
  const ranked = [...data].sort((a, b) => b.value - a.value);

  if (total === 0) {
    return (
      <p className="py-10 text-center text-sm" style={{ color: CHROME.textMuted }}>
        No invoices to break down yet.
      </p>
    );
  }

  return (
    <motion.ul
      // Motion drives these rows' opacity/transform — opt out of the global
      // `ul > li` CSS entrance animation so the two don't fight.
      data-motion
      className="flex flex-col gap-3.5"
      initial="hidden"
      // `animate`, not a one-shot `whileInView` — a row added after the
      // container has played would otherwise inherit `hidden` and stay invisible.
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
    >
      {ranked.map((item) => {
        const Icon = item.icon;
        const pct = Math.round((item.value / total) * 100);
        return (
          <motion.li
            key={item.name}
            variants={{
              hidden: { opacity: 0, x: -8 },
              show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
            }}
          >
            <div className="mb-1.5 flex items-center gap-2">
              {Icon && (
                <Icon size={13} style={{ color: item.color }} aria-hidden="true" className="shrink-0" />
              )}
              <span className="flex-1 text-xs font-medium" style={{ color: CHROME.textSecondary }}>
                {item.name}
              </span>
              {/* Direct label — every row, since there are few enough rows to
                  label them all without the plot turning into a wall of digits. */}
              <span className="text-xs font-bold tabular-nums" style={{ color: CHROME.textPrimary }}>
                {item.value}
              </span>
              <span className="w-9 text-right text-xs tabular-nums" style={{ color: CHROME.textMuted }}>
                {pct}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#f1f0ee]">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: item.color }}
                initial={{ width: 0 }}
                whileInView={{ width: `${(item.value / max) * 100}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </motion.li>
        );
      })}
    </motion.ul>
  );
}
