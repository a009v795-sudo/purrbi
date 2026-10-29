// Per-job record of outbound calls: which service, host, path, HTTP status and latency. It is saved
// on the scan document and logged under the job's trace id, so a failed or slow lookup can be traced.
// Only sanitized values are kept: no headers, keys, query strings or response bodies; a failed call
// keeps a short, redacted reason (e.g. the provider's error message).
import { AsyncLocalStorage } from 'node:async_hooks';

export type CallOutcome = 'ok' | 'not_found' | 'http_error' | 'rate_limited' | 'timeout' | 'network' | 'parse';

export interface SourceCall {
  source: string;
  host: string;
  path: string;
  status: number | null;
  outcome: CallOutcome;
  ms: number;
  attempt: number;
  detail?: string; // failed calls only
}

const storage = new AsyncLocalStorage<SourceCall[]>();
const MAX_CALLS = 60;

/** Runs `fn` with its own call log; calls made anywhere inside it are recorded. */
export function runWithCallLog<T>(fn: () => Promise<T>): Promise<T> {
  return storage.run([], fn);
}

/** The calls recorded so far in the current job (empty outside a job). */
export function currentCalls(): SourceCall[] {
  return [...(storage.getStore() ?? [])];
}

export function recordCall(call: SourceCall): void {
  const log = storage.getStore();
  if (log && log.length < MAX_CALLS) log.push(call);
}

/** A short reason for a failed call: the provider's error message if the body has one, redacted. */
export function errorDetail(body: string): string {
  let reason = body;
  try {
    const j = JSON.parse(body) as { error?: { message?: string } | string; message?: string };
    reason = (typeof j.error === 'string' ? j.error : j.error?.message) ?? j.message ?? body;
  } catch {
    reason = body.replace(/<[^>]+>/g, ' ');
  }
  return reason
    .replace(/\bsk-[\w*-]+/g, 'sk-…')
    .replace(/Bearer\s+\S+/gi, 'Bearer …')
    .replace(/(https?:\/\/[^\s"'?]+)\?\S*/g, '$1?…')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160);
}

/** Path without query or fragment; long digit runs (barcodes, ids) collapsed. */
export function sanitizeUrl(url: string): { host: string; path: string } {
  try {
    const u = new URL(url);
    return { host: u.host, path: u.pathname.replace(/\d{6,}/g, ':n').slice(0, 80) };
  } catch {
    return { host: 'invalid-url', path: '' };
  }
}

export function summarizeCalls(calls: SourceCall[]): { externalCalls: number; aiCalls: number; failedCalls: number } {
  return {
    externalCalls: calls.length,
    aiCalls: calls.filter((c) => c.host === 'api.openai.com').length,
    failedCalls: calls.filter((c) => c.outcome !== 'ok' && c.outcome !== 'not_found').length,
  };
}
