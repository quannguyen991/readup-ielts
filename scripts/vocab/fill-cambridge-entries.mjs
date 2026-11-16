// Soạn nghĩa, phiên âm, ví dụ cho từ Cambridge 10–21 còn thiếu (xem build-cambridge-entries.ts → tmp/cam-need-fill.json).
// Dùng hạn mức gói của người dùng qua router cục bộ (AI_LOCAL_BASE_URL / AI_LOCAL_API_KEY trong .env.local), KHÔNG dùng API trả phí.
// Hai cổng chạy xen kẽ: ag/gemini-3.8-flash và cx/gpt-5.6-luna. Kết quả ghi dần vào src/data/seed/vocab-cambridge/cam-fill.json,
// chạy lại thì bỏ qua từ đã có. Chạy: node scripts/vocab/fill-cambridge-entries.mjs [--limit N]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const FILL_PATH = path.join(ROOT, 'src/data/seed/vocab-cambridge/cam-fill.json');
const NEED_PATH = path.join(ROOT, 'tmp/cam-need-fill.json');
const LIMIT = Number(process.argv[process.argv.indexOf('--limit') + 1]) || Infinity;
const MODELS = ['ag/gemini-3.8-flash', 'cx/gpt-6-luna', 'ag/gemini-3.8-flash-high'];

const env = Object.fromEntries(
  fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8').split(/\r?\n/).filter((l) => l.includes('=') && !l.startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]; }),
);
const BASE = env.AI_LOCAL_BASE_URL.replace(/\/$/, '');
const KEY = env.AI_LOCAL_API_KEY;

const norm = (s) => s.normalize('NFKC').toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();
const VI = /[ạảãàáâậầấẩẫăắằặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôộồốổỗơợờớởỡùúụủũưựừứửữỳýỵỷỹđ]/i;
const POS = new Set(['noun', 'verb', 'adjective', 'adverb', 'preposition', 'phrase', 'phrasal verb', 'idiom', 'abbreviation', 'numeral', 'conjunction', 'determiner', 'pronoun']);

