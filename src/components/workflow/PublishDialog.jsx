'use client';

import { Radio } from 'lucide-react';

import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';
import { describeVersions, versionsWithRunsToMove } from '@/lib/publishImpact';
import BlockedRunsNote from './BlockedRunsNote';

/**
 * Confirming a publish, with what it will actually do to work in flight.
 *
 * Shared by the builder and the workflow list on purpose. Publishing is one act
 * with one set of consequences, and two dialogs describing it in two sets of
 * words is how they drift — somebody reads the reassuring one, acts on the
 * other screen, and is surprised.
 *
 * **It is not a destructive act**, and the dialog should not imply it is: it
 * either succeeds whole or is refused whole, and publishing an older version is
 * how you go back — subject to the same rule. What it IS, is an act with
 * consequences somebody cannot see from the button, which is the whole reason
 * for the impact section below. See `lib/publishImpact.js` for the rule.
 */

/** One consequence, only rendered when it is actually true of this publish. */
function Impact({ tone, children }) {
  return (
    <li
      className="rounded-md px-2.5 py-2 text-xs leading-relaxed"
      style={{ backgroundColor: withAlpha(tone, 0.09), color: CHROME.textSecondary }}
    >
      {children}
    </li>
  );
}

/**
 * @param {Object}   props
 * @param {boolean}  props.open
 * @param {string}   [props.workflowName]
 * @param {Object}   props.version      the version row being made live — or, publishing the
 *                                      draft, `{ version: N }` for the number it will take
 * @param {boolean}  [props.fromDraft]  publishing the draft (2026-10-11) rather than an existing version
 * @param {Object}   [props.liveVersion] the row that is live now, if any
 * @param {Object[]} [props.versions]   every version row — runs on ANY of them move
 * @param {Array}    [props.blockedRuns] the runs that refused the last try (409 WF-024)
 * @param {boolean}  [props.busy]
 * @param {Function} props.onClose
 * @param {Function} props.onConfirm
 */
export default function PublishDialog({
  open, workflowName, version, fromDraft = false, liveVersion, versions = [], blockedRuns = [], busy = false,
  onClose, onConfirm,
}) {
  if (!version) return null;

  const going = liveVersion && liveVersion.version !== version.version ? liveVersion : null;

  /*
   * Workflows running on ANY version, not just the live one.
   *
   * A successful publish moves every running workflow onto this version,
   * wherever each one is. This used to read only the live version's flag, so
   * workflows running on any other version — or on a workflow with nothing live
   * yet — never raised the warning, and the dialog said nothing at all about
   * them.
   */
  const moving = versionsWithRunsToMove(versions, version);
  const runsWillMove = moving.length > 0;

  // Going back to an older version is a rollback, and it follows the same rule
  // — so it can be refused too, which is worth saying rather than implying that
  // going back is always safe.
  const rollingBack = Boolean(going && version.version < going.version);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={fromDraft ? `Publish the draft as version ${version.version}?` : `Make version ${version.version} live?`}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button icon={Radio} onClick={onConfirm} loading={busy}>
            {blockedRuns.length > 0 ? 'Try again' : fromDraft ? `Publish as version ${version.version}` : `Make version ${version.version} live`}
          </Button>
        </>
      }
    >
      <p className="text-sm" style={{ color: CHROME.textPrimary }}>
        {fromDraft ? (
          <>The draft becomes version {version.version}, and </>
        ) : null}
        {workflowName ? <strong>{workflowName}</strong> : fromDraft ? 'this workflow' : 'This workflow'} will follow
        version {version.version} from now on.
      </p>

      <ul className="mt-3 flex flex-col gap-1.5">
        {going ? (
          <Impact tone={STATUS.info}>
            <strong>Version {going.version} stands down.</strong> It stops being what new runs
            follow{rollingBack ? ', which is how a rollback is done' : ''}.
          </Impact>
        ) : (
          <Impact tone={STATUS.info}>
            Nothing is live yet, so there is no version to stand down. This is the first one, and
            the workflow can be started once it is published.
          </Impact>
        )}

        {/*
          Always said, one way or the other. A dialog that is silent about
          running workflows reads as "nothing to worry about" whether or not
          that is true, so the no-runs case gets its own sentence too.
        */}
        {runsWillMove ? (
          <>
            <Impact tone={STATUS.warning}>
              <strong>Running workflows move onto version {version.version}</strong> — the ones
              on {describeVersions(moving)}. Every one of them moves; none is left behind.
            </Impact>
            <Impact tone={STATUS.warning}>
              If any of them is in a stage where more changed than a stage title or a Call API
              step&rsquo;s inputs, publishing is <strong>refused</strong>:{' '}
              {going ? `version ${going.version} stays live` : 'nothing goes live'} and nothing moves.
            </Impact>
          </>
        ) : (
          <Impact tone={STATUS.info}>
            No workflows are running, so nothing moves.
          </Impact>
        )}
      </ul>

      <BlockedRunsNote runs={blockedRuns} />

      <p className="mt-3 text-[11px]" style={{ color: CHROME.textMuted }}>
        There is no unpublish. To go back, make the older version live again
        {rollingBack || runsWillMove ? ' — the same rule applies, so that can be refused too.' : '.'}
      </p>
    </Modal>
  );
}
