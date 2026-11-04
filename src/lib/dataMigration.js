export const MIGRATION_MAX_BYTES = 2 * 1024 ** 3;

const TOP_FOLDERS = ['boqs', 'invoices'];
const SYSTEM_FILES = new Set(['thumbs.db', 'desktop.ini', '.ds_store']);

export const pathOf = (file) => (file.webkitRelativePath || file.name).replace(/\\/g, '/');

function partsOf(path) {
  const parts = path.split('/').map((p) => p.trim()).filter(Boolean);
  return parts.length > 0 && !TOP_FOLDERS.includes(parts[0].toLowerCase()) ? parts.slice(1) : parts;
}

export function skipReason(path) {
  const parts = partsOf(path);
  const name = parts.at(-1) ?? '';
  if (SYSTEM_FILES.has(name.toLowerCase())) return 'System file';
  if (name.startsWith('~$')) return 'Office lock file';
  if (parts.length <= 1) return 'At the top of the folder';
  return null;
}

export function isWorkbookCandidate(file) {
  const parts = partsOf(pathOf(file));
  return parts.length === 1 && /\.xlsx$/i.test(parts[0]) && !parts[0].startsWith('~$');
}

/**
 * @param {File[]} files
 */
export function readSelection(files) {
  const workbooks = [];
  const included = [];
  const skipped = [];
  for (const file of files) {
    const path = pathOf(file);
    if (isWorkbookCandidate(file)) workbooks.push(file);
    const reason = skipReason(path);
    if (reason) skipped.push({ path, size: file.size, reason });
    else included.push({ file, path, size: file.size });
  }
  const folderName = pathOf(files[0] ?? { name: '' }).split('/')[0] || '';
  return {
    folderName,
    workbooks,
    included,
    skipped,
    totalBytes: included.reduce((sum, f) => sum + f.size, 0),
  };
}

export function selectionSignature(workbook, included) {
  const head = workbook ? `${workbook.name}:${workbook.size}:${workbook.lastModified}` : '-';
  return `${head}|${included.map((f) => `${f.path}:${f.size}:${f.file.lastModified}`).join('|')}`;
}

export function checkFormData(workbook, included) {
  const form = new FormData();
  form.append('workbook', workbook, workbook.name);
  form.append('fileList', JSON.stringify(included.map((f) => ({ path: f.path, size: f.size }))));
  return form;
}

export function importFormData(workbook, included) {
  const form = new FormData();
  form.append('workbook', workbook, workbook.name);
  for (const f of included) form.append('files', f.file, f.file.name);
  form.append('filePaths', JSON.stringify(included.map((f) => f.path)));
  return form;
}

const COUNT_KEYS = ['boqItems', 'planDates', 'invoices', 'invoiceLines', 'boqFiles', 'invoiceFiles'];

export function mapMigrationResult(raw) {
  const counts = raw?.counts ?? {};
  return {
    saved: raw?.saved === true,
    counts: Object.fromEntries(COUNT_KEYS.map((key) => [key, Number(counts[key]) || 0])),
    problems: (Array.isArray(raw?.problems) ? raw.problems : []).map((p, index) => ({
      id: index,
      sheet: p.sheet ?? null,
      row: p.row ?? null,
      path: p.path ?? null,
      message: p.message ?? '',
    })),
  };
}

export function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / 1024 ** i;
  return `${value >= 10 || i === 0 ? Math.round(value) : value.toFixed(1)} ${units[i]}`;
}
