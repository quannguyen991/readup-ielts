import { hashString, mulberry32, shuffle } from '@/services/questions/rng';
import {
  SAT_RW_DOMAINS,
  SAT_RW_QUESTIONS,
  type SatRwQuestion,
} from '@/data/sat-rw-repository';

/**
 * Năm mươi đề trộn cho SAT Reading & Writing.
 *
 * VÌ SAO LÀ TRỘN ĐỀ CHỨ KHÔNG PHẢI THÊM 34 UNIT MỚI. Mười sáu unit hiện có chia
 * theo KỸ NĂNG (ranh giới câu, đại từ, từ nối…), mà SAT English chỉ có chừng ấy
 * nhóm luật — đẻ thêm 34 nhãn chương nữa là bịa ra tên gọi chứ không thêm thứ gì
 * để học. Cái người luyện thiếu không phải thêm chương, mà là ĐỀ MỚI MỖI LẦN
 * NGỒI XUỐNG: một đề trộn nhiều mảng, giống một module thi thật thu nhỏ, thay vì
 * hai mươi tư câu liên tiếp cùng một luật (làm hết unit "đại từ" thì tới câu thứ
 * năm là đoán được đáp án mà không cần đọc).
 *
 * MỖI ĐỀ TÁI LẬP ĐƯỢC. Cùng số đề luôn ra cùng bộ câu, cùng thứ tự — người học
 * gửi link "đề 12" cho bạn thì hai người làm đúng một đề, và làm lại lần sau vẫn
 * gặp đúng những câu ấy để đối chiếu tiến bộ. Không dùng `Math.random()` ở đâu
 * cả, đúng kỷ luật của bộ sinh đề Math.
 *
 * CÂU ĐƯỢC DÙNG LẠI GIỮA CÁC ĐỀ, và đó là chủ ý chứ không phải giới hạn giấu đi:
 * kho có 384 câu, 50 đề × 12 câu là 600 lượt, nên trung bình mỗi câu xuất hiện
 * khoảng 1,5 lần — nằm rải rác ở những đề cách xa nhau. Gặp lại một câu sau vài
 * tuần là ôn tập ngắt quãng, không phải nhồi lại. Cách chia dưới đây bảo đảm
 * dùng đều: không có câu nào xuất hiện lần thứ hai khi còn câu chưa dùng lần nào.
 */

/** Số câu một đề. Mười hai câu ≈ mười phút — một buổi luyện thật, không phải một kỳ thi. */
export const QUESTIONS_PER_SET = 12;

export const MIXED_SET_COUNT = 50;

export type SatRwMixedSet = {
  id: string;
  order: number;
  title: string;
  blurb: string;
  questions: SatRwQuestion[];
};

/**
 * Chia `total` suất cho các mảng theo tỷ trọng đề thật.
 *
 * Dùng phép "phần dư lớn nhất": chia phần nguyên trước, rồi phát nốt các suất lẻ
 * cho mảng có phần thập phân lớn nhất. Làm tròn từng mảng một cách độc lập sẽ ra
 * tổng lệch khỏi `total` — mà lệch thì đề dài ngắn thất thường.
 */
export function allocate(total: number, weights: number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum <= 0) return weights.map(() => 0);

  const exact = weights.map((w) => (w / sum) * total);
  const base = exact.map((x) => Math.floor(x));
  let left = total - base.reduce((a, b) => a + b, 0);

  const order = exact
    .map((x, i) => ({ i, frac: x - Math.floor(x) }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);

  for (const { i } of order) {
    if (left <= 0) break;
    base[i] = (base[i] ?? 0) + 1;
    left -= 1;
  }
  return base;
}

/** Tỷ trọng lấy từ chính bảng mảng của kho, không chép lại thành một con số thứ hai. */
function domainWeights(): { key: string; weight: number }[] {
  return SAT_RW_DOMAINS.map((d) => ({
    key: d.key,
    // "~26%" -> 26. Bảng kia là nguồn duy nhất; đổi ở đó thì đây đổi theo.
    weight: Number(d.percent.replace(/[^\d]/g, '')) || 0,
  }));
}

