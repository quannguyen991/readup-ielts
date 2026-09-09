import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Đánh dấu câu gạch chân cho 17 câu R&W hỏi về "the underlined …".
 *
 * VÌ SAO CẦN. Đề bài của unit 12 hỏi "function of the underlined sentence", unit
 * 13 hỏi "the underlined claim in Text 1" — nhưng trong kho không có gì được
 * đánh dấu cả. Người học đọc một đoạn bốn câu rồi phải TỰ ĐOÁN câu nào đang được
 * hỏi. Đoán sai là làm sai, mà lỗi lại không nằm ở chỗ họ hiểu bài.
 *
 * VÌ SAO LÀ SCRIPT CHẠY LẠI ĐƯỢC, KHÔNG PHẢI SỬA TAY MỘT LẦN. Kho câu sinh từ
 * dự án `sat-rw-luyen-tap` và có thể được xuất lại. Sửa tay thì lần xuất sau mất
 * sạch dấu mà không ai biết; chạy lại script này thì dấu về đúng chỗ cũ.
 *
 * VÌ SAO CHỈ SỐ CÂU CHỨ KHÔNG PHẢI CHÉP NGUYÊN CÂU VÀO BẢNG DƯỚI. Đoạn văn dùng
 * dấu nháy cong (’) và gạch ngang dài (—). Chép tay là sớm muộn gõ nhầm thành
 * dấu thẳng, rồi chuỗi không khớp và câu ấy lặng lẽ mất dấu gạch chân. Lấy chỉ
 * số rồi để máy tự cắt ra khỏi chính đoạn văn thì không có chỗ cho lỗi gõ.
 *
 * Chạy: npx tsx scripts/mark-underlines.ts [--check]
 *   --check chỉ kiểm tra, không ghi. Dùng được trong CI.
 */

const SEED_PATH = resolve(process.cwd(), 'src/data/seed/sat-rw/index.json');

type Target = {
  /** Chỉ số câu, đếm từ 0. Với câu ghép thì đếm TRONG Text 1. */
  sentence: number;
  /** Ghi chú vì sao là câu ấy — lấy từ chính lời giải của câu hỏi. */
  why: string;
};

/**
 * Câu nào được gạch chân, và vì sao.
 *
 * Mỗi dòng đối chiếu với `solutionVi` của chính câu đó: lời giải đã nói rõ câu
 * gạch chân làm gì trong đoạn, nên chỗ này không phải tôi chọn mà là đọc ra.
 */
const TARGETS: Record<string, Target> = {
  /* Unit 12 — "function of the underlined sentence in the text as a whole" */
  'satrw-u12-01': { sentence: 1, why: 'lời giải: "câu gạch chân mở bằng He argued that…"' },
  'satrw-u12-02': { sentence: 1, why: 'lời giải: câu sau nó mở bằng "therefore", nên nó là tiền đề' },
  'satrw-u12-03': { sentence: 1, why: 'lời giải: "nhịp thứ hai — dựng ra cái đề nghị" (biên tập viên đòi cắt)' },
  'satrw-u12-04': { sentence: 2, why: 'lời giải: "trả lời câu hỏi còn treo: vậy thì họ chuyển tới cái gì?"' },
  'satrw-u12-05': { sentence: 1, why: 'lời giải: câu ngay sau bắt đầu bằng "That does not mean…"' },
  'satrw-u12-06': { sentence: 2, why: 'lời giải: "nhịp thứ ba — việc ông làm sau khi thấy hai nhịp trước"' },
  'satrw-u12-07': { sentence: 1, why: 'lời giải: "nói bà được đào tạo với ai và nguyên tắc của người thầy ấy"' },
  'satrw-u12-08': { sentence: 2, why: 'lời giải: "số liệu ngày thứ tư và ngày thứ năm"' },

  /* Unit 13 — "the underlined claim in Text 1" */
  'satrw-u13-01': { sentence: 1, why: 'lời giải chỉ thẳng cụm "across the whole city"' },
  'satrw-u13-02': { sentence: 1, why: 'câu suy rộng từ dữ kiện: "This shows that…"' },
  'satrw-u13-05': { sentence: 1, why: 'câu suy rộng: "The audience’s reaction proves that…"' },
  'satrw-u13-07': { sentence: 1, why: 'câu suy rộng: "therefore develops in a fixed order…"' },
  'satrw-u13-10': { sentence: 1, why: 'câu suy rộng: "Raising a child with two languages therefore…"' },
  'satrw-u13-13': { sentence: 1, why: 'câu suy rộng từ tương quan sang nhân quả: "Bike lanes cause…"' },
  'satrw-u13-16': { sentence: 1, why: 'lời giải chỉ thẳng chữ "reliably"' },
  'satrw-u13-19': { sentence: 1, why: 'câu ngoại suy: "can therefore be expected to recover…"' },
  'satrw-u13-22': { sentence: 1, why: 'câu suy rộng từ tương quan sang nhân quả: "The program raised…"' },
};

/** Dấu ngăn hai văn bản của câu ghép — cùng dấu mà `splitPassage` dùng. */
const PAIR_MARKER = /Văn bản\s*\d+\s*/g;

type Question = {
  id: string;
  passage: string;
  stem: string;
  underline?: string;
  [k: string]: unknown;
};

