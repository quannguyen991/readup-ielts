import type { SatRwQuestion } from '@/data/sat-rw-repository';
import { buildEvidenceItem, EVIDENCE_SLUGS } from '@/services/sat-rw/evidence/generate';
import { allSynthesisItems } from '@/services/sat-rw/synthesis/generate';
import { buildVocabItem, scanCandidates } from '@/services/sat-rw/vocab/generate';
import { fromEvidence, fromSynthesis, fromVocab, type MockItem } from '@/services/sat-rw/mock/item';

/**
 * Ba bộ "sinh mới" của lộ trình, quy về hình dạng mà màn luyện đang hiểu.
 *
 * VÌ SAO CẦN LỚP NÀY. Thẻ bài học hứa "câu mới mỗi lượt" ở ba bài 11, 15, 16.
 * Lời hứa ấy kiểm được trong ba phút — bấm hai lần và so — nên nó phải đúng.
 * Nhưng ba bộ sinh cho ra `MockItem`, còn `QuestionCard` của màn luyện chỉ biết
 * `SatRwQuestion`. Không có cầu nối thì thẻ vẫn hiện, bấm vào vẫn chạy, và trả
 * về đúng 24 câu cũ — tức là quảng cáo một thứ không tồn tại, đúng cái mà
 * `plans.ts` đã đặt ra luật cấm cho phần bán gói.
 *
 * HẠT GIỐNG THEO LƯỢT, không cố định. Đây là chỗ DUY NHẤT trong app cố ý cho ra
 * câu khác nhau giữa hai lần bấm; mọi chỗ khác (đề thi thử, đề trộn) đều gieo
 * hạt cố định để hai người so được với nhau. Ở đây thì ngược lại mới đúng lời
 * hứa trên thẻ.
 *
 * KHÔNG GỌI API DÒNG NÀO. Cả ba bộ sinh bằng luật: từ trong ngữ cảnh cắt từ
 * 1.399 bài đọc có sẵn, bảng số của Command of Evidence bịa theo khuôn và đáp
 * án tính ra từ chính bảng, Rhetorical Synthesis ghép 8 chủ đề × 6 mục đích.
 */

/** Bài nào có bộ sinh, và bộ sinh ấy là bộ nào. */
export type GeneratedKind = 'words' | 'evidence' | 'synthesis';

export const GENERATED_KIND_OF_UNIT: Record<number, GeneratedKind> = {
  11: 'words',
  15: 'evidence',
  16: 'synthesis',
};

/** Xáo theo hạt giống — không dùng `Math.random` trực tiếp để còn test được. */
function shuffle<T>(list: T[], rnd: () => number): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/**
 * Quy `MockItem` về `SatRwQuestion`.
 *
 * Bốn trường đầu trùng nhau hoàn toàn, nên phần thật sự phải bịa chỉ là `unit`,
 * `unitTitle` và `domain` — và chúng lấy từ bài học đang mở chứ không đặt bừa,
 * để nhãn trên màn luyện nói đúng bài người ta đang làm.
 */
function toQuestion(item: MockItem, unit: number, unitTitle: string): SatRwQuestion {
  return {
    id: item.id,
    unit,
    unitTitle,
    domain: item.domain,
    skill: item.skill,
    passage: item.passage,
    stem: item.stem,
    options: item.options,
    answerIndex: item.answerIndex,
    solutionVi: item.solutionVi,
    /*
      MANG THEO BẢNG SỐ VÀ GHI CHÚ. Bỏ hai trường này đi thì câu Command of
      Evidence hiện ra là "dùng số liệu trong bảng để chứng minh" mà không có
      bảng nào trên màn hình — câu hỏi thành không trả lời được.
    */
    table: item.table,
    notes: item.notes,
  };
}

/**
 * Sinh `count` câu mới cho một bài.
 *
 * `rnd` bơm từ ngoài để test gieo được hạt cố định; lúc chạy thật thì dùng
 * `Math.random` để hai lượt ra hai đề.
 */
export function generateSetQuestions(
  kind: GeneratedKind,
  unit: number,
  unitTitle: string,
  count: number,
  rnd: () => number = Math.random,
): SatRwQuestion[] {
  if (kind === 'evidence') {
    /*
      Nguồn VÔ HẠN THẬT: mỗi lần gọi với hạt khác cho một bảng số khác. Không
      cần xáo, chỉ cần gọi đủ số lần.
    */
    const out: SatRwQuestion[] = [];
    for (let i = 0; out.length < count && i < count * 4; i += 1) {
      const slug = EVIDENCE_SLUGS[Math.floor(rnd() * EVIDENCE_SLUGS.length)]!;
      const item = buildEvidenceItem(slug, `gen-${rnd()}-${i}`);
      if (item) out.push(toQuestion(fromEvidence(item), unit, unitTitle));
    }
    return out;
  }

  /*
    Hai nguồn còn lại có SỐ CÂU HỮU HẠN (43 câu từ vựng, 48 câu synthesis) —
    "mới mỗi lượt" ở đây nghĩa là bốc khác nhau, không phải bịa ra câu chưa
    từng có. Lấy nhiều hơn kho thì trả hết kho chứ không lặp lại câu.
  */
  const pool =
    kind === 'words'
      ? scanCandidates().map(buildVocabItem).map(fromVocab)
      : allSynthesisItems().map(fromSynthesis);

  return shuffle(pool, rnd)
    .slice(0, count)
    .map((item) => toQuestion(item, unit, unitTitle));
}
