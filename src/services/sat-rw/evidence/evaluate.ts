import type { Claim, EvidenceTable } from './types';

/**
 * Phán xử một mệnh đề bằng chính bảng số. Hàm THUẦN, không phụ thuộc gì bên ngoài.
 *
 * ĐÂY LÀ CHỖ ĐÁP ÁN ĐƯỢC SINH RA, không phải chỗ nó được tra cứu. Bộ sinh dựng
 * bốn mệnh đề rồi gọi hàm này để biết cái nào đúng — nên đề và đáp án không thể
 * lệch nhau, cùng nguyên tắc với bộ sinh SAT Math.
 *
 * MỌI ĐẦU VÀO HỎNG ĐỀU RA `false`, KHÔNG NÉM LỖI. Một mệnh đề trỏ vào hàng không
 * tồn tại là một mệnh đề SAI, không phải một sự cố — và bộ sinh dựa vào đúng
 * điều đó để dựng nhiễu `not_in_table`.
 */

/** Ô bảng tại (hàng, cột). `null` khi không có hàng hoặc cột ấy. */
export function valueAt(table: EvidenceTable, entity: string, column: string): number | null {
  const col = table.columns.indexOf(column);
  if (col === -1) return null;
  const row = table.rows.find((r) => r.entity === entity);
  if (!row) return null;
  return row.values[col] ?? null;
}

/** Mức thay đổi của một hàng giữa hai cột. `null` khi thiếu ô. */
function delta(table: EvidenceTable, entity: string, from: string, to: string): number | null {
  const a = valueAt(table, entity, from);
  const b = valueAt(table, entity, to);
  if (a === null || b === null) return null;
  return b - a;
}

export function evaluate(table: EvidenceTable, claim: Claim): boolean {
  switch (claim.kind) {
    case 'value': {
      const v = valueAt(table, claim.entity, claim.column);
      return v !== null && v === claim.value;
    }

    case 'rank': {
      const col = table.columns.indexOf(claim.column);
      if (col === -1) return false;
      const mine = valueAt(table, claim.entity, claim.column);
      if (mine === null) return false;

      const all = table.rows.map((r) => r.values[col]).filter((v): v is number => v !== undefined);
      const target = claim.extreme === 'highest' ? Math.max(...all) : Math.min(...all);
      if (mine !== target) return false;

      /*
        HOÀ NHAU THÌ KHÔNG AI LÀ CỰC TRỊ. Hai nơi cùng cao nhất thì câu "X cao
        nhất" có hai đáp án đúng, và một câu trắc nghiệm hai đáp án đúng là câu
        hỏng. Thà loại oan một câu còn hơn để lọt câu ấy tới người học.
      */
      return all.filter((v) => v === target).length === 1;
    }

    case 'change': {
      const d = delta(table, claim.entity, claim.from, claim.to);
      if (d === null || d === 0) return false;
      return claim.direction === 'increase' ? d > 0 : d < 0;
    }

    case 'change-most': {
      const mine = delta(table, claim.entity, claim.from, claim.to);
      if (mine === null || mine === 0) return false;
      if (claim.direction === 'increase' ? mine <= 0 : mine >= 0) return false;

      /*
        CHỈ SO GIỮA NHỮNG NƠI ĐI CÙNG CHIỀU. "Giảm nhiều nhất" không có nghĩa là
        "đổi nhiều nhất": một nơi tăng vọt vẫn đổi nhiều hơn mọi nơi giảm, nhưng
        nó không tham gia cuộc so sánh về giảm.
      */
      const sameWay = table.rows
        .map((r) => delta(table, r.entity, claim.from, claim.to))
        .filter((d): d is number => d !== null && (claim.direction === 'increase' ? d > 0 : d < 0))
        .map(Math.abs);

      const best = Math.max(...sameWay);
      if (Math.abs(mine) !== best) return false;
      return sameWay.filter((d) => d === best).length === 1;
    }
  }
}

/**
 * Mệnh đề này có ĐỠ nhận định không — khác hẳn với "có đúng không".
 *
 * VÌ SAO PHẢI TÁCH LÀM HAI HÀM. Câu hỏi của dạng đề này là "phương án nào ĐỠ
 * NHẬN ĐỊNH", chứ không phải "phương án nào đúng". Người học kiểm tra tính đúng
 * rồi dừng lại là mắc đúng cái bẫy đề thật hay giăng — và bộ sinh dựng được cái
 * bẫy ấy (`accurate_but_irrelevant`) chính vì hai chuyện này tách rời nhau.
 */
export function supportsThesis(claim: Claim, thesis: Claim): boolean {
  // Nói về nơi khác thì không đỡ, dù đúng đến đâu.
  if (claim.entity !== thesis.entity) return false;

  const dirOf = (c: Claim): string | null =>
    c.kind === 'change' || c.kind === 'change-most'
      ? c.direction
      : c.kind === 'rank'
        ? c.extreme
        : null;

  const a = dirOf(claim);
  const b = dirOf(thesis);

  // Cùng có chiều thì phải cùng chiều; đảo chiều là phản chứng, không phải hậu thuẫn.
  if (a !== null && b !== null) return a === b;

  /*
    Mệnh đề `value` trần không đỡ được một nhận định có chiều: biết "Ba Bể có 61
    loài năm 2022" tự nó chưa nói lên Ba Bể tăng nhiều nhất — còn thiếu mốc kia
    và còn thiếu mọi nơi khác.
  */
  return a === null && b === null;
}
