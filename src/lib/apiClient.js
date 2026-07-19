const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/**
 * Error shape returned by the backend on failure:
 *   { "ErrorCode": "BOQ-002", "Message": "...", "TraceId": "..." }
 *
 * `message` is always the human-readable text meant for the user (falls back
 * gracefully if the backend ever returns something else). `code`/`traceId`/
 * `status` are kept on the instance for callers that need to branch on a
 * specific failure (e.g. treating a 404 as "not found yet" instead of an error).
 */
export class ApiError extends Error {
  constructor(message, { code = null, traceId = null, status = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.traceId = traceId;
    this.status = status;
  }
}

async function parseErrorResponse(res) {
  const raw = await res.text().catch(() => '');
  const fallback = res.statusText || `Request failed with status ${res.status}`;
  if (!raw) return { message: fallback };

  try {
    const data = JSON.parse(raw);
    return {
      message: data.Message || data.message || fallback,
      code: data.ErrorCode || data.errorCode || null,
      traceId: data.TraceId || data.traceId || null,
    };
  } catch {
    return { message: raw };
  }
}

async function request(url, { method = 'GET', body, headers = {}, ...rest } = {}) {
  let res;
  try {
    res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...rest,
    });
  } catch {
    throw new ApiError('Network error. Please check your connection and try again.');
  }

  if (!res.ok) {
    const { message, code, traceId } = await parseErrorResponse(res);
    throw new ApiError(message, { code, traceId, status: res.status });
  }

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

/**
 * Creates a namespaced API client for a specific module prefix.
 * Example: createApiClient('/api/Projects') → all calls are scoped to that prefix.
 *
 * @param {string} prefix - URL segment appended after BASE_URL, e.g. '/api/Projects'
 */
export function createApiClient(prefix = '') {
  const base = `${BASE_URL}${prefix}`;
  return {
    get:    (path, params) => request(base + path + (params ? `?${new URLSearchParams(params)}` : '')),
    post:   (path, body)   => request(base + path, { method: 'POST', body }),
    put:    (path, body)   => request(base + path, { method: 'PUT', body }),
    patch:  (path, body)   => request(base + path, { method: 'PATCH', body }),
    delete: (path)         => request(base + path, { method: 'DELETE' }),
  };
}

export const apiClient = createApiClient();
