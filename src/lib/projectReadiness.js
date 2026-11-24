const blank = (value) => String(value ?? '').trim() === '';

/**
 * @param {Object} header
 * @returns {string[]} keys of `projects.readiness.fields`
 */
export function missingProjectInfo(header) {
  const required = [
    ['code', header?.projectCode],
    ['contractName', header?.contractName],
    ['contractStart', header?.contractStartDate],
    ['contractEnd', header?.contractFinishDate],
    ['bdm', header?.bdm],
    ['buHead', header?.buHead],
    ['crp', header?.crp],
  ];
  return required.filter(([, value]) => blank(value)).map(([label]) => label);
}

/**
 * @param {string[]} labels
 * @param {string} locale
 */
export function listOf(labels, locale) {
  return new Intl.ListFormat(locale, { type: 'conjunction' }).format(labels);
}
