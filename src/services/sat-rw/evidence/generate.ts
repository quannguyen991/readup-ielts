import { hashString, mulberry32 } from '@/services/questions/rng';

import { evaluate, supportsThesis, valueAt } from './evaluate';
import { CONTEXTS, contextBySlug, type EvidenceContext } from './templates';
import type { Claim, DistractorCode, EvidenceItem, EvidenceOption, EvidenceTable } from './types';

/**
 * Dựng một câu Command of Evidence từ bối cảnh + hạt giống.
 *
 * THỨ TỰ LÀ HỢP ĐỒNG: dựng BẢNG trước, rồi mới rút nhận định RA TỪ bảng, rồi mới
 * dựng phương án và để `evaluate` phán xử. Không có bước nào ai đó "đánh dấu đáp
 * án đúng" — đáp án là kết quả của một phép tính trên bảng, và vì thế đề với đáp
 * án không thể lệch nhau.
 *
 * TẤT ĐỊNH TUYỆT ĐỐI. Cùng slug + hạt giống ra cùng câu, cùng thứ tự phương án.
 * Không `Math.random()` ở đâu cả — người học làm lại đề cũ phải gặp đúng câu ấy
 * để đối chiếu tiến bộ, và một ca lạ phải dựng lại được để soi.
 */

/** Số nguyên trong [lo, hi]. */
function intBetween(rng: () => number, lo: number, hi: number): number {
  return lo + Math.floor(rng() * (hi - lo + 1));
}

/**
 * Bảng mà đúng MỘT thực thể tăng mạnh nhất, và không có hoà ở bất kỳ cột nào.
 *
 * Sinh rồi kiểm rồi sinh lại, thay vì cố dựng cho khéo ngay từ đầu: luật "không
 * hoà" dễ kiểm hơn nhiều so với dễ dựng, và vòng lặp có trần thì vẫn tất định.
 */
function buildTable(ctx: EvidenceContext, rng: () => number): EvidenceTable | null {
  const [lo, hi] = ctx.range;

  for (let attempt = 0; attempt < 40; attempt += 1) {
    const rows = ctx.entities.map((entity) => {
      const start = intBetween(rng, lo, hi);
      // Cho phép cả tăng lẫn giảm: một bảng toàn tăng thì nhiễu "đảo chiều" trở
      // nên dễ loại chỉ bằng cách nhìn, không cần đọc bảng.
      const shift = intBetween(rng, -Math.round((hi - lo) * 0.18), Math.round((hi - lo) * 0.3));
      const end = Math.max(lo, Math.min(hi, start + shift));
      return { entity, values: [start, end] };
    });

    const table: EvidenceTable = {
      caption: ctx.caption,
      entityHeader: ctx.entityHeader,
      columns: [...ctx.columns],
      unit: ctx.unit,
      rows,
    };

    const gains = rows.map((r) => r.values[1]! - r.values[0]!);
    const rising = gains.filter((g) => g > 0);
    if (rising.length < 2) continue; // cần ít nhất hai nơi tăng để "tăng nhiều nhất" có nghĩa
    if (!rising.some((g) => g > 0)) continue;

    const best = Math.max(...rising);
    if (gains.filter((g) => g === best).length !== 1) continue; // hoà ở mức tăng

    // Không hoà ở bất kỳ cột nào — để mệnh đề `rank` luôn có một đáp án duy nhất.
    const tied = table.columns.some((_, c) => {
      const col = rows.map((r) => r.values[c]!);
      return new Set(col).size !== col.length;
    });
    if (tied) continue;

    return table;
  }
  return null;
}

/**
 * Câu chữ tiếng Anh cho một mệnh đề. Đề SAT viết bằng tiếng Anh.
 *
 * MỌI CÁCH DIỄN ĐẠT LẤY TỪ BỐI CẢNH, không dựng theo một khuôn chung. Bản đầu
 * dùng một khuôn cho tất cả và cho ra "In Heat-treated, Alloy A recorded 524
 * megapascals" — sai ngữ pháp vì nhãn cột không phải năm, và "the number of
 * megapascals" sai nghĩa vì MPa không đếm được. Một câu SAT sai ngữ pháp là câu
 * bỏ đi, dù đáp án của nó đúng.
 */
