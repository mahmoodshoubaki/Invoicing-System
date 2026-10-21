'use client';

import { memo } from 'react';

import { Note } from '@/components/workflow/builder/containers/shared';
import { CHROME } from '@/theme/vizPalette';
import RecipientPicker from './RecipientPicker';
import CcDelivery from './CcDelivery';

function Heading({ children, hint }) {
  return (
    <h4 className="mb-2 text-xs font-semibold" style={{ color: CHROME.textPrimary }}>
      {children}
      {hint && <span className="ml-1 text-[11px] font-normal" style={{ color: CHROME.textMuted }}>{hint}</span>}
    </h4>
  );
}

/**
 * A Send notification step's Recipients tab: who it goes to, who is copied in,
 * and what the copied get.
 *
 * @param {{ step: Object, ctx: Object, onChange: (patch: Object) => void }} props
 */
function SendRecipientsFields({ step, ctx, onChange }) {
  return (
    <div className="flex flex-col gap-4">
      <section>
        <Heading>To</Heading>
        <RecipientPicker line="to" step={step} ctx={ctx} onChange={onChange} />
      </section>

      <section className="border-t border-[#f1f0ee] pt-4">
        <Heading hint="— someone in both To and CC is only in To">CC</Heading>
        <RecipientPicker line="cc" step={step} ctx={ctx} onChange={onChange} />
        <div className="mt-3">
          <CcDelivery step={step} onChange={onChange} />
        </div>
      </section>

      <Note>
        Everyone gets one email addressed to the whole group — like &ldquo;To: Sara, Mona, Karim · Cc: Ahmad&rdquo; —
        and each copy greets its own reader. A role counts as its people. Anybody who cannot be reached is skipped
        and logged; the run never stops for it.
      </Note>
    </div>
  );
}

export default memo(SendRecipientsFields);
