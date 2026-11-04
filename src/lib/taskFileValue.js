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

export function initialFilesDraft(field) {
  return { existing: parseFilesValue(field?.value), deleteIds: [], added: [] };
}

export function filesAfterSave(draft) {
  const kept = (draft?.existing ?? []).filter((f) => !(draft?.deleteIds ?? []).includes(f.id)).length;
  return kept + (draft?.added ?? []).length;
}

export const isStillAdding = (draft) => (draft?.added ?? []).some((f) => f.status !== 'done');

export function filesValueToSend(draft) {
  const deleteIds = draft?.deleteIds ?? [];
  return deleteIds.length ? JSON.stringify({ deleteIds }) : null;
}

export function toggleRemoval(draft, id) {
  const deleteIds = draft.deleteIds.includes(id)
    ? draft.deleteIds.filter((d) => d !== id)
    : [...draft.deleteIds, id];
  return { ...draft, deleteIds };
}