function render(claim: Claim, ctx: EvidenceContext, table: EvidenceTable): string {
  switch (claim.kind) {
    case 'value':
      return `${ctx.atColumn(claim.column)} ${claim.entity} ${ctx.recordVerb} ${claim.value} ${ctx.unitPhrase}.`;
    case 'rank':
      return `${claim.entity} ${ctx.recordVerb} the ${claim.extreme} figure of the four ${ctx.noun}s ${ctx.atColumn(claim.column).replace(/,$/, '').toLowerCase()}.`;
    case 'change': {
      const verb = claim.direction === 'increase' ? 'rose' : 'fell';
      return `${ctx.measureOf(claim.entity)} ${verb} between ${claim.from} and ${claim.to}.`;
    }
    case 'change-most': {
      const word = claim.direction === 'increase' ? 'increase' : 'decrease';
      const from = valueAt(table, claim.entity, claim.from);
      const to = valueAt(table, claim.entity, claim.to);
      /*
        NGOẶC ĐƠN CHỈ ĐƯỢC GHI KHI NÓ KHỚP CHIỀU ĐANG NÓI.

        Bản đầu ghi "(from 639 to 612)" cạnh chữ "larger increase" — tự mâu thuẫn,
        nên loại được nó mà KHÔNG CẦN NHÌN BẢNG. Đó đúng là "nhiễu tự lộ" mà chính
        dự án cấm ở bộ sinh IELTS, và nó làm câu hỏi mất hết giá trị đo lường.
      */
      const consistent =
        from !== null && to !== null && (claim.direction === 'increase' ? to > from : to < from);
      const detail = consistent ? ` (from ${from} to ${to})` : '';
      return `${claim.entity} showed a larger ${word}${detail} than any other ${ctx.noun} between ${claim.from} and ${claim.to}.`;
    }
  }
}

/** Một con số KHÔNG có trong bảng — nguyên liệu cho nhiễu `not_in_table`. */
function absentValue(table: EvidenceTable, rng: () => number): number {
  const present = new Set(table.rows.flatMap((r) => r.values));
  for (let i = 0; i < 60; i += 1) {
    const all = [...present];
    const candidate = intBetween(rng, Math.min(...all), Math.max(...all));
    if (!present.has(candidate)) return candidate;
  }
  return Math.max(...present) + 7;
}

