/**
 * PHÉP ĐO: bao nhiêu phần trăm đề đọc hiểu do AI sinh ra trả lời được mà KHÔNG
 * cần đọc bài — và model nào tệ nhất.
 *
 *   npx tsx --env-file=.env.local scripts/measure-item-validity.ts --passages 60
 *   npx tsx --env-file=.env.local scripts/measure-item-validity.ts --report
 *
 * CÂU HỎI NÀY SẮC HƠN VẺ NGOÀI CỦA NÓ. Prompt sinh đề trong `services/ai/
 * questions.ts` ĐÃ có sẵn sáu luật (số 8–13) cấm đúng kiểu hỏng này: cấm chép
 * lại câu trong bài, cấm dựng FALSE bằng cách chèn "not", cấm nhiễu tự lộ. Nên
 * cái đo được ở đây không phải "AI có hỏng không" — mà là **dặn thẳng rồi thì
 * còn hỏng bao nhiêu**. Một tỉ lệ cao sau khi đã cấm tường minh nói được điều mà
 * một tỉ lệ cao khi không dặn gì không nói được.
 *
 * GIÁM KHẢO CỐ ĐỊNH, VÀ KHÔNG NẰM TRONG DANH SÁCH BỊ ĐO. Nếu mỗi model bị một
 * giám khảo khác chấm thì độ nghiêm khác nhau giữa các giám khảo trở thành một
 * biến nằm ngay giữa phép so sánh, và bảng xếp hạng sẽ đo lẫn cả giám khảo. Một
 * giám khảo cho tất cả thì con số so sánh được với nhau; đổi lại, con số tuyệt
 * đối mang dấu vết của riêng giám khảo ấy — và điều đó phải ghi kèm khi công bố.
 *
 * KHÔNG BAO GIỜ GHI "ĐÃ ĐỖ" CHO MỘT LƯỢT CHƯA CHẠY. Lời gọi hỏng thì nhãn ghi
 * `not-run`, và `ledger.ts` để nó ra ngoài phân số. Xem `provenance/label.ts`.
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';

import { filterArticles, getArticleWithBody } from '../src/data/articles';
import {
  buildBlindPrompt,
  judgeBlindReply,
  readBlindReply,
  worthBlindChecking,
  type BlindProbe,
} from '../src/services/provenance/blind-gate';
import { buildLabel, type GateOutcome, type ProvenanceLabel } from '../src/services/provenance/label';
import { preregisteredVerdict, summarise } from '../src/services/provenance/ledger';
import type { QuestionType } from '../src/types/database';

/* ------------------------------------------------------------------ cấu hình */

type Gate = { env: 'PRIMARY' | 'SECONDARY' | 'TERTIARY'; model: string; foldSystem: boolean };

function gates(): Gate[] {
  const out: Gate[] = [];
  for (const env of ['PRIMARY', 'SECONDARY', 'TERTIARY'] as const) {
    const base = process.env[`AI_${env}_BASE_URL`];
    const key = process.env[`AI_${env}_API_KEY`];
    const model =
      env === 'PRIMARY'
        ? (process.env.QUESTIONS_MODEL ?? process.env.AI_PRIMARY_MODEL)
        : process.env[`AI_${env}_MODEL`];
    if (!base || !key || !model) continue;
    out.push({ env, model, foldSystem: process.env[`AI_${env}_FOLD_SYSTEM`] === 'true' });
  }
  return out;
}

/**
 * Prompt lấy bằng regex từ mã nguồn, không import.
 *
 * `IELTS_SYSTEM_PROMPT` không được export, và import cả module ấy sẽ kéo theo
 * tầng client. Cách này giòn — đổi tên hằng là hỏng — nhưng nó giòn TO TIẾNG:
 * script dừng ngay chứ không âm thầm đo bằng một prompt khác. Cùng cách mà
 * `bench-question-models.ts` đã dùng.
 */
function ieltsSystemPrompt(): string {
  const src = readFileSync('src/services/ai/questions.ts', 'utf8');
  const m = /const IELTS_SYSTEM_PROMPT = `([\s\S]*?)`;/.exec(src);
  if (!m) throw new Error('Không tìm thấy IELTS_SYSTEM_PROMPT — mã nguồn đã đổi, dừng lại.');
  return m[1]!;
}

