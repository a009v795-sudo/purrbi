// Outbound HTTP with timeouts, bounded retries and typed failures, so callers can tell
// "the source is down" apart from "the source has no record". Every attempt is recorded (sanitized)
// in the current job's call log.
import { errorDetail, recordCall, sanitizeUrl, type CallOutcome } from './diagnostics';

export type SourceErrorKind = 'timeout' | 'network' | 'http' | 'parse' | 'rate_limited' | 'config';

export class SourceError extends Error {
  constructor(
    readonly source: string,
    readonly kind: SourceErrorKind,
    message: string,
    readonly status?: number,
  ) {
    super(`${source}: ${message}`);
    this.name = 'SourceError';
  }
}

export interface HttpOptions {
  source: string;
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: string;
  timeoutMs?: number;
  retries?: number; // extra attempts for timeouts, network errors, 429 and 5xx
  acceptStatuses?: number[]; // non-2xx statuses returned to the caller instead of thrown (e.g. 404)
}

export interface HttpResponse {
  status: number;
  text: string;
  headers: Headers;
  url: string; // after redirects
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function httpRequest(url: string, opts: HttpOptions): Promise<HttpResponse> {
  const retries = opts.retries ?? 1;
  const { host, path } = sanitizeUrl(url);
  let lastError: SourceError | null = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) await sleep(400 * 3 ** (attempt - 1));
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 8000);
    const started = Date.now();
    let status: number | null = null;
    let outcome: CallOutcome = 'network';
    let detail: string | undefined;
    try {
      const res = await fetch(url, {
        method: opts.method ?? 'GET',
        headers: opts.headers,
        body: opts.body,
        signal: controller.signal,
        redirect: 'follow',
      });
      status = res.status;
      const text = await res.text();
      outcome = res.ok ? 'ok' : res.status === 404 ? 'not_found' : res.status === 429 ? 'rate_limited' : 'http_error';
      if (res.ok || opts.acceptStatuses?.includes(res.status)) return { status: res.status, text, headers: res.headers, url: res.url || url };
      detail = errorDetail(text);
      if (res.status === 429) lastError = new SourceError(opts.source, 'rate_limited', 'rate limited', 429);
      else if (res.status >= 500) lastError = new SourceError(opts.source, 'http', `HTTP ${res.status}`, res.status);
      else throw new SourceError(opts.source, 'http', `HTTP ${res.status}: ${text.slice(0, 200)}`, res.status);
    } catch (err) {
      if (err instanceof SourceError) {
        if (err.kind === 'http' && (err.status ?? 0) < 500) throw err;
        lastError = err;
      } else if ((err as Error).name === 'AbortError') {
        outcome = 'timeout';
        lastError = new SourceError(opts.source, 'timeout', `no response within ${opts.timeoutMs ?? 8000} ms`);
      } else {
        outcome = status === null ? 'network' : 'http_error';
        lastError = new SourceError(opts.source, 'network', (err as Error).message);
      }
    } finally {
      clearTimeout(timer);
      recordCall({ source: opts.source, host, path, status, outcome, ms: Date.now() - started, attempt: attempt + 1, ...(detail ? { detail } : {}) });
    }
  }
  throw lastError ?? new SourceError(opts.source, 'network', 'request failed');
}

export async function httpJson<T = unknown>(url: string, opts: HttpOptions): Promise<{ status: number; json: T | null }> {
  const res = await httpRequest(url, opts);
  if (!res.text) return { status: res.status, json: null };
  try {
    return { status: res.status, json: JSON.parse(res.text) as T };
  } catch {
    if (res.status >= 200 && res.status < 300) throw new SourceError(opts.source, 'parse', 'response was not valid JSON');
    return { status: res.status, json: null };
  }
}

/** Binary download (images) with the same timeout, diagnostics and typed failures; refuses large bodies. */
export async function httpBytes(url: string, opts: HttpOptions & { maxBytes: number }): Promise<{ status: number; bytes: Buffer; contentType: string }> {
  const { host, path } = sanitizeUrl(url);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 15000);
  const started = Date.now();
  let status: number | null = null;
  let outcome: CallOutcome = 'network';
  try {
    const res = await fetch(url, { headers: opts.headers, signal: controller.signal, redirect: 'follow' });
    status = res.status;
    outcome = res.ok ? 'ok' : res.status === 404 ? 'not_found' : res.status === 429 ? 'rate_limited' : 'http_error';
    if (!res.ok) throw new SourceError(opts.source, res.status === 429 ? 'rate_limited' : 'http', `HTTP ${res.status}`, res.status);
    const declared = Number(res.headers.get('content-length') ?? 0);
    if (declared > opts.maxBytes) throw new SourceError(opts.source, 'parse', 'file too large');
    const bytes = Buffer.from(await res.arrayBuffer());
    if (bytes.length > opts.maxBytes) throw new SourceError(opts.source, 'parse', 'file too large');
    return { status: res.status, bytes, contentType: (res.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase() };
  } catch (err) {
    if (err instanceof SourceError) throw err;
    if ((err as Error).name === 'AbortError') {
      outcome = 'timeout';
      throw new SourceError(opts.source, 'timeout', `no response within ${opts.timeoutMs ?? 15000} ms`);
    }
    throw new SourceError(opts.source, 'network', (err as Error).message);
  } finally {
    clearTimeout(timer);
    recordCall({ source: opts.source, host, path, status, outcome, ms: Date.now() - started, attempt: 1 });
  }
}
