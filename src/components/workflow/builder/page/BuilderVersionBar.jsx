'use client';

import { useRouter } from 'next/navigation';
import { PencilLine, Radio, Trash2 } from 'lucide-react';

import Card from '@/components/common/Card';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';
import { formatDateTime } from '@/utils/formatters';
import { ROUTES } from '@/constants/routes';
import { draftRowOf } from '@/lib/workflowDrafts';

const DRAFT = 'draft';

/** What the open document is: the draft, the live version, or an older one. */
function Badge({ state, isActive }) {
  const look = state.isDraft || !state.code
    ? { label: 'Draft', icon: PencilLine, color: STATUS.warning }
    : isActive
      ? { label: 'Live', icon: Radio, color: STATUS.good }
      : { label: `Version ${state.version}`, icon: Radio, color: CHROME.textSecondary };
  const Icon = look.icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ backgroundColor: withAlpha(look.color, 0.12), color: look.color }}
    >
      <Icon size={10} aria-hidden="true" />
      {look.label}
    </span>
  );
}

/**
 * Which draft or version is open, whether it is live, how to switch, and what
 * a save will do from here (2026-10-11).
 *
 * @param {{
 *   state: Object, versions: Array, isActive: boolean, isDirty: boolean, nextVersion: number,
 *   canDiscard: boolean, onDiscard: () => void,
 * }} props
 */
export default function BuilderVersionBar({ state, versions, isActive, isDirty, nextVersion, canDiscard, onDiscard }) {
  const router = useRouter();
  const code = state.code;
  if (!code) return null;

  const draft = draftRowOf(versions);
  const numbered = versions.filter((v) => !v.isDraft);
  const open = (value) => {
    const version = value === DRAFT ? '' : `&version=${value}`;
    router.replace(`${ROUTES.WORKFLOW_BUILDER}?code=${encodeURIComponent(code)}${version}`);
  };

  const note = state.isDraft
    ? `Saving updates this draft. Publishing makes it version ${nextVersion}, live.`
    : draft
      ? `Saving starts the draft again from version ${state.version}, replacing the unpublished draft${
        draft.savedByName ? ` from ${draft.savedByName}` : ''}${draft.savedOn ? `, ${formatDateTime(draft.savedOn)}` : ''}.`
      : `Saving starts a draft from version ${state.version}. The version itself never changes.`;

  return (
    <Card padding={false} className="mb-5">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        <Badge state={state} isActive={isActive} />

        <label htmlFor="wf-version" className="text-xs" style={{ color: CHROME.textMuted }}>
          Open
        </label>
        <select
          id="wf-version"
          value={state.isDraft ? DRAFT : state.version ?? ''}
          onChange={(e) => open(e.target.value)}
          className="rounded-md border border-gray-200 px-2 py-1 text-xs outline-none focus:border-primary"
        >
          {draft && <option value={DRAFT}>Draft — not published</option>}
          {numbered.map((v) => (
            <option key={v.definitionId} value={v.version}>
              v{v.version}{v.isActive ? ' — live' : ''}
            </option>
          ))}
        </select>

        <p className="min-w-0 flex-1 text-[11px]" style={{ color: CHROME.textMuted }}>{note}</p>

        {isDirty && (
          <span className="text-[11px] font-medium" style={{ color: STATUS.warning }}>
            Unsaved changes
          </span>
        )}

        {canDiscard && state.isDraft && (
          <button
            type="button"
            onClick={onDiscard}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors hover:bg-[#f6f5f3]"
            style={{ color: STATUS.critical }}
            title="Throw the draft away. The live version is not touched."
          >
            <Trash2 size={12} aria-hidden="true" />
            Discard draft
          </button>
        )}
      </div>
    </Card>
  );
}
