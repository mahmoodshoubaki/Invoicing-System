'use client';

import { memo } from 'react';

import { CHROME } from '@/theme/vizPalette';
import DurationFields from './DurationFields';

/**
 * Holds the run for a set time, then carries on by itself.
 *
 * Five optional units and a set of days to skip — all of which is
 * `DurationFields`, shared with the stage deadline because the engine applies
 * the same rules to both.
 */
function DelayEditor({ step, onChange }) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-medium" style={{ color: CHROME.textSecondary }}>
        Wait for
      </p>
      <DurationFields source={step} prefix="delay" onChange={onChange} />
    </div>
  );
}

export default memo(DelayEditor);
