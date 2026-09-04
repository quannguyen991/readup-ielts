import { readFileSync, writeFileSync } from 'node:fs';

/**
 * Đo xem model nào chấm bài Writing tốt nhất — BẰNG TIÊU CHÍ MÁY KIỂM ĐƯỢC.
 *
 *   npx tsx scripts/bench-writing-models.ts
 *
 * VÌ SAO KHÔNG CHẤM BẰNG CẢM TÍNH: đọc năm bản nhận xét rồi bảo "cái này nghe
 * hay hơn" là cách chọn model tệ nhất — nó thưởng cho văn phong, mà văn phong
 * thì model nào cũng làm được. Thứ thật sự phân biệt chúng là:
 *
 *   1. TRÍCH DẪN CÓ THẬT KHÔNG. Đây là phép thử quyết định. Model yếu bịa ra
 *      câu văn không có trong bài rồi nhận xét câu đó — người học sửa một lỗi
 *      mình chưa từng mắc. Kiểm được chính xác: cắt chuỗi trích dẫn và tìm lại
 *      trong bài gốc.
 *   2. ĐIỂM CÓ NHẤT QUÁN KHÔNG. Bốn tiêu chí IELTS phải là bội của 0,5 trong
 *      khoảng 0–9, và điểm tổng phải nằm gần trung bình của bốn tiêu chí.
 *   3. ĐỦ TRƯỜNG KHÔNG. Thiếu một trường là giao diện vỡ.
 *   4. SÂU TỚI ĐÂU. Đếm số lỗi cụ thể có câu sửa kèm theo.
 *   5. NHANH TỚI ĐÂU. Người học chờ trên màn hình.
 *
 * Bài văn mẫu bên dưới được viết CÓ CHỦ Ý với những lỗi biết trước, để còn đối
 * chiếu xem model có bắt được không.
 */

type Proxy = { id: string; label: string; base: string; key: string };
const CONFIG = JSON.parse(readFileSync('.secrets-proxies.json', 'utf8')) as { proxies: Proxy[] };

/** Model đáng thử. Bỏ hẳn model ảnh/video và model nhúng — chúng không chấm văn. */
const CANDIDATES: Array<{ proxy: string; model: string }> = [
  { proxy: 'codex', model: 'claude-sonnet-5' },
  { proxy: 'codex', model: 'claude-opus-5' },
  { proxy: 'codex', model: 'claude-haiku-4-5-20251001' },
  { proxy: 'codex', model: 'gpt-5.5' },
  { proxy: 'codex', model: 'gpt-5.6-terra' },
  { proxy: 'aibox', model: 'qwen3.8-max' },
  { proxy: 'aibox', model: 'qwen3.7-max' },
  { proxy: 'aibox', model: 'deepseek-v4-pro-0813' },
  { proxy: 'aibox', model: 'kimi-k3' },
  { proxy: 'aibox', model: 'glm-5.2' },
  { proxy: 'aibox', model: 'deepseek-v4-flash' },
];

const PROMPT =
  'Some people believe that universities should only offer places to the students with ' +
  'the highest marks, while others think anyone who wants to study should be allowed. ' +
  'Discuss both views and give your own opinion.';

/*
  Bài viết mẫu, band khoảng 5.5–6.0, với LỖI CÀI SẴN:

  - "Firstly", "Secondly", "In conclusion" — nối câu máy móc, lặp khuôn
  - "students which" (sai đại từ quan hệ)
  - "informations", "knowledges" (danh từ không đếm được bị chia số nhiều)
  - "In my opinion I think" (thừa)
  - "more better" (so sánh kép)
  - đoạn hai lạc đề: nói về học phí thay vì về điểm số
  - kết luận không trả lời câu hỏi "quan điểm của bạn"
*/
const ESSAY = `Nowadays, the question of who should be allowed to enter university is a controversial topic. Some people think only students which have the highest marks should get places, while other people think everyone should have the chance. In my opinion I think both sides have some good points.

Firstly, the people who support only high marks say that universities have limited resources. If too many students come, the teachers cannot give enough attention to each one. Also, university education is very expensive and the government must pay a lot of money. Many families cannot afford the tuition fees which are increasing every year, and this is a big problem for society. Therefore the cost is a serious issue.

Secondly, the other side says that everyone should be allowed to study because education is a human right. Some students have bad marks because they had difficult situations in their family, not because they are stupid. If we give them a chance, they can gain many knowledges and informations that will help them later. Sometimes these students become more better than the students with high marks.

In conclusion, both opinions have advantages and disadvantages. Universities are important for the future of the country and students should work hard to get good marks.`;

