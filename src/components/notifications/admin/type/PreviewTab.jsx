'use client';

import { AlertTriangle, CheckCircle2, Eye, Send, Sparkles } from 'lucide-react';

import Button from '@/components/common/Button';
import ErrorNote from '@/components/ui/ErrorNote';
import { controlClass, labelClass } from '@/components/ui/kit';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';

/** The preview: problems instead of a result when there are any (not an error response). */
function PreviewResult({ preview }) {
  if (preview.problems.length > 0) {
    return (
      <div className="rounded-lg px-3 py-2.5" style={{ backgroundColor: withAlpha(STATUS.critical, 0.07) }}>
        <p className="mb-1 flex items-center gap-1.5 text-xs font-medium" style={{ color: CHROME.textPrimary }}>
          <AlertTriangle size={13} style={{ color: STATUS.critical }} aria-hidden="true" />
          This would not send — fix these first:
        </p>
        <ul className="list-disc pl-5 text-[11px] leading-relaxed" style={{ color: CHROME.textSecondary }}>
          {preview.problems.map((p, i) => <li key={i}>{typeof p === 'string' ? p : p?.message ?? JSON.stringify(p)}</li>)}
        </ul>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[11px]" style={{ color: CHROME.textMuted }}>
        Subject
        <span className="mt-0.5 block text-sm font-semibold" style={{ color: CHROME.textPrimary }}>{preview.subject}</span>
      </p>
      {preview.isHtml ? (
        // Sandboxed with nothing allowed: it renders, and can run nothing.
        <iframe title="Email preview" sandbox="" srcDoc={preview.body} className="h-96 w-full rounded-lg border border-[#eceae4] bg-white" />
      ) : (
        <p className="whitespace-pre-line rounded-lg px-3 py-2.5 text-xs leading-relaxed" style={{ backgroundColor: '#f6f5f3', color: CHROME.textPrimary }}>
          {preview.body}
        </p>
      )}
      {preview.actionUrl && (
        <p className="truncate text-[11px]" style={{ color: CHROME.textMuted }}>
          Opens <code className="font-mono" style={{ color: STATUS.info }}>{preview.actionUrl}</code>
        </p>
      )}
    </div>
  );
}

/**
 * The editor's text filled in with sample values — and, for email, sent to
 * yourself as a test.
 *
 * @param {{
 *   previewer: ReturnType<import('./useTemplatePreview').useTemplatePreview>,
 *   hasPlaceholders: boolean,  "Fill samples from defaults" needs a list to fill from
 *   test: null | { blocked: string|null, version: number|null },  null = no test on this channel
 * }} props
 */
export default function PreviewTab({ previewer, hasPlaceholders, test }) {
  const { samples, setSamples, preview, error, running } = previewer;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs" style={{ color: CHROME.textSecondary }}>
          The editor&rsquo;s text, filled in with these values. Nothing is saved or sent.
        </p>
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="ghost" icon={Sparkles} onClick={previewer.fillFromDefaults} disabled={!hasPlaceholders}>
            Fill samples from defaults
          </Button>
          <Button size="sm" icon={Eye} onClick={previewer.run} loading={running}>
            Preview
          </Button>
          {test && (
            <Button
              size="sm"
              variant="outline"
              icon={Send}
              onClick={previewer.openTest}
              disabled={Boolean(test.blocked)}
              title={test.blocked ?? `Email version ${test.version} to yourself, filled in with these sample values`}
            >
              Send test email
            </Button>
          )}
        </div>
      </div>

      <label className="block">
        <span className={labelClass} style={{ color: CHROME.textMuted }}>
          Sample values (JSON) — lists work too, like {'{ "Invoices": [ { "Number": "INV-1" } ] }'}
        </span>
        <textarea
          value={samples}
          onChange={(e) => setSamples(e.target.value)}
          rows={5}
          spellCheck={false}
          className={`${controlClass} w-full resize-y font-mono`}
        />
      </label>

      <div className="rounded-xl border border-[#eceae4] bg-[#fbfaf9] p-3">
        {error && <ErrorNote error={error} compact />}
        {preview && !error && <PreviewResult preview={preview} />}
        {!preview && !error && (
          <p className="flex items-center gap-1.5 py-6 text-[11px]" style={{ color: CHROME.textMuted }}>
            <CheckCircle2 size={11} aria-hidden="true" /> Press Preview to see it filled in — a preview catches a template mistake before the save does.
          </p>
        )}
      </div>
    </div>
  );
}
