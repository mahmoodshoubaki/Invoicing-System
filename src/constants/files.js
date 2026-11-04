/** File rules for BOQs and change requests, as the server checks them (BOQ-020). */
export const BOQ_FILE_LIMITS = {
  perFileMb: 20,
  totalMb: 50,
  maxCount: 10,
  accept: '.pdf,.docx,.xlsx,.jpg,.jpeg,.png',
  extensions: ['pdf', 'docx', 'xlsx', 'jpg', 'jpeg', 'png'],
  label: 'PDF, Word (.docx), Excel (.xlsx) or image',
};

/** A file the server refused, and one it could not find. */
export const FILE_REFUSED = 'BOQ-020';
export const FILE_NOT_FOUND = 'BOQ-021';
