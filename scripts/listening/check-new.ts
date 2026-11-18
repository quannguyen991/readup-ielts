/**
 * Kiểm một đề Listening mới theo chuẩn IELTS (cấu trúc, giới hạn từ, đáp án có trong lời thoại và đúng thứ tự nghe,
 * số người nói, độ dài lời thoại). Không kiểm âm thanh (chưa có).
 *
 *   npx tsx scripts/listening/check-new.ts <đường dẫn đề.json> [...]
 *
 * Mỗi đề cần tệp bên cạnh `<tên>.cast.json`: {"Tên người nói": "F" | "M", ...} cho MỌI người nói trong transcript.
 * Thoát mã 1 nếu còn LỖI (CẢNH BÁO không làm hỏng).
 */
import fs from 'node:fs';
import path from 'node:path';
import { validateTest } from '../../src/services/listening/validate';
import type { ListeningTest } from '../../src/services/listening/types';

const words = (s: string) => (s.match(/[\p{L}\p{N}'’-]+/gu) ?? []).length;
const norm = (s: string) => s.toLowerCase().replace(/[’']/g, "'").replace(/[^\p{L}\p{N}' ]+/gu, ' ').replace(/\s+/g, ' ').trim();
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const LIM: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3 };

// Khoảng từ chuẩn mỗi section (đề thật ~5–7 phút/section ở ~150 từ/phút).
const RANGE: Record<number, [number, number]> = { 1: [650, 950], 2: [700, 1000], 3: [850, 1200], 4: [800, 1150] };

function check(file: string): { errs: string[]; warns: string[] } {
  const errs: string[] = [];
  const warns: string[] = [];
  let t: ListeningTest;
  try { t = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return { errs: [`không đọc được JSON: ${(e as Error).message}`], warns }; }
  errs.push(...validateTest(t));
  if (t.sections.length !== 4) errs.push(`phải đủ 4 section (đang ${t.sections.length})`);
  if (t.source !== 'Band 9 Original') errs.push(`source phải là "Band 9 Original"`);

  const castFile = file.replace(/\.json$/, '.cast.json');
  let cast: Record<string, string> = {};
  try { cast = JSON.parse(fs.readFileSync(castFile, 'utf8')); } catch { errs.push(`thiếu tệp người nói ${path.basename(castFile)}`); }

  for (const s of t.sections) {
    const at = `S${s.n}`;
    const text = s.transcript.map((l) => l.text).join(' ');
    const wc = words(text);
    const [lo, hi] = RANGE[s.n]!;
    if (wc < lo) errs.push(`${at}: lời thoại ${wc} từ (cần ≥ ${lo})`);
    if (wc > hi) warns.push(`${at}: lời thoại ${wc} từ (> ${hi})`);

    const speakers = [...new Set(s.transcript.map((l) => (l.speaker ?? '').trim()))];
    if (speakers.includes('')) errs.push(`${at}: có dòng thoại không ghi speaker`);
    const named = speakers.filter(Boolean);
    for (const sp of named) if (!['F', 'M'].includes(cast[sp] ?? '')) errs.push(`${at}: người nói "${sp}" chưa có F/M trong cast.json`);
    if (s.n === 1 && named.length !== 2) errs.push(`${at}: Section 1 cần đúng 2 người nói (đang ${named.length})`);
    if (s.n === 3 && (named.length < 2 || named.length > 4)) errs.push(`${at}: Section 3 cần 2–4 người nói (đang ${named.length})`);
    if ((s.n === 2 || s.n === 4) && named.length !== 1) errs.push(`${at}: Section ${s.n} là độc thoại, cần đúng 1 người nói (đang ${named.length})`);
    // hội thoại: không để một người nói liền > 90 từ (đề thật luân phiên)
    if (s.n === 1 || s.n === 3) for (const l of s.transcript) if (words(l.text) > 90) { warns.push(`${at}: một lượt thoại dài ${words(l.text)} từ ("${l.text.slice(0, 40)}…")`); break; }

    const types = s.groups.map((g) => g.type);
    const gapQ = s.groups.filter((g) => g.type === 'gap').reduce((a, g) => a + g.questions.length, 0);
    if ((s.n === 1 || s.n === 4) && gapQ !== 10) errs.push(`${at}: Section ${s.n} phải là 10 câu điền (gap), đang ${gapQ}`);
    if (s.n === 2 || s.n === 3) {
      if (s.groups.length < 2) errs.push(`${at}: cần ≥ 2 nhóm câu hỏi`);
      if (types.every((x) => x === 'gap')) errs.push(`${at}: không được toàn gap — cần MCQ/ghép/chọn nhiều đáp án`);
    }

    const tn = norm(text);
    for (const [gi, g] of s.groups.entries()) {
      const w = `${at}/nhóm ${gi + 1}(${g.type})`;
      if (g.type === 'gap') {
        const m = (g.wordLimit ?? '').toUpperCase().match(/(ONE|TWO|THREE)\s+WORD/);
        if (!m) errs.push(`${w}: wordLimit phải dạng ONE/TWO/THREE WORD(S) … (đề thật tối đa THREE)`);
        const lim = m ? LIM[m[1]!]! : 3;
        const num = /NUMBER/.test((g.wordLimit ?? '').toUpperCase());
        let last = -1;
        const seen = new Set<string>();
        for (const q of g.questions) {
          const a = String(q.answer);
          const wcount = a.trim().split(/\s+/).length;
          if (wcount > lim + (num && /\d/.test(a) ? 1 : 0)) errs.push(`${w}: câu ${q.n} "${a}" vượt giới hạn ${g.wordLimit}`);
          if (seen.has(norm(a))) warns.push(`${w}: đáp án "${a}" lặp`);
          seen.add(norm(a));
          const variants = [a, ...(q.accept ?? [])].map(norm).filter(Boolean);
          const re = new RegExp(variants.map(esc).join('|'), 'g');
          const hits = [...tn.matchAll(re)].map((x) => x.index!);
          if (!hits.length) { errs.push(`${w}: câu ${q.n} đáp án "${a}" KHÔNG có trong lời thoại`); continue; }
          const after = hits.find((p) => p >= last);
          if (after === undefined) errs.push(`${w}: câu ${q.n} "${a}" nằm TRƯỚC đáp án câu trước (sai thứ tự nghe)`);
          else last = after;
        }
      } else if (g.type === 'mcq-one') {
        for (const q of g.questions) {
          const opts = q.options ?? g.options ?? [];
          if (opts.length !== 3) errs.push(`${w}: câu ${q.n} cần đúng 3 lựa chọn A–C (đang ${opts.length})`);
        }
      } else if (g.type === 'mcq-many') {
        if ((g.options ?? []).length !== 5) errs.push(`${w}: "Choose TWO" cần đúng 5 lựa chọn A–E`);
        for (const q of g.questions) if (!Array.isArray(q.answer) || q.answer.length !== 2) errs.push(`${w}: câu ${q.n} cần đúng 2 đáp án`);
      } else if (g.type === 'matching') {
        const opts = g.options ?? [];
        if (opts.length < g.questions.length + 1) errs.push(`${w}: lựa chọn (${opts.length}) phải nhiều hơn số câu (${g.questions.length}) — đề thật luôn thừa lựa chọn`);
        const ans = g.questions.map((q) => String(q.answer).toUpperCase());
        if (new Set(ans).size !== ans.length) warns.push(`${w}: có đáp án ghép trùng nhau`);
      }
    }
  }
  return { errs, warns };
}

let bad = 0;
for (const f of process.argv.slice(2)) {
  const { errs, warns } = check(path.resolve(f));
  console.log(`\n== ${path.basename(f)}: ${errs.length ? 'LỖI ' + errs.length : 'ĐẠT'}${warns.length ? ` (cảnh báo ${warns.length})` : ''}`);
  for (const e of errs) console.log('  [LỖI]', e);
  for (const w of warns) console.log('  [CẢNH BÁO]', w);
  if (errs.length) bad++;
}
process.exit(bad ? 1 : 0);
