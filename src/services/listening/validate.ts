import { coveredNumbers } from './scoring';
import type { ListeningGroup, ListeningOption, ListeningSection, ListeningTest } from './types';

/**
 * Bộ kiểm dữ liệu đề Listening — chạy trong `npm test` trên MỌI tệp ở
 * `src/data/listening-tests/`. Trả về danh sách lỗi (rỗng = đạt), mỗi lỗi nói rõ
 * đề / section / nhóm / câu nào sai.
 */

const LEVELS = ['easy', 'medium', 'hard'];
const GROUP_TYPES = ['gap', 'mcq-one', 'mcq-many', 'matching'];
const MARKER = /\{\{\s*(\d+)\s*\}\}/g;

const nonEmpty = (v: unknown): v is string => typeof v === 'string' && v.trim() !== '';

function optionKeys(opts: ListeningOption[] | undefined): string[] {
  return (opts ?? []).map((o) => String(o.key).trim().toUpperCase());
}

function checkOptions(where: string, opts: ListeningOption[] | undefined, errs: string[]): void {
  if (!opts || opts.length < 2) {
    errs.push(`${where}: cần ít nhất 2 lựa chọn`);
    return;
  }
  const keys = optionKeys(opts);
  if (new Set(keys).size !== keys.length) errs.push(`${where}: khoá lựa chọn bị trùng`);
  for (const o of opts) {
    if (!nonEmpty(o.key) || !nonEmpty(o.text)) errs.push(`${where}: lựa chọn thiếu key/text`);
  }
}

function checkGroup(where: string, g: ListeningGroup, errs: string[]): void {
  if (!GROUP_TYPES.includes(g.type)) {
    errs.push(`${where}: type "${String(g.type)}" không hợp lệ`);
    return;
  }
  if (!nonEmpty(g.instruction)) errs.push(`${where}: thiếu instruction`);
  if (!Array.isArray(g.questions) || g.questions.length === 0) {
    errs.push(`${where}: không có câu hỏi`);
    return;
  }

  if (g.type === 'gap') {
    if (!Array.isArray(g.lines) || g.lines.length === 0) {
      errs.push(`${where}: nhóm gap cần "lines"`);
    } else {
      const marked = new Set<number>();
      for (const line of g.lines) {
        for (const m of line.matchAll(MARKER)) {
          const n = Number(m[1]);
          if (marked.has(n)) errs.push(`${where}: ô {{${n}}} xuất hiện nhiều lần`);
          marked.add(n);
        }
      }
      const qn = new Set(g.questions.map((q) => q.n));
      for (const n of marked) if (!qn.has(n)) errs.push(`${where}: ô {{${n}}} không có câu hỏi tương ứng`);
      for (const n of qn) if (!marked.has(n)) errs.push(`${where}: câu ${n} không có ô {{${n}}} trong lines`);
    }
    for (const q of g.questions) {
      if (!nonEmpty(q.answer)) errs.push(`${where}: câu ${q.n} thiếu đáp án (chuỗi)`);
      if (q.accept && !q.accept.every(nonEmpty)) errs.push(`${where}: câu ${q.n} có accept rỗng`);
    }
    return;
  }

  if (g.type === 'mcq-many') {
    checkOptions(`${where}`, g.options, errs);
    const keys = optionKeys(g.options);
    for (const q of g.questions) {
      if (!Array.isArray(q.answer) || q.answer.length < 2 || q.answer.length > 3) {
        errs.push(`${where}: câu ${q.n} (mcq-many) cần đáp án là mảng 2-3 khoá`);
        continue;
      }
      const ans = q.answer.map((k) => String(k).trim().toUpperCase());
      if (new Set(ans).size !== ans.length) errs.push(`${where}: câu ${q.n} có khoá đáp án trùng`);
      for (const k of ans) if (!keys.includes(k)) errs.push(`${where}: câu ${q.n} đáp án "${k}" không có trong options`);
      if (keys.length <= ans.length) errs.push(`${where}: câu ${q.n} cần nhiều lựa chọn hơn số đáp án đúng`);
    }
    return;
  }

  // mcq-one, matching
  if (g.type === 'matching') checkOptions(`${where}`, g.options, errs);
  for (const q of g.questions) {
    if (!nonEmpty(q.answer)) {
      errs.push(`${where}: câu ${q.n} thiếu đáp án (khoá)`);
      continue;
    }
    if (!nonEmpty(q.prompt)) errs.push(`${where}: câu ${q.n} thiếu prompt`);
    const opts = q.options ?? g.options;
    checkOptions(`${where} câu ${q.n}`, opts, errs);
    if (!optionKeys(opts).includes(String(q.answer).trim().toUpperCase())) {
      errs.push(`${where}: câu ${q.n} đáp án "${String(q.answer)}" không có trong options`);
    }
  }
}

