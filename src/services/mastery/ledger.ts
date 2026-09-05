import {
  skillId,
  type EvidencePointer,
  type Ledger,
  type Observation,
  type ProbeKind,
  type ProofState,
  type SkillRecord,
  type SkillRef,
  type SkillStatus,
} from './types';

/**
 * Bộ quy giản thuần của sổ bằng chứng: quan sát vào, trạng thái kỹ năng ra.
 *
 * KHÔNG GỌI MODEL Ở ĐÂY, và đó là ràng buộc quan trọng nhất của cả module. Model
 * soạn nội dung phép thử, nhưng quyền kết luận "đã hiểu hay chưa" nằm trong hàm
 * thuần này. Mở một khe cho model chạm vào đây thì một lời giải thích trôi chảy
 * sẽ tự phong cho mình là bằng chứng học tập — và cả cơ chế mất nghĩa trong im
 * lặng, vì đầu ra vẫn trông y hệt.
 */

/** So hai con trỏ bằng chứng. Khác loại thì không so được, coi như lệch. */
export function pointsSame(a: EvidencePointer, b: EvidencePointer): boolean {
  if (a.kind !== b.kind) return false;
  switch (a.kind) {
    case 'paragraph':
      return b.kind === 'paragraph' && a.index === b.index;
    case 'transcript-line':
      return b.kind === 'transcript-line' && a.index === b.index;
    case 'step':
      return b.kind === 'step' && a.index === b.index;
    case 'error-tag':
      return b.kind === 'error-tag' && a.tag === b.tag;
  }
}

/**
 * Phân loại một quan sát thành bốn trạng thái quan sát được.
 *
 * Giữ nguyên luật của `services/proofloop/state.ts`, chỉ mở rộng cho nhiều loại
 * con trỏ. Hai lối ra `unobserved` phải đứng trước mọi thứ: không chỉ bằng chứng,
 * hoặc câu không có đối chứng, đều là CHƯA ĐO ĐƯỢC — khác hẳn đo rồi thấy sai.
 * Gộp hai thứ đó lại là cách nhanh nhất để bảng thống kê nói dối.
 */
export function classify(obs: Observation): ProofState {
  if (obs.pointer === null) return 'unobserved';
  if (obs.truth === null) return 'unobserved';

  const aligned = pointsSame(obs.pointer, obs.truth);
  if (obs.answerCorrect) return aligned ? 'aligned-correct' : 'misaligned-correct';
  return aligned ? 'aligned-wrong' : 'misaligned-wrong';
}

/**
 * TRẠNG THÁI → PHÉP THỬ. Cố định, công bố, không do model chọn.
 *
 * Mỗi phép thử cô lập ĐÚNG MỘT biến. Một phép thử vừa đo định vị vừa đo suy luận
 * thì làm xong vẫn không biết hỏng ở đâu.
 */
export const PROBE_TABLE: Readonly<Record<ProofState, ProbeKind | null>> = Object.freeze({
  unobserved: null,
  'aligned-correct': 'transfer',
  'misaligned-correct': 'evidence-reselect',
  'aligned-wrong': 'entailment',
  'misaligned-wrong': 'locate',
});

export function probeFor(state: ProofState): ProbeKind | null {
  return PROBE_TABLE[state];
}

export function emptyLedger(): Ledger {
  return {};
}

function blank(skill: SkillRef, at: string): SkillRecord {
  return {
    skill,
    status: 'unobserved',
    lastState: 'unobserved',
    lastSourceId: null,
    observations: 0,
    observed: 0,
    transfers: 0,
    updatedAt: at,
  };
}

/**
 * Ghi một quan sát THƯỜNG (không phải phép thử) vào sổ.
 *
 * Quan sát thường không bao giờ tự nó tạo ra `confirmed`: làm đúng một câu chỉ
 * cho biết lần này đúng. Nó chỉ đặt ra điều chưa biết và chọn phép thử để làm rõ.
 *
 * Một quan sát mới GỠ LẠI `confirmed` nếu lần này trượt. Mastery là phát biểu về
 * hiện tại, không phải huy chương đã trao — và người học tụt lại là chuyện có
 * thật, một cái sổ không phản ánh được điều đó thì không dùng để dạy được.
 */
