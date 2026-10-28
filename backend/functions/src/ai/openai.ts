// Minimal OpenAI REST client (no SDK). The key comes from Secret Manager (OPENAI_API_KEY) and is
// never logged, stored in Firestore or returned to clients.
import { httpJson, SourceError } from '../util/http';

export interface JsonSchemaFormat {
  name: string;
  schema: Record<string, unknown>;
}

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
  const body = {
    model: opts.model,
    temperature: 0,
    max_completion_tokens: opts.maxTokens ?? 2500,
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

export interface UrlCitation {
  url: string;
  title?: string;
}

/** Responses API with the web_search tool and a strict JSON schema. Returns parsed data + citations. */
export async function researchJson<T>(opts: {
  apiKey: string | undefined;
  model: string;
  system: string;
  user: string;
  format: JsonSchemaFormat;
  timeoutMs: number;
  allowedDomains?: string[];
}): Promise<{ data: T; citations: UrlCitation[]; model: string }> {
  const tool: Record<string, unknown> = { type: 'web_search' };
  if (opts.allowedDomains?.length) tool.filters = { allowed_domains: opts.allowedDomains };
  const body = {
    model: opts.model,
    tools: [tool],
    max_output_tokens: 3000,
    input: [
      { role: 'system', content: opts.system },
      { role: 'user', content: opts.user },
    ],
    text: { format: { type: 'json_schema', name: opts.format.name, strict: true, schema: opts.format.schema } },
  };
  const { json } = await httpJson<{
    model?: string;
    output?: { type?: string; content?: { type?: string; text?: string; annotations?: { type?: string; url?: string; title?: string }[] }[] }[];
  }>('https://api.openai.com/v1/responses', {
    source: 'OpenAI',
    method: 'POST',
    headers: { Authorization: `Bearer ${requireKey(opts.apiKey)}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    timeoutMs: opts.timeoutMs,
    retries: 0,
  });
  const message = json?.output?.find((o) => o.type === 'message');
  const part = message?.content?.find((c) => c.type === 'output_text');
  if (!part?.text) throw new SourceError('OpenAI', 'parse', 'no output text');
  const citations = (part.annotations ?? [])
    .filter((a) => a.type === 'url_citation' && a.url)
    .map((a) => ({ url: a.url as string, title: a.title }));
  try {
    return { data: JSON.parse(part.text) as T, citations, model: json?.model ?? opts.model };
  } catch {
    throw new SourceError('OpenAI', 'parse', 'research output did not match the JSON schema');
  }
}
