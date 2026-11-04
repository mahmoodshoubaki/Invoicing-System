'use client';

import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';

/**
 * @param {{ types: Array<{ key: number, label: string }>, otherTypeText: string|null, projectEffect: { label: string }|null }} props
 */
export default function TypeAndEffect({ types, otherTypeText, projectEffect }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div>
        <p className="mb-1.5 text-xs font-semibold" style={{ color: CHROME.textPrimary }}>Type</p>
        {types.length === 0 ? (
          <p className="text-xs" style={{ color: CHROME.textMuted }}>Not set</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {types.map((type) => (
              <span key={type.key} className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ backgroundColor: withAlpha(STATUS.info, 0.1), color: STATUS.info }}>
                {type.label}
              </span>
            ))}
          </div>
        )}
        {otherTypeText && (
          <p className="mt-1.5 whitespace-pre-line text-xs leading-relaxed" style={{ color: CHROME.textSecondary }}>{otherTypeText}</p>
        )}
      </div>
      <div>
        <p className="mb-1.5 text-xs font-semibold" style={{ color: CHROME.textPrimary }}>Project effect</p>
        <p className="text-xs" style={{ color: projectEffect ? CHROME.textPrimary : CHROME.textMuted }}>
          {projectEffect?.label ?? 'Not set'}
        </p>
      </div>
    </div>
  );
}