async function ask(model, content) {
  const r = await fetch(`${BASE}/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${KEY}` },
    body: JSON.stringify({ model, messages: [{ role: 'user', content }], max_tokens: 6000 }),
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

function fullPrompt(words) {
  const list = words.map((w, i) => `${i + 1}. ${w}`).join('\n');
  return `Bạn là biên tập viên từ điển cho app học IELTS của người Việt. Với MỖI mục trong danh sách (từ hoặc cụm từ lấy từ bài đọc IELTS Reading), trả về một phần tử JSON.
CHỈ trả về một mảng JSON hợp lệ, không markdown, không giải thích.
Mỗi phần tử có đúng các khóa:
- "w": mục gốc, chép y nguyên.
- "ipa": phiên âm IPA kiểu Anh-Anh, đặt trong dấu gạch chéo, ví dụ "/ˈheɪdeɪ/".
- "pos": một trong noun, verb, adjective, adverb, preposition, conjunction, phrase, phrasal verb, idiom, abbreviation.
- "vi": nghĩa tiếng Việt ngắn gọn, tự nhiên, tối đa 8 từ, chọn nghĩa hay gặp nhất trong văn bản học thuật.
- "en": định nghĩa tiếng Anh ngắn kiểu từ điển học viên, tối đa 15 từ, không dùng lại chính mục từ.
- "ex": MỘT câu ví dụ tiếng Anh MỚI do bạn tự viết, 8 đến 18 từ, tự nhiên, chứa đúng mục từ (giữ nguyên dạng chữ; nếu mục có "sth", "sb", "smt" thì thay bằng danh từ cụ thể trong câu).
- "syn": mảng 0 đến 3 từ đồng nghĩa tiếng Anh.
Danh sách:
${list}`;
}

function extrasPrompt(items) {
  const list = items.map((it, i) => `${i + 1}. ${it.w} | nghĩa: ${it.vi}${it.needIpa ? '' : ' | đã có phiên âm'}`).join('\n');
  return `Bạn là biên tập viên từ điển cho app học IELTS của người Việt. Mỗi mục dưới đây đã có nghĩa tiếng Việt; hãy bổ sung phần còn thiếu.
CHỈ trả về một mảng JSON hợp lệ, không markdown, không giải thích. Mỗi phần tử có các khóa:
- "w": mục gốc, chép y nguyên.
- "ipa": phiên âm IPA kiểu Anh-Anh trong dấu gạch chéo (bắt buộc cho mọi mục).
- "ex": MỘT câu ví dụ tiếng Anh MỚI tự viết, 8 đến 18 từ, tự nhiên, đúng nghĩa đã cho, chứa đúng mục từ (giữ nguyên dạng chữ; "sth", "sb", "smt" thay bằng danh từ cụ thể).
Danh sách:
${list}`;
}

function parseArray(text) {
  const a = text.indexOf('[');
  const b = text.lastIndexOf(']');
  if (a < 0 || b < a) throw new Error('không có mảng JSON');
  return JSON.parse(text.slice(a, b + 1));
}

function checkFull(row) {
  const vi = String(row.vi ?? '').trim();
  const en = String(row.en ?? '').trim();
  const ipa = String(row.ipa ?? '').trim();
  const ex = String(row.ex ?? '').trim();
  if (!vi || vi.length > 90 || (!VI.test(vi) && !/^[a-z ]{1,12}$/i.test(vi))) return null;
  if (!ipa.startsWith('/') || !ipa.endsWith('/') || ipa.length < 3 || ipa.length > 70 || VI.test(ipa)) return null;
  if (!en || en.length > 160 || VI.test(en)) return null;
  const n = ex.split(/\s+/).length;
  if (!ex || n < 4 || n > 30 || VI.test(ex)) return null;
  const pos = String(row.pos ?? '').trim().toLowerCase();
  const syn = Array.isArray(row.syn) ? [...new Set(row.syn.map((s) => String(s).trim()).filter((s) => s && !VI.test(s) && s.length < 30 && norm(s) !== norm(String(row.w ?? ''))))].slice(0, 3) : [];
  return { pos: POS.has(pos) ? pos : 'phrase', ipa, meaningVi: vi, definitionEn: en, example: ex, ...(syn.length ? { synonyms: syn } : null) };
}

function checkExtras(row, need) {
  const ipa = String(row.ipa ?? '').trim();
  const ex = String(row.ex ?? '').trim();
  const out = {};
  if (need.needIpa) {
    if (!ipa.startsWith('/') || !ipa.endsWith('/') || ipa.length < 3 || ipa.length > 70 || VI.test(ipa)) return null;
    out.ipa = ipa;
  }
  if (need.needEx) {
    const n = ex.split(/\s+/).length;
    if (!ex || n < 4 || n > 30 || VI.test(ex)) return null;
    out.example = ex;
  }
  return out;
}

const fill = fs.existsSync(FILL_PATH) ? JSON.parse(fs.readFileSync(FILL_PATH, 'utf8')) : {};
const save = () => fs.writeFileSync(FILL_PATH, JSON.stringify(fill));
const need = JSON.parse(fs.readFileSync(NEED_PATH, 'utf8'));
const entries = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/seed/vocab-cambridge/entries.json'), 'utf8'));

const fullTodo = need.needMeaning.filter((w) => !fill[w]?.meaningVi).slice(0, LIMIT);
const extraTodo = need.needExtras
  .filter((w) => entries[w])
  .map((w) => ({ w, vi: entries[w][3], needIpa: !entries[w][0] && !fill[w]?.ipa, needEx: !entries[w][4] && !fill[w]?.example }))
  .filter((it) => it.needIpa || it.needEx)
  .slice(0, LIMIT);
console.log(`cần soạn đủ: ${fullTodo.length} từ; cần bổ sung ví dụ/phiên âm: ${extraTodo.length} từ`);

const queue = [];
for (let i = 0; i < fullTodo.length; i += 25) queue.push({ kind: 'full', items: fullTodo.slice(i, i + 25), tries: 0 });
for (let i = 0; i < extraTodo.length; i += 40) queue.push({ kind: 'extra', items: extraTodo.slice(i, i + 40), tries: 0 });

let done = 0;
let failedWords = 0;
async function worker(model, id) {
  let cooldown = 0;
  while (queue.length) {
    const batch = queue.shift();
    if (cooldown) await new Promise((r) => setTimeout(r, cooldown));
    const t0 = Date.now();
    try {
      const prompt = batch.kind === 'full' ? fullPrompt(batch.items) : extrasPrompt(batch.items);
      const rows = parseArray(await ask(model, prompt));
      const byWord = new Map(rows.map((r) => [norm(String(r.w ?? '')), r]));
      const redo = [];
      let ok = 0;
      for (const it of batch.items) {
        const w = batch.kind === 'full' ? it : it.w;
        const row = byWord.get(norm(w));
        const checked = row ? (batch.kind === 'full' ? checkFull(row) : checkExtras(row, it)) : null;
        if (checked) { fill[w] = { ...(fill[w] ?? {}), ...checked }; ok++; } else redo.push(it);
      }
      save();
      done += ok;
      console.log(`[${id}] ${model} ${batch.kind} ${ok}/${batch.items.length} ok, ${Math.round((Date.now() - t0) / 1000)}s, tổng ${done}, còn ${queue.length} lô`);
      if (redo.length) {
        if (batch.tries < 3) queue.push({ kind: batch.kind, items: redo, tries: batch.tries + 1 });
        else failedWords += redo.length;
      }
      cooldown = 0;
    } catch (e) {
      console.log(`[${id}] ${model} lỗi: ${String(e.message).slice(0, 120)}`);
      if (batch.tries < 4) queue.push({ ...batch, tries: batch.tries + 1 });
      else failedWords += batch.items.length;
      cooldown = Math.min(60000, (cooldown || 5000) * 2);
    }
  }
}

await Promise.all(MODELS.map((m, i) => worker(m, i)));
console.log(`xong: ${done} mục ghi vào cam-fill.json, ${failedWords} mục không qua luật kiểm`);
