// Gộp raw/<typeId>/NN.json thành generated/<typeId>.json (Metro cần import tĩnh).
// Chạy: node scripts/ielts/build-drill-sets.mjs   (nên chạy validate-drill-sets trước)
import fs from 'node:fs';
import path from 'node:path';

const base = path.resolve('src/data/drill-sets');
const TYPES = ['reading-tfng', 'reading-matching-headings', 'reading-summary-completion', 'reading-matching-info', 'reading-multiple-choice', 'listening-form-completion', 'listening-map-labelling', 'listening-matching'];
fs.mkdirSync(path.join(base, 'generated'), { recursive: true });
for (const t of TYPES) {
  const dir = path.join(base, 'raw', t);
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort() : [];
  const sets = files.map((f) => ({ id: `${t}-${f.replace('.json', '')}`, ...JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) }));
  fs.writeFileSync(path.join(base, 'generated', `${t}.json`), JSON.stringify(sets));
  console.log(t, sets.length, 'set');
}
