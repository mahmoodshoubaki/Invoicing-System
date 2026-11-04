const blank = (value) => String(value ?? '').trim() === '';

/**
 * The project details a request needs that the header lacks, by label.
 *
 * @param {Object} header  mapProjectHeader's
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

/** "A", "A and B", "A, B and C". */
export function listOf(labels) {
  if (labels.length <= 1) return labels.join('');
  return `${labels.slice(0, -1).join(', ')} and ${labels.at(-1)}`;
}
