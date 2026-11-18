// Sinh thêm đề luyện nói bằng hạn mức gói qua router cục bộ (AI_LOCAL_* trong .env.local):
//   mock — 24 đề thi thử IELTS Speaking đủ ba Part (Part 1 hai chủ đề × 4 câu, cue card, Part 3 năm câu) kèm đáp án mẫu.
//   gt   — 20 nhóm × 5 đề luyện nói GIAO TIẾP (10 nhóm đời sống hằng ngày thêm sau) (tình huống đời sống, công việc) kèm ý bắt buộc, mẫu câu và bài mẫu.
// Ghi từng phần vào src/data/hub/speaking-more-raw/<mock|gt>/<id>.json; chạy lại thì bỏ qua cái đã có.
// Chạy: node scripts/hub/gen-speaking-more.mjs [--kind mock|gt] [--workers 4]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const RAW = path.join(ROOT, 'src/data/hub/speaking-more-raw');
const arg = (n, d) => (process.argv.includes(n) ? process.argv[process.argv.indexOf(n) + 1] : d);
const KIND = arg('--kind', 'all');
const WORKERS = Number(arg('--workers', '4'));
const MODELS = ['ag/gemini-3.8-flash-high', 'cx/gpt-6-luna', 'ag/gemini-3.8-flash'];
for (const k of ['mock', 'gt']) fs.mkdirSync(path.join(RAW, k), { recursive: true });

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

const VI = /[ạảãàáâậầấẩẫăắằặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôộồốổỗơợờớởỡùúụủũưựừứửữỳýỵỷỹđ]/i;
const words = (s) => String(s ?? '').trim().split(/\s+/).filter(Boolean).length;
const isQ = (s) => typeof s === 'string' && s.trim().length > 8 && s.trim().endsWith('?');
const parse = (text, open, close) => {
  const a = text.indexOf(open);
  const b = text.lastIndexOf(close);
  if (a < 0 || b < a) throw new Error('không có JSON');
  return JSON.parse(text.slice(a, b + 1));
};

/* ------------------------------------------------------------------ đề thi thử */

const MOCK_SEEDS = [
  ['Work or Study', 'Hometown', 'a person who taught you something useful'],
  ['Home and Accommodation', 'Daily Routine', 'a place you visited and want to return to'],
  ['Food and Cooking', 'Friends', 'a piece of technology you find useful'],
  ['Sports and Exercise', 'Weather', 'a book or film that influenced you'],
  ['Transport', 'Shopping', 'a time you helped someone'],
  ['Music', 'Reading', 'a skill you would like to learn'],
  ['Technology', 'Neighbours', 'a memorable meal'],
  ['Hobbies', 'Public Holidays', 'an important decision you made'],
  ['Family', 'Clothes', 'a building you like'],
  ['Health', 'Weekends', 'a time you were very busy'],
  ['Studies', 'Social Media', 'a gift you gave or received'],
  ['Travel', 'Sleep', 'a historical place'],
  ['Art and Museums', 'Cities and Towns', 'a person you admire'],
  ['Money', 'News', 'an event that made you happy'],
  ['Photography', 'Time Management', 'a piece of clothing you like'],
  ['Teachers and School', 'Nature and Parks', 'a difficult task you completed'],
  ['Friends', 'Advertising', 'a place where you like to relax'],
  ['Languages', 'Birthdays', 'a time you waited for something'],
  ['Environment', 'Celebrities', 'a small business you know'],
  ['Science', 'Safety', 'a traditional festival'],
  ['Volunteering', 'Childhood', 'a useful website or app'],
  ['Jobs and Careers', 'Weather and Seasons', 'a team you were part of'],
  ['Shopping Online', 'Free Time', 'a quiet place you enjoy'],
  ['Health and Diet', 'Technology at Home', 'an old object you keep'],
  ['Daily Routine', 'Cooking', 'a place where you study or work'],
  ['Weekends', 'Pets and Animals', 'a person who makes you laugh'],
  ['Libraries', 'Television', 'a time you learned something new online'],
  ['Films and Cinema', 'The Internet', 'a public place you like to visit'],
  ['Online Shopping', 'Mobile Apps', 'a goal you want to achieve'],
  ['Jobs and Careers', 'Teamwork', 'a job you would like to do'],
  ['Public Speaking', 'Memory', 'a time you felt proud'],
  ['Happiness', 'Stress and Relaxation', 'a tradition in your country'],
  ['Tourism', 'Culture and Traditions', 'a journey that was difficult'],
  ['Climate Change', 'Handwriting and Typing', 'a rule you think is important'],
  ['Gardens and Plants', 'Sports Events', 'a famous person you would like to meet'],
  ['Leadership', 'Job Interviews', 'a time you made a mistake'],
  ['Family', 'Weather and Seasons', 'a family member you spend time with'],
  ['Music', 'Technology at Home', 'a song or piece of music you like'],
  ['Hometown', 'Shopping', 'an interesting conversation you had'],
  ['Studies', 'Friends', 'a time you changed your mind'],
];

