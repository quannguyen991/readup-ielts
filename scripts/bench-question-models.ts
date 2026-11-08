/**
 * Đo model nào sinh đề đọc hiểu tốt nhất.
 *
 * Chạy:  npx tsx --env-file=.env.local scripts/bench-question-models.ts
 *
 * Sinh đề khác chấm bài ở chỗ nó bị BÓ THỜI GIAN: Vercel cắt request ở 60s, nên
 * một model hay mà chậm là một model không dùng được. Vì vậy điểm ở đây tính cả
 * độ trễ, không chỉ chất lượng.
 *
 * Bốn thứ được đo, theo thứ tự quan trọng:
 *   1. JSON bóc được không — hỏng cái này thì mọi thứ khác vô nghĩa.
 *   2. Trích dẫn có NGUYÊN VĂN trong bài không — dùng để tô sáng, sai là hỏng.
 *   3. Ra đúng những dạng câu đã đặt hàng không.
 *   4. Mất bao lâu.
 */
// Đọc toàn văn từ đĩa đồng bộ (không qua HTTP) khi chạy script này.
process.env.BAND9_SYNC_READ = '1';
import { readFileSync } from 'node:fs';
import { getArticleWithBody } from '@/data/articles';

const SYS = /const IELTS_SYSTEM_PROMPT = `([\s\S]*?)`;/.exec(
  readFileSync('src/services/ai/questions.ts', 'utf8'),
)![1]!;

const ASKED = ['true_false_not_given', 'matching_headings'];
const COUNT = 4;

const CANDIDATES = [
  { model: 'claude-haiku-4-5-20251001', proxy: 'SECONDARY' },
  { model: 'deepseek-v4-flash', proxy: 'PRIMARY' },
  { model: 'glm-5.2-fast-preview', proxy: 'PRIMARY' },
];

function norm(t: string) {
  return t.toLowerCase().replace(/[‘’“”]/g, "'").replace(/[–—]/g, '-').replace(/\s+/g, ' ').trim();
}

async function run(c: (typeof CANDIDATES)[number], article: any, passage: string) {
  const base = process.env[`AI_${c.proxy}_BASE_URL`];
  const key = process.env[`AI_${c.proxy}_API_KEY`];
  const t0 = Date.now();
  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: c.model,
        temperature: 0.4,
        messages: [
          { role: 'system', content: SYS },
          {
            role: 'user',
            content: `Tiêu đề bài: ${article.title}\n\nBÀI ĐỌC:\n${passage}\n\nYêu cầu: tạo đúng ${COUNT} câu hỏi. Chia cho các dạng sau, mỗi dạng ít nhất một câu: ${ASKED.map((t) => `"${t}"`).join(', ')}.`,
          },
        ],
      }),
      signal: AbortSignal.timeout(120_000),
    });
    const ms = Date.now() - t0;
    const j: any = await res.json();
    const raw: string = j.choices?.[0]?.message?.content ?? '';
    if (!raw) return { ...c, ms, err: JSON.stringify(j).slice(0, 90) };

    const cleaned = raw.replace(/^\s*```(?:json)?/i, '').replace(/```\s*$/, '').trim();
    const parsed = JSON.parse(cleaned.slice(cleaned.indexOf('{'), cleaned.lastIndexOf('}') + 1));
    const qs: any[] = parsed.questions ?? [];

    const paras = article.paragraphs.map(norm);
    const verbatim = qs.filter((q) => paras.some((p: string) => p.includes(norm(String(q.evidence_text ?? ''))))).length;
    const onType = qs.filter((q) => ASKED.includes(String(q.type))).length;
    const kinds = new Set(qs.map((q) => String(q.type)));
    return { ...c, ms, n: qs.length, verbatim, onType, kinds: kinds.size };
  } catch (e: any) {
    return { ...c, ms: Date.now() - t0, err: String(e?.message).slice(0, 60) };
  }
}

async function main() {
  const a = getArticleWithBody(process.argv[2] ?? '12c6ca6b-616d-4229-a60b-397760edb211')!;
  const passage = a.paragraphs.map((p: string, i: number) => `[Đoạn ${i}]\n${p}`).join('\n\n');
  console.log(`Bài: ${a.title} (${a.paragraphs.length} đoạn)\nĐặt ${COUNT} câu, dạng: ${ASKED.join(', ')}\n`);

  // Chạy tuần tự: chạy song song thì các model tranh nhau và số đo độ trễ vô nghĩa.
  for (const c of CANDIDATES) {
    const r: any = await run(c, a, passage);
    if (r.err) console.log(`${r.model.padEnd(26)} ${String(r.ms).padStart(6)}ms  LỖI ${r.err}`);
    else
      console.log(
        `${r.model.padEnd(26)} ${String(r.ms).padStart(6)}ms  câu ${r.n}/${COUNT}  nguyên văn ${r.verbatim}/${r.n}  đúng dạng ${r.onType}/${r.n}  ${r.kinds} dạng`,
      );
  }
}

main().catch((e) => console.error('FAIL', e?.message));
