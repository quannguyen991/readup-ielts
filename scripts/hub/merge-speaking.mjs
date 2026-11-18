// Gộp src/data/hub/speaking-raw/*.json thành:
//   speaking-topics-new.json  — 24 chủ đề mới (không kèm extra)
//   speaking-extra.json       — { id: extra } cho mọi chủ đề (mới và có sẵn)
// Chạy: node scripts/hub/merge-speaking.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const RAW = path.join(ROOT, 'src/data/hub/speaking-raw');
const OUT = path.join(ROOT, 'src/data/hub');

const topics = [];
const extra = {};
for (const f of fs.readdirSync(RAW).filter((x) => x.endsWith('.json')).sort()) {
  const o = JSON.parse(fs.readFileSync(path.join(RAW, f), 'utf8'));
  extra[o.id] = o.extra;
  if (o.part1) {
    const { extra: _e, ...base } = o;
    topics.push(base);
  }
}
fs.writeFileSync(path.join(OUT, 'speaking-topics-new.json'), JSON.stringify(topics, null, 1));
fs.writeFileSync(path.join(OUT, 'speaking-extra.json'), JSON.stringify(extra, null, 1));
console.log('chủ đề mới', topics.length, '· extra', Object.keys(extra).length);
