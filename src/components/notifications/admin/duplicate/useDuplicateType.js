'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

import { ROUTES } from '@/constants/routes';
import { CHANNEL } from '@/constants/notifications';
import { useToast } from '@/hooks/useToast';
import { copyTypeFields, versionToCopy } from '@/lib/notificationTypeDuplicate';
import { notificationRepository } from '@/repositories/notificationRepository';
import { draftFrom, draftRequest } from '@/components/notifications/admin/type/templateDraft';

const CHANNEL_NAMES = { [CHANNEL.EMAIL]: 'email', [CHANNEL.IN_APP]: 'in-app' };
const channelName = (key) => CHANNEL_NAMES[key] ?? `channel ${key}`;

export function useDuplicateType() {
  const router = useRouter();
  const toast = useToast();
  const [type, setType] = useState(null);
  const [step, setStep] = useState(null);
  const [error, setError] = useState(null);

  const open = useCallback((source) => {
    setError(null);
    setType(source);
  }, []);

  const close = useCallback(() => {
    if (!step) setType(null);
  }, [step]);

  const confirm = useCallback(async (names) => {
    if (!type) return;
    setError(null);
    let copyId = null;
    let details = null;
    try {
      setStep('Reading the type…');
      details = await notificationRepository.getTypeDetails(type.notificationTypeId);
      setStep('Creating the copy…');
      ({ notificationTypeId: copyId } = await notificationRepository.addType(copyTypeFields(details, names)));
    } catch (err) {
      setError(err?.message || 'The type could not be copied.');
      setStep(null);
      return;
    }

    const failed = [];
    try {
      setStep('Pausing the copy…');
      await notificationRepository.setTypePaused(copyId, true);
    } catch {
      failed.push('pausing it');
    }
    for (const channel of details.channels) {
      if (channel.latestVersion == null) continue;
      try {
        setStep(`Copying the ${channelName(channel.channelKey)} words…`);
        const versions = await notificationRepository.getTemplateVersions(type.notificationTypeId, channel.channelKey);
        const source = versionToCopy(versions);
        if (source) await notificationRepository.saveTemplate(draftRequest(draftFrom(source), copyId, channel.channelKey));
      } catch {
        failed.push(`copying the ${channelName(channel.channelKey)} words`);
      }
    }

    setStep(null);
    setType(null);
    if (failed.length) toast.error('The copy is incomplete', `It was created, but ${failed.join(' and ')} failed. Finish it or delete it.`);
    else toast.success('Type copied', 'It is paused, and its words are unpublished drafts.');
    router.push(ROUTES.NOTIFICATION_TYPE_DETAIL(copyId));
  }, [router, toast, type]);

  return { type, step, busy: step !== null, error, open, close, confirm };
}
