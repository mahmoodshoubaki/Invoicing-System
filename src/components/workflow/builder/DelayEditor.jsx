'use client';

import { memo } from 'react';

import { CHROME } from '@/theme/vizPalette';
import DurationFields from './DurationFields';

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
