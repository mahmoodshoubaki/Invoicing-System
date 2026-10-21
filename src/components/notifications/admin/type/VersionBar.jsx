'use client';

import { useState } from 'react';
import { AlertTriangle, Power, Rocket, RotateCcw, Save } from 'lucide-react';

import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import { CHROME, STATUS } from '@/theme/vizPalette';
import { withAlpha } from '@/utils/color';
import VersionPicker from './VersionPicker';

/**
 * The bar over every editing tab: which version is being edited, and what can
 * be done with it — save the draft, throw it away, publish, or turn the channel
 * off. Why a save is blocked shows under it, whichever tab is open.
 *
 * @param {{
 *   editor: ReturnType<import('./useTemplateDraft').useTemplateDraft>,
 *   channelLabel: string, canManage: boolean, canPublish: boolean,
 * }} props
 */
export default function VersionBar({ editor, channelLabel, canManage, canPublish }) {
  const [confirmOff, setConfirmOff] = useState(false);
  const { versions, live, selected, dirty, busy, checks, canSave } = editor;
  const rollback = Boolean(live && selected && selected.version < live.version);
  const channel = channelLabel.toLowerCase();

  const turnOff = async () => {
    if (await editor.turnOff()) setConfirmOff(false);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <VersionPicker
          versions={versions}
          live={live}
          selected={selected}
          dirty={dirty}
          canManage={canManage}
          onPick={editor.pickVersion}
          onBlank={editor.startBlank}
        />
        {!live && versions.length > 0 && (
          <span className="rounded-full px-2 py-0.5 text-[11px]" style={{ backgroundColor: withAlpha(STATUS.warning, 0.14), color: CHROME.textSecondary }}>
            {channelLabel} is off — nothing is sent on it until a version is published
          </span>
        )}
        <span className="ml-auto" />
        {canManage && dirty && (
          <Button size="sm" variant="ghost" icon={RotateCcw} onClick={editor.discard} disabled={Boolean(busy)}>
            Discard changes
          </Button>
        )}
        {canManage && (
          <Button
            size="sm"
            icon={Save}
            onClick={editor.save}
            loading={busy === 'save'}
            disabled={!canSave}
            title={checks.saveHint ?? (dirty ? 'Saving makes a new version. It is not live until published.' : 'Nothing has changed since this version.')}
          >
            Save as new version
          </Button>
        )}
        {canPublish && selected && !selected.isActive && (
          <Button
            size="sm"
            variant="outline"
            icon={rollback ? RotateCcw : Rocket}
            onClick={() => editor.publish(selected)}
            loading={busy === `publish:${selected.templateId}`}
            disabled={Boolean(busy) || dirty}
            title={dirty ? 'Save or discard the changes first — publishing sends the saved version.' : undefined}
          >
            {rollback ? `Roll back to version ${selected.version}` : `Publish version ${selected.version}`}
          </Button>
        )}
        {canPublish && live && (
          <Button size="sm" variant="ghost" icon={Power} onClick={() => setConfirmOff(true)} disabled={Boolean(busy)}>
            Turn {channel} off
          </Button>
        )}
      </div>

      {canManage && dirty && (
        <p className="flex items-center gap-1.5 text-[11px]" style={{ color: CHROME.textMuted }}>
          {checks.saveHint
            ? <><AlertTriangle size={11} style={{ color: STATUS.warning }} aria-hidden="true" /> {checks.saveHint}</>
            : 'Unsaved changes. Saving makes a new version — what is sent changes only when one is published.'}
        </p>
      )}

      <Modal
        open={confirmOff}
        onClose={() => setConfirmOff(false)}
        title={`Turn ${channel} off?`}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmOff(false)}>Keep it on</Button>
            <Button variant="danger" icon={Power} onClick={turnOff} loading={busy === 'off'}>Turn off</Button>
          </>
        }
      >
        <p className="text-xs leading-relaxed" style={{ color: CHROME.textSecondary }}>
          Nothing more is sent on {channel} for this type. Its versions are kept, and publishing any of them turns it
          back on. To stop every channel at once, pause the type instead.
        </p>
      </Modal>
    </div>
  );
}
