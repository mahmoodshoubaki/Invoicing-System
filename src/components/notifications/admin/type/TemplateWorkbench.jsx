'use client';

import { memo } from 'react';

import Skeleton from '@/components/ui/Skeleton';
import ErrorNote from '@/components/ui/ErrorNote';
import TemplateTestEmail from '@/components/notifications/admin/TemplateTestEmail';
import { CHANNEL } from '@/constants/notifications';
import { BUILT_IN_PLACEHOLDERS } from '@/lib/templatePlaceholders';
import { useTemplateDraft } from './useTemplateDraft';
import { useTemplatePreview } from './useTemplatePreview';
import VersionBar from './VersionBar';
import PlaceholdersTab from './PlaceholdersTab';
import BodyTab from './BodyTab';
import PreviewTab from './PreviewTab';

/**
 * One channel's words, as three tabs under one version bar. The draft lives
 * here (in its hooks), not in the tabs, so it survives switching tabs; the page
 * keeps this mounted while hidden, so it survives switching channels too.
 *
 * @param {{
 *   typeId: string, channelKey: number, channelLabel: string,
 *   languages: Array, priorities: Array,
 *   canManage: boolean, canPublish: boolean,
 *   canSendTest: boolean,  may send a saved email version as a test (Manage Settings)
 *   senders: Array|null,   the email senders to test through
 *   preferredSenderId: string|null,  the type's own sender, picked first
 *   tab: 'placeholders'|'body'|'preview'|null,  which tab to draw (null: none, while hidden)
 *   onStatus?: (channelKey, { dirty, placeholderIssues, bodyIssues }) => void,
 *   onChanged: () => void,  the type's live/latest versions moved
 * }} props
 */
function TemplateWorkbench({
  typeId, channelKey, channelLabel, languages, priorities, canManage, canPublish,
  canSendTest = false, senders = null, preferredSenderId = null, tab, onStatus, onChanged,
}) {
  const editor = useTemplateDraft({ typeId, channelKey, channelLabel, onChanged, onStatus });
  const previewer = useTemplatePreview({ draft: editor.draft, typeId, channelKey });
  const { draft, selected, dirty, checks } = editor;

  if (editor.error && !editor.loaded) return <ErrorNote error={editor.error} onRetry={editor.reload} />;
  if (!editor.loaded) return <Skeleton rows={4} height={60} />;

  const readOnly = !canManage;
  // What the visual editor's "Value" menu offers: this text's values, then the built-ins.
  const valueNames = [...new Set([...checks.listed, ...BUILT_IN_PLACEHOLDERS])];

  // A test sends a saved email version; why it cannot right now, if it cannot.
  const test = canSendTest && channelKey === CHANNEL.EMAIL && Array.isArray(senders)
    ? {
        version: selected?.version ?? null,
        blocked: !selected ? 'Save a version first — a test sends a saved version.'
          : dirty ? 'Save or discard the changes first — a test sends the saved version.'
            : senders.length === 0 ? 'Add an email sender first.' : null,
      }
    : null;

  return (
    <div className="flex flex-col gap-4">
      <VersionBar editor={editor} channelLabel={channelLabel} canManage={canManage} canPublish={canPublish} />

      {editor.actionError && <ErrorNote error={editor.actionError} />}

      {tab === 'placeholders' && (
        <PlaceholdersTab
          placeholders={draft.placeholders}
          unlisted={checks.unlisted}
          readOnly={readOnly}
          onChange={(placeholders) => editor.update({ placeholders })}
        />
      )}
      {tab === 'body' && (
        <BodyTab
          draft={draft}
          update={editor.update}
          readOnly={readOnly}
          languages={languages}
          priorities={priorities}
          valueNames={valueNames}
          versionKey={editor.baseId ?? 'blank'}
        />
      )}
      {tab === 'preview' && (
        <PreviewTab previewer={previewer} hasPlaceholders={draft.placeholders.length > 0} test={test} />
      )}

      {previewer.testing && selected && (
        <TemplateTestEmail
          version={selected}
          senders={senders}
          preferredSenderId={preferredSenderId}
          sampleValues={previewer.testing.sampleValues}
          onClose={previewer.closeTest}
        />
      )}
    </div>
  );
}

export default memo(TemplateWorkbench);
