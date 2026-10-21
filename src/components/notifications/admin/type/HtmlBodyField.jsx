'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { AlertTriangle, Code2, PenLine } from 'lucide-react';

import { controlClass, labelClass } from '@/components/ui/kit';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';
import { visualEditorProblem } from '@/lib/richText';

// Loaded only when an HTML body is on screen — the editor is the heaviest thing here.
const RichTextEditor = dynamic(() => import('@/components/ui/richText/RichTextEditor'), {
  ssr: false,
  loading: () => <div className="h-72 animate-pulse rounded-lg border border-[#eceae4] bg-[#fbfaf9]" />,
});

const VIEWS = [
  { key: 'visual', label: 'Visual', icon: PenLine },
  { key: 'code', label: 'HTML', icon: Code2 },
];

/**
 * An HTML body: written visually by default, or as HTML code.
 *
 * Both edit the same string, so switching is free — except that the visual
 * editor cannot hold everything HTML can (layout blocks, classes, loops between
 * table rows…). A body using any of that opens as code, says what the visual
 * editor would drop, and asks before switching.
 */
export default function HtmlBodyField({ label, value, onChange, dir = 'ltr', readOnly, valueNames }) {
  const [mode, setMode] = useState(() => (visualEditorProblem(value) ? 'code' : 'visual'));
  const problem = mode === 'code' ? visualEditorProblem(value) : null;

  const choose = (next) => {
    if (next === 'visual' && problem
      && !window.confirm(`The visual editor can't keep ${problem} — they are removed as soon as you type there. Switch anyway?`)) return;
    setMode(next);
  };

  return (
    <div>
      <div className={`${labelClass} flex flex-wrap items-center justify-between gap-2`} style={{ color: CHROME.textSecondary }}>
        <span>{label}</span>
        <span className="inline-flex rounded-md bg-[#f1f0ee] p-0.5" role="group" aria-label={`${label} view`}>
          {VIEWS.map(({ key, label: viewLabel, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => choose(key)}
              aria-pressed={mode === key}
              className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium"
              style={mode === key
                ? { backgroundColor: '#fff', color: CHROME.textPrimary, boxShadow: '0 1px 2px rgb(60 60 58 / 0.12)' }
                : { color: CHROME.textMuted }}
            >
              <Icon size={11} aria-hidden="true" /> {viewLabel}
            </button>
          ))}
        </span>
      </div>

      {mode === 'visual' ? (
        <RichTextEditor value={value} onChange={onChange} dir={dir} readOnly={readOnly} valueNames={valueNames} ariaLabel={label} />
      ) : (
        <>
          {problem && (
            <p className="mb-1.5 flex items-start gap-1.5 rounded-md px-2 py-1.5 text-[11px]" style={{ backgroundColor: withAlpha(STATUS.warning, 0.12), color: CHROME.textSecondary }}>
              <AlertTriangle size={11} className="mt-0.5 shrink-0" style={{ color: STATUS.warning }} aria-hidden="true" />
              Shown as HTML: it uses {problem}, which the visual editor can&rsquo;t keep.
            </p>
          )}
          <textarea
            dir={dir}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={14}
            readOnly={readOnly}
            spellCheck={false}
            className={`${controlClass} w-full resize-y font-mono leading-relaxed`}
          />
        </>
      )}
    </div>
  );
}
