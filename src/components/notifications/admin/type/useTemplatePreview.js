'use client';

import { useState } from 'react';

import { notificationRepository } from '@/repositories/notificationRepository';
import { draftRequest, parseSamples, samplesFromDefaults } from './templateDraft';

export function useTemplatePreview({ draft, typeId, channelKey }) {
  const [samples, setSamples] = useState('{}');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [running, setRunning] = useState(false);
  const [testing, setTesting] = useState(null);

  const preview = result && result.draft === draft ? result.preview : null;

  const run = async () => {
    const parsed = parseSamples(samples);
    if (parsed.error) {
      setError(parsed.error);
      return;
    }
    setRunning(true);
    setError(null);
    try {
      const made = await notificationRepository.previewTemplate({
        templateId: null,
        ...draftRequest(draft, typeId, channelKey),
        sampleValues: parsed.values,
      });
      setResult({ draft, preview: made });
    } catch (err) {
      setError(err);
    } finally {
      setRunning(false);
    }
  };

  const openTest = () => {
    const parsed = parseSamples(samples, { asObject: true });
    if (parsed.error) {
      setError(parsed.error);
      return;
    }
    setError(null);
    setTesting({ sampleValues: Object.keys(parsed.values).length ? parsed.values : null });
  };

  return {
    samples, setSamples,
    fillFromDefaults: () => setSamples(samplesFromDefaults(draft)),
    preview, error, running, run,
    testing, openTest, closeTest: () => setTesting(null),
  };
}
