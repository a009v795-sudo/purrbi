// Publishes a JSON report from a GitHub Actions step where it can be read without downloading the
// artifact: as the job summary (for people) and as notice annotations (readable through the GitHub
// checks API). Reports must already be free of secrets; they hold ids, statuses and timings only.
//   node report.mjs "<title>" <report.json>
import { appendFileSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const CHUNK = 3500; // characters per annotation
const MAX_CHUNKS = 9; // GitHub keeps at most 10 notices per step

const escapeData = (s) => s.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
const escapeProp = (s) => escapeData(s).replace(/:/g, '%3A').replace(/,/g, '%2C');

export function publish(title, report, summaryMarkdown) {
  const json = JSON.stringify(report);
  const parts = [];
  for (let i = 0; i < json.length && parts.length < MAX_CHUNKS; i += CHUNK) parts.push(json.slice(i, i + CHUNK));
  const truncated = parts.join('').length < json.length;
  parts.forEach((p, i) => console.log(`::notice title=${escapeProp(`${title} (${i + 1}/${parts.length}${truncated ? ', truncated' : ''})`)}::${escapeData(p)}`));
  if (process.env.GITHUB_STEP_SUMMARY) {
    const body = summaryMarkdown ?? `\`\`\`json\n${JSON.stringify(report, null, 2).slice(0, 60000)}\n\`\`\``;
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### ${title}\n\n${body}\n\n`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const [title, file] = process.argv.slice(2);
  if (!title || !file) {
    console.error('usage: node report.mjs "<title>" <report.json>');
    process.exit(2);
  }
  let report;
  try {
    report = JSON.parse(readFileSync(file, 'utf8'));
  } catch (e) {
    report = { error: `report not readable: ${e.message}` };
  }
  publish(title, report);
}
