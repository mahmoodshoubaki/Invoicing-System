'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  UploadCloud, X, FileText, FileSpreadsheet, Image as ImageIcon,
  File as FileIcon, CheckCircle2, Paperclip,
} from 'lucide-react';
import { formatFileSize } from '@/utils/formatters';

export const MAX_ATTACHMENT_SIZE_MB = 15;
export const MAX_ATTACHMENTS_TOTAL_SIZE_MB = 75;
export const MAX_ATTACHMENTS_COUNT = 10;

const NO_EXISTING = { count: 0, size: 0 };

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

export const INVOICE_FILE_LIMITS = {
  perFileMb: MAX_ATTACHMENT_SIZE_MB,
  totalMb: MAX_ATTACHMENTS_TOTAL_SIZE_MB,
  maxCount: MAX_ATTACHMENTS_COUNT,
  accept: ACCEPT_ATTR,
  extensions: null,
  label: 'PDF, Word, Excel, or images',
};

const extensionOf = (name) => String(name ?? '').split('.').pop().toLowerCase();

function iconFor(type) {
  return ACCEPTED_TYPES[type] || FileIcon;
}

function genId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * @param {object} props
 * @param {Array} props.files
 * @param {(updater: (prev: Array) => Array) => void} props.onChange
 * @param {(rejected: {file: File, reason: string}[]) => void} [props.onRejected]
 * @param {boolean} [props.disabled]
 * @param {typeof INVOICE_FILE_LIMITS} [props.limits]
 * @param {{ count: number, size: number }} [props.existing]
 */
export default function AttachmentUploader({ files, onChange, onRejected, disabled = false, limits = INVOICE_FILE_LIMITS, existing = NO_EXISTING }) {
  const perFile = limits.perFileMb * 1024 * 1024;
  const total = limits.totalMb * 1024 * 1024;
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);
  const timers = useRef({});

  useEffect(() => () => {
    Object.values(timers.current).forEach(clearInterval);
  }, []);

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
    let runningTotal = existing.size + files.reduce((sum, f) => sum + f.size, 0);
    let runningCount = existing.count + files.length;

    for (const file of incoming) {
      const isDuplicate = files.some((f) => f.name === file.name && f.size === file.size)
        || accepted.some((f) => f.name === file.name && f.size === file.size);

      if (isDuplicate) {
        rejected.push({ file, reason: 'This file was already added' });
      } else if (limits.extensions && !limits.extensions.includes(extensionOf(file.name))) {
        rejected.push({ file, reason: `Only ${limits.label} files are allowed` });
      } else if (runningCount >= limits.maxCount) {
        rejected.push({ file, reason: `Maximum of ${limits.maxCount} attachments reached` });
      } else if (file.size > perFile) {
        rejected.push({ file, reason: `Exceeds the ${limits.perFileMb} MB per-file limit` });
      } else if (runningTotal + file.size > total) {
        rejected.push({ file, reason: `Would exceed the ${limits.totalMb} MB total limit` });
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
  }, [files, onChange, onRejected, animateProgress, existing, limits, perFile, total]);

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
        accept={limits.accept}
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
          {limits.label} · up to {limits.perFileMb} MB per file · {limits.maxCount} files max
        </p>
      </div>

      {files.length > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-gray-400 px-0.5">
            <span className="flex items-center gap-1">
              <Paperclip size={12} />
              {files.length} file{files.length !== 1 ? 's' : ''} · {formatFileSize(totalSize)} of {limits.totalMb} MB
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
