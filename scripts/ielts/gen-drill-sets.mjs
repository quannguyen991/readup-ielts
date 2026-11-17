// Sinh bộ đề luyện theo dạng cho các dạng Reading/Listening còn thiếu, qua router cục bộ (hạn mức gói của người dùng).
// Khuôn: AI sinh → luật máy kiểm (bằng chứng phải nằm trong bài, đáp án thuộc phương án, phân bố nhãn) → MỘT MÔ HÌNH KHÁC làm bài
// mù, câu nào làm khác đáp án thì bỏ → ghi vào src/data/drill-sets/raw/<dạng>/NN.json. Chạy lại thì bỏ qua set đã có.
// Chạy: node scripts/ielts/gen-drill-sets.mjs [--types a,b] [--sets N]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const RAW = path.join(ROOT, 'src/data/drill-sets/raw');
const arg = (name, def) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : def; };
const SETS = Number(arg('--sets', 6));
const ONLY = arg('--types', '').split(',').filter(Boolean);
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
    body: JSON.stringify({ model, messages: [{ role: 'user', content }], max_tokens: 12000 }),
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

const TOPICS = [
  'urban beekeeping', 'the history of the bicycle', 'sleep and memory', 'microplastics in oceans', 'the decline of handwriting',
  'tidal energy', 'the psychology of colour', 'ancient Roman roads', 'language extinction', 'vertical farming',
  'the invention of the printing press', 'migratory birds and light pollution', 'coffee and global trade', 'bilingual education',
  'earthquake-resistant buildings', 'the economics of public libraries', 'desert plants and water', 'the rise of remote work',
  'glass-making through history', 'volcanic soil and agriculture', 'children and screen time', 'the science of laughter',
  'railways and the growth of cities', 'honeybee communication', 'cold-water coral reefs', 'noise in open-plan offices',
  'the spread of the potato', 'wearable health devices', 'medieval universities', 'recycling in small island nations',
  'the Silk Road', 'the biology of hibernation', 'street trees and city temperature', 'the history of timekeeping',
  'museum audio guides', 'fog harvesting', 'the origins of chess', 'community gardens', 'night-shift work and health',
  'artificial reefs', 'sand and construction', 'the return of wolves to forests', 'paper-making', 'public transport pricing',
  'bamboo as a building material', 'the study of dreams', 'ice cores and climate history', 'volunteer tourism', 'cheese-making heritage',
  'the lifespan of bridges', 'urban foxes', 'university lecture formats', 'tropical fruit exports', 'wind farms and wildlife',
  'the history of the postal service', 'salt marshes and flood defence', 'learning musical instruments as an adult', 'lighthouses', 'rainwater harvesting',
];

const READ_RULES = 'The passage must be ORIGINAL (do not copy any real text), factually plausible, academic in register, 520-650 words, split into paragraphs labelled A, B, C, D, E, F (start each paragraph with its capital letter and a period, e.g. "A. ...").';
const LISTEN_RULES = 'The script must be ORIGINAL and natural spoken English of 620-760 words, written as lines "Speaker: text" (one speaker per line; the first line is "Narrator: ..." introducing the situation). Use 2 sections (a first short conversation/announcement then a longer talk or discussion). Numbers, spellings and names must be spoken exactly as they would be said.';