const SYSTEM = [
  'Bạn là giám khảo IELTS Writing giàu kinh nghiệm, chấm Task 2.',
  '',
  'Chấm theo bốn tiêu chí chính thức: Task Response (TR), Coherence and Cohesion (CC),',
  'Lexical Resource (LR), Grammatical Range and Accuracy (GRA).',
  '',
  'QUY TẮC BẮT BUỘC:',
  '- Mọi nhận xét phải kèm TRÍCH DẪN NGUYÊN VĂN từ bài viết. Chép chính xác từng ký tự.',
  '  TUYỆT ĐỐI KHÔNG bịa câu không có trong bài.',
  '- Điểm từng tiêu chí và điểm tổng: số trong khoảng 0–9, bước 0,5.',
  '- Viết nhận xét bằng TIẾNG VIỆT. Giữ nguyên tiếng Anh cho phần trích dẫn và phần sửa.',
  '- Mỗi lỗi phải nói rõ: sai ở đâu, sửa thành gì, và VÌ SAO.',
  '',
  'Trả về DUY NHẤT một khối JSON theo đúng khuôn:',
  '{',
  '  "overall": 6.0,',
  '  "criteria": [',
  '    {"code":"TR","band":6.0,"summary":"…","evidence":["trích dẫn nguyên văn"],"improve":"…"},',
  '    {"code":"CC","band":6.0,"summary":"…","evidence":["…"],"improve":"…"},',
  '    {"code":"LR","band":5.5,"summary":"…","evidence":["…"],"improve":"…"},',
  '    {"code":"GRA","band":5.5,"summary":"…","evidence":["…"],"improve":"…"}',
  '  ],',
  '  "errors": [',
  '    {"quote":"trích nguyên văn","fix":"câu đã sửa","why":"giải thích ngắn bằng tiếng Việt"}',
  '  ],',
  '  "nextSteps": ["việc cụ thể cần làm ở bài sau"]',
  '}',
].join('\n');

type Criterion = { code?: string; band?: number; summary?: string; evidence?: string[]; improve?: string };
type Evaluation = {
  overall?: number;
  criteria?: Criterion[];
  errors?: Array<{ quote?: string; fix?: string; why?: string }>;
  nextSteps?: string[];
};

type Score = {
  model: string;
  proxy: string;
  ms: number;
  ok: boolean;
  note: string;
  json: boolean;
  fields: number;
  bandsValid: boolean;
  overallConsistent: boolean;
  quotesTotal: number;
  quotesReal: number;
  errorsWithFix: number;
  vietnamese: boolean;
  total: number;
};

