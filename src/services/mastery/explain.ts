import { PROBE_TABLE } from './ledger';
import { DOMAIN_LABEL, type ProbeKind, type ProofState, type SkillRecord } from './types';

/**
 * Dịch trạng thái trong sổ thành lời giải thích cho người học.
 *
 * VÌ SAO ĐÂY LÀ MỘT MODULE RIÊNG, KHÔNG PHẢI VÀI DÒNG TRONG GIAO DIỆN. Câu "vì
 * sao app nghĩ tôi chưa hiểu" là câu hỏi mà một hệ thống ra quyết định về việc
 * học BẮT BUỘC phải trả lời được. Một con số 62% không trả lời được nó; một
 * chuỗi "đã quan sát gì → suy ra gì → nên làm gì tiếp" thì có.
 *
 * Đây cũng là chỗ dạy AI literacy mạnh nhất trong app, và nó dạy bằng cách tự
 * phơi mình ra: người học thấy kết luận được rút ra từ đâu, thấy nó dựa trên
 * QUAN SÁT chứ không phải phán đoán, và thấy chỗ nào hệ thống nói "chưa đo được".
 * Một hệ thống dám nói "tôi chưa biết" dạy được nhiều hơn một hệ thống luôn có
 * câu trả lời.
 *
 * NGUYÊN TẮC VIẾT: không dùng chữ mô tả trạng thái trong đầu người học. Không
 * "bạn chưa hiểu", không "bạn đoán bừa" — hệ thống không nhìn thấy những thứ ấy.
 * Chỉ nói điều quan sát được: trả lời đúng hay sai, chỉ vào đúng chỗ hay không.
 */

export type Explanation = {
  /** Một câu tóm tắt, hiện ở nhãn thu gọn. */
  headline: string;
  /** Chuỗi lập luận, mỗi bước một dòng. */
  steps: { label: string; detail: string }[];
  /** Việc tiếp theo hệ thống sẽ làm, và vì sao là việc đó. */
  nextVi: string;
};

const STATE_OBSERVED: Record<ProofState, string> = {
  unobserved:
    'Bạn chưa đánh dấu chỗ mình dựa vào, nên chưa có gì để đối chiếu. Chưa đo được khác với đo rồi thấy sai — app không suy đoán vào chỗ trống này.',
  'aligned-correct': 'Bạn trả lời đúng, và chỗ bạn đánh dấu đúng là chỗ đỡ đáp án.',
  'misaligned-correct':
    'Bạn trả lời đúng, nhưng chỗ bạn đánh dấu không phải chỗ đỡ đáp án. Đúng đáp án mà dựa vào chỗ khác thì chưa kết luận được gì.',
  'aligned-wrong':
    'Bạn tìm đúng chỗ nhưng trả lời sai. Vậy chỗ vướng nằm ở bước suy ra, không nằm ở bước đi tìm.',
  'misaligned-wrong': 'Bạn trả lời sai và chỗ đánh dấu cũng không phải chỗ đỡ đáp án.',
};

const PROBE_PURPOSE: Record<ProbeKind, string> = {
  transfer:
    'Một câu tương tự trên MỘT BÀI KHÁC. Đây là phép thử duy nhất tạo ra công nhận, vì nó là phép thử duy nhất tách được "đã hiểu" khỏi "nhớ đáp án bài này".',
  'evidence-reselect':
    'Cho bạn đánh dấu lại, và cố ý KHÔNG giải thích trước — giải thích trước là mớm đáp án, và sau đó thì không đo được gì nữa.',
  entailment:
    'Bỏ hẳn bước đi tìm, chỉ hỏi bài có đỡ mệnh đề này không. Cô lập đúng bước suy ra.',
  locate: 'Bỏ hẳn bước suy luận, chỉ hỏi chỗ nào trong bài. Cô lập đúng bước định vị.',
};

const STATUS_HEADLINE: Record<SkillRecord['status'], string> = {
  unobserved: 'Chưa có quan sát nào',
  'needs-probe': 'Đang có một chỗ cần làm rõ',
  probing: 'Chưa đủ căn cứ để công nhận',
  confirmed: 'Đã làm được trên một bài khác',
};

export function explain(rec: SkillRecord): Explanation {
  const steps: Explanation['steps'] = [
    {
      label: 'Mảng kỹ năng',
      detail: `${DOMAIN_LABEL[rec.skill.domain]} · ${rec.skill.key}`,
    },
    {
      label: `App đã quan sát ${rec.observations} lượt`,
      detail: STATE_OBSERVED[rec.lastState],
    },
  ];

  const probe = PROBE_TABLE[rec.lastState];
  if (probe) {
    steps.push({ label: 'Phép thử được chọn', detail: PROBE_PURPOSE[probe] });
  }

  steps.push({
    label: 'Điều kiện để được công nhận',
    detail:
      'Làm được một câu cùng kỹ năng trên MỘT BÀI KHÁC. Làm đúng nhiều lần trên cùng một bài không tính, và công nhận sẽ bị gỡ lại nếu sau đó bạn trượt.',
  });

  if (rec.transfers > 0) {
    steps.push({
      label: 'Đã đạt chuyển giao',
      detail: `${rec.transfers} lần, mỗi lần trên một bài khác bài gốc.`,
    });
  }

  return { headline: STATUS_HEADLINE[rec.status], steps, nextVi: nextStep(rec) };
}

function nextStep(rec: SkillRecord): string {
  if (rec.status === 'confirmed') {
    return 'Không cần làm gì thêm lúc này. App vẫn theo dõi: gặp lại kỹ năng này mà trượt thì công nhận sẽ được gỡ.';
  }
  const probe = PROBE_TABLE[rec.lastState];
  if (!probe) {
    return 'Lần tới khi làm bài thuộc kỹ năng này, hãy đánh dấu chỗ bạn dựa vào — không có dấu đó thì app không đối chiếu được gì.';
  }
  if (probe === 'transfer') {
    return 'App sẽ đưa một câu cùng kỹ năng trên một bài khác. Qua được thì kỹ năng này được công nhận.';
  }
  return 'App sẽ đưa một phép thử hẹp hơn để khoanh đúng chỗ vướng, rồi mới tới bước chuyển giao.';
}
