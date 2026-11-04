import {
  FileText, FileSpreadsheet, Image as ImageIcon, File as FileIcon,
} from 'lucide-react';

const ATTACHMENT_ICONS = {
  pdf: FileText,
  doc: FileText,
  docx: FileText,
  xls: FileSpreadsheet,
  xlsx: FileSpreadsheet,
  png: ImageIcon,
  jpg: ImageIcon,
  jpeg: ImageIcon,
};

export function iconForFileName(fileName) {
  const ext = fileName?.split('.').pop()?.toLowerCase();
  return ATTACHMENT_ICONS[ext] || FileIcon;
}
