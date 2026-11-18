// Sinh lời giải 3 bước cho từng câu của mọi set luyện Reading/Listening (kiểu "Giải thích đáp án" của YouPass):
//   u = Bước 1 · Hiểu câu hỏi (tiếng Việt)
//   k = Bước 2 · Tìm keyword được paraphrase: [{ q: cụm trong câu hỏi, p: cụm tương ứng trong bài (nguyên văn), n: ghi chú }]
//   c = Bước 3 · So sánh và đối chiếu (tiếng Việt, nêu bẫy và vì sao lựa chọn khác sai)
// Dùng hạn mức gói qua router cục bộ (AI_LOCAL_* trong .env.local). Ghi từng set vào src/data/drill-sets/explain-raw/<dạng>/NN.json
// rồi gộp thành explain/<dạng>.json. Chạy lại thì bỏ qua set đã có. Chạy: node scripts/ielts/gen-drill-explain.mjs [--types a,b]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const GEN = path.join(ROOT, 'src/data/drill-sets/generated');
const RAWX = path.join(ROOT, 'src/data/drill-sets/explain-raw');
const OUT = path.join(ROOT, 'src/data/drill-sets/explain');
const ONLY = (process.argv.includes('--types') ? process.argv[process.argv.indexOf('--types') + 1] : '').split(',').filter(Boolean);
const MODELS = ['ag/gemini-3.8-flash-high', 'cx/gpt-6-luna', 'ag/gemini-3.8-flash'];

const env = Object.fromEntries(
  fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8').split(/\r?\n/).filter((l) => l.includes('=') && !l.startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]; }),
);
const BASE = env.AI_LOCAL_BASE_URL.replace(/\/$/, '');
const KEY = env.AI_LOCAL_API_KEY;

async function ask(model, content) {
  const r = await fetch(`${BASE}/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${KEY}` },
    body: JSON.stringify({ model, messages: [{ role: 'user', content }], max_tokens: 14000 }),
  });
  const text = await r.text();
  if (text.startsWith('data:')) {
    let out = '';
    for (const line of text.split('\n')) {
      if (!line.startsWith('data:') || line.includes('[DONE]')) continue;
      try { const j = JSON.parse(line.slice(5)); out += j.choices?.[0]?.delta?.content ?? j.choices?.[0]?.message?.content ?? ''; } catch { /* bỏ dòng hỏng */ }
    }
    return out;
  }
  const j = JSON.parse(text);
  if (j.error) throw new Error(String(j.error.message ?? j.error).slice(0, 160));
  return j.choices?.[0]?.message?.content ?? '';
}

const sq = (s) => String(s ?? '').normalize('NFKC').toLowerCase().replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/[^a-z0-9£$%]/g, '');
const VI = /[ạảãàáâậầấẩẫăắằặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôộồốổỗơợờớởỡùúụủũưựừứửữỳýỵỷỹđ]/i;

function prompt(typeId, set) {
  const ctx = set.context ? `TEXT:\n${set.context}\n` : '';
  const qs = set.questions.map((q, i) => {
    const opts = q.options ?? set.options;
    return `${i + 1}. ${q.prompt}${q.context ? `\n   [paragraph] ${q.context}` : ''}${opts ? `\n   Options: ${opts.join(' | ')}` : ''}\n   CORRECT ANSWER: ${q.answer}\n   EVIDENCE: "${q.quote ?? ''}"`;
  }).join('\n');
  return `Bạn là giáo viên IELTS giỏi, viết lời giải chi tiết kiểu "Giải thích đáp án" cho học viên Việt Nam (dạng bài: ${typeId}).
Với MỖI câu dưới đây, viết một lời giải 3 bước. CHỈ trả về một mảng JSON hợp lệ có đúng ${set.questions.length} phần tử, theo thứ tự câu, không markdown, mỗi phần tử có các khóa:
- "u": Bước 1 · Hiểu câu hỏi. Tiếng Việt, 1-2 câu: câu hỏi/nhận định nghĩa là gì và cần tìm thông tin gì trong bài (dịch nghĩa sát, nêu điều cần kiểm tra).
- "k": Bước 2 · Tìm keyword được paraphrase. Mảng 1-3 phần tử {"q": cụm tiếng Anh trong câu hỏi, "p": cụm tiếng Anh tương ứng trong bài (PHẢI chép nguyên văn từ TEXT hoặc EVIDENCE), "n": ghi chú tiếng Việt ngắn: quan hệ paraphrase (đồng nghĩa, trái nghĩa, nâng/hạ mức độ, thêm/bớt thông tin)}.
- "c": Bước 3 · So sánh và đối chiếu. Tiếng Việt, 2-4 câu: đối chiếu từng ý của câu hỏi với bài, kết luận vì sao đáp án đúng, và chỉ ra bẫy hoặc vì sao các lựa chọn/nhãn khác sai (với TRUE/FALSE/NOT GIVEN nêu rõ ý nào khớp, mâu thuẫn hay không được nhắc).
Giữ nội dung chính xác theo CORRECT ANSWER và EVIDENCE đã cho; không đổi đáp án.

${ctx}
QUESTIONS:
${qs}`;
}

