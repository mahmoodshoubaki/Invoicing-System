'use client';

import { controlClass, labelClass } from '@/components/ui/kit';
import { CHROME } from '@/theme/vizPalette';
import HtmlBodyField from './HtmlBodyField';
import PlainTextField from './PlainTextField';
import { FALLBACK_LANGUAGES, SUBJECT_MAX } from './templateDraft';

/**
 * What a version says: the language it is sent in, its priority, whether it is
 * HTML, and its two subjects and two bodies. HTML bodies get the visual editor
 * and the full width; plain-text ones sit side by side. Every one of them —
 * subjects and plain bodies too — has the Value menu for `{{ Name }}`.
 *
 * @param {{
 *   draft: Object, update: (patch) => void, readOnly: boolean,
 *   languages: Array, priorities: Array,
 *   valueNames: string[],  what every "Value" menu offers
 *   versionKey: string,    the version being edited — a new one reopens each body in the view that suits it
 * }} props
 */
export default function BodyTab({ draft, update, readOnly, languages, priorities, valueNames, versionKey }) {
  const languageOptions = languages.length ? languages : FALLBACK_LANGUAGES;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="block">
          <span className={labelClass} style={{ color: CHROME.textSecondary }}>Language sent</span>
          <select value={draft.languageKey} onChange={(e) => update({ languageKey: Number(e.target.value) })} disabled={readOnly} className={controlClass}>
            {languageOptions.map((l) => <option key={l.key} value={l.key}>{l.value}</option>)}
          </select>
        </label>
        <label className="block">
          <span className={labelClass} style={{ color: CHROME.textSecondary }}>Priority</span>
          <select
            value={draft.priorityKey ?? ''}
            onChange={(e) => update({ priorityKey: e.target.value === '' ? null : Number(e.target.value) })}
            disabled={readOnly}
            className={controlClass}
          >
            <option value="">Same as the type</option>
            {priorities.map((p) => <option key={p.key} value={p.key}>{p.value}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-1.5 pb-1.5 text-xs" style={{ color: CHROME.textSecondary }}>
          <input type="checkbox" checked={draft.isHtml} onChange={(e) => update({ isHtml: e.target.checked })} disabled={readOnly} />
          HTML (formatted)
        </label>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <PlainTextField label="English subject" value={draft.englishSubject} onChange={(v) => update({ englishSubject: v })} max={SUBJECT_MAX} readOnly={readOnly} valueNames={valueNames} placeholder="Invoice {{ InvoiceNumber }} is overdue" />
        <PlainTextField label="Arabic subject" value={draft.arabicSubject} onChange={(v) => update({ arabicSubject: v })} max={SUBJECT_MAX} readOnly={readOnly} valueNames={valueNames} dir="rtl" />
        {!draft.isHtml && (
          <>
            <PlainTextField label="English body" value={draft.englishBody} onChange={(v) => update({ englishBody: v })} rows={9} readOnly={readOnly} valueNames={valueNames} placeholder="Hello {{ RecipientName }}, …" />
            <PlainTextField label="Arabic body" value={draft.arabicBody} onChange={(v) => update({ arabicBody: v })} rows={9} readOnly={readOnly} valueNames={valueNames} dir="rtl" />
          </>
        )}
      </div>

      {draft.isHtml && (
        <div className="flex flex-col gap-4">
          <HtmlBodyField
            key={`en-${versionKey}`}
            label="English body"
            value={draft.englishBody}
            onChange={(v) => update({ englishBody: v })}
            readOnly={readOnly}
            valueNames={valueNames}
          />
          <HtmlBodyField
            key={`ar-${versionKey}`}
            label="Arabic body"
            value={draft.arabicBody}
            onChange={(v) => update({ arabicBody: v })}
            dir="rtl"
            readOnly={readOnly}
            valueNames={valueNames}
          />
        </div>
      )}
    </div>
  );
}
