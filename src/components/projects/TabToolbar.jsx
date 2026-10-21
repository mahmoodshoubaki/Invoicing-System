'use client';

import { memo } from 'react';
import { motion } from 'motion/react';
import { CHROME } from '@/theme/vizPalette';

/**
 * The strip that sits above each project tab's table: a few at-a-glance
 * figures on the left, the tab's primary actions on the right.
 *
 * Gives the three tabs a shared shape so switching between them doesn't feel
 * like landing on three differently-built screens.
 */
function TabToolbar({ stats = [], actions }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="mb-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#e9e7e5] bg-white px-5 py-3.5 shadow-[var(--shadow-card)]"
    >
      <dl className="flex flex-wrap items-center gap-x-7 gap-y-2">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-2.5">
            {stat.icon && (
              <span
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
                style={{ backgroundColor: `${stat.accent ?? '#898781'}1a`, color: stat.accent ?? '#898781' }}
              >
                <stat.icon size={14} />
              </span>
            )}
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: CHROME.textMuted }}>
                {stat.label}
              </dt>
              <dd className="text-sm font-bold" style={{ color: stat.valueColor ?? CHROME.textPrimary }}>
                {stat.value}
              </dd>
            </div>
          </div>
        ))}
      </dl>

      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </motion.div>
  );
}

export default memo(TabToolbar);
