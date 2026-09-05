import { PROBE_TABLE } from './ledger';
import { DOMAIN_LABEL, type ProbeKind, type ProofState, type SkillRecord } from './types';
import { translate, type Locale } from '@/i18n';
import type { MessageKey } from '@/i18n/keys';

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

/** Trạng thái quan sát → khoá từ điển. Lời văn nằm trong `src/i18n`. */
const STATE_KEY: Record<ProofState, MessageKey> = {
  unobserved: 'state.unobserved',
  'aligned-correct': 'state.alignedCorrect',
  'misaligned-correct': 'state.misalignedCorrect',
  'aligned-wrong': 'state.alignedWrong',
  'misaligned-wrong': 'state.misalignedWrong',
};

const PROBE_KEY: Record<ProbeKind, MessageKey> = {
  transfer: 'probe.transfer',
  'evidence-reselect': 'probe.evidenceReselect',
  entailment: 'probe.entailment',
  locate: 'probe.locate',
};

const STATUS_KEY: Record<SkillRecord['status'], MessageKey> = {
  unobserved: 'status.unobserved',
  'needs-probe': 'status.needsProbe',
  probing: 'status.probing',
  confirmed: 'status.confirmed',
};

export function explain(rec: SkillRecord, locale: Locale = 'vi'): Explanation {
  const t = (key: MessageKey, params?: Record<string, string | number>) =>
    translate(locale, key, params);

  const steps: Explanation['steps'] = [
    { label: t('explain.domain'), detail: `${DOMAIN_LABEL[rec.skill.domain]} · ${rec.skill.key}` },
    { label: t('explain.observed', { n: rec.observed ?? 0 }), detail: t(STATE_KEY[rec.lastState]) },
  ];

  const probe = PROBE_TABLE[rec.lastState];
  if (probe) {
    steps.push({ label: t('explain.probeChosen'), detail: t(PROBE_KEY[probe]) });
  }

  steps.push({ label: t('explain.condition'), detail: t('explain.conditionBody') });

  if (rec.transfers > 0) {
    steps.push({
      label: t('explain.transfersDone'),
      detail: t('mastery.transfers', { n: rec.transfers }),
    });
  }

  return { headline: t(STATUS_KEY[rec.status]), steps, nextVi: nextStep(rec, locale) };
}

function nextStep(rec: SkillRecord, locale: Locale): string {
  const t = (key: MessageKey) => translate(locale, key);
  if (rec.status === 'confirmed') return t('explain.nextConfirmed');

  const probe = PROBE_TABLE[rec.lastState];
  if (!probe) return t('explain.nextNoMark');
  if (probe === 'transfer') return t('explain.nextTransfer');
  return t('explain.nextNarrow');
}