const TYPES = [
  {
    id: 'reading-ynng', skill: 'reading', fixed: ['YES', 'NO', 'NOT GIVEN'],
    task: `Write an argumentative/discursive article in which the writer clearly expresses views and also reports other people's opinions. ${READ_RULES}
Then write 20 statements about the WRITER'S views or claims, in the order the ideas appear. Label each YES (the statement agrees with the writer's view), NO (it contradicts the writer's view) or NOT GIVEN (it is impossible to say what the writer thinks). Aim for about 7 YES, 7 NO, 6 NOT GIVEN. "answer" must be exactly "YES", "NO" or "NOT GIVEN". For NOT GIVEN the "quote" must be the nearest sentence on the same topic that does not settle the point. Prompts are plain statements, do not include the label list.`,
  },
  {
    id: 'reading-matching-features', skill: 'reading', setOptions: true,
    task: `Write an article that presents the work, claims or theories of FIVE named people (e.g. "Dr Maria Lopez, a marine ecologist") or five named groups. ${READ_RULES}
Set "options" to the five names as ["A. Dr Maria Lopez", "B. ...", ...] (letter, full stop, name). Then write 20 statements (paraphrased, never copied word for word) each of which matches exactly ONE of the five; every option must be used at least 3 times. "answer" must be exactly one of the option strings; "quote" is the supporting sentence in the passage. Statements follow no fixed order.`,
  },
  {
    id: 'reading-matching-endings', skill: 'reading', perQuestionOptions: 5,
    task: `Write an article rich in cause-effect, comparison and condition statements. ${READ_RULES}
Then write 20 sentence BEGINNINGS (prompt) that can be finished by information from the passage, in passage order. For each give "options": FIVE candidate endings (grammatically fitting the beginning, only one correct according to the passage; the others plausible but wrong or not supported) and "answer" = the exact text of the correct ending. Do not use letters in options.`,
  },
  {
    id: 'reading-sentence-completion', skill: 'reading', typed: true,
    task: `Write an informative article. ${READ_RULES}
Then write 20 sentences that paraphrase information in the passage, in passage order, each with ONE blank written as "____" to be completed with NO MORE THAN THREE WORDS taken exactly from the passage. "answer" is the exact words from the passage (1-3 words, or a number); if a second form is acceptable add it after " | ". The sentence must not already contain the answer.`,
  },
  {
    id: 'reading-table-flow-completion', skill: 'reading', typed: true,
    task: `Write an informative article describing a process or comparing several things (stages, materials, regions, methods). ${READ_RULES}
Then write 20 prompts that look like cells of a table, notes or flow-chart boxes, in passage order, e.g. "Stage 2 | Material used: ____" or "Notes - Step 3: workers ____ the surface". Each has ONE blank to be completed with NO MORE THAN THREE WORDS taken exactly from the passage. "answer" is the exact words (1-3 words or a number); optional alternative after " | ".`,
  },
  {
    id: 'reading-short-answer', skill: 'reading', typed: true,
    task: `Write an informative article full of facts, names, dates, numbers and places. ${READ_RULES}
Then write 20 direct questions ("What ...?", "Which ...?", "How many ...?", "Who ...?"), in passage order, to be answered with NO MORE THAN THREE WORDS AND/OR A NUMBER taken from the passage. "answer" is the exact words (optional alternative after " | ").`,
  },
  {
    id: 'listening-mcq', skill: 'listening', perQuestionOptions: 3,
    task: `Write the script of a conversation or talk. ${LISTEN_RULES}
Then write 20 multiple-choice questions (three options each, as plain text WITHOUT letters) in the order the information is spoken. The correct option must be supported by the script; wrong options must use words that actually occur in the script as distractors (speaker changes mind, corrects a figure, mentions something that did not happen). "answer" = exact text of the correct option. Mix the position of the correct option.`,
  },
  {
    id: 'listening-sentence-completion', skill: 'listening', typed: true,
    task: `Write the script of a lecture or guided tour with a speaker and short interruptions. ${LISTEN_RULES}
Then write 20 sentences summarising what is said, in spoken order, each with ONE blank "____" to be completed with NO MORE THAN THREE WORDS AND/OR A NUMBER heard in the script. "answer" is exactly what the speaker says (numbers as digits); optional alternative after " | ". The sentence must not contain the answer.`,
  },
  {
    id: 'listening-table-completion', skill: 'listening', typed: true,
    task: `Write the script of a conversation or talk that gives information about several options (courses, tours, products, schedules). ${LISTEN_RULES}
Then write 20 prompts that look like cells of a table, notes or flow-chart boxes, in spoken order, e.g. "Course B | Cost per term: £____" or "Notes - Step 2: collect ____". Each has ONE blank to be completed with NO MORE THAN THREE WORDS AND/OR A NUMBER heard in the script. "answer" is exactly what is said (digits for numbers); optional alternative after " | ".`,
  },
  {
    id: 'listening-short-answer', skill: 'listening', typed: true,
    task: `Write the script of a discussion between two students and a tutor about a project. ${LISTEN_RULES}
Then write 20 direct questions in spoken order to be answered with NO MORE THAN THREE WORDS AND/OR A NUMBER heard in the script. "answer" is exactly what is said (optional alternative after " | ").`,
  },
];