/**
 * Chia sẵn toàn bộ 50 đề trong MỘT lượt.
 *
 * Phải chia cả loạt cùng lúc chứ không bốc riêng từng đề: chỉ khi nhìn cả 50 đề
 * mới bảo đảm được "dùng hết câu chưa dùng rồi mới lặp lại". Bốc riêng từng đề
 * thì mỗi lần bốc không biết những đề khác đã lấy gì.
 *
 * Cách chia: mỗi mảng có một cỗ bài riêng đã xáo theo hạt cố định; phát lần lượt
 * cho 50 đề, hết cỗ thì xáo lại rồi phát tiếp. Nhờ vậy lượt dùng của các câu
 * trong cùng một mảng chênh nhau tối đa một.
 */
function buildAll(): SatRwMixedSet[] {
  const weights = domainWeights();
  const perSet = allocate(
    QUESTIONS_PER_SET,
    weights.map((w) => w.weight),
  );

  /** Cỗ bài của từng mảng, kèm con trỏ đang phát tới đâu. */
  const decks = weights.map((w, i) => {
    const pool = SAT_RW_QUESTIONS.filter((q) => q.domain === w.key);
    return {
      key: w.key,
      need: perSet[i] ?? 0,
      pool,
      cards: shuffle(pool, mulberry32(hashString(`satrw-mix-deck-${w.key}`))),
      at: 0,
      round: 0,
    };
  });

  const sets: SatRwMixedSet[] = [];

  for (let n = 1; n <= MIXED_SET_COUNT; n += 1) {
    const picked: SatRwQuestion[] = [];

    for (const deck of decks) {
      if (deck.pool.length === 0) continue;

      const want = Math.min(deck.need, deck.pool.length);
      let taken = 0;
      /*
        Trần số lần rút, để vòng lặp luôn kết thúc.

        Cần trần vì có một lá bị bỏ qua khi nó đã nằm trong đề này rồi (xảy ra
        đúng lúc cỗ vừa được xáo lại giữa chừng một đề). Không có trần thì cỗ nhỏ
        hơn số câu cần sẽ quay vô tận — mà mảng "Expression of Ideas" chỉ có 48
        câu nên chuyện cỗ cạn giữa chừng là thường xuyên, không phải hiếm.
      */
      const maxDraws = deck.pool.length * 2 + deck.need;
      for (let draw = 0; draw < maxDraws && taken < want; draw += 1) {
        if (deck.at >= deck.cards.length) {
          // Hết cỗ: xáo lại bằng hạt khác để vòng sau không ra đúng thứ tự cũ.
          deck.round += 1;
          deck.cards = shuffle(
            deck.pool,
            mulberry32(hashString(`satrw-mix-deck-${deck.key}-${deck.round}`)),
          );
          deck.at = 0;
        }
        const card = deck.cards[deck.at];
        deck.at += 1;
        // Trong cùng một đề không được lặp câu, kể cả khi vừa xáo lại cỗ.
        if (card && !picked.some((q) => q.id === card.id)) {
          picked.push(card);
          taken += 1;
        }
      }
    }

    // Trộn thứ tự trong đề để các mảng không đứng thành từng khối.
    const questions = shuffle(picked, mulberry32(hashString(`satrw-mix-order-${n}`)));

    sets.push({
      id: `satrw-mix-${String(n).padStart(2, '0')}`,
      order: n,
      title: `Đề trộn ${n}`,
      blurb: `${questions.length} câu rải đều bốn mảng, xếp xen kẽ như đề thật.`,
      questions,
    });
  }

  return sets;
}

export const SAT_RW_MIXED_SETS: SatRwMixedSet[] = buildAll();

export function getMixedSet(id: string): SatRwMixedSet | undefined {
  return SAT_RW_MIXED_SETS.find((s) => s.id === id);
}

export function mixedSetStats() {
  return {
    sets: SAT_RW_MIXED_SETS.length,
    questions: SAT_RW_MIXED_SETS.reduce((n, s) => n + s.questions.length, 0),
  };
}

/**
 * Lối vào cho test — không dùng trong mã chạy thật.
 *
 * Phơi `buildAll` ra để test gọi lại lần hai và đối chiếu: đó là cách duy nhất
 * chứng minh phép chia thật sự tái lập được, chứ đọc `SAT_RW_MIXED_SETS` hai lần
 * thì lần nào cũng ra cùng một mảng đã dựng sẵn, không chứng minh được gì.
 */
export const __mixedInternals = { buildAll };
