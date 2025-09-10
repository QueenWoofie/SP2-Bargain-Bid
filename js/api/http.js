import { API_BASE } from './constants.js';
import { authHeaders } from '../utils/storage.js';

function buildQuery(params = {}) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === false) continue;
    if (Array.isArray(v)) v.forEach((val) => q.append(k, val));
    else q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

async function handle(res) {
  const ct = res.headers.get('content-type') || '';
  let body = null;
  try {
    body = ct.includes('application/json') ? await res.json() : await res.text();
  } catch {}

  if (!res.ok) {
    const err = new Error(messageForUser(body, res.status, res.statusText));
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

function messageForUser(body, status, fallback) {
  if (Array.isArray(body?.errors) && body.errors[0]?.message) return body.errors[0].message;
  if (typeof body?.message === 'string' && body.message) return body.message;
  if (status === 401) return 'Please log in to continue.';
  if (status === 403) return 'You don’t have permission for this action.';
  if (status === 404) return 'Not found.';
  if (status >= 500) return 'Server error. Please try again shortly.';
  return fallback || 'Request failed.';
}

export async function httpGet(path, { query = {}, headers = {}, signal } = {}) {
  const url = `${API_BASE}${path}${buildQuery(query)}`;
  const h = authHeaders(headers);

  let res = await fetch(url, { headers: h, signal });

  if ((res.status === 401 || res.status === 403) && h['X-Noroff-API-Key']) {
    const { ['X-Noroff-API-Key']: _drop, ...noKey } = h;
    res = await fetch(url, { headers: noKey, signal });
  }

  return handle(res);
}

export async function httpSend(method, path, body, { headers = {}, signal } = {}) {
  const url = `${API_BASE}${path}`;
  const h = authHeaders(headers);

  let res = await fetch(url, {
    method,
    headers: h,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  });

  if ((res.status === 401 || res.status === 403) && h['X-Noroff-API-Key']) {
    const { ['X-Noroff-API-Key']: _drop, ...noKey } = h;
    res = await fetch(url, {
      method,
      headers: noKey,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  }

  return handle(res);
}
