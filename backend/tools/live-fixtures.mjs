// Collects real products and package photos for live tests run where Open Pet Food Facts is not
// reachable (the Claude sandbox). Runs on GitHub Actions; writes <outDir>/manifest.json and photos/,
// which the live-fixtures workflow publishes on the live-fixtures branch (never main). The photos are
// Open Pet Food Facts contributor images (CC BY-SA 3.0); each keeps its source URL in the manifest.
//   node live-fixtures.mjs <outDir> [how many incomplete products, default 3]
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { discover, UA } from './opff-discovery.mjs';
import { publish } from './report.mjs';

const outDir = process.argv[2];
if (!outDir) {
  console.error('usage: node live-fixtures.mjs <outDir>');
  process.exit(2);
}
mkdirSync(join(outDir, 'photos'), { recursive: true });

const found = await discover({ incompleteCount: Math.min(12, Number(process.argv[3]) || 3) });
for (const p of found.incomplete) {
  p.photos = [];
  for (const [i, url] of p.images.entries()) {
    const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(60000) }).catch((e) => ({ ok: false, status: e.name }));
    if (!res.ok) {
      p.photos.push({ source: url, fetch: res.status });
      continue;
    }
    const file = `photos/${p.code}-${i + 1}.jpg`;
    writeFileSync(join(outDir, file), Buffer.from(await res.arrayBuffer()));
    p.photos.push({ file, source: url });
  }
  delete p.images;
}
found.photoCandidate = found.incomplete[0] ?? null;

const LICENSE = 'Product photos: Open Pet Food Facts contributors, CC BY-SA 3.0 (https://creativecommons.org/licenses/by-sa/3.0/); product data: Open Database License (ODbL).';
writeFileSync(join(outDir, 'manifest.json'), JSON.stringify({ generatedAt: new Date().toISOString(), source: 'world.openpetfoodfacts.org search', license: LICENSE, ...found }, null, 2));
writeFileSync(
  join(outDir, 'README.md'),
  `# Purrbi live-test fixtures\n\nReal products found with Open Pet Food Facts' search, and package photos of the products whose database record lacks the label, for Purrbi's live tests. Not part of the app.\n\n${LICENSE}\nEach photo's source page is listed in manifest.json.\n`,
);
publish('Live fixtures', {
  items: found.items,
  incomplete: found.incomplete.map((p) => ({ code: p.code, name: p.name, species: p.species, photos: p.photos.map((x) => x.file ?? `fetch ${x.fetch}`) })),
  counts: found.counts,
});
