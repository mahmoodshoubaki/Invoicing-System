'use client';

import { useState } from 'react';

import { notificationRepository } from '@/repositories/notificationRepository';
import {
  addAddresses, copyCount, createResendPayload, resendProblems, splitResendErrors, suggestedAddresses,
} from '@/lib/resendRecipients';

const NO_ERRORS = { to: null, cc: null, channels: null, other: [] };
const NOT_ADDED = 'Not added yet — press Add (or Enter), or clear the box.';

/**
 * The resend dialog's state (2026-10-13): who it goes to — the person it was
 * for, and To / CC addresses added one at a time — which channels, and each
 * channel's text, edited from what was sent. Checked as the server would
 * before it is sent; a refusal is put back under the part it is about.
 *
 * Each line keeps its addresses as a list, and what is still in its box apart:
 * an address typed but not added is pointed at, never sent or dropped quietly.
 *
 * @param {Object} details  the notification, from GetNotificationDetails
 * @param {(result: { notificationId: string|null, notificationIds: string[] }) => void} onDone
 */
export function useResend(details, onDone) {
  const [includePrevious, setIncludePrevious] = useState(true);
  const [lines, setLines] = useState({ to: [], cc: [] });
  const [boxes, setBoxes] = useState({ to: '', cc: '' });
  const [boxProblems, setBoxProblems] = useState({ to: null, cc: null });
  const [rows, setRows] = useState(() => details.deliveries.map((d) => ({
    channelKey: d.channelKey,
    channel: d.channel,
    include: true,
    englishSubject: d.englishSubject ?? '',
    englishBody: d.englishBody ?? '',
    arabicSubject: d.arabicSubject ?? '',
    arabicBody: d.arabicBody ?? '',
  })));
  const [busy, setBusy] = useState(false);
  const [serverErrors, setServerErrors] = useState(NO_ERRORS);
  const [error, setError] = useState(null);

  const { to, cc } = lines;
  const chosen = rows.filter((r) => r.include);
  const problems = resendProblems({ includePrevious, to, cc, channelKeys: chosen.map((r) => r.channelKey) });
  const missingText = chosen.some((r) => ![r.englishSubject, r.englishBody, r.arabicSubject, r.arabicBody].every((t) => t.trim()));
  const pending = { to: boxes.to.trim() !== '', cc: boxes.cc.trim() !== '' };
  const copies = copyCount({ includePrevious, previousEmail: details.recipientEmail, to, cc });
  const suggestions = suggestedAddresses({
    toEmail: details.toEmail, ccEmail: details.ccEmail, recipientEmail: details.recipientEmail, typed: [...to, ...cc],
  });

  // An edit answers the refusal about that part.
  const clear = (part) => setServerErrors((prev) => (prev[part] ? { ...prev, [part]: null } : prev));

  const setBox = (line, text) => {
    setBoxes((prev) => ({ ...prev, [line]: text }));
    setBoxProblems((prev) => ({ ...prev, [line]: null }));
  };

  /** Adds what is in a line's box — or, from a suggestion, one address — to that line. */
  const add = (line, text = boxes[line]) => {
    const result = addAddresses(lines[line], text);
    setLines((prev) => ({ ...prev, [line]: result.list }));
    if (text === boxes[line]) setBoxes((prev) => ({ ...prev, [line]: result.rest }));
    setBoxProblems((prev) => ({ ...prev, [line]: result.problem }));
    clear(line);
  };

  const remove = (line, address) => {
    setLines((prev) => ({ ...prev, [line]: prev[line].filter((a) => a !== address) }));
    clear(line);
  };

  const send = async () => {
    setBusy(true);
    setError(null);
    setServerErrors(NO_ERRORS);
    try {
      onDone(await notificationRepository.resend(createResendPayload({
        notificationId: details.notificationId, includePrevious, to, cc, deliveries: chosen,
      })));
    } catch (err) {
      const split = splitResendErrors(err?.errors);
      setServerErrors(split);
      // Shown above the buttons only when nothing could be put under a part.
      if (!split.to && !split.cc && !split.channels) setError(err);
    } finally {
      setBusy(false);
    }
  };

  const lineProblem = (line) => serverErrors[line] ?? boxProblems[line] ?? (pending[line] ? NOT_ADDED : null) ?? problems[line] ?? null;

  return {
    includePrevious,
    setIncludePrevious: (value) => { setIncludePrevious(value); clear('to'); clear('channels'); },
    to,
    cc,
    boxes,
    setBox,
    add,
    remove,
    typedAny: to.length + cc.length > 0,
    suggestions,
    rows,
    patchRow: (i, change) => {
      setRows((prev) => prev.map((r, j) => (j === i ? { ...r, ...change } : r)));
      clear('channels');
    },
    problems: {
      to: lineProblem('to'),
      cc: lineProblem('cc'),
      channels: serverErrors.channels ?? problems.channels ?? null,
    },
    missingText,
    copies,
    canSend: !busy && Object.keys(problems).length === 0 && !missingText && !pending.to && !pending.cc,
    busy,
    error,
    otherErrors: serverErrors.other,
    send,
  };
}
