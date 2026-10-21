'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useToast } from '@/hooks/useToast';
import { useLoadOnChange } from '@/hooks/useLoadOnChange';
import { notificationRepository } from '@/repositories/notificationRepository';
import { blankDraft, checkDraft, draftFrom, draftRequest, sameDraft } from './templateDraft';

/**
 * One channel's words: its saved versions, and the draft being edited.
 *
 * Saving always makes a NEW version, never live. Publishing makes one live;
 * publishing an older one rolls back. Versions are never edited or deleted —
 * so the editor holds a draft, started from whichever version is picked, and
 * "Save as new version" adds it to the list.
 *
 * @param {{
 *   typeId: string, channelKey: number, channelLabel: string,
 *   onChanged: () => void,  the type's live/latest versions moved
 *   onStatus?: (channelKey, { dirty, placeholderIssues, bodyIssues }) => void,
 * }} options
 */
export function useTemplateDraft({ typeId, channelKey, channelLabel, onChanged, onStatus }) {
  const toast = useToast();
  const [versions, setVersions] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [baseId, setBaseId] = useState(null);
  const [draft, setDraft] = useState(() => blankDraft(channelKey));
  const [base, setBase] = useState(() => blankDraft(channelKey));
  const [busy, setBusy] = useState(null);
  const [actionError, setActionError] = useState(null);
  const firstLoad = useRef(true);

  const load = useCallback(async ({ selectNewest = false } = {}) => {
    try {
      const rows = await notificationRepository.getTemplateVersions(typeId, channelKey);
      setVersions(rows);
      setLoaded(true);
      setError(null);
      // On arrival, start from the newest version; after a save, select the one just made.
      if ((firstLoad.current || selectNewest) && rows.length > 0) {
        const start = rows[0];
        setBaseId(start.templateId);
        setDraft(draftFrom(start));
        setBase(draftFrom(start));
      }
      firstLoad.current = false;
      return rows;
    } catch (err) {
      setError(err);
      return null;
    }
  }, [typeId, channelKey]);

  useLoadOnChange(load);

  const live = versions.find((v) => v.isActive) ?? null;
  const selected = versions.find((v) => v.templateId === baseId) ?? null;
  const dirty = !sameDraft(draft, base);
  const checks = useMemo(() => checkDraft(draft), [draft]);
  const canSave = !busy && !checks.saveHint && (dirty || versions.length === 0);

  // Where the problems are, for the page's tab bar — so one on a tab not showing
  // is not missed. A channel nobody has written for yet is not "missing" anything.
  const untouchedBlank = versions.length === 0 && !dirty;
  const placeholderIssues = untouchedBlank ? 0 : checks.unlisted.length + (checks.emptyKey ? 1 : 0);
  const bodyIssues = dirty ? checks.missing.length + (checks.tooLong ? 1 : 0) : 0;
  useEffect(() => {
    onStatus?.(channelKey, { dirty, placeholderIssues, bodyIssues });
  }, [onStatus, channelKey, dirty, placeholderIssues, bodyIssues]);

  const update = (patch) => setDraft((prev) => ({ ...prev, ...patch }));

  const pickVersion = (version) => {
    if (dirty && !window.confirm('Discard the changes in the editor?')) return;
    setBaseId(version.templateId);
    setDraft(draftFrom(version));
    setBase(draftFrom(version));
  };

  const startBlank = () => {
    if (dirty && !window.confirm('Discard the changes in the editor?')) return;
    const blank = blankDraft(channelKey);
    setBaseId(null);
    setDraft(blank);
    setBase(blank);
  };

  const discard = () => setDraft(base);

  /** Runs one action: one at a time, its error shown above the tabs. */
  const run = async (name, action) => {
    setBusy(name);
    setActionError(null);
    try {
      await action();
      return true;
    } catch (err) {
      setActionError(err);
      return false;
    } finally {
      setBusy(null);
    }
  };

  const save = () => run('save', async () => {
    const { version } = await notificationRepository.saveTemplate(draftRequest(draft, typeId, channelKey));
    toast.success(`Saved as version ${version}`, 'It is not live yet — publish it when it is ready.');
    await load({ selectNewest: true });
    onChanged();
  });

  const publish = (version) => run(`publish:${version.templateId}`, async () => {
    await notificationRepository.publishTemplate(version.templateId);
    const rollback = live && version.version < live.version;
    toast.success(rollback ? `Rolled back to version ${version.version}` : `Version ${version.version} is live`);
    await load();
    onChanged();
  });

  /** @returns {Promise<boolean>} whether it went through — the confirm box closes only then */
  const turnOff = () => run('off', async () => {
    await notificationRepository.unpublishTemplate(typeId, channelKey);
    toast.success(`${channelLabel} is off for this type`, 'Its versions are kept; publishing one turns it back on.');
    await load();
    onChanged();
  });

  return {
    versions, loaded, error, reload: load,
    baseId, draft, live, selected, dirty, checks, canSave,
    busy, actionError,
    update, pickVersion, startBlank, discard, save, publish, turnOff,
  };
}
