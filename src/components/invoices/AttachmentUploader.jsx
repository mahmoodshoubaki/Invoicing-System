'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  UploadCloud, X, FileText, FileSpreadsheet, Image as ImageIcon,
  File as FileIcon, CheckCircle2, Paperclip,
} from 'lucide-react';
import { formatFileSize } from '@/utils/formatters';

// Client-side guardrails only — the backend independently re-checks file
// size, extension, total size, and file name length, so these exist purely
// to fail fast before the browser bothers holding onto files that could
// never be submitted anyway.
export const MAX_ATTACHMENT_SIZE_MB = 15;
export const MAX_ATTACHMENTS_TOTAL_SIZE_MB = 75;
export const MAX_ATTACHMENTS_COUNT = 10;

const MAX_ATTACHMENT_SIZE = MAX_ATTACHMENT_SIZE_MB * 1024 * 1024;
const MAX_TOTAL_SIZE = MAX_ATTACHMENTS_TOTAL_SIZE_MB * 1024 * 1024;

const ACCEPTED_TYPES = {
  'application/pdf': FileText,
  'application/msword': FileText,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': FileText,
  'application/vnd.ms-excel': FileSpreadsheet,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': FileSpreadsheet,
  'image/png': ImageIcon,
  'image/jpeg': ImageIcon,
  'image/jpg': ImageIcon,
};

const ACCEPT_ATTR = '.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg';

function iconFor(type) {
  return ACCEPTED_TYPES[type] || FileIcon;
}

function genId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Multi-file attachment picker. Files are submitted as real multipart file
 * parts (see models/invoice.js's createInvoiceFormData) — nothing is read
 * or encoded client-side, so the per-file progress bar here is purely a
 * cosmetic pace-out rather than tracking real work, similar to how a lot of
 * upload UIs give a moment of visible progress before confirming. The
 * parent owns the file list as state and passes it in via `files`/
 * `onChange`, the same pattern as a controlled input. Each entry is shaped
 * as `{ id, file, name, size, type, progress, status }`, where `file` is
 * the raw File object and `status` is 'uploading' | 'done'.
 *
 * @param {object} props
 * @param {Array} props.files
 * @param {(updater: (prev: Array) => Array) => void} props.onChange
 * @param {(rejected: {file: File, reason: string}[]) => void} [props.onRejected]
 * @param {boolean} [props.disabled]
 */
export default function AttachmentUploader({ files, onChange, onRejected, disabled = false }) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);
  const timers = useRef({});

  useEffect(() => () => {
    Object.values(timers.current).forEach(clearInterval);
  }, []);

  // Bigger files "take longer" here too, purely cosmetic but reads as
  // realistic feedback rather than an instant fake 100%.
  const animateProgress = useCallback((id, size) => {
    const durationMs = Math.min(2500, Math.max(400, size / 50_000));
    const start = Date.now();
    timers.current[id] = setInterval(() => {
      const pct = Math.min(100, Math.round(((Date.now() - start) / durationMs) * 100));
      onChange((prev) => prev.map((f) => (f.id === id ? { ...f, progress: pct } : f)));
      if (pct >= 100) {
        clearInterval(timers.current[id]);
        delete timers.current[id];
        onChange((prev) => prev.map((f) => (f.id === id ? { ...f, status: 'done' } : f)));
      }
    }, 120);
  }, [onChange]);

  const stopProgress = (id) => {
    if (timers.current[id]) {
      clearInterval(timers.current[id]);
      delete timers.current[id];
    }
  };

  const addFiles = useCallback((fileList) => {
    const incoming = Array.from(fileList);
    const accepted = [];
    const rejected = [];
    let runningTotal = files.reduce((sum, f) => sum + f.size, 0);
    let runningCount = files.length;

    for (const file of incoming) {
      const isDuplicate = files.some((f) => f.name === file.name && f.size === file.size)
        || accepted.some((f) => f.name === file.name && f.size === file.size);

      if (isDuplicate) {
        rejected.push({ file, reason: 'This file was already added' });
      } else if (runningCount >= MAX_ATTACHMENTS_COUNT) {
        rejected.push({ file, reason: `Maximum of ${MAX_ATTACHMENTS_COUNT} attachments reached` });
      } else if (file.size > MAX_ATTACHMENT_SIZE) {
        rejected.push({ file, reason: `Exceeds the ${MAX_ATTACHMENT_SIZE_MB} MB per-file limit` });
      } else if (runningTotal + file.size > MAX_TOTAL_SIZE) {
        rejected.push({ file, reason: `Would exceed the ${MAX_ATTACHMENTS_TOTAL_SIZE_MB} MB total limit` });
      } else {
        accepted.push(file);
        runningTotal += file.size;
        runningCount += 1;
      }
    }

    if (accepted.length > 0) {
      const entries = accepted.map((file) => ({
        id: genId(),
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        progress: 0,
        status: 'uploading',
      }));
      onChange((prev) => [...prev, ...entries]);
      entries.forEach((entry) => animateProgress(entry.id, entry.size));
    }

    if (rejected.length > 0) {
      onRejected?.(rejected);
    }
  }, [files, onChange, onRejected, animateProgress]);

  const removeFile = (id) => {
    stopProgress(id);
    onChange((prev) => prev.filter((f) => f.id !== id));
  };

  const handleInputChange = (e) => {
    if (e.target.files?.length) addFiles(e.target.files);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (disabled) return;
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  const anyUploading = files.some((f) => f.status === 'uploading');

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT_ATTR}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />

      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDragEnter={(e) => { e.preventDefault(); if (!disabled) setDragActive(true); }}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragActive(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors
          ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200' : 'cursor-pointer'}
          ${dragActive ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/60 hover:bg-gray-50'}
        `}
      >
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${dragActive ? 'bg-primary/10' : 'bg-gray-100'}`}>
          <UploadCloud size={18} className={dragActive ? 'text-primary' : 'text-gray-400'} />
        </div>
        <p className="text-sm text-gray-700">
          <span className="font-medium text-primary">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs text-gray-400">
          PDF, Word, Excel, or images · up to {MAX_ATTACHMENT_SIZE_MB} MB per file · {MAX_ATTACHMENTS_COUNT} files max
        </p>
      </div>

      {files.length > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-gray-400 px-0.5">
            <span className="flex items-center gap-1">
              <Paperclip size={12} />
              {files.length} file{files.length !== 1 ? 's' : ''} · {formatFileSize(totalSize)} of {MAX_ATTACHMENTS_TOTAL_SIZE_MB} MB
            </span>
            {anyUploading && <span className="text-primary">Uploading…</span>}
          </div>

          {files.map((f) => {
            const Icon = iconFor(f.type);
            const isDone = f.status === 'done';
            return (
              <div key={f.id} className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50/60 px-3 py-2.5">
                <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center shrink-0">
                  <Icon size={15} className="text-gray-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-gray-800 truncate">{f.name}</p>
                    <span className="text-xs text-gray-400 shrink-0">{formatFileSize(f.size)}</span>
                  </div>
                  {isDone ? (
                    <p className="flex items-center gap-1 text-xs text-green-600 mt-1">
                      <CheckCircle2 size={12} /> Uploaded
                    </p>
                  ) : (
                    <div className="h-1.5 w-full bg-gray-200 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-[width] duration-150 ease-linear"
                        style={{ width: `${f.progress}%` }}
                      />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(f.id)}
                  className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Remove"
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
