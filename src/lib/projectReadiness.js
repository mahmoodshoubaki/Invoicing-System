const blank = (value) => String(value ?? '').trim() === '';

/**
 * @param {Object} header
 * @returns {string[]}
 */
export function missingProjectInfo(header) {
  const required = [
    ['Code', header?.projectCode],
    ['Contract name', header?.contractName],
    ['Contract start', header?.contractStartDate],
    ['Contract end', header?.contractFinishDate],
    ['BDM', header?.bdm],
    ['BU head', header?.buHead],
    ['CRP', header?.crp],
  ];
  return required.filter(([, value]) => blank(value)).map(([label]) => label);
}

export function listOf(labels) {
  if (labels.length <= 1) return labels.join('');
  return `${labels.slice(0, -1).join(', ')} and ${labels.at(-1)}`;
}