/** Chuẩn hoá để so trích dẫn: bỏ khoảng trắng thừa và dấu nháy cong. */
function normalize(text: string): string {
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

const ESSAY_NORM = normalize(ESSAY);

/** Trích dẫn có thật trong bài không. Đây là phép thử quan trọng nhất của cả bộ. */
function quoteIsReal(quote: string): boolean {
  const q = normalize(quote);
  if (q.length < 8) return false;
  return ESSAY_NORM.includes(q);
}

function isHalfStep(n: unknown): boolean {
  return typeof n === 'number' && n >= 0 && n <= 9 && Math.abs(n * 2 - Math.round(n * 2)) < 1e-9;
}

function hasVietnamese(text: string): boolean {
  return /[àáâãèéêìíòóôõùúýăđĩũơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i.test(text);
}

async function evaluateWith(proxy: Proxy, model: string): Promise<Score> {
  const started = Date.now();
  const base: Score = {
    model,
    proxy: proxy.id,
    ms: 0,
    ok: false,
    note: '',
    json: false,
    fields: 0,
    bandsValid: false,
    overallConsistent: false,
    quotesTotal: 0,
    quotesReal: 0,
    errorsWithFix: 0,
    vietnamese: false,
    total: 0,
  };

  let raw = '';
  try {
    const res = await fetch(`${proxy.base}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${proxy.key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: `ĐỀ BÀI:\n${PROMPT}\n\nBÀI VIẾT:\n${ESSAY}` },
        ],
      }),
      signal: AbortSignal.timeout(180_000),
    });
    base.ms = Date.now() - started;
    if (!res.ok) {
      base.note = `HTTP ${res.status}: ${(await res.text()).slice(0, 120)}`;
      return base;
    }
    const body = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    raw = body.choices?.[0]?.message?.content ?? '';
  } catch (err) {
    base.ms = Date.now() - started;
    base.note = err instanceof Error ? err.message.slice(0, 120) : 'lỗi lạ';
    return base;
  }

  if (!raw.trim()) {
    base.note = 'trả về rỗng';
    return base;
  }

  let parsed: Evaluation;
  try {
    const from = raw.indexOf('{');
    const to = raw.lastIndexOf('}');
    parsed = JSON.parse(raw.slice(from, to + 1)) as Evaluation;
    base.json = true;
  } catch {
    base.note = 'không bóc được JSON';
    return base;
  }

  const criteria = parsed.criteria ?? [];
  const codes = new Set(criteria.map((c) => c.code));
  base.fields =
    (typeof parsed.overall === 'number' ? 1 : 0) +
    (['TR', 'CC', 'LR', 'GRA'].every((c) => codes.has(c)) ? 1 : 0) +
    (Array.isArray(parsed.errors) && parsed.errors.length > 0 ? 1 : 0) +
    (Array.isArray(parsed.nextSteps) && parsed.nextSteps.length > 0 ? 1 : 0);

  base.bandsValid =
    isHalfStep(parsed.overall) && criteria.length >= 4 && criteria.every((c) => isHalfStep(c.band));

  if (base.bandsValid) {
    const avg = criteria.reduce((sum, c) => sum + (c.band ?? 0), 0) / criteria.length;
    base.overallConsistent = Math.abs((parsed.overall ?? 0) - avg) <= 0.75;
  }

  const quotes = [
    ...criteria.flatMap((c) => c.evidence ?? []),
    ...(parsed.errors ?? []).map((e) => e.quote ?? ''),
  ].filter((q) => typeof q === 'string' && q.trim().length > 0);
  base.quotesTotal = quotes.length;
  base.quotesReal = quotes.filter(quoteIsReal).length;

  base.errorsWithFix = (parsed.errors ?? []).filter(
    (e) => e.quote && e.fix && e.why && e.fix !== e.quote,
  ).length;

  base.vietnamese = hasVietnamese(
    criteria.map((c) => `${c.summary ?? ''} ${c.improve ?? ''}`).join(' '),
  );

  /*
    Trọng số: TRÍCH DẪN CÓ THẬT ăn nhiều điểm nhất (40).

    Một bản nhận xét văn hay mà trích dẫn bịa thì tệ hơn không có nhận xét — người
    học tin vào nó và đi sửa một lỗi mình chưa từng mắc. Mọi thứ còn lại chỉ có
    giá trị khi nền tảng này đúng.
  */
  const quoteAccuracy = base.quotesTotal ? base.quotesReal / base.quotesTotal : 0;
  base.total =
    Math.round(quoteAccuracy * 40) +
    base.fields * 5 +
    (base.bandsValid ? 12 : 0) +
    (base.overallConsistent ? 8 : 0) +
    Math.min(base.errorsWithFix, 8) * 2 +
    (base.vietnamese ? 8 : 0) +
    (base.ms < 20_000 ? 6 : base.ms < 45_000 ? 3 : 0);
  base.ok = true;
  base.note = `${base.quotesReal}/${base.quotesTotal} trích dẫn có thật`;

  writeFileSync(
    `bench-out/${proxy.id}--${model.replace(/[^\w.-]/g, '_')}.json`,
    JSON.stringify({ score: base, raw: parsed }, null, 2),
    'utf8',
  );
  return base;
}

async function main() {
  const { mkdirSync } = await import('node:fs');
  mkdirSync('bench-out', { recursive: true });

  const byId = new Map(CONFIG.proxies.map((p) => [p.id, p]));
  const results: Score[] = [];

  for (const c of CANDIDATES) {
    const proxy = byId.get(c.proxy);
    if (!proxy) continue;
    process.stdout.write(`${c.proxy}/${c.model} … `);
    const score = await evaluateWith(proxy, c.model);
    results.push(score);
    console.log(
      score.ok
        ? `${score.total} điểm · ${(score.ms / 1000).toFixed(1)}s · ${score.note}`
        : `HỎNG · ${score.note}`,
    );
  }

  results.sort((a, b) => b.total - a.total);
  console.log('\n' + '='.repeat(96));
  console.log(
    'model'.padEnd(30) +
      'điểm'.padStart(6) +
      'giây'.padStart(7) +
      'trích thật'.padStart(12) +
      'trường'.padStart(8) +
      'điểm hợp lệ'.padStart(13) +
      'lỗi có sửa'.padStart(12) +
      '  tiếng Việt',
  );
  console.log('-'.repeat(96));
  for (const r of results) {
    if (!r.ok) {
      console.log(`${(r.proxy + '/' + r.model).padEnd(30)}${'—'.padStart(6)}   ${r.note}`);
      continue;
    }
    console.log(
      (r.proxy + '/' + r.model).padEnd(30) +
        String(r.total).padStart(6) +
        (r.ms / 1000).toFixed(1).padStart(7) +
        `${r.quotesReal}/${r.quotesTotal}`.padStart(12) +
        `${r.fields}/4`.padStart(8) +
        (r.bandsValid ? (r.overallConsistent ? 'có' : 'lệch') : 'KHÔNG').padStart(13) +
        String(r.errorsWithFix).padStart(12) +
        (r.vietnamese ? '  có' : '  KHÔNG'),
    );
  }
  console.log('='.repeat(96));
  writeFileSync('bench-out/summary.json', JSON.stringify(results, null, 2), 'utf8');
}

void main();
