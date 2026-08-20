'use client';

import { memo } from 'react';
import { motion } from 'motion/react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import AnimatedCounter from '@/components/motion/AnimatedCounter';
import Sparkline from '@/components/charts/Sparkline';
import { revealItem } from '@/components/motion/Reveal';
import { CHROME } from '@/theme/vizPalette';

const DELTA_STYLES = {
  positive: { cls: 'text-[#006300] bg-[#0ca30c]/10', Icon: ArrowUpRight },
  negative: { cls: 'text-[#c0392f] bg-[#d03b3b]/10', Icon: ArrowDownRight },
  neutral: { cls: 'text-[#52514e] bg-[#898781]/12', Icon: Minus },
};

/**
 * A single KPI tile: label, animated value, optional trend sparkline and a
 * delta chip. The delta always pairs an arrow icon with text, so direction is
 * never carried by colour alone.
 */
function KpiTile({
  label, value, format, icon: Icon, accent, trend, delta, deltaType = 'neutral', footnote,
}) {
  const { cls, Icon: DeltaIcon } = DELTA_STYLES[deltaType] ?? DELTA_STYLES.neutral;

  return (
    <motion.div
      variants={revealItem}
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 380, damping: 26 }}
      className="group relative overflow-hidden rounded-2xl border border-[#e9e7e5] bg-white p-5 shadow-[0_2px_6px_-2px_rgb(60_60_58/0.08)] transition-shadow hover:shadow-[0_18px_38px_-14px_rgb(60_60_58/0.20)]"
    >
      {/* Accent wash that blooms on hover */}
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
        style={{ backgroundColor: accent }}
        aria-hidden="true"
      />

      <div className="relative flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: CHROME.textMuted }}>
          {label}
        </p>
        {Icon && (
          <span
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
            style={{ backgroundColor: `${accent}1a`, color: accent }}
          >
            <Icon size={15} />
          </span>
        )}
      </div>

      <p className="relative mt-3 text-2xl font-bold tracking-tight" style={{ color: CHROME.textPrimary }}>
        <AnimatedCounter value={value} format={format} />
      </p>

      <div className="relative mt-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          {delta && (
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}>
              <DeltaIcon size={11} />
              {delta}
            </span>
          )}
          {footnote && (
            <p className="mt-1.5 truncate text-[11px]" style={{ color: CHROME.textMuted }}>
              {footnote}
            </p>
          )}
        </div>
        {trend?.length > 1 && <Sparkline values={trend} color={accent} width={84} height={28} />}
      </div>
    </motion.div>
  );
}

export default memo(KpiTile);
