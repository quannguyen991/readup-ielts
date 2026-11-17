// Sinh nội dung luyện nói IELTS theo chủ điểm bằng hạn mức gói qua router cục bộ (AI_LOCAL_* trong .env.local).
//   - 24 chủ đề MỚI: đủ đề Part 1 (3 câu), cue card Part 2 (4 gợi ý), Part 3 (2 câu) + phần mở rộng.
//   - 16 chủ đề CÓ SẴN: chỉ sinh phần mở rộng (`extra`) bám đúng đề đang có.
// `extra`: vocab (8 cụm Band 7+), outlineVi (4 bước dàn ý), sample (bài mẫu Part 2), p1/p3 (đáp án mẫu), mistakesVi, p1More, p3More.
// Ghi từng chủ đề vào src/data/hub/speaking-raw/<id>.json; chạy lại thì bỏ qua cái đã có.
// Chạy: node scripts/hub/gen-speaking.mjs [--only id1,id2] [--workers 4]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const RAW = path.join(ROOT, 'src/data/hub/speaking-raw');
fs.mkdirSync(RAW, { recursive: true });
const arg = (n, d) => (process.argv.includes(n) ? process.argv[process.argv.indexOf(n) + 1] : d);
const ONLY = arg('--only', '').split(',').filter(Boolean);
const WORKERS = Number(arg('--workers', '4'));
const MODELS = ['ag/gemini-3.8-flash-high', 'cx/gpt-6-luna', 'ag/gemini-3.8-flash'];

const env = Object.fromEntries(
  fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8').split(/\r?\n/).filter((l) => l.includes('=') && !l.startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]; }),
);
const BASE = env.AI_LOCAL_BASE_URL.replace(/\/$/, '');
const KEY = env.AI_LOCAL_API_KEY;

/** Chủ đề mới: id, tên Anh, tên Việt. */
const NEW_TOPICS = [
  ['childhood', 'Childhood', 'Tuổi thơ'], ['festivals', 'Festivals', 'Lễ hội'], ['housing', 'Housing', 'Nhà ở'], ['clothes', 'Clothes and Fashion', 'Trang phục'],
  ['art', 'Art', 'Nghệ thuật'], ['transport', 'Transport', 'Giao thông'], ['neighbours', 'Neighbours', 'Hàng xóm'], ['sleep', 'Sleep', 'Giấc ngủ'],
  ['money', 'Money', 'Tiền bạc'], ['news', 'News', 'Tin tức'], ['museums', 'Museums', 'Bảo tàng'], ['photography', 'Photography', 'Nhiếp ảnh'],
  ['birthdays', 'Birthdays and Gifts', 'Sinh nhật và quà tặng'], ['language-learning', 'Language Learning', 'Học ngoại ngữ'], ['social-media', 'Social Media', 'Mạng xã hội'], ['advertising', 'Advertising', 'Quảng cáo'],
  ['nature', 'Nature and Parks', 'Thiên nhiên và công viên'], ['hobbies', 'Hobbies', 'Sở thích'], ['teachers', 'Teachers', 'Thầy cô'], ['science', 'Science', 'Khoa học'],
  ['safety', 'Safety and Crime', 'An toàn và tội phạm'], ['volunteering', 'Volunteering', 'Tình nguyện'], ['time-management', 'Time Management', 'Quản lý thời gian'], ['celebrities', 'Celebrities', 'Người nổi tiếng'],
];

const mod = fs.readFileSync(path.join(ROOT, 'src/data/hub/speaking-topics.ts'), 'utf8');
const existing = [];
for (const m of mod.matchAll(/id: '([a-z0-9-]+)',\s*title: '([^']+)',\s*titleVi: '([^']+)',\s*tipVi: '([^']+)',\s*part1: \[([^\]]*)\],\s*part2: \{\s*prompt: '([^']+)',\s*bullets: \[([^\]]*)\],?\s*\},\s*part3: \[([^\]]*)\]/g)) {
  const list = (s) => [...s.matchAll(/'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"/g)].map((x) => (x[1] ?? x[2]).replace(/\\'/g, "'"));
  existing.push({ id: m[1], title: m[2], titleVi: m[3], part1: list(m[5]), part2: { prompt: m[6], bullets: list(m[7]) }, part3: list(m[8]) });
}