function mockPrompt(i, seed) {
  const [a, b, theme] = seed;
  return `You are an expert IELTS Speaking examiner writing ONE complete original mock test (test number ${i + 1}) for Vietnamese learners. Reply with ONE valid JSON object only, no markdown:
{
 "id": "mock-${String(i + 1).padStart(2, '0')}",
 "title": "IELTS Speaking Mock Test ${i + 1}",
 "titleVi": "Đề thi thử số ${i + 1}",
 "focusVi": one Vietnamese sentence: the main skill this test trains (e.g. mở rộng câu trả lời, kể chuyện có mở-thân-kết, so sánh quá khứ và hiện tại),
 "part1": [ {"topic": "${a}", "qs": 4 questions, each ends with ?}, {"topic": "${b}", "qs": 4 questions, each ends with ?} ],
 "part2": {"prompt": must start with "Describe " and be about ${theme}, "bullets": 4 strings (three prompts like "what it was", and a fourth starting with "and explain why" or "and say how")},
 "part3": 5 abstract discussion questions extending the Part 2 theme, each ends with ?,
 "answers": {
   "p1": 8 model spoken answers in the order of the 8 Part 1 questions, each 22-40 words (direct answer, reason, short example),
   "sample": a Band 8 model Part 2 answer, 150-200 words, first person, natural spoken English covering every bullet,
   "p3": 5 model answers in order, each 45-75 words (opinion, reason, contrast or example, brief conclusion)
 }
}
All questions must be original exam-style questions (not copied from any published test).`;
}

function mockCheck(o, i) {
  if (!o || o.id !== `mock-${String(i + 1).padStart(2, '0')}`) return 'id';
  if (typeof o.focusVi !== 'string' || !VI.test(o.focusVi)) return 'focusVi';
  if (!Array.isArray(o.part1) || o.part1.length !== 2 || !o.part1.every((g) => g.topic && Array.isArray(g.qs) && g.qs.length === 4 && g.qs.every(isQ))) return 'part1';
  if (!o.part2 || !/^Describe /.test(o.part2.prompt) || !Array.isArray(o.part2.bullets) || o.part2.bullets.length !== 4) return 'part2';
  if (!Array.isArray(o.part3) || o.part3.length !== 5 || !o.part3.every(isQ)) return 'part3';
  const a = o.answers;
  if (!a || !Array.isArray(a.p1) || a.p1.length !== 8 || !a.p1.every((x) => words(x) >= 15 && words(x) <= 70)) return 'p1 answers';
  if (words(a.sample) < 120 || words(a.sample) > 240) return `sample ${words(a.sample)}`;
  if (!Array.isArray(a.p3) || a.p3.length !== 5 || !a.p3.every((x) => words(x) >= 35 && words(x) <= 110)) return 'p3 answers';
  return null;
}

/* ------------------------------------------------------------------ giao tiếp */

const GT_CATS = [
  ['gioi-thieu', 'Giới thiệu và làm quen', 'introducing yourself, meeting new people, talking about your background, job, hobbies'],
  ['hoi-thong-tin', 'Hỏi thông tin và chỉ đường', 'asking for directions, prices, schedules, availability, repeating and clarifying'],
  ['nho-giup', 'Nhờ giúp, đề nghị và từ chối lịch sự', 'asking for help or favours, offering help, politely refusing or declining'],
  ['phan-nan', 'Phàn nàn và xin lỗi', 'complaining about service or goods, apologising, giving and accepting explanations'],
  ['y-kien', 'Nêu ý kiến, đồng ý và phản đối', 'giving opinions, agreeing, disagreeing politely, suggesting alternatives, persuading'],
  ['ke-chuyen', 'Kể chuyện và trải nghiệm', 'telling a past experience, a news story, a funny incident, with sequence and feelings'],
  ['mo-ta', 'Mô tả người, nơi chốn, đồ vật', 'describing a person, a place, an object or a picture in detail, comparing two things'],
  ['dien-thoai', 'Điện thoại, đặt chỗ và dịch vụ', 'phone calls, booking tables or rooms, making appointments, leaving messages'],
  ['cong-so', 'Công sở: họp, báo cáo, email nói', 'giving a work update, explaining a delay, leading a short meeting, presenting a plan'],
  ['du-lich', 'Du lịch và nhà hàng', 'airports, hotels, restaurants, taxis, shopping abroad, handling problems while travelling'],

  ['thoi-quen', 'Thói quen và một ngày của bạn', 'describing a daily routine, habits, schedules, mornings and evenings, weekends, changing a bad habit'],
  ['mua-sam', 'Mua sắm và tiền bạc', 'shopping for clothes and groceries, comparing prices, returning an item, bargaining, budgeting, paying bills'],
  ['am-thuc', 'Ăn uống và nấu nướng', 'ordering food, describing dishes, explaining a recipe, dietary needs and allergies, inviting friends to dinner'],
  ['suc-khoe', 'Sức khỏe và đi khám', 'describing symptoms, making a doctor appointment, at the pharmacy, healthy habits, joining a gym'],
  ['nha-cua', 'Nhà cửa và hàng xóm', 'renting a flat, describing your home, reporting a problem to a landlord, talking to neighbours, moving house'],
  ['di-chuyen', 'Di chuyển và giao thông', 'commuting, taxis and ride apps, trains and buses, getting lost, delays, car versus public transport'],
  ['ban-be', 'Bạn bè, gia đình và kế hoạch', 'making plans, inviting people, accepting and declining invitations, family events, giving advice to a friend'],
  ['cong-nghe', 'Công nghệ và mạng xã hội', 'phone and internet problems, tech support calls, apps, online shopping, opinions about social media'],
  ['hoc-tap', 'Học tập và trường lớp', 'asking a teacher for help, group projects, exam stress, study plans, joining a club, talking about courses'],
  ['xa-hoi', 'Xã hội, tin tức và ý kiến', 'talking about news and events, volunteering, environmental habits, giving opinions on social issues, community life'],
];