async function call(
  gate: Gate,
  system: string,
  user: string,
  temperature: number,
): Promise<{ text: string; ms: number }> {
  const t0 = Date.now();
  const messages = gate.foldSystem
    ? [{ role: 'user', content: `${system}\n\n---\n\n${user}` }]
    : [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ];

  const res = await fetch(`${process.env[`AI_${gate.env}_BASE_URL`]}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env[`AI_${gate.env}_API_KEY`]}`,
    },
    body: JSON.stringify({ model: gate.model, temperature, messages }),
    signal: AbortSignal.timeout(180_000),
  });
  if (!res.ok) throw new Error(`${gate.model}: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = json.choices?.[0]?.message?.content ?? '';
  if (!text) throw new Error(`${gate.model}: trả về rỗng`);
  return { text, ms: Date.now() - t0 };
}

/* ------------------------------------------------------- đọc đề model trả về */

type RawQuestion = {
  type?: string;
  prompt?: string;
  options?: string[] | null;
  correct_answer?: string;
};

function parseQuestions(text: string): RawQuestion[] {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) return [];
  try {
    const o = JSON.parse(text.slice(start, end + 1)) as { questions?: RawQuestion[] };
    return Array.isArray(o.questions) ? o.questions : [];
  } catch {
    return [];
  }
}

/* --------------------------------------------------------------- lấy mẫu bài */

/**
 * Băm tất định để lấy mẫu — không dùng `Math.random`.
 *
 * Chạy lại phải ra ĐÚNG bộ bài ấy, nếu không thì hai lần đo không so được với
 * nhau và người khác không lặp lại được kết quả. Cùng lý do đã ghi ở
 * `proofloop/transfer-source.ts`.
 */
function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

function sample(n: number): { id: string; title: string; body: string }[] {
  const pool = filterArticles({ exam: 'ielts' })
    .filter((a) => a.licenseType !== 'headline_only')
    .sort((a, b) => (a.id < b.id ? -1 : 1));

  const picked = [...pool].sort((a, b) => hash(a.id) - hash(b.id)).slice(0, n);
  const out: { id: string; title: string; body: string }[] = [];
  for (const meta of picked) {
    const full = getArticleWithBody(meta.id);
    if (full?.bodyText) out.push({ id: meta.id, title: meta.title, body: full.bodyText });
  }
  return out;
}

/* ------------------------------------------------------------------- chạy đo */

type Args = {
  passages: number;
  judgeEnv: string;
  out: string;
  report: boolean;
  perPassage: number;
};

function parseArgs(argv: string[]): Args {
  const flag = (name: string, fallback: string) => {
    const i = argv.indexOf(`--${name}`);
    return i >= 0 && argv[i + 1] ? argv[i + 1]! : fallback;
  };
  return {
    passages: Number.parseInt(flag('passages', '40'), 10),
    judgeEnv: flag('judge', 'TERTIARY').toUpperCase(),
    out: flag('out', 'data/provenance/labels.jsonl'),
    report: argv.includes('--report'),
    perPassage: Number.parseInt(flag('count', '6'), 10),
  };
}

function readLabels(path: string): ProvenanceLabel[] {
  if (!existsSync(path)) return [];
  return readFileSync(path, 'utf8')
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l) as ProvenanceLabel);
}

function printReport(labels: ProvenanceLabel[]): void {
  const s = summarise(labels);
  const pct = (r: number | null) => (r === null ? 'chưa đo' : `${(r * 100).toFixed(1)}%`);

  console.log('');
  console.log('════════ TỈ LỆ ĐỀ TRẢ LỜI ĐƯỢC MÀ KHÔNG CẦN ĐỌC BÀI ════════');
  console.log('');
  console.log(`  Tổng: ${s.overall.items} câu · ${s.overall.blindRuns} lượt kiểm bịt mắt`);
  console.log(`  Loại: ${s.overall.blindRejections} lượt  →  ${pct(s.overall.blindRejectionRate)}`);
  if (s.overall.blindNotRun > 0) {
    console.log(`  Chưa kiểm được: ${s.overall.blindNotRun} lượt (nằm NGOÀI phân số)`);
  }
  console.log('');
  console.log('  Theo model — tệ nhất trên đầu:');
  for (const m of s.byModel) {
    console.log(
      `    ${pct(m.blindRejectionRate).padStart(8)}  ${String(m.blindRejections).padStart(4)}/${String(m.blindRuns).padEnd(5)}  ${m.model}`,
    );
  }
  const reasons = Object.entries(s.overall.byReason).sort((a, b) => b[1] - a[1]);
  if (reasons.length > 0) {
    console.log('');
    console.log('  Theo kiểu hỏng:');
    for (const [reason, n] of reasons) console.log(`    ${String(n).padStart(5)}  ${reason}`);
  }

  const v = preregisteredVerdict(s);
  console.log('');
  console.log('  ── Kết luận đã đăng ký TRƯỚC khi đo ──');
  console.log(`  [${v.kind}] ${v.text}`);
  console.log('');
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.report) {
    printReport(readLabels(args.out));
    return;
  }

  const all = gates();
  const judge = all.find((g) => g.env === args.judgeEnv);
  if (!judge) throw new Error(`Không có cửa ${args.judgeEnv} để làm giám khảo.`);
  const generators = all.filter((g) => g.env !== judge.env);
  if (generators.length === 0) throw new Error('Không còn cửa nào để đo sau khi trừ giám khảo.');

  const system = ieltsSystemPrompt();
  const passages = sample(args.passages);

  console.log(`Giám khảo bịt mắt: ${judge.model} (${judge.env})`);
  console.log(`Model đem đo: ${generators.map((g) => g.model).join(', ')}`);
  console.log(`Bài: ${passages.length} · mỗi bài đặt ${args.perPassage} câu`);
  console.log(`Ghi nhãn vào: ${args.out}`);
  console.log('');

  mkdirSync(dirname(args.out), { recursive: true });
  /*
    Dò trùng theo CẶP (bài, model), không theo từng câu: một lần sinh đề ra cả
    bộ, nên đã đo cặp ấy rồi thì bỏ qua cả cụm. Dựng sẵn tập tiền tố thay vì quét
    lại danh sách cho mỗi cặp — kho nhãn sẽ lên hàng nghìn dòng.
  */
  const existing = readLabels(args.out);
  const done = new Set(existing.map((l) => l.itemId.split('#')[0]!));
  if (existing.length > 0) {
    console.log(`Đã có ${existing.length} nhãn, bỏ qua ${done.size} cặp (bài × model).\n`);
  }

  for (const passage of passages) {
    for (const gen of generators) {
      const key = `${passage.id}::${gen.model}`;
      if (done.has(key)) {
        process.stdout.write('·');
        continue;
      }

      let questions: RawQuestion[] = [];
      try {
        const { text } = await call(
          gen,
          system,
          `Tiêu đề bài: ${passage.title}\n\nBÀI ĐỌC:\n${passage.body}\n\nYêu cầu: tạo đúng ${args.perPassage} câu hỏi.`,
          0.4,
        );
        questions = parseQuestions(text);
      } catch (err) {
        process.stdout.write('E');
        console.error(`\n  sinh đề hỏng — ${(err as Error).message}`);
        continue;
      }

      for (const [i, q] of questions.entries()) {
        const type = q.type as QuestionType | undefined;
        if (!type || !q.prompt || !q.correct_answer) continue;
        if (!worthBlindChecking(type)) continue;

        const probe: BlindProbe = {
          questionId: `${key}#${i}`,
          type,
          prompt: q.prompt,
          options: q.options ?? null,
          correctAnswer: q.correct_answer,
        };

        /*
          Hàng rào LUẬT không chạy ở đây, và nhãn ghi đúng như vậy: `not-run` với
          lý do `not-applicable`. Bộ luật đang được sửa ở một phiên khác, và đo
          bằng một bộ luật đang đổi thì con số không lặp lại được. Ghi "đã đỗ" cho
          một hàng rào chưa chạy mới là điều không được phép.
        */
        const gatesOut: GateOutcome[] = [{ gate: 'rules', result: 'not-run', why: 'not-applicable' }];

        try {
          const { text } = await call(judge, 'You answer questions. Reply with one JSON object.', buildBlindPrompt(probe), 0);
          const reply = readBlindReply(text);
          if (reply === null) {
            gatesOut.push({ gate: 'blind', result: 'not-run', why: 'check-failed' });
            process.stdout.write('?');
          } else {
            const verdict = judgeBlindReply(probe, reply);
            gatesOut.push(
              verdict.ok
                ? { gate: 'blind', result: 'passed', note: verdict.note }
                : { gate: 'blind', result: 'rejected', reason: verdict.note },
            );
            process.stdout.write(verdict.ok ? '.' : 'X');
          }
        } catch {
          gatesOut.push({ gate: 'blind', result: 'not-run', why: 'check-failed' });
          process.stdout.write('!');
        }

        const label = buildLabel({
          itemId: probe.questionId,
          sourceId: passage.id,
          model: gen.model,
          generatedAt: new Date().toISOString(),
          attempts: 1,
          rejectedDrafts: [],
          gates: gatesOut,
        });
        appendFileSync(args.out, `${JSON.stringify(label)}\n`, 'utf8');
      }
    }
  }

  console.log('\n');
  printReport(readLabels(args.out));
}

main().catch((err) => {
  console.error(`\n${(err as Error).message}`);
  process.exit(1);
});