function check(set, arr) {
  if (!Array.isArray(arr) || arr.length !== set.questions.length) return { ok: [], bad: set.questions.map((_, i) => i) };
  const pool = sq([set.context ?? '', ...set.questions.map((q) => `${q.context ?? ''} ${q.quote ?? ''}`)].join(' '));
  const ok = []; const bad = [];
  arr.forEach((e, i) => {
    const good = e && typeof e.u === 'string' && VI.test(e.u) && e.u.length > 15 && typeof e.c === 'string' && VI.test(e.c) && e.c.length > 40
      && Array.isArray(e.k) && e.k.length >= 1 && e.k.length <= 4
      && e.k.every((k) => k && typeof k.q === 'string' && typeof k.p === 'string' && k.p.length > 1 && pool.includes(sq(k.p)) && typeof k.n === 'string');
    if (good) ok.push(i); else bad.push(i);
  });
  return { ok, bad };
}

function parseArray(text) {
  const a = text.indexOf('[');
  const b = text.lastIndexOf(']');
  if (a < 0 || b < a) throw new Error('không có mảng JSON');
  return JSON.parse(text.slice(a, b + 1));
}

function merge(typeId) {
  const dir = path.join(RAWX, typeId);
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
  const bySet = {};
  for (const f of files) bySet[f.replace('.json', '')] = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, `${typeId}.json`), JSON.stringify(bySet));
}

const jobs = [];
for (const f of fs.readdirSync(GEN)) {
  const typeId = f.replace('.json', '');
  if (ONLY.length && !ONLY.includes(typeId)) continue;
  const sets = JSON.parse(fs.readFileSync(path.join(GEN, f), 'utf8'));
  sets.forEach((set, i) => {
    const num = String(i + 1).padStart(2, '0');
    const file = path.join(RAWX, typeId, `${num}.json`);
    if (!fs.existsSync(file)) jobs.push({ typeId, set, num, file });
  });
}
console.log(`${jobs.length} set cần lời giải`);

let done = 0; let partial = 0;
async function worker(k) {
  while (jobs.length) {
    const job = jobs.shift();
    let best = null; let bestOk = -1;
    for (let attempt = 0; attempt < 3; attempt++) {
      const model = MODELS[(k + attempt) % MODELS.length];
      try {
        const arr = parseArray(await ask(model, prompt(job.typeId, job.set)));
        const { ok } = check(job.set, arr);
        if (ok.length > bestOk) { bestOk = ok.length; best = job.set.questions.map((_, i) => (ok.includes(i) ? arr[i] : null)); }
        if (ok.length === job.set.questions.length) break;
      } catch (e) {
        console.log(`  ${job.typeId}-${job.num} thử ${attempt + 1} lỗi: ${String(e.message).slice(0, 90)}`);
      }
    }
    if (best && bestOk >= Math.ceil(job.set.questions.length * 0.8)) {
      fs.mkdirSync(path.dirname(job.file), { recursive: true });
      fs.writeFileSync(job.file, JSON.stringify(best));
      merge(job.typeId);
      done++; if (bestOk < job.set.questions.length) partial++;
      console.log(`[${k}] ${job.typeId}/${job.num}: ${bestOk}/${job.set.questions.length} câu đạt, xong ${done}, còn ${jobs.length}`);
    } else {
      console.log(`[${k}] BỎ ${job.typeId}/${job.num}: chỉ ${bestOk} câu đạt`);
    }
  }
}
await Promise.all([...MODELS, ...MODELS].map((_, k) => worker(k)));
console.log(`xong: ${done} set (${partial} set còn vài câu dùng lời giải ngắn)`);
