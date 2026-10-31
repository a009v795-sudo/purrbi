// Minimal OpenAI REST client (no SDK). The key comes from Secret Manager (OPENAI_API_KEY) and is
// never logged, stored in Firestore or returned to clients.
import { httpJson, SourceError } from '../util/http';

export interface JsonSchemaFormat {
  name: string;
  schema: Record<string, unknown>;
}

/** Reasoning models (o-series, GPT-5 family) take a reasoning effort, not a temperature, and spend output tokens on reasoning. */
export const isReasoningModel = (model: string) => /^(o\d|gpt-5)/i.test(model);

function requireKey(apiKey: string | undefined): string {
  if (!apiKey) throw new SourceError('OpenAI', 'config', 'OPENAI_API_KEY is not configured');
  return apiKey;
}

/** Chat Completions with a strict JSON schema; supports image inputs. Returns the parsed object. */
export async function chatJson<T>(opts: {
  apiKey: string | undefined;
  model: string;
  system: string;
  userContent: unknown[];
  format: JsonSchemaFormat;
  timeoutMs: number;
  maxTokens?: number;
}): Promise<{ data: T; model: string; usage: unknown }> {
  const reasoning = isReasoningModel(opts.model);
  const body = {
    model: opts.model,
    ...(reasoning ? { reasoning_effort: 'low' } : { temperature: 0 }),
    max_completion_tokens: reasoning ? Math.max(16000, opts.maxTokens ?? 0) : (opts.maxTokens ?? 2500),
    response_format: { type: 'json_schema', json_schema: { name: opts.format.name, strict: true, schema: opts.format.schema } },
    messages: [
      { role: 'system', content: opts.system },
      { role: 'user', content: opts.userContent },
    ],
  };
  const { json } = await httpJson<{
    model?: string;
    usage?: unknown;
    choices?: { message?: { content?: string | null; refusal?: string | null }; finish_reason?: string }[];
  }>('https://api.openai.com/v1/chat/completions', {
    source: 'OpenAI',
    method: 'POST',
    headers: { Authorization: `Bearer ${requireKey(opts.apiKey)}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    timeoutMs: opts.timeoutMs,
    retries: 1,
  });
  const choice = json?.choices?.[0];
  if (choice?.message?.refusal) throw new SourceError('OpenAI', 'parse', `model refused: ${choice.message.refusal.slice(0, 200)}`);
  if (choice?.finish_reason === 'length') throw new SourceError('OpenAI', 'parse', 'output was truncated');
  const content = choice?.message?.content;
  if (!content) throw new SourceError('OpenAI', 'parse', 'empty response');
  try {
    return { data: JSON.parse(content) as T, model: json?.model ?? opts.model, usage: json?.usage };
  } catch {
    throw new SourceError('OpenAI', 'parse', 'response did not match the JSON schema');
  }
}

/** web_search_call actions on one page (reasoning models): the page opened, or searched for words. */
const OPENED = new Set(['open_page', 'find', 'find_in_page']);

/** Models whose API refused `include` (the search's result pages): not asked for again by this instance. */
const sourcesRefused = new Set<string>();

/** For tests: forget the refusals. */
export function resetResearchClientState(): void {
  sourcesRefused.clear();
}

export interface UrlCitation {
  url: string;
  title?: string;
}

/** One web search the model ran (its query and the pages it returned), or a page it opened. */
export interface WebSearchLog {
  query: string;
  urls: string[];
  kind?: 'search' | 'open';
}

/**
 * Responses API with the web_search tool and a strict JSON schema. Returns parsed data, the url
 * citations attached to the output (models often attach none to JSON output, so callers verify pages
 * themselves), how many searches ran, and each search's query and result pages (asked for with
 * `include`; an API that refuses `include` is asked once more without it).
 */
export async function researchJson<T>(opts: {
  apiKey: string | undefined;
  model: string;
  system: string;
  user: string;
  format: JsonSchemaFormat;
  timeoutMs: number;
  allowedDomains?: string[];
  /** Ask for each search's result pages (research checks them; explanations do not need them). */
  wantSources?: boolean;
}): Promise<{ data: T; citations: UrlCitation[]; searches: number; model: string; searchLog: WebSearchLog[] }> {
  const tool: Record<string, unknown> = { type: 'web_search' };
  if (opts.allowedDomains?.length) tool.filters = { allowed_domains: opts.allowedDomains };
  const reasoning = isReasoningModel(opts.model);
  const body = {
    model: opts.model,
    tools: [tool],
    max_output_tokens: reasoning ? 16000 : 3000,
    ...(reasoning ? { reasoning: { effort: 'low' } } : {}),
    include: opts.wantSources && !sourcesRefused.has(opts.model) ? (['web_search_call.action.sources'] as string[] | undefined) : undefined,
    input: [
      { role: 'system', content: opts.system },
      { role: 'user', content: opts.user },
    ],
    text: { format: { type: 'json_schema', name: opts.format.name, strict: true, schema: opts.format.schema } },
  };
  type ResearchResponse = {
    model?: string;
    status?: string;
    incomplete_details?: { reason?: string } | null;
    output?: {
      type?: string;
      action?: { type?: string; query?: string | null; queries?: string[] | null; url?: string | null; sources?: { type?: string; url?: string }[] | null };
      content?: { type?: string; text?: string; annotations?: { type?: string; url?: string; title?: string }[] }[];
    }[];
  };
  const send = (b: typeof body) =>
    httpJson<ResearchResponse>('https://api.openai.com/v1/responses', {
      source: 'OpenAI',
      method: 'POST',
      headers: { Authorization: `Bearer ${requireKey(opts.apiKey)}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(b),
      timeoutMs: opts.timeoutMs,
      retries: 0,
    });
  let json: ResearchResponse | null;
  let sent = body;
  try {
    ({ json } = await send(sent));
  } catch (err) {
    if (!(err instanceof SourceError && err.status === 400)) throw err;
    // The search's result pages are only for the trace and Purrbi's own checks: refused, they are not asked for.
    if (sent.include && /include/i.test(err.message)) {
      sourcesRefused.add(opts.model);
      sent = { ...sent, include: undefined };
    }
    // A model that refuses the search tool's domain filter (HTTP 400) is asked once more without it.
    // The result stays restricted: callers keep only citations on the allowed sites whose quote is
    // found again on the fetched page.
    else if (opts.allowedDomains?.length) {
      const sites = `Search and cite only pages on these sites: ${opts.allowedDomains.join(', ')}. Add site: to every search query (for example: <search terms> site:${opts.allowedDomains[0]}).`;
      sent = { ...sent, tools: [{ type: 'web_search' }], input: [{ role: 'system', content: `${opts.system} ${sites}` }, body.input[1]] };
    } else throw err;
    ({ json } = await send(sent));
  }
  if (json?.status === 'incomplete') throw new SourceError('OpenAI', 'parse', `output incomplete (${json.incomplete_details?.reason ?? 'no reason given'})`);
  const calls = (json?.output ?? []).filter((o) => o.type === 'web_search_call');
  // Only searches count as searches (an action-less call is one, as before); opened pages are listed apart.
  const searches = calls.filter((o) => !o.action?.type || o.action.type === 'search').length;
  // Reasoning models also open pages and look for words on them (actions "open_page", "find", "find_in_page"):
  // those pages count as result pages too.
  const web = (u: string | null | undefined): u is string => !!u && /^https?:\/\//.test(u);
  const searchLog: WebSearchLog[] = calls.flatMap((o): WebSearchLog[] => {
    const a = o.action;
    if (a?.type && a.type !== 'search') return OPENED.has(a.type) && web(a.url) ? [{ query: '', urls: [a.url], kind: 'open' }] : [];
    // A search may carry several queries ("queries"; the older "query" holds one of them).
    const queries = [...new Set([...(a?.queries ?? []), ...(a?.query ? [a.query] : [])].map((q) => q.trim()).filter(Boolean))];
    return [{ query: queries.join(' | '), urls: (a?.sources ?? []).map((x) => x.url ?? '').filter(web), kind: 'search' }];
  });
  const message = json?.output?.find((o) => o.type === 'message');
  const part = message?.content?.find((c) => c.type === 'output_text');
  if (!part?.text) throw new SourceError('OpenAI', 'parse', 'no output text');
  const citations = (part.annotations ?? [])
    .filter((a) => a.type === 'url_citation' && a.url)
    .map((a) => ({ url: a.url as string, title: a.title }));
  try {
    return { data: JSON.parse(part.text) as T, citations, searches, model: json?.model ?? opts.model, searchLog };
  } catch {
    throw new SourceError('OpenAI', 'parse', 'research output did not match the JSON schema');
  }
}