async function ask(model, content) {
  const r = await fetch(`${BASE}/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${KEY}` },
    body: JSON.stringify({ model, messages: [{ role: 'user', content }], max_tokens: 9000 }),
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

const VI = /[ạảãàáâậầấẩẫăắằặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôộồốổỗơợờớởỡùúụủũưựừứửữỳýỵỷỹđ]/i;
const words = (s) => String(s).trim().split(/\s+/).filter(Boolean).length;
const isQ = (s) => typeof s === 'string' && s.trim().length > 8 && s.trim().endsWith('?');

const EXTRA_SPEC = `"extra": {
  "vocab": 8 objects {"en": a natural Band 7+ collocation, idiom or phrasal verb that fits this topic, "vi": short Vietnamese meaning, "ex": one natural English example sentence using it},
  "outlineVi": 4 strings: Vietnamese step-by-step plan for building the Part 2 answer (Mở đầu / Ý 1 / Ý 2 / Kết) with concrete content ideas for THIS cue card,
  "sample": a Band 8 model answer to the Part 2 cue card, first person, natural spoken English, 150-200 words, covering every bullet,
  "p1": 3 objects {"q": each Part 1 question in order, "a": model spoken answer, 25-45 words, direct answer + reason + short example},
  "p3": 2 objects {"q": each Part 3 question in order, "a": model answer, 50-80 words, opinion + reason + contrast or example + short conclusion},
  "mistakesVi": 3 strings: Vietnamese notes on typical mistakes Vietnamese learners make on THIS topic (vocabulary, grammar or structure),
  "p1More": 5 extra Part 1 questions on this topic (each ends with ?),
  "p3More": 4 extra Part 3 questions on this topic, more abstract and society-level (each ends with ?)
}`;

function promptFor(t, isNew) {
  if (isNew) {
    return `You are an expert IELTS Speaking examiner and coach writing practice material for Vietnamese learners.
Create ONE complete topic: "${t.title}" (Vietnamese name: ${t.titleVi}). Reply with ONE valid JSON object only, no markdown, with these keys:
"id": "${t.id}", "title": "${t.title}", "titleVi": "${t.titleVi}",
"tipVi": one Vietnamese sentence of practical advice for answering questions on this topic,
"part1": 3 short everyday questions (each ends with ?),
"part2": {"prompt": must start with "Describe " and be a realistic cue card about this topic, "bullets": 4 strings: first three start with who/what/where/when/how style prompts like "what it is", and the fourth starts with "and explain why" or "and say how" },
"part3": 2 abstract discussion questions that extend the Part 2 theme (each ends with ?),
${EXTRA_SPEC}
The exam-style questions must be original (not copied from any published test).`;
  }
  return `You are an expert IELTS Speaking examiner and coach writing practice material for Vietnamese learners.
Existing topic "${t.title}" (${t.titleVi}).
Part 1 questions: ${JSON.stringify(t.part1)}
Part 2 cue card: ${JSON.stringify(t.part2)}
Part 3 questions: ${JSON.stringify(t.part3)}
Reply with ONE valid JSON object only, no markdown, containing exactly this key and nothing else:
${EXTRA_SPEC}
The model answers must answer exactly the questions given above, in the same order.`;
}

function check(o, isNew) {
  const e = o?.extra;
  if (!e) return 'thiếu extra';
  if (isNew) {
    if (!Array.isArray(o.part1) || o.part1.length !== 3 || !o.part1.every(isQ)) return 'part1';
    if (!o.part2 || !/^Describe /.test(o.part2.prompt) || !Array.isArray(o.part2.bullets) || o.part2.bullets.length !== 4) return 'part2';
    if (!Array.isArray(o.part3) || o.part3.length !== 2 || !o.part3.every(isQ)) return 'part3';
    if (typeof o.tipVi !== 'string' || !VI.test(o.tipVi)) return 'tipVi';
  }
  if (!Array.isArray(e.vocab) || e.vocab.length !== 8 || !e.vocab.every((v) => v && v.en && v.vi && v.ex && words(v.ex) >= 4)) return 'vocab';
  if (!Array.isArray(e.outlineVi) || e.outlineVi.length !== 4 || !e.outlineVi.every((s) => typeof s === 'string' && VI.test(s) && s.length > 20)) return 'outlineVi';
  if (typeof e.sample !== 'string' || words(e.sample) < 120 || words(e.sample) > 240) return `sample ${words(e.sample)} từ`;
  if (!Array.isArray(e.p1) || e.p1.length !== 3 || !e.p1.every((x) => isQ(x.q) && words(x.a) >= 15 && words(x.a) <= 70)) return 'p1';
  if (!Array.isArray(e.p3) || e.p3.length !== 2 || !e.p3.every((x) => isQ(x.q) && words(x.a) >= 35 && words(x.a) <= 110)) return 'p3';
  if (!Array.isArray(e.mistakesVi) || e.mistakesVi.length !== 3 || !e.mistakesVi.every((s) => typeof s === 'string' && VI.test(s))) return 'mistakesVi';
  if (!Array.isArray(e.p1More) || e.p1More.length < 4 || !e.p1More.every(isQ)) return 'p1More';
  if (!Array.isArray(e.p3More) || e.p3More.length < 3 || !e.p3More.every(isQ)) return 'p3More';
  return null;
}

function parseObj(text) {
  const a = text.indexOf('{');
  const b = text.lastIndexOf('}');
  if (a < 0 || b < a) throw new Error('không có JSON');
  return JSON.parse(text.slice(a, b + 1));
}

async function doTopic(job) {
  const file = path.join(RAW, `${job.t.id}.json`);
  if (fs.existsSync(file)) return;
  let last = '';
  for (let round = 0; round < 3; round++) {
    for (const model of MODELS) {
      try {
        const out = parseObj(await ask(model, promptFor(job.t, job.isNew)));
        const bad = check(out, job.isNew);
        if (!bad) {
          const result = job.isNew ? out : { id: job.t.id, extra: out.extra };
          fs.writeFileSync(file, JSON.stringify(result, null, 1));
          console.log('ok', job.t.id, model);
          return;
        }
        last = `${model}: ${bad}`;
      } catch (err) {
        last = `${model}: ${String(err.message ?? err).slice(0, 100)}`;
      }
    }
  }
  console.log('FAIL', job.t.id, last);
}

const jobs = [
  ...NEW_TOPICS.map(([id, title, titleVi]) => ({ t: { id, title, titleVi }, isNew: true })),
  ...existing.map((t) => ({ t, isNew: false })),
].filter((j) => !ONLY.length || ONLY.includes(j.t.id));
console.log('chủ đề có sẵn đọc được:', existing.length, '· việc cần làm:', jobs.length);

let next = 0;
await Promise.all(Array.from({ length: WORKERS }, async () => {
  while (next < jobs.length) await doTopic(jobs[next++]);
}));
console.log('XONG');