function buildPrompt(t, topic, idx) {
  const opts = t.setOptions ? '\n- "options": the set-level option list described above.' : '';
  const perQ = t.perQuestionOptions ? `\n- every question has "options": an array of ${t.perQuestionOptions} strings (one is the answer).` : '';
  return `You are an experienced IELTS item writer. Create ONE complete practice set for the question type "${t.id}".
Topic: ${topic} (set ${idx}).
${t.task}

Return ONLY a JSON object (no markdown) with this shape:
{"title": "<short English title>", "topic": "<short English topic phrase>", "context": "<the full passage or full script>",${t.setOptions ? ' "options": [...],' : ''} "questions": [20 objects]}
Each question object has: "prompt" (English), "answer", "why" (explanation in VIETNAMESE, 1-3 sentences saying exactly why this is the answer and, when useful, which trap the wrong choices fall into), "quote" (an exact, contiguous quotation copied from "context" that proves the answer; 6-30 words)${perQ ? ',' + perQ.replace('\n- ', ' ') : ''}.${opts}
Rules: exactly 20 questions; questions must be answerable ONLY from the context; never put the answer inside the prompt; "quote" MUST be copied character for character from "context".`;
}

const norm = (s) => String(s ?? '').normalize('NFKC').toLowerCase().replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/[^a-z0-9£$%]/g, '');
const VI = /[ạảãàáâậầấẩẫăắằặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôộồốổỗơợờớởỡùúụủũưựừứửữỳýỵỷỹđ]/i;

function parseObject(text) {
  const a = text.indexOf('{');
  const b = text.lastIndexOf('}');
  if (a < 0 || b < a) throw new Error('không có JSON');
  return JSON.parse(text.slice(a, b + 1));
}

/** Luật máy: trả về mảng lỗi; rỗng là qua. Câu hỏng được trả về trong `bad` để bỏ riêng. */
function check(t, set) {
  const errs = [];
  const bad = new Set();
  const ctx = String(set.context ?? '');
  const words = ctx.split(/\s+/).length;
  if (t.skill === 'reading' && (words < 430 || words > 760)) errs.push(`bài đọc ${words} từ`);
  if (t.skill === 'listening' && (words < 480 || words > 900)) errs.push(`kịch bản ${words} từ`);
  if (!Array.isArray(set.questions) || set.questions.length < 18) { errs.push('thiếu câu'); return { errs, bad }; }
  if (t.setOptions && (!Array.isArray(set.options) || set.options.length < 4)) errs.push('thiếu options của set');
  const nctx = norm(ctx);
  const seenPrompt = new Set();
  const labelCount = {};
  set.questions.forEach((q, i) => {
    const fail = (m) => { errs.push(`#${i + 1} ${m}`); bad.add(i); };
    if (!q.prompt || !q.answer || !q.why || !q.quote) return fail('thiếu trường');
    if (!VI.test(q.why)) return fail('why không phải tiếng Việt');
    if (!nctx.includes(norm(q.quote))) return fail('quote không nằm trong bài');
    const key = norm(q.prompt);
    if (seenPrompt.has(key)) return fail('trùng câu');
    seenPrompt.add(key);
    const opts = q.options ?? set.options ?? t.fixed;
    if (opts) {
      if (!opts.includes(q.answer)) return fail('đáp án không thuộc phương án');
      if (new Set(opts.map(norm)).size !== opts.length) return fail('phương án trùng');
    } else {
      const a = String(q.answer).split('|')[0].trim();
      if (a.split(/\s+/).length > 3 && !/\d/.test(a)) return fail('đáp án quá 3 từ');
      if (t.skill === 'reading' && !nctx.includes(norm(a))) return fail('đáp án không có trong bài đọc');
      if (t.typed && /(sentence|table|completion)/.test(t.id) && !String(q.prompt).includes('____') && !t.id.includes('short')) return fail('thiếu chỗ trống');
      if (norm(q.prompt).includes(norm(a)) && norm(a).length > 3) return fail('đáp án nằm trong câu hỏi');
    }
    labelCount[q.answer] = (labelCount[q.answer] ?? 0) + 1;
  });
  if (t.fixed) for (const l of t.fixed) if ((labelCount[l] ?? 0) < 4) errs.push(`nhãn ${l} chỉ ${labelCount[l] ?? 0} câu`);
  if (t.setOptions && set.options) for (const o of set.options) if ((labelCount[o] ?? 0) < 2) errs.push(`phương án "${o}" ít dùng`);
  return { errs, bad };
}

