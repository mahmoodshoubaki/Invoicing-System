'use client';

import { controlClass, labelClass } from '@/components/ui/kit';
import { OTHER_REASON_KEY, REASON_TEXT_MAX } from '@/lib/taskReasons';
import { CHROME, STATUS } from '@/theme/vizPalette';

/**
 * @param {{ id: string, reasons: { required: boolean, options: Array<{ key: string, label: string }> }, value: { reasonKey: string, otherReason: string }, onChange: (value) => void, error?: string|null, disabled?: boolean, }} props
 */
export default function ReasonPicker({ id, reasons, value, onChange, error = null, disabled = false }) {
  const other = value.reasonKey === OTHER_REASON_KEY;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={labelClass} style={{ color: CHROME.textSecondary }}>
        Reason{reasons.required ? '' : ' (optional)'}
      </label>
      <select
        id={id}
        value={value.reasonKey}
        onChange={(e) => onChange({ ...value, reasonKey: e.target.value })}
        disabled={disabled}
        className={`${controlClass} w-full`}
        style={error ? { borderColor: STATUS.critical } : undefined}
      >
        <option value="">Choose a reason…</option>
        {reasons.options.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
        <option value={OTHER_REASON_KEY}>Other</option>
      </select>
      {other && (
        <>
          <textarea
            aria-label="The reason"
            rows={2}
            autoFocus
            maxLength={REASON_TEXT_MAX}
            value={value.otherReason}
            onChange={(e) => onChange({ ...value, otherReason: e.target.value })}
            disabled={disabled}
            placeholder="Type the reason…"
            className={`${controlClass} w-full resize-y`}
          />
          <p className="text-right text-[10px] tabular-nums" style={{ color: CHROME.textMuted }}>
            {value.otherReason.length} / {REASON_TEXT_MAX}
          </p>
        </>
      )}
      {error && <p className="text-[11px]" style={{ color: STATUS.critical }}>{error}</p>}
    </div>
  );
}
