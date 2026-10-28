// Outbound HTTP with timeouts, bounded retries and typed failures, so callers can tell
// "the source is down" apart from "the source has no record".

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
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function httpRequest(url: string, opts: HttpOptions): Promise<HttpResponse> {
  const retries = opts.retries ?? 1;
  let lastError: SourceError | null = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) await sleep(400 * 3 ** (attempt - 1));
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 8000);
    try {
      const res = await fetch(url, {
        method: opts.method ?? 'GET',
        headers: opts.headers,
        body: opts.body,
        signal: controller.signal,
        redirect: 'follow',
      });
      const text = await res.text();
      if (res.ok || opts.acceptStatuses?.includes(res.status)) return { status: res.status, text, headers: res.headers };
      if (res.status === 429) lastError = new SourceError(opts.source, 'rate_limited', 'rate limited', 429);
      else if (res.status >= 500) lastError = new SourceError(opts.source, 'http', `HTTP ${res.status}`, res.status);
      else throw new SourceError(opts.source, 'http', `HTTP ${res.status}: ${text.slice(0, 200)}`, res.status);
    } catch (err) {
      if (err instanceof SourceError) {
        if (err.kind === 'http' && (err.status ?? 0) < 500) throw err;
        lastError = err;
      } else if ((err as Error).name === 'AbortError') {
        lastError = new SourceError(opts.source, 'timeout', `no response within ${opts.timeoutMs ?? 8000} ms`);
      } else {
        lastError = new SourceError(opts.source, 'network', (err as Error).message);
      }
    } finally {
      clearTimeout(timer);
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