function gtPrompt(cat) {
  const [id, vi, scope] = cat;
  return `You are an English communication coach writing speaking tasks for Vietnamese adult learners (level A2 to B2). Group: "${vi}" (${scope}).
Write FIVE different free-speaking tasks for this group, from easy to harder. Reply with ONE valid JSON array of 5 objects only, no markdown. Each object:
{
 "id": "gt-${id}-N" (N = 1..5),
 "level": "EASY" | "MEDIUM" | "HARD" (two EASY, two MEDIUM, one HARD, in that order),
 "title": short English title (3-6 words),
 "titleVi": short Vietnamese title,
 "situationVi": 1-2 Vietnamese sentences setting the scene and who the learner is talking to,
 "task": the instruction in English addressed to the learner, 1-3 sentences ("You are... Tell/Ask/Explain..."), requiring about 45-90 seconds of speaking,
 "mustVi": 3 Vietnamese strings: the points the learner must cover,
 "phrases": 6 objects {"en": a useful natural phrase or sentence frame, "vi": Vietnamese meaning, "ex": a short example sentence},
 "sample": a natural model answer in English, 70-110 words, covering all the must-points,
 "tipVi": one Vietnamese sentence of advice about tone, politeness or structure for this task
}
Tasks must be realistic, original, and different from each other.`;
}

function gtCheck(arr, cat) {
  if (!Array.isArray(arr) || arr.length !== 5) return 'không đủ 5 đề';
  for (let i = 0; i < 5; i++) {
    const t = arr[i];
    if (!t || t.id !== `gt-${cat[0]}-${i + 1}`) return `id ${i + 1}`;
    if (!['EASY', 'MEDIUM', 'HARD'].includes(t.level)) return `level ${i + 1}`;
    if (!t.title || !t.titleVi || !VI.test(t.situationVi ?? '')) return `tiêu đề ${i + 1}`;
    if (typeof t.task !== 'string' || words(t.task) < 8) return `task ${i + 1}`;
    if (!Array.isArray(t.mustVi) || t.mustVi.length !== 3 || !t.mustVi.every((s) => typeof s === 'string' && VI.test(s))) return `mustVi ${i + 1}`;
    if (!Array.isArray(t.phrases) || t.phrases.length !== 6 || !t.phrases.every((p) => p && p.en && p.vi && p.ex)) return `phrases ${i + 1}`;
    if (words(t.sample) < 55 || words(t.sample) > 140) return `sample ${i + 1}: ${words(t.sample)}`;
    if (typeof t.tipVi !== 'string' || !VI.test(t.tipVi)) return `tipVi ${i + 1}`;
  }
  return null;
}

/* ------------------------------------------------------------------ chạy */

async function work(job) {
  const file = path.join(RAW, job.kind, `${job.key}.json`);
  if (fs.existsSync(file)) return;
  let last = '';
  for (let round = 0; round < 3; round++) {
    for (const model of MODELS) {
      try {
        const text = await ask(model, job.prompt);
        const out = job.kind === 'gt' ? parse(text, '[', ']') : parse(text, '{', '}');
        const bad = job.check(out);
        if (!bad) {
          fs.writeFileSync(file, JSON.stringify(out, null, 1));
          console.log('ok', job.kind, job.key, model);
          return;
        }
        last = `${model}: ${bad}`;
      } catch (err) {
        last = `${model}: ${String(err.message ?? err).slice(0, 100)}`;
      }
    }
  }
  console.log('FAIL', job.kind, job.key, last);
}

const jobs = [];
if (KIND === 'all' || KIND === 'mock') MOCK_SEEDS.forEach((seed, i) => jobs.push({ kind: 'mock', key: `mock-${String(i + 1).padStart(2, '0')}`, prompt: mockPrompt(i, seed), check: (o) => mockCheck(o, i) }));
if (KIND === 'all' || KIND === 'gt') GT_CATS.forEach((cat) => jobs.push({ kind: 'gt', key: cat[0], prompt: gtPrompt(cat), check: (o) => gtCheck(o, cat) }));
console.log('việc cần làm:', jobs.length);
let next = 0;
await Promise.all(Array.from({ length: WORKERS }, async () => {
  while (next < jobs.length) await work(jobs[next++]);
}));
console.log('XONG');
