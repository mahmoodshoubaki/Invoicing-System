// BFF proxy: the browser only ever talks to this Next.js server (same origin
// as the app), never to the real backend directly. That makes every
// auth cookie the backend sets first-party from the browser's point of
// view — no SameSite/cross-site restrictions, no CORS credentials dance.
//
// This route forwards the request to the real backend server-to-server
// (no browser involved, so no cookie/CORS restrictions apply there either),
// and relays the response — including Set-Cookie headers — straight back.
// It never inspects or needs to understand the cookies' contents; it just
// passes them through opaquely in both directions.

import { fetch as undiciFetch, Agent } from 'undici';

const BACKEND_URL = process.env.BACKEND_API_URL;

// Local dev backends (e.g. ASP.NET Core's self-signed HTTPS dev certificate)
// aren't trusted by Node's own CA store, even when `dotnet dev-certs https
// --trust` has made the browser trust it — that only touches the OS/browser
// trust store, which Node's fetch doesn't consult. Scoped to this one
// outgoing connection via a dedicated Agent (not a process-wide
// NODE_TLS_REJECT_UNAUTHORIZED bypass).
//
// Allowed in `next dev`, and in `next start` only when BACKEND_ALLOW_SELF_SIGNED
// is "true" — a production build run locally against the dev backend needs it,
// and keying this on NODE_ENV alone made every call fail there with a 502.
// A real deployment has a proper certificate and never sets the flag.
const allowSelfSigned = process.env.NODE_ENV !== 'production'
  || process.env.BACKEND_ALLOW_SELF_SIGNED === 'true';

const dispatcher = allowSelfSigned
  ? new Agent({ connect: { rejectUnauthorized: false } })
  : undefined;

async function proxy(request, { params }) {
  const { path } = await params;
  const targetUrl = `${BACKEND_URL}/${path.join('/')}${request.nextUrl.search}`;

  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('content-length');

  const hasBody = !['GET', 'HEAD'].includes(request.method);

  // .text() would UTF-8-decode/re-encode the body, corrupting anything
  // binary (e.g. multipart/form-data file uploads) — arrayBuffer()
  // forwards the exact bytes regardless of content type.
  const bodyBuffer = hasBody ? await request.arrayBuffer() : undefined;

  let backendRes;
  try {
    backendRes = await undiciFetch(targetUrl, {
      method: request.method,
      headers,
      body: bodyBuffer,
      dispatcher,
    });
  } catch (err) {
    console.error('[BFF proxy] Could not reach backend at', targetUrl, err);
    return Response.json({ Message: 'An error has occurred please contact your Administrator.' }, { status: 502 });
  }

  const responseHeaders = new Headers();
  backendRes.headers.forEach((value, key) => {
    if (key.toLowerCase() !== 'set-cookie') responseHeaders.set(key, value);
  });
  // Set-Cookie headers must be forwarded one-by-one — joining multiple
  // cookies into a single header value (which naive header-copying does)
  // corrupts them, since Expires dates themselves contain commas.
  const setCookies = backendRes.headers.getSetCookie?.() ?? [];
  for (const cookie of setCookies) {
    responseHeaders.append('set-cookie', cookie);
  }

  return new Response(backendRes.body, {
    status: backendRes.status,
    headers: responseHeaders,
  });
}

export const dynamic = 'force-dynamic';
export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE };
