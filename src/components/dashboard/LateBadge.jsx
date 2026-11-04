import { STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';
import { plural } from './sourceNote';

/** How far past its date something is, in whole days. */
export default function LateBadge({ days }) {
  return (
    <span
      className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums"
      style={{ color: STATUS.critical, backgroundColor: withAlpha(STATUS.critical, 0.1) }}
    >
      {days > 0 ? `${plural(days, 'day')} late` : 'Due today'}
    </span>
  );
}