function solverPrompt(t, set, idxs) {
  const list = idxs.map((i, n) => {
    const q = set.questions[i];
    const opts = q.options ?? set.options ?? t.fixed;
    return `${n + 1}. ${q.prompt}${opts ? `\n   Options: ${opts.map((o) => `[${o}]`).join(' ')}` : ''}`;
  }).join('\n');
  const rule = t.typed ? 'For fill-in questions give the exact words (max 3 words or a number) from the text.' : 'For option questions answer with the EXACT option text.';
  return `Do this IELTS task using ONLY the text below. ${rule}
Return ONLY a JSON array of strings, one answer per question, in order, no explanations.

TEXT:
${set.context}

QUESTIONS:
${list}`;
}

const lenient = (a, b) => {
  const x = norm(a); const y = norm(b);
  return !!x && !!y && (x === y || (x.length > 3 && y.length > 3 && (x.includes(y) || y.includes(x))));
};

async function verify(t, set, model) {
  const idxs = set.questions.map((_, i) => i);
  const text = await ask(model, solverPrompt(t, set, idxs));
  const a = text.indexOf('[');
  const b = text.lastIndexOf(']');
  const got = JSON.parse(text.slice(a, b + 1));
  const wrong = new Set();
  idxs.forEach((i, n) => {
    const q = set.questions[i];
    const ok = String(q.answer).split('|').some((alt) => lenient(alt, got[n]));
    if (!ok) wrong.add(i);
  });
  return wrong;
}

async function makeSet(t, topic, idx, workerModel, otherModel) {
  let best = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const gen = attempt % 2 === 0 ? workerModel : otherModel;
    const ver = gen === workerModel ? otherModel : workerModel;
    try {
      const set = parseObject(await ask(gen, buildPrompt(t, topic, idx)));
      const { errs, bad } = check(t, set);
      if (errs.some((e) => !e.startsWith('#')) ) { console.log(`  ${t.id}-${idx} thử ${attempt + 1}: ${errs.slice(0, 3).join('; ')}`); continue; }
      const kept = set.questions.map((_, i) => i).filter((i) => !bad.has(i));
      const stage = { ...set, questions: kept.map((i) => set.questions[i]) };
      const wrong = await verify(t, stage, ver);
      const clean = { ...stage, questions: stage.questions.filter((_, i) => !wrong.has(i)) };
      console.log(`  ${t.id}-${idx} thử ${attempt + 1}: máy loại ${bad.size}, làm mù lệch ${wrong.size}, còn ${clean.questions.length}`);
      if (!best || clean.questions.length > best.questions.length) best = clean;
      if (clean.questions.length >= 20) break;
      if (clean.questions.length >= 18 && attempt >= 1) break;
    } catch (e) {
      console.log(`  ${t.id}-${idx} thử ${attempt + 1} lỗi: ${String(e.message).slice(0, 100)}`);
    }
  }
  return best && best.questions.length >= 16 ? best : null;
}

const jobs = [];
TYPES.filter((t) => !ONLY.length || ONLY.includes(t.id)).forEach((t, ti) => {
  fs.mkdirSync(path.join(RAW, t.id), { recursive: true });
  for (let i = 1; i <= SETS; i++) {
    const file = path.join(RAW, t.id, `${String(i).padStart(2, '0')}.json`);
    if (fs.existsSync(file)) continue;
    jobs.push({ t, i, file, topic: TOPICS[(ti * SETS + i - 1) % TOPICS.length] });
  }
});
console.log(`${jobs.length} set cần sinh`);

let done = 0;
async function worker(k) {
  const mine = MODELS[k % MODELS.length];
  const other = MODELS[(k + 1) % MODELS.length];
  while (jobs.length) {
    const job = jobs.shift();
    const set = await makeSet(job.t, job.topic, job.i, mine, other);
    if (set) {
      fs.writeFileSync(job.file, JSON.stringify({ title: set.title, topic: set.topic, context: set.context, ...(set.options ? { options: set.options } : null), questions: set.questions }, null, 1));
      done++;
      console.log(`[${k}] ghi ${job.t.id}/${path.basename(job.file)} (${set.questions.length} câu), xong ${done}, còn ${jobs.length}`);
    } else {
      console.log(`[${k}] BỎ ${job.t.id}-${job.i}: không đạt sau 3 lần`);
    }
  }
}
await Promise.all([...MODELS, ...MODELS].map((_, k) => worker(k)));
console.log(`xong: ${done} set`);
