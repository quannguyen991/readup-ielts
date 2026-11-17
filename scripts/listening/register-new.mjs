// Đưa các đề Listening mới (.local-private/listening-new/band9-listening-NN.json) vào app, hai bước:
//   node scripts/listening/register-new.mjs --manifest   thêm các section vào .listening-manifest.json (để tạo giọng Sarah/Adam)
//   node scripts/listening/register-new.mjs --install     chép đề vào src/data/listening-tests, khai báo trong index.ts,
//                                                         đặt durationSec theo bản Sarah đã tạo; chỉ nhận đề có ĐỦ 4 section Sarah.
// Tạo giọng: python scripts/audio/gen_kokoro_clips.py --voice sarah --kind listening   (xem SHARD/MANIFEST trong script đó)
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..', '..');
const NEW = path.join(ROOT, '.local-private', 'listening-new');
const MANIFEST = path.join(ROOT, '.listening-manifest.json');
const DATA = path.join(ROOT, 'src', 'data', 'listening-tests');
const mode = process.argv[2];

const ids = fs.readdirSync(NEW).filter((f) => /^band9-listening-\d+\.json$/.test(f)).map((f) => f.replace('.json', '')).sort();
const readJson = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const writeLikeRepo = (f, obj) => fs.writeFileSync(f, JSON.stringify(obj, null, 1).replace(/\n/g, '\r\n'));

if (mode === '--manifest') {
  const m = readJson(MANIFEST);
  const have = new Set(m.sections.map((s) => `${s.test}#${s.n}`));
  let added = 0;
  for (const id of ids) {
    for (const s of readJson(path.join(NEW, `${id}.json`)).sections) {
      if (have.has(`${id}#${s.n}`)) continue;
      m.sections.push({ test: id, n: s.n, lines: s.transcript.map((l) => l.text) });
      added++;
    }
  }
  fs.writeFileSync(MANIFEST, JSON.stringify(m));
  console.log(`manifest: thêm ${added} section, tổng ${m.sections.length}`);
} else if (mode === '--install') {
  const ready = [];
  for (const id of ids) {
    const t = readJson(path.join(NEW, `${id}.json`));
    const dir = path.join(ROOT, 'public', 'listening', id, 'sarah');
    const ok = t.sections.every((s) => fs.existsSync(path.join(dir, `s${s.n}.mp3`)) && fs.existsSync(path.join(dir, `s${s.n}.timings.json`)));
    if (!ok) { console.log(`bỏ qua ${id}: chưa đủ 4 section Sarah`); continue; }
    for (const s of t.sections) {
      const tm = readJson(path.join(dir, `s${s.n}.timings.json`));
      if (tm.timings.length !== s.transcript.length) throw new Error(`${id} s${s.n}: mốc thời gian lệch số câu`);
      s.durationSec = Math.round(tm.durationSec);
    }
    writeLikeRepo(path.join(DATA, `${id}.json`), t);
    ready.push(id);
  }
  // index.ts: thêm import + phần tử mảng cho các đề chưa có (idempotent)
  const indexPath = path.join(DATA, 'index.ts');
  let src = fs.readFileSync(indexPath, 'utf8');
  const nl = src.includes('\r\n') ? '\r\n' : '\n';
  for (const id of ready) {
    const name = id.replace(/-(\w)/g, (_, c) => c.toUpperCase());
    if (src.includes(`'./${id}.json'`)) continue;
    src = src.replace(`import { ORIGINAL_TOPIC_TESTS }`, `import ${name} from './${id}.json';${nl}import { ORIGINAL_TOPIC_TESTS }`);
    src = src.replace(`  ...(SHOW_TEMPLATE_TOPICS ? ORIGINAL_TOPIC_TESTS : []),`, `  ${name} as ListeningTest,${nl}  ...(SHOW_TEMPLATE_TOPICS ? ORIGINAL_TOPIC_TESTS : []),`);
  }
  fs.writeFileSync(indexPath, src);
  console.log(`đã cài ${ready.length}/${ids.length} đề: ${ready.join(', ')}`);
} else {
  console.log('dùng: --manifest | --install');
}
