// Checks that every Firestore query in the exported app (app/lib) that needs a composite index has one
// in backend/firestore.indexes.json. Without it the query fails on the real project and the screen
// waits forever, while the emulator (which needs no indexes) passes. Rule: equality filters plus a
// sort on another field need an index of the equality fields followed by the sort fields.
//   node check-indexes.mjs        exits 1 and lists what is missing
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..', '..');
const libDir = join(root, 'app', 'lib');
const indexes = JSON.parse(readFileSync(join(root, 'backend', 'firestore.indexes.json'), 'utf8')).indexes ?? [];

const dartFiles = (dir) => readdirSync(dir).flatMap((n) => {
  const p = join(dir, n);
  return statSync(p).isDirectory() ? dartFiles(p) : n.endsWith('.dart') ? [p] : [];
});

const needed = [];
for (const file of dartFiles(libDir)) {
  const text = readFileSync(file, 'utf8');
  for (const m of text.matchAll(/query(\w+)Record\(\s*(?:parent:[^,]+,\s*)?queryBuilder:\s*\(\w+\)\s*=>([\s\S]*?)\)\s*,\s*(?:limit|singleRecord|\))/g)) {
    const collection = m[1].charAt(0).toLowerCase() + m[1].slice(1);
    const chain = m[2];
    const equality = [...chain.matchAll(/\.where\(\s*'(\w+)',\s*isEqualTo:/g)].map((x) => x[1]);
    const orderBy = [...chain.matchAll(/\.orderBy\(\s*'(\w+)'(\s*,\s*descending:\s*true)?/g)].map((x) => ({ field: x[1], order: x[2] ? 'DESCENDING' : 'ASCENDING' }));
    const sortsOnOther = orderBy.some((o) => !equality.includes(o.field));
    if (!equality.length || !sortsOnOther) continue;
    needed.push({ file: relative(root, file), collection, equality, orderBy });
  }
}

const covered = (q) => indexes.some((ix) => {
  if (ix.collectionGroup !== q.collection) return false;
  const f = ix.fields ?? [];
  const head = f.slice(0, q.equality.length).map((x) => x.fieldPath).sort();
  if (JSON.stringify(head) !== JSON.stringify([...q.equality].sort())) return false;
  const tail = f.slice(q.equality.length);
  return tail.length === q.orderBy.length && tail.every((x, i) => x.fieldPath === q.orderBy[i].field && x.order === q.orderBy[i].order);
});

const missing = needed.filter((q) => !covered(q));
for (const q of needed) console.log(`${covered(q) ? 'ok     ' : 'MISSING'} ${q.collection}(${[...q.equality.map((f) => `${f} ASC`), ...q.orderBy.map((o) => `${o.field} ${o.order === 'DESCENDING' ? 'DESC' : 'ASC'}`)].join(', ')})  ${q.file}`);
if (missing.length) {
  console.log(`\n${missing.length} quer${missing.length === 1 ? 'y needs an index' : 'ies need indexes'} that backend/firestore.indexes.json does not define.`);
  process.exit(1);
}
console.log(`\nAll ${needed.length} app queries that need a composite index have one.`);
