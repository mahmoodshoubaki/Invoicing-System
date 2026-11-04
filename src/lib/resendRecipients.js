import { CHANNEL } from '@/constants/notifications';

const SIMPLE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseAddresses(text) {
  const seen = new Set();
  return String(text ?? '')
    .split(/[\s,;]+/)
    .map((a) => a.trim())
    .filter((a) => {
      const key = a.toLowerCase();
      if (!a || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export const isEmailAddress = (address) => SIMPLE_EMAIL.test(String(address ?? ''));

/**
 * @param {string[]} list
 * @param {string} text
 * @returns {{ list: string[], rest: string, problem: string|null }}
 */
export function addAddresses(list, text) {
  const taken = new Set(list.map((a) => a.toLowerCase()));
  const added = [];
  const bad = [];
  for (const address of parseAddresses(text)) {
    if (!isEmailAddress(address)) bad.push(address);
    else if (!taken.has(address.toLowerCase())) {
      taken.add(address.toLowerCase());
      added.push(address);
    }
  }
  return {
    list: [...list, ...added],
    rest: bad.join(', '),
    problem: bad.length ? `'${bad[0]}' is not a valid email address.` : null,
  };
}

/**
 * @param {{ includePrevious: boolean, to: string[], cc: string[], channelKeys: number[] }} form
 * @returns {{ to?: string, cc?: string, channels?: string }}
 */
export function resendProblems({ includePrevious, to, cc, channelKeys }) {
  const problems = {};
  const badTo = to.find((a) => !isEmailAddress(a));
  const badCc = cc.find((a) => !isEmailAddress(a));
  if (badTo) problems.to = `'${badTo}' is not a valid email address.`;
  else if (!includePrevious && to.length === 0) {
    problems.to = 'Someone has to be on the To line: send it to the person it was for again, or type a To address.';
  }
  if (badCc) problems.cc = `'${badCc}' is not a valid email address.`;

  if (channelKeys.length === 0) problems.channels = 'Pick at least one channel to send again on.';
  else if (!includePrevious && channelKeys.includes(CHANNEL.IN_APP)) {
    problems.channels = 'In-app only reaches the person it was for, so send it to them again or leave in-app out.';
  } else if (to.length + cc.length > 0 && !channelKeys.includes(CHANNEL.EMAIL)) {
    problems.channels = 'Typed addresses only get the email, so pick the email channel.';
  }
  return problems;
}

export function copyCount({ includePrevious, previousEmail, to, cc }) {
  const people = new Set([...to, ...cc].map((a) => a.toLowerCase()));
  if (previousEmail) people.delete(String(previousEmail).toLowerCase());
  return (includePrevious ? 1 : 0) + people.size;
}

export function suggestedAddresses({ toEmail, ccEmail, recipientEmail, typed }) {
  const taken = new Set([recipientEmail, ...typed].filter(Boolean).map((a) => String(a).toLowerCase()));
  return parseAddresses(`${toEmail ?? ''} ${ccEmail ?? ''}`).filter((a) => !taken.has(a.toLowerCase()) && isEmailAddress(a));
}

export function createResendPayload({ notificationId, includePrevious, to, cc, deliveries }) {
  return {
    notificationId,
    includePreviousRecipient: includePrevious,
    toEmails: to,
    ccEmails: cc,
    deliveries: deliveries.map(({ channelKey, englishSubject, englishBody, arabicSubject, arabicBody }) => ({
      channelKey, englishSubject, englishBody, arabicSubject, arabicBody,
    })),
  };
}

export function splitResendErrors(errors) {
  const parts = { to: [], cc: [], channels: [], other: [] };
  for (const [key, messages] of Object.entries(errors ?? {})) {
    const text = (Array.isArray(messages) ? messages : [messages]).filter(Boolean);
    const k = String(key).toLowerCase();
    const part = k.startsWith('toemails') ? 'to'
      : k.startsWith('ccemails') ? 'cc'
        : k.startsWith('deliveries') || k.startsWith('includepreviousrecipient') ? 'channels'
          : 'other';
    parts[part].push(...text);
  }
  return {
    to: parts.to.join(' ') || null,
    cc: parts.cc.join(' ') || null,
    channels: parts.channels.join(' ') || null,
    other: parts.other,
  };
}
