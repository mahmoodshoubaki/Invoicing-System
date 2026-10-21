'use client';

import Link from 'next/link';
import { ChevronLeft, Radio, Save } from 'lucide-react';

import PageHeader from '@/components/common/PageHeader';
import Button from '@/components/common/Button';
import { ROUTES } from '@/constants/routes';

/**
 * Why Publish is greyed out, or null when it can be pressed. Said on the
 * button, because a greyed-out button on its own is a dead end.
 */
function publishBlocker({ state, dirty, problemCount }) {
  if (!state.code) return 'Save it first — publishing makes the saved draft live.';
  if (dirty) return 'Save first — publishing makes the draft live as it was last saved.';
  if (problemCount > 0) return `Fix the ${problemCount} problem${problemCount === 1 ? '' : 's'} listed above first.`;
  return null;
}

/**
 * The workflow's name and code, and its actions (2026-10-11):
 *
 *   Save         writes the draft, problems and all — any time there is something to save
 *   Publish      the draft becomes the next version, live — only with nothing to fix
 *   Make vN live an older version, opened to look at, goes live again
 *
 * Opening an older version and pressing Save starts the draft again from it,
 * so Save is offered there even with nothing edited.
 *
 * @param {{
 *   state: Object, dirty: boolean, isSaving: boolean, problemCount: number,
 *   save: ReturnType<import('./useBuilderSave').useBuilderSave>,
 *   publish: ReturnType<import('./useBuilderPublish').useBuilderPublish>,
 *   openIsActive: boolean, openVersion: Object|null, nextVersion: number, canPublish: boolean,
 * }} props
 */
export default function BuilderHeader({
  state, dirty, isSaving, problemCount, save, publish, openIsActive, openVersion, nextVersion, canPublish,
}) {
  const viewingVersion = Boolean(state.code) && !state.isDraft;
  const canSave = !state.code || dirty || (viewingVersion && !openIsActive);
  const blocker = publishBlocker({ state, dirty, problemCount });

  return (
    <PageHeader
      title={state.name || 'New workflow'}
      subtitle={state.code ?? 'Not saved yet'}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Admin' },
        { label: 'Workflows', href: ROUTES.WORKFLOW },
        { label: state.code ?? 'New' },
      ]}
      actions={
        <>
          <Link href={ROUTES.WORKFLOW}>
            <Button variant="ghost" size="sm" icon={ChevronLeft}>Back</Button>
          </Link>
          <Button
            size="sm"
            variant={state.isDraft || !state.code ? 'primary' : 'outline'}
            icon={Save}
            onClick={save.handleSave}
            loading={isSaving}
            disabled={!canSave}
            title={
              viewingVersion && !dirty
                ? `Start the draft again from version ${state.version}.`
                : 'Save the draft. Problems do not stop a save — they stop a publish.'
            }
          >
            {viewingVersion && !dirty ? `Edit from v${state.version}` : 'Save draft'}
          </Button>

          {/* Publishing the draft: one above the highest version, live at once. */}
          {canPublish && (state.isDraft || !state.code) && (
            <Button
              size="sm"
              variant={blocker ? 'outline' : 'primary'}
              icon={Radio}
              onClick={publish.askToPublishDraft}
              disabled={Boolean(blocker)}
              title={blocker ?? `Make the draft version ${nextVersion} and put it live.`}
            >
              Publish as v{nextVersion}
            </Button>
          )}

          {/* An older version, opened to look at: it can go live again as it is. */}
          {canPublish && viewingVersion && openVersion && (
            <Button
              size="sm"
              variant="outline"
              icon={Radio}
              onClick={() => publish.askToActivate(openVersion)}
              disabled={openIsActive}
              title={openIsActive ? `Version ${state.version} is already live.` : `Make version ${state.version} live again, as it is.`}
            >
              {openIsActive ? 'Live' : `Make v${state.version} live`}
            </Button>
          )}
        </>
      }
    />
  );
}
