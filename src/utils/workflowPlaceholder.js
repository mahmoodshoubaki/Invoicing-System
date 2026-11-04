import {
  PLACEHOLDER_BUILTIN,
  PLACEHOLDER_BUILTIN_INFO,
  PLACEHOLDER_OFFSET_UNITS,
  SECRETS_PREFIX,
} from '@/constants/workflow';

const WHOLE = /^\{\{([^{}]*)\}\}$/;

const OFFSET = /^([A-Za-z_][\w.]*)\s*([+-])\s*(\d+)\s*([dhm])$/;

const BARE = /^[A-Za-z_][\w.]*$/;

const BUILTINS = new Set(Object.values(PLACEHOLDER_BUILTIN));

export function isBuiltin(name) {
  return BUILTINS.has(String(name ?? '').toLowerCase());
}

/**
 * @returns {{kind: 'literal'|'builtin'|'name'|'secret'|'malformed', …}}
 */
export function readPlaceholder(value) {
  if (typeof value !== 'string') return { kind: 'literal' };

  const match = WHOLE.exec(value.trim());
  if (!match) return { kind: 'literal' };

  const inner = match[1].trim();
  if (inner === '') return { kind: 'malformed', reason: 'empty' };

  if (inner.toLowerCase().startsWith(SECRETS_PREFIX)) return { kind: 'secret', name: inner };

  const offset = OFFSET.exec(inner);
  if (offset) {
    const [, name, sign, amount, unit] = offset;
    if (!isBuiltin(name)) return { kind: 'malformed', reason: 'offsetOnName', name };
    return { kind: 'builtin', name: name.toLowerCase(), sign, amount: Number(amount), unit };
  }

  if (!BARE.test(inner)) return { kind: 'malformed', reason: 'syntax', name: inner };

  if (isBuiltin(inner)) {
    return { kind: 'builtin', name: inner.toLowerCase(), sign: '+', amount: 0, unit: 'd' };
  }

  return { kind: 'name', name: inner };
}

export function writeBuiltin(name, { sign = '+', amount = 0, unit = 'd' } = {}) {
  const n = Number(amount) || 0;
  return n > 0 ? `{{${name}${sign}${n}${unit}}}` : `{{${name}}}`;
}

export function writeName(name) {
  return `{{${name}}}`;
}

export function validatePlaceholderValue(value, { builtinsOnly = false, label = 'A condition' } = {}) {
  const errors = [];
  if (typeof value !== 'string' || value === '') return errors;

  const opens = (value.match(/\{\{/g) ?? []).length;
  const closes = (value.match(/\}\}/g) ?? []).length;
  if (opens !== closes) {
    errors.push(`${label} has an unclosed {{…}} in its value.`);
    return errors;
  }
  if (opens === 0) return errors;

  const parsed = readPlaceholder(value);

  switch (parsed.kind) {
    case 'secret':
      errors.push(`${label} compares against a credential. That is refused — a secret can be sent in a request header, never read in a condition.`);
      break;
    case 'malformed':
      if (parsed.reason === 'empty') {
        errors.push(`${label} has an empty {{}} in its value.`);
      } else if (parsed.reason === 'offsetOnName') {
        errors.push(`${label} adds an offset to "${parsed.name}", which only works on today and now. Compare against the value itself, or use {{today}}.`);
      } else {
        errors.push(`${label} has a {{…}} that is not a name the run can answer.`);
      }
      break;
    case 'name':
      if (builtinsOnly) {
        errors.push(`${label} uses "${parsed.name}", but a schedule's filter runs before any run exists, so only today and now can be used here.`);
      }
      break;
    default:
      break;
  }

  return errors;
}

export function describePlaceholder(parsed) {
  if (parsed.kind === 'builtin') {
    const base = PLACEHOLDER_BUILTIN_INFO[parsed.name]?.label.toLowerCase() ?? parsed.name;
    if (!parsed.amount) return base;
    const unit = PLACEHOLDER_OFFSET_UNITS.find((u) => u.key === parsed.unit)?.label ?? parsed.unit;
    const amount = parsed.amount === 1 ? unit.replace(/s$/, '') : unit;
    return `${parsed.amount} ${amount} ${parsed.sign === '-' ? 'before' : 'after'} ${base}`;
  }
  if (parsed.kind === 'name') return parsed.name;
  return null;
}