export function buildEvidenceItem(slug: string, seed: string): EvidenceItem | null {
  const ctx = contextBySlug(slug);
  if (!ctx) return null;

  const rng = mulberry32(hashString(`evidence:${slug}:${seed}`));
  const table = buildTable(ctx, rng);
  if (!table) return null;

  const [from, to] = ctx.columns;
  const gains = table.rows.map((r) => ({ entity: r.entity, gain: r.values[1]! - r.values[0]! }));
  const winner = gains.reduce((a, b) => (b.gain > a.gain ? b : a));

  const thesis: Claim = {
    kind: 'change-most',
    entity: winner.entity,
    from,
    to,
    direction: 'increase',
  };

  const others = table.rows.map((r) => r.entity).filter((e) => e !== winner.entity);

  /*
    BỐN PHƯƠNG ÁN: một đúng, ba nhiễu CÓ TÊN.

    `accurate_but_irrelevant` là nhiễu quan trọng nhất và là bẫy đề thật hay
    giăng: nó ĐÚNG với bảng, nên người học kiểm tra tính đúng rồi dừng lại — quên
    mất câu hỏi là "phương án nào ĐỠ NHẬN ĐỊNH", không phải "phương án nào đúng".
  */
  const irrelevantEntity = others[0]!;
  const irrelevantValue = valueAt(table, irrelevantEntity, from)!;

  /*
    NHIỄU `wrong_row` PHẢI LÀ MỘT NƠI CŨNG TĂNG, chỉ tăng ít hơn.

    Chọn một nơi GIẢM thì phương án đọc ra là "showed a larger increase" về một
    nơi đang giảm — người học loại được ngay mà không cần mở bảng, và cái bẫy
    biến mất. Chọn một nơi cũng tăng thì buộc phải SO ĐỘ LỚN với nơi kia, tức là
    buộc phải đọc bảng — đúng kỹ năng đề này đo.
  */
  const risingOthers = others.filter((e) => {
    const g = gains.find((x) => x.entity === e)!.gain;
    return g > 0 && g < winner.gain;
  });
  const wrongRowEntity = risingOthers[0] ?? others[0]!;

  const drafted: { claim: Claim; code: DistractorCode | null }[] = [
    { claim: thesis, code: null },
    {
      claim: { kind: 'value', entity: irrelevantEntity, column: from, value: irrelevantValue },
      code: 'accurate_but_irrelevant',
    },
    {
      claim: { kind: 'change-most', entity: wrongRowEntity, from, to, direction: 'increase' },
      code: 'wrong_row',
    },
    {
      claim: { kind: 'change', entity: winner.entity, from, to, direction: 'decrease' },
      code: 'reversed_comparison',
    },
  ];

  // Thỉnh thoảng đổi một nhiễu sang `not_in_table` để bốn mã không luôn giống nhau.
  if (rng() < 0.5) {
    drafted[1] = {
      claim: { kind: 'value', entity: irrelevantEntity, column: to, value: absentValue(table, rng) },
      code: 'not_in_table',
    };
  }

  const options: EvidenceOption[] = drafted.map((d) => ({
    claim: d.claim,
    code: d.code,
    text: render(d.claim, ctx, table),
  }));

  // Trộn tất định: cùng hạt giống ra cùng thứ tự.
  for (let i = options.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [options[i], options[j]] = [options[j]!, options[i]!];
  }

  const answerIndex = options.findIndex((o) => o.code === null);

  const winnerFrom = valueAt(table, winner.entity, from)!;
  const winnerTo = valueAt(table, winner.entity, to)!;

  return {
    id: `${slug}:${seed}`,
    templateSlug: slug,
    // Nhận định lấy từ bối cảnh, không dùng chung một câu: năm bối cảnh mà cùng
    // một câu kết thì đọc ba bài là nhận ra khuôn, và người học thôi đọc bài dẫn.
    passage: `${ctx.lead} The researchers concluded that ${ctx.thesisPhrase(winner.entity)}.`,
    thesis,
    table,
    stem: 'Which choice most effectively uses data from the table to support the researchers’ conclusion?',
    options,
    answerIndex,
    solutionVi:
      `Nhận định cần đỡ là "${winner.entity} hưởng lợi nhiều hơn mọi ${ctx.noun} khác". ` +
      `Chỉ một phương án nói được điều đó: ${winner.entity} tăng từ ${winnerFrom} lên ${winnerTo} ` +
      `(${winnerTo - winnerFrom} đơn vị), mức tăng lớn nhất bảng. ` +
      'Các phương án còn lại hoặc nói về nơi khác, hoặc đảo chiều, hoặc nêu con số không có trong bảng — ' +
      'có phương án ĐÚNG với bảng nhưng vẫn không đỡ nhận định, và đó mới là chỗ dễ mắc.',
  };
}

/** Mọi bối cảnh đang có — dùng để sinh hàng loạt. */
export const EVIDENCE_SLUGS: readonly string[] = CONTEXTS.map((c) => c.slug);

/** Tiện cho test và cho script nạp kho. */
export function evaluateOption(item: EvidenceItem, index: number): boolean {
  return evaluate(item.table, item.options[index]!.claim);
}

export function optionSupports(item: EvidenceItem, index: number): boolean {
  return supportsThesis(item.options[index]!.claim, item.thesis);
}
