'use client';

import { useCallback, useRef, useState } from 'react';

import { ApiError } from '@/lib/apiClient';
import { ROUTES } from '@/constants/routes';

const FALLBACK = 'The jobs dashboard could not be opened.';

function toError(text) {
  try {
    const data = JSON.parse(text);
    return new ApiError(data.Message || data.message || FALLBACK, {
      code: data.ErrorCode ?? null,
      traceId: data.TraceId ?? null,
    });
  } catch {
    return new ApiError(text || FALLBACK);
  }
}

/**
 * State of the Hangfire frame, read on every page it loads. The frame is
 * same-origin, so its document is readable:
 * - a JSON body is a refusal (API 401/403, proxy 502), shown as an error;
 * - links leaving /hangfire ("Back to site") open in the whole window, since
 *   app pages send X-Frame-Options: DENY and would show blank in the frame.
 */
export function useHangfireFrame() {
  const frameRef = useRef(null);
  const [frameKey, setFrameKey] = useState(0);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  const onLoad = useCallback(() => {
    const doc = frameRef.current?.contentDocument;
    if (doc && /json/i.test(doc.contentType)) {
      setError(toError(doc.body?.textContent));
      setStatus('error');
      return;
    }
    if (doc) {
      for (const link of doc.querySelectorAll('a[href]')) {
        const { origin, pathname } = new URL(link.href, doc.baseURI);
        if (origin === window.location.origin && !pathname.startsWith(ROUTES.HANGFIRE)) link.target = '_top';
      }
    }
    setStatus('ready');
  }, []);

  const retry = useCallback(() => {
    setError(null);
    setStatus('loading');
    setFrameKey((k) => k + 1);
  }, []);

  return { frameRef, frameKey, status, error, onLoad, retry };
}
