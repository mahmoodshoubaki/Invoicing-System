import { fetch as undiciFetch, Agent } from 'undici';

const BACKEND_URL = process.env.BACKEND_API_URL;

const allowSelfSigned = process.env.NODE_ENV !== 'production'
  || process.env.BACKEND_ALLOW_SELF_SIGNED === 'true';

const tls = allowSelfSigned ? { connect: { rejectUnauthorized: false } } : {};
const dispatcher = allowSelfSigned ? new Agent(tls) : undefined;

const LONG_WAIT_MS = 60 * 60 * 1000;
const longDispatcher = new Agent({ ...tls, headersTimeout: LONG_WAIT_MS, bodyTimeout: LONG_WAIT_MS });
const waitsLong = (path) => path[0]?.toLowerCase() === 'api' && path[1]?.toLowerCase() === 'datamigration';

async function proxy(request, { params }) {
  const { path } = await params;
  const targetUrl = `${BACKEND_URL}/${path.join('/')}${request.nextUrl.search}`;

  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('content-length');

  const hasBody = !['GET', 'HEAD'].includes(request.method);

  const body = hasBody && request.body ? request.body : undefined;

  let backendRes;
  try {
    backendRes = await undiciFetch(targetUrl, {
      method: request.method,
      headers,
      body,
      ...(body ? { duplex: 'half' } : {}),
      dispatcher: waitsLong(path) ? longDispatcher : dispatcher,
    });
  } catch (err) {
    console.error('[BFF proxy] Could not reach backend at', targetUrl, err);
    return Response.json({ Message: 'An error has occurred please contact your Administrator.' }, { status: 502 });
  }

  const responseHeaders = new Headers();
  backendRes.headers.forEach((value, key) => {
    if (key.toLowerCase() !== 'set-cookie') responseHeaders.set(key, value);
  });
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
