import { CHROME } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';

/**
 * A titled list of problems — what blocks a publish, or what is worth a
 * second look. An item is a sentence, or `{ message, onClick, where }` for a
 * problem the server placed (2026-10-11): clicking it opens what it is about.
 */
export default function ProblemList({ tone, icon: Icon, title, items, note }) {
  if (items.length === 0) return null;
  return (
    <div
      className="mb-4 rounded-xl px-4 py-3"
      style={{ backgroundColor: withAlpha(tone, 0.08), border: `1px solid ${withAlpha(tone, 0.25)}` }}
    >
      <p className="mb-1 inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: CHROME.textPrimary }}>
        <Icon size={13} style={{ color: tone }} aria-hidden="true" />
        {title}
      </p>
      {note && <p className="mb-1 text-[11px]" style={{ color: CHROME.textMuted }}>{note}</p>}
      <ul className="ml-5 list-disc" data-motion>
        {/* Keyed by position: two steps can share a name, and then two
            problems are reported in exactly the same words. */}
        {items.map((item, index) => (
          <li key={index} className="text-xs leading-relaxed" style={{ color: CHROME.textSecondary }}>
            {typeof item === 'string' ? item : item.onClick ? (
              <button
                type="button"
                onClick={item.onClick}
                className="text-left underline-offset-2 hover:underline"
                title={item.where ? `Open ${item.where}` : undefined}
              >
                {item.message}
              </button>
            ) : (
              item.message
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