/**
 * Cắt đoạn thành câu.
 *
 * Đủ dùng vì 17 đoạn này không có chữ viết tắt nào (không "U.S.", không "Dr.").
 * Nếu về sau có, hàm kiểm tra bên dưới sẽ bắt được: ghép các câu lại phải ra
 * đúng đoạn ban đầu, sai một ký tự là dừng.
 */
function sentences(text: string): string[] {
  return (text.match(/[^.!?]+[.!?]+/g) ?? []).map((s) => s.trim());
}

/** Phần Text 1 của câu ghép; câu thường thì trả về cả đoạn. */
function firstText(passage: string): string {
  if (!/Văn bản/.test(passage)) return passage;
  return passage.split(/Văn bản\s*2/)[0]!.replace(/Văn bản\s*1/, '').trim();
}

type Problem = { id: string; message: string };

function main(): void {
  const check = process.argv.includes('--check');
  const raw = readFileSync(SEED_PATH, 'utf8');
  const seed = JSON.parse(raw) as { units: unknown[]; questions: Question[] };

  const problems: Problem[] = [];
  const marks = new Map<string, string>();

  /* Mọi câu hỏi về "underlined" phải có mặt trong bảng, và ngược lại. */
  const asksUnderlined = seed.questions.filter((q) => /underlined/i.test(q.stem ?? ''));
  for (const q of asksUnderlined) {
    if (!TARGETS[q.id]) problems.push({ id: q.id, message: 'đề hỏi "underlined" nhưng bảng không có' });
  }
  for (const id of Object.keys(TARGETS)) {
    const q = seed.questions.find((x) => x.id === id);
    if (!q) problems.push({ id, message: 'bảng có nhưng kho không có câu này' });
    else if (!/underlined/i.test(q.stem ?? ''))
      problems.push({ id, message: 'bảng có nhưng đề KHÔNG hỏi "underlined" — đánh dấu thừa' });
  }

  for (const q of asksUnderlined) {
    const target = TARGETS[q.id];
    if (!target) continue;

    const region = firstText(q.passage);
    const parts = sentences(region);

    /* Ghép lại phải ra đúng đoạn: sai nghĩa là bộ cắt câu không hiểu đoạn này. */
    if (parts.join(' ') !== region.replace(/\s+/g, ' ').trim()) {
      problems.push({ id: q.id, message: 'cắt câu không khớp lại được với đoạn gốc' });
      continue;
    }

    const picked = parts[target.sentence];
    if (!picked) {
      problems.push({ id: q.id, message: `không có câu số ${target.sentence} (đoạn có ${parts.length} câu)` });
      continue;
    }

    /* Chuỗi phải xuất hiện ĐÚNG MỘT LẦN trong cả đoạn, kể cả Text 2. */
    const first = q.passage.indexOf(picked);
    if (first < 0) {
      problems.push({ id: q.id, message: 'câu cắt ra không tìm thấy trong đoạn' });
      continue;
    }
    if (q.passage.indexOf(picked, first + 1) >= 0) {
      problems.push({ id: q.id, message: 'câu cắt ra xuất hiện nhiều hơn một lần — không xác định được vị trí' });
      continue;
    }

    /* Câu ghép: dấu phải nằm trong Text 1, đúng như đề bài nói. */
    if (/Văn bản/.test(q.passage)) {
      const boundary = q.passage.search(/Văn bản\s*2/);
      if (boundary >= 0 && first > boundary) {
        problems.push({ id: q.id, message: 'dấu rơi vào Text 2 trong khi đề hỏi Text 1' });
        continue;
      }
    }

    /* Còn sót dấu ngăn trong chính chuỗi được gạch chân là cắt hỏng. */
    PAIR_MARKER.lastIndex = 0;
    if (PAIR_MARKER.test(picked)) {
      problems.push({ id: q.id, message: 'chuỗi gạch chân còn chứa dấu ngăn văn bản' });
      continue;
    }

    marks.set(q.id, picked);
  }

  if (problems.length > 0) {
    console.error('KHÔNG ghi gì cả. Có ' + problems.length + ' chỗ không khớp:');
    for (const p of problems) console.error('  ' + p.id + ': ' + p.message);
    process.exit(1);
  }

  /* Dựng lại từng câu, đặt `underline` ngay sau `passage` cho dễ đọc diff. */
  let changed = 0;
  seed.questions = seed.questions.map((q) => {
    const mark = marks.get(q.id);
    const rebuilt: Question = {} as Question;
    for (const [k, v] of Object.entries(q)) {
      if (k === 'underline') continue; // bỏ dấu cũ, script này là nguồn duy nhất
      rebuilt[k] = v;
      if (k === 'passage' && mark) rebuilt.underline = mark;
    }
    if (mark && q.underline !== mark) changed += 1;
    return rebuilt;
  });

  console.log(`Đánh dấu ${marks.size} câu (${changed} câu đổi so với kho hiện tại).`);
  for (const [id, text] of marks) {
    console.log(`  ${id}  →  ${text.length > 72 ? text.slice(0, 69) + '…' : text}`);
  }

  if (check) {
    console.log('--check: không ghi.');
    return;
  }

  /* Giữ nguyên khuôn của file: thụt 1 dấu cách, xuống dòng CRLF, không dòng cuối. */
  const out = JSON.stringify(seed, null, 1).replace(/\n/g, '\r\n');
  writeFileSync(SEED_PATH, out, 'utf8');
  console.log('Đã ghi ' + SEED_PATH);
}

main();