export function record(ledger: Ledger, obs: Observation): Ledger {
  const id = skillId(obs.skill);
  const cur = ledger[id] ?? blank(obs.skill, obs.at);
  const state = classify(obs);

  /*
    LƯỢT KHÔNG QUAN SÁT ĐƯỢC THÌ KHÔNG ĐƯỢC XOÁ DẤU VẾT CỦA LƯỢT ĐÃ QUAN SÁT ĐƯỢC.

    Đây là hệ quả trực tiếp của nguyên tắc "không đo được khác đo rồi thấy sai":
    một lượt không mang thông tin thì cũng không được phá thông tin đang có.

    Bản cũ ghi đè `lastState` và `lastSourceId` cho MỌI lượt, và điều đó phá cơ
    chế theo hai đường, cả hai đều im lặng:

    1. `lastState` chọn phép thử tiếp theo. Người học để lộ `misaligned-correct` ở
       câu 1 rồi làm tiếp 9 câu không khoanh gì — trạng thái bị dập về
       `unobserved`, `probeFor` trả null, và phép thử đáng lẽ phải chạy thì không
       bao giờ chạy. Đúng thứ mà cả cơ chế sinh ra để bắt lại bị bỏ lọt.

    2. `lastSourceId` là vế so của điều kiện chuyển giao. Đọc bài A có khoanh, rồi
       lướt bài B không khoanh gì, `lastSourceId` thành B. Phép thử chạy trên A —
       đúng chỗ khó khăn xuất hiện — lại được tính là "nguồn khác" và công nhận.
       Luật chuyển giao bị lộn ngược.
  */
  if (state === 'unobserved') {
    return {
      ...ledger,
      [id]: {
        ...cur,
        observations: cur.observations + 1,
        observed: cur.observed ?? 0,
        updatedAt: obs.at,
      },
    };
  }

  const status: SkillStatus = !obs.answerCorrect
    ? 'needs-probe'
    : cur.status === 'confirmed'
      ? 'confirmed'
      : 'probing';

  return {
    ...ledger,
    [id]: {
      ...cur,
      status,
      lastState: state,
      lastSourceId: obs.sourceId,
      observations: cur.observations + 1,
      observed: (cur.observed ?? 0) + 1,
      updatedAt: obs.at,
    },
  };
}

export type ProbeOutcome = {
  skill: SkillRef;
  kind: ProbeKind;
  passed: boolean;
  /** Nguồn nơi điều chưa biết xuất hiện. */
  sourceId: string;
  /** Nguồn của chính phép thử. Khác `sourceId` thì mới là chuyển giao. */
  probeSourceId: string;
  at: string;
};

/**
 * Ghi kết quả một phép thử.
 *
 * CHỈ `transfer` TRÊN MỘT NGUỒN KHÁC MỚI SINH RA `confirmed`. Hai lối chặn, cả
 * hai đều có lý do và cả hai đều là chỗ dễ bị hạ chuẩn cho bảng trông đẹp hơn:
 *
 *  1. Loại phép thử phải là `transfer`. Vượt được phép thử định vị hay suy luận
 *     nghĩa là đã làm rõ một điều chưa biết — không phải đã thành kỹ năng.
 *
 *  2. Nguồn phải khác nguồn gốc. Làm lại đúng bài cũ thì không tách được "đã
 *     hiểu" khỏi "nhớ đáp án", mà tách được hai thứ đó chính là toàn bộ lý do
 *     phép thử chuyển giao tồn tại.
 */
export function applyOutcome(ledger: Ledger, outcome: ProbeOutcome): Ledger {
  const id = skillId(outcome.skill);
  const cur = ledger[id] ?? blank(outcome.skill, outcome.at);

  const isTransfer = outcome.kind === 'transfer' && outcome.probeSourceId !== outcome.sourceId;

  if (!isTransfer) {
    return {
      ...ledger,
      [id]: {
        ...cur,
        // Phép thử không phải chuyển giao vẫn đổi trạng thái làm việc: qua thì
        // sẵn sàng cho bước chuyển giao, trượt thì còn nguyên điều cần làm rõ.
        status: outcome.passed ? 'probing' : 'needs-probe',
        updatedAt: outcome.at,
      },
    };
  }

  return {
    ...ledger,
    [id]: {
      ...cur,
      status: outcome.passed ? 'confirmed' : 'needs-probe',
      transfers: outcome.passed ? cur.transfers + 1 : cur.transfers,
      updatedAt: outcome.at,
    },
  };
}

export function statusOf(ledger: Ledger, skill: SkillRef): SkillStatus {
  return ledger[skillId(skill)]?.status ?? 'unobserved';
}

/** Kỹ năng đang cần làm rõ, nhiều quan sát nhất lên trước. */
export function needsWork(ledger: Ledger): SkillRecord[] {
  return Object.values(ledger)
    .filter((r) => r.status === 'needs-probe' || r.status === 'probing')
    .sort((a, b) => b.observations - a.observations);
}

export function confirmed(ledger: Ledger): SkillRecord[] {
  return Object.values(ledger).filter((r) => r.status === 'confirmed');
}
