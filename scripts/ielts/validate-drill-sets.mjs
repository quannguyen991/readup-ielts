// Kiểm bộ đề luyện theo dạng: node scripts/ielts/validate-drill-sets.mjs [typeId]
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('src/data/drill-sets/raw');
const only = process.argv[2];
const TFNG = ['TRUE', 'FALSE', 'NOT GIVEN'];
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9' -]/g, ' ').replace(/\s+/g, ' ').trim();
let bad = 0;
const err = (f, m) => { bad++; console.log(`✗ ${f}: ${m}`); };

for (const typeId of fs.readdirSync(root)) {
  if (only && typeId !== only) continue;
  const dir = path.join(root, typeId);
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
  if (files.length !== 10) err(typeId, `cần 10 set, có ${files.length}`);
  for (const file of files) {
    const f = `${typeId}/${file}`;
    let set;
    try { set = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8')); } catch (e) { err(f, 'JSON hỏng ' + e.message); continue; }
    if (!set.title || !set.topic) err(f, 'thiếu title/topic');
    const qs = set.questions || [];
    if (qs.length !== 20) err(f, `cần 20 câu, có ${qs.length}`);
    const counts = {};
    const prompts = new Set();
    qs.forEach((q, i) => {
      const id = `${f}#${i + 1}`;
      if (!q.prompt || !q.answer || !q.why) return err(id, 'thiếu prompt/answer/why');
      if (prompts.has(q.prompt)) err(id, 'trùng prompt');
      prompts.add(q.prompt);
      const ctx = q.context || set.context || '';
      if (!ctx || ctx.length < 40) err(id, 'thiếu context');
      let options = q.options || set.options;
      if (typeId === 'reading-tfng') options = TFNG;
      if (options) {
        if (!options.includes(q.answer)) err(id, `answer "${q.answer}" không nằm trong options`);
        if (new Set(options).size !== options.length) err(id, 'options trùng nhau');
        counts[q.answer] = (counts[q.answer] || 0) + 1;
      } else {
        const alts = q.answer.split('|').map((s) => s.trim());
        const words = alts[0].split(/\s+/).length;
        if (words > 3) err(id, `đáp án ${words} từ (tối đa 3)`);
        if (typeId === 'reading-summary-completion' && !norm(ctx).includes(norm(alts[0]))) err(id, `đáp án "${alts[0]}" không có nguyên văn trong bài`);
        if (!/_{3,}/.test(q.prompt)) err(id, 'prompt thiếu chỗ trống ____');
      }
    });
    if (counts && typeId === 'reading-tfng') for (const k of TFNG) if ((counts[k] || 0) < 5) err(f, `quá ít đáp án ${k}: ${counts[k] || 0}`);
    if (typeId === 'reading-multiple-choice') for (const [k, v] of Object.entries(counts)) if (v > 9) err(f, `đáp án "${k}" chiếm ${v}/20`);
  }
}
console.log(bad ? `\n${bad} lỗi` : '✓ hợp lệ');
process.exit(bad ? 1 : 0);