function checkSection(testId: string, s: ListeningSection, errs: string[]): number[] {
  const at = `${testId} / section ${s.n}`;
  if (![1, 2, 3, 4].includes(s.n)) errs.push(`${at}: n phải là 1-4`);
  if (!nonEmpty(s.title)) errs.push(`${at}: thiếu title`);
  if (!nonEmpty(s.audio) || !s.audio.startsWith('/')) errs.push(`${at}: audio phải là đường dẫn bắt đầu bằng "/"`);
  if (!Array.isArray(s.transcript) || s.transcript.length === 0) {
    errs.push(`${at}: thiếu transcript`);
  } else {
    let prev = -1;
    s.transcript.forEach((line, i) => {
      if (!nonEmpty(line.text)) errs.push(`${at}: transcript[${i}] rỗng`);
      const has = typeof line.start === 'number' || typeof line.end === 'number';
      if (has) {
        if (typeof line.start !== 'number' || typeof line.end !== 'number') errs.push(`${at}: transcript[${i}] chỉ có một mốc start/end`);
        else {
          if (line.end <= line.start) errs.push(`${at}: transcript[${i}] end <= start`);
          if (line.start < prev) errs.push(`${at}: transcript[${i}] start lùi so với câu trước`);
          prev = line.start;
        }
      }
    });
  }
  if (!Array.isArray(s.groups) || s.groups.length === 0) {
    errs.push(`${at}: không có nhóm câu hỏi`);
    return [];
  }
  s.groups.forEach((g, gi) => checkGroup(`${at} / nhóm ${gi + 1}`, g, errs));

  const nums = s.groups.flatMap((g) => (Array.isArray(g.questions) ? g.questions.flatMap(coveredNumbers) : []));
  const seen = new Set<number>();
  for (const n of nums) {
    if (seen.has(n)) errs.push(`${at}: số câu ${n} bị trùng`);
    seen.add(n);
  }
  const sorted = [...seen].sort((a, b) => a - b);
  const base = (s.n - 1) * 10 + 1;
  if (sorted.length !== 10 || sorted[0] !== base || sorted.at(-1) !== base + 9 || sorted.some((n, i) => n !== base + i)) {
    errs.push(`${at}: số câu phải liên tục ${base}-${base + 9} (đang có: ${sorted.join(',') || 'trống'})`);
  }
  return sorted;
}

export function validateTest(test: ListeningTest): string[] {
  const errs: string[] = [];
  const id = nonEmpty(test.id) ? test.id : '(thiếu id)';
  if (!nonEmpty(test.id) || !/^[a-z0-9][a-z0-9-]*$/.test(test.id)) errs.push(`${id}: id phải là chữ thường/số/gạch ngang`);
  if (!nonEmpty(test.title)) errs.push(`${id}: thiếu title`);
  if (!nonEmpty(test.source)) errs.push(`${id}: thiếu source`);
  if (!LEVELS.includes(test.level)) errs.push(`${id}: level phải là easy | medium | hard`);
  if (!test.cover || !nonEmpty(test.cover.topic)) errs.push(`${id}: thiếu cover.topic`);
  if (!Array.isArray(test.sections) || test.sections.length < 1 || test.sections.length > 4) {
    errs.push(`${id}: cần 1-4 section`);
    return errs;
  }
  const ns = test.sections.map((s) => s.n);
  if (new Set(ns).size !== ns.length) errs.push(`${id}: section bị trùng`);
  if (ns.some((n, i) => i > 0 && n < (ns[i - 1] ?? 0))) errs.push(`${id}: section phải xếp theo thứ tự 1,2,3,4`);

  const all: number[] = [];
  for (const s of test.sections) all.push(...checkSection(id, s, errs));
  if (new Set(all).size !== all.length) errs.push(`${id}: số câu trùng giữa các section`);
  return errs;
}

/** Kiểm cả danh sách: thêm luật id không trùng giữa các đề. */
export function validateAll(tests: ListeningTest[]): string[] {
  const errs = tests.flatMap(validateTest);
  const ids = tests.map((t) => t.id);
  for (const id of ids) if (ids.indexOf(id) !== ids.lastIndexOf(id)) errs.push(`${id}: id trùng với đề khác`);
  return errs;
}
