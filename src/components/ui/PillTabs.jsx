'use client';

import { memo } from 'react';

import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';

/**
 * A small row of filter pills — the same control the run page's task filter
 * uses, so a filter looks like a filter everywhere.
 *
 * @param {{
 *   tabs: Array<{ key: string, label: string, count?: number|null, tone?: string }>,
 *   value: string,
 *   onChange: (key: string) => void,
 * }} props
 */
function PillTabs({ tabs, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1" role="tablist">
      {tabs.map((tab) => {
        const on = tab.key === value;
        const tone = tab.tone ?? STATUS.info;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(tab.key)}
            className="rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors"
            style={{
              backgroundColor: on ? withAlpha(tone, 0.14) : '#f6f5f3',
              color: on ? CHROME.textPrimary : CHROME.textMuted,
            }}
          >
            {tab.label}
            {tab.count != null && (
              <span className="ml-1 tabular-nums" style={{ opacity: tab.count === 0 ? 0.5 : 1 }}>{tab.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default memo(PillTabs);
