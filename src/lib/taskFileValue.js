/**
 * A `files` task field — an invoice's attachments (2026-10-13) — between the
 * task row and CompleteTaskWithFiles.
 *
 * It arrives as JSON text of the invoice's current files:
 *   [{ "id", "contentId", "fileName", "contentType", "fileSize", "uploadedBy", "uploadedOn" }]
 * In the form it is a draft: those files, the ids marked for removal, and the
 * files added (the uploader's entries, `{ id, file, name, size, type, status }`).
 * It goes back in two halves: the removals as text in `values`
 * (`{"deleteIds":[…]}`, or nothing when none), the new files as parts.
 */

/** The files a value lists. Unreadable text is no files. */
export function parseFilesValue(text) {
  if (!text) return [];
  try {
    const raw = JSON.parse(text);
    if (!Array.isArray(raw)) return [];
    return raw.map((f) => ({
      id: f.id ?? f.Id ?? null,
      contentId: f.contentId ?? f.ContentId ?? null,
      fileName: f.fileName ?? f.FileName ?? '',
      contentType: f.contentType ?? f.ContentType ?? null,
      fileSize: f.fileSize ?? f.FileSize ?? null,
      uploadedBy: f.uploadedBy ?? f.UploadedBy ?? null,
      uploadedOn: f.uploadedOn ?? f.UploadedOn ?? null,
    }));
  } catch {
    return [];
  }
}

/** A field's starting draft: what is on the invoice, nothing removed, nothing added. */
export function initialFilesDraft(field) {
  return { existing: parseFilesValue(field?.value), deleteIds: [], added: [] };
}

/** How many files the invoice would hold after saving — the files already there count. */
export function filesAfterSave(draft) {
  const kept = (draft?.existing ?? []).filter((f) => !(draft?.deleteIds ?? []).includes(f.id)).length;
  return kept + (draft?.added ?? []).length;
}

/** Whether a picked file is still being read by the uploader. */
export const isStillAdding = (draft) => (draft?.added ?? []).some((f) => f.status !== 'done');

/** The removals as `values` text: `{"deleteIds":[…]}`, or null when nothing is removed. */
export function filesValueToSend(draft) {
  const deleteIds = draft?.deleteIds ?? [];
  return deleteIds.length ? JSON.stringify({ deleteIds }) : null;
}

/** Marks a file for removal, or takes the mark off again. */
export function toggleRemoval(draft, id) {
  const deleteIds = draft.deleteIds.includes(id)
    ? draft.deleteIds.filter((d) => d !== id)
    : [...draft.deleteIds, id];
  return { ...draft, deleteIds };
}
