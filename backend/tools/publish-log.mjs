// Publishes the end of a command's output, and the error lines of firebase-debug.log, as annotations so
// a failed deploy can be diagnosed without downloading job logs. Query strings (signed URLs), OAuth
// tokens, JWTs and API keys are redacted before anything is published.
//   node publish-log.mjs "<title>" <output.txt> [firebase-debug.log]
import { existsSync, readFileSync } from 'node:fs';
import { publish } from './report.mjs';

const [title, outFile, debugFile] = process.argv.slice(2);
if (!title || !outFile) {
  console.error('usage: node publish-log.mjs "<title>" <output.txt> [firebase-debug.log]');
  process.exit(2);
}
const clean = (s) =>
  s
    .replace(/\x1b\[[0-9;]*m/g, '')
    .replace(/(https?:\/\/[^\s"'?]+)\?[^\s"']*/g, '$1?<redacted>')
    .replace(/\bya29\.[\w.-]+/g, '<token>')
    .replace(/\beyJ[\w-]+\.[\w-]+\.[\w-]+/g, '<jwt>')
    .replace(/AIza[0-9A-Za-z_-]{35}/g, '<api-key>');
const lines = (f) => (f && existsSync(f) ? clean(readFileSync(f, 'utf8')).split('\n') : []);
const output = lines(outFile).filter((l) => l.trim()).slice(-60).map((l) => l.slice(0, 400));
const debugErrors = lines(debugFile)
  .filter((l) => /error|status[":\s]+[45]\d\d|denied|permission|not found|failed/i.test(l))
  .slice(-40)
  .map((l) => l.slice(0, 400));
publish(title, { output, debugErrors });
