import { ApiError, newCorrelationId } from '@/lib/apiClient';

const CORRELATION_HEADER = 'X-Correlation-Id';

function errorFrom(xhr, tracking) {
  let data = null;
  try { data = xhr.responseText ? JSON.parse(xhr.responseText) : null; } catch { data = null; }
  if (xhr.status === 401) return new ApiError('Your session has expired. Please sign in again, then try again.', { status: 401 });
  if (xhr.status === 413) return new ApiError('The upload is larger than the server accepts.', { status: 413 });
  return new ApiError(data?.Message || data?.message || xhr.statusText || `Request failed with status ${xhr.status}`, {
    code: data?.ErrorCode || data?.errorCode || null,
    traceId: data?.TraceId || data?.traceId || xhr.getResponseHeader(CORRELATION_HEADER) || tracking,
    status: xhr.status,
    errors: data?.Errors || data?.errors || null,
    body: data,
  });
}

/**
 * POSTs a multipart body with upload progress, which fetch cannot report.
 *
 * @param {string} url  same-origin, through the backend proxy
 * @param {FormData} formData
 * @param {{ onProgress?: (p: { loaded: number, total: number, uploaded: boolean }) => void, signal?: AbortSignal }} [options]
 * @returns {Promise<any>} the parsed JSON answer
 */
export function uploadWithProgress(url, formData, { onProgress, signal } = {}) {
  const tracking = newCorrelationId();
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.withCredentials = true;
    xhr.setRequestHeader(CORRELATION_HEADER, tracking);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.({ loaded: e.loaded, total: e.total, uploaded: false });
    };
    xhr.upload.onload = (e) => onProgress?.({ loaded: e.total, total: e.total, uploaded: true });
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try { resolve(xhr.responseText ? JSON.parse(xhr.responseText) : null); } catch { resolve(null); }
      } else {
        reject(errorFrom(xhr, tracking));
      }
    };
    xhr.onerror = () => reject(new ApiError('Network error. Please check your connection and try again.', { traceId: tracking }));
    xhr.onabort = () => reject(new ApiError('The upload was stopped.', { traceId: tracking }));
    signal?.addEventListener('abort', () => xhr.abort(), { once: true });

    xhr.send(formData);
  });
}
