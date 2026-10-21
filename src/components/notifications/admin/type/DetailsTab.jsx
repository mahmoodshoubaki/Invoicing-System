'use client';

import { Lock, PauseCircle, Pencil } from 'lucide-react';

import Button from '@/components/common/Button';
import LookupBadge from '@/components/ui/LookupBadge';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { formatDateTime } from '@/utils/formatters';

function Fact({ label, children, wide = false }) {
  return (
    <div className={`min-w-0 ${wide ? 'col-span-2' : ''}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: CHROME.textMuted }}>{label}</p>
      <div className="mt-0.5 break-words text-xs" style={{ color: CHROME.textPrimary }}>{children}</div>
    </div>
  );
}

const Muted = ({ children }) => <span style={{ color: CHROME.textMuted }}>{children}</span>;

/** "date · by name", or just the date. */
const when = (on, by) => (
  <>
    {formatDateTime(on) || '—'}
    {by && <span className="block text-[11px]" style={{ color: CHROME.textMuted }}>by {by}</span>}
  </>
);

/**
 * The type itself, all in one place: how it is named and found, how it is sent,
 * and its history. Edit opens the same form as the page header's button.
 *
 * @param {{
 *   type: Object,
 *   priority: { value: string, colorHex?: string } | undefined,
 *   senderName: string|null,  the type's own sender, when it has one and it could be read
 *   canManage: boolean, onEdit: () => void,
 * }} props
 */
export default function DetailsTab({ type, priority, senderName, canManage, onEdit }) {
  return (
    <div className="flex flex-col gap-6 p-5">
      <section>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-4">
          <Fact label="English name">{type.englishName}</Fact>
          <Fact label="Arabic name"><span dir="rtl">{type.arabicName}</span></Fact>
          <Fact label="Code"><code className="font-mono text-[11px]">{type.code}</code></Fact>
          <Fact label="Number">
            <span className="font-mono tabular-nums">{type.key}</span>
            <span className="block text-[11px]" style={{ color: CHROME.textMuted }}>workflows pick the type by this</span>
          </Fact>
          <Fact label="Category">{type.category || <Muted>None</Muted>}</Fact>
          <Fact label="Kind">
            {type.isSystemType
              ? <span className="inline-flex items-center gap-1"><Lock size={11} aria-hidden="true" /> Standard — sent by the system</span>
              : 'Made by an admin'}
          </Fact>
          {type.description && (
            <Fact label="Description" wide><span style={{ color: CHROME.textSecondary }}>{type.description}</span></Fact>
          )}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-xs font-semibold" style={{ color: CHROME.textPrimary }}>Sending</h3>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-4">
          <Fact label="State">
            {type.isPaused
              ? <span className="inline-flex items-center gap-1" style={{ color: STATUS.warning }}><PauseCircle size={11} aria-hidden="true" /> Paused</span>
              : 'Sending'}
          </Fact>
          <Fact label="Priority">{priority ? <LookupBadge label={priority.value} colorHex={priority.colorHex} /> : type.priorityKey}</Fact>
          <Fact label="Email sender">
            {type.emailSenderId ? (senderName ?? 'Its own sender') : 'The default sender'}
          </Fact>
          <Fact label="Link" wide>
            {type.actionUrlPattern
              ? <code className="break-all font-mono text-[11px]">{type.actionUrlPattern}</code>
              : <Muted>None — the notification opens nothing</Muted>}
          </Fact>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-xs font-semibold" style={{ color: CHROME.textPrimary }}>History</h3>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-4">
          <Fact label="Created">{when(type.createdOn, type.createdByName)}</Fact>
          <Fact label="Last changed">
            {type.lastModifiedOn ? when(type.lastModifiedOn, type.lastModifiedByName) : <Muted>Not changed since</Muted>}
          </Fact>
        </div>
      </section>
    </div>
  );
}
