'use client';

import { useState } from 'react';

import { notificationRepository } from '@/repositories/notificationRepository';
import { draftRequest, parseSamples, samplesFromDefaults } from './templateDraft';

/**
 * The Preview & test tab's state, held by the editor rather than the tab so the
 * sample values and the last preview survive switching tabs.
 *
 * A preview belongs to the draft it was made from: once the text changes it is
 * no longer shown (it would describe words that are not there any more).
 */
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

  // A test sends the selected SAVED version with these sample values — an
  // object of values, or nothing (each value then uses its default).
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
