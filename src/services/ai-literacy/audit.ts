import type { Observation, SkillRef } from '@/services/mastery/types';
import { NO_FALSE_ALARM, type AuditItem, type FlawKind } from './flaws';

/**
 * Chấm một lượt soi bản AI — thuần, không gọi model.
 *
 * HAI TRỤC, ĐÚNG NHƯ CÁC MẢNG KHÁC, và đó không phải chuyện dùng lại mã cho tiện:
 *
 *   · trục một — CÓ GÌ SAI KHÔNG (`answerCorrect`)
 *   · trục hai — SAI CÁI GÌ (`pointer`, đối chiếu với lỗi ta đã cấy)
 *
 * Tách hai trục ra mới thấy được trạng thái đáng giá nhất của mảng này:
 * `misaligned-correct` — người học nói "bản này có vấn đề" mà gọi tên sai loại
 * vấn đề. Họ đang ngờ ngợ chứ chưa đọc ra. Một thang điểm đúng/sai gộp hai câu
 * ấy lại và chấm họ ngang với người thật sự bắt được lỗi.
 *
 * BÁO ĐỘNG GIẢ LÀ MỘT KỸ NĂNG RIÊNG. Người kêu "có lỗi" trên mọi bản sẽ bắt trúng
 * mọi bản bẩn, và đó chính là lý do không được gộp họ vào cùng một ô với người
 * đọc được. Bản sạch ghi vào kỹ năng `false-alarm-control`, tách hẳn.
 */

export type AuditAnswer = {
  /** Người học cho rằng bản này có lỗi hay không. */
  flawed: boolean;
  /** Loại lỗi họ gọi tên. `null` khi họ nói bản này sạch. */
  kind: FlawKind | null;
};

/** Nhãn dùng cho trục hai khi bản được cho là sạch. */
const NONE = 'none';

/**
 * Nhãn cho "tôi thấy có lỗi nhưng không gọi được tên".
 *
 * Phải khác `NONE`, và đây là chỗ dễ sai nhất của cả tệp. Gộp hai thứ vào cùng
 * một nhãn thì trên một bản SẠCH, người kêu có lỗi mà không nói được lỗi gì sẽ
 * trùng nhãn với người nói bản này sạch — bộ phân loại đọc ra "chỉ đúng chỗ",
 * và một lượt báo động giả được ghi thành một lượt chỉ chuẩn.
 */
const UNNAMED = 'unnamed';

/**
 * Kỹ năng mà lượt này ghi vào.
 *
 * Bản bẩn ghi vào ĐÚNG HỌ LỖI ĐÃ CẤY, không ghi vào họ mà người học đoán — nếu
 * ghi theo lời người học thì họ tự chọn được mình đang luyện kỹ năng nào, và sổ
 * sẽ đầy những kỹ năng chưa bao giờ được kiểm.
 */
export function auditSkill(item: AuditItem): SkillRef {
  return { domain: 'ai-literacy', key: item.planted ?? NO_FALSE_ALARM };
}

/**
 * Dựng quan sát để gửi lên sổ bằng chứng.
 *
 * `sourceId` phải là định danh của BẢN ĐEM SOI, không phải của người học và cũng
 * không phải một chuỗi mới mỗi lượt: điều kiện chuyển giao so hai `sourceId`, nên
 * đặt bừa sẽ khiến mọi lượt đều tính là "bắt được lỗi này trên một bản khác" và
 * công nhận trở thành thứ phát không cho ai cả.
 */
export function gradeAudit(
  item: AuditItem,
  answer: AuditAnswer,
  sourceId: string,
  at: string,
): Observation {
  const isFlawed = item.planted !== null;

  return {
    skill: auditSkill(item),
    sourceId,
    // Trục một: chỉ hỏi CÓ hay KHÔNG, chưa hỏi là gì.
    answerCorrect: answer.flawed === isFlawed,
    /*
      Trục hai. Người học nói bản sạch thì họ đang chỉ vào "không có lỗi nào", và
      đó là một lời chỉ thật chứ không phải chỗ trống — nên nó là `none`, không
      phải `null`. Để `null` thì bộ phân loại ghi `unobserved`, và một lượt soi
      bản sạch trả lời đúng sẽ biến mất khỏi sổ.
    */
    pointer: { kind: 'error-tag', tag: answer.flawed ? (answer.kind ?? UNNAMED) : NONE },
    truth: { kind: 'error-tag', tag: item.planted ?? NONE },
    at,
  };
}

/**
 * Câu nói lại cho người học sau khi họ trả lời, theo đúng bốn trạng thái.
 *
 * KHÔNG có câu nào phán đoán trạng thái trong đầu họ. "Bạn đoán bừa" là một suy
 * diễn; "bạn nói có lỗi nhưng gọi tên khác với lỗi đã cấy" là một quan sát. Cùng
 * ràng buộc ngôn ngữ với `mastery/explain.ts`, và cùng lý do.
 */
export function auditFeedback(item: AuditItem, answer: AuditAnswer): string {
  const isFlawed = item.planted !== null;

  if (!isFlawed) {
    return answer.flawed
      ? 'Bản này không bị cấy lỗi nào. Báo động khi không có gì sai cũng tốn công đúng như bỏ lọt một lỗi thật.'
      : 'Đúng, bản này sạch. Nhận ra lúc không có gì sai cũng là một phần của việc đọc kết quả máy.';
  }

  if (!answer.flawed) {
    return 'Bản này có một lỗi được cấy sẵn, và nó đã đi qua. Đây là chỗ đáng dừng lại lâu hơn chỗ làm sai một câu đọc hiểu.';
  }

  return answer.kind === item.planted
    ? 'Đúng cả hai vế: có lỗi, và đúng loại lỗi đó.'
    : 'Bạn thấy có vấn đề, nhưng gọi tên khác với lỗi đã cấy. Nhận ra "có gì đó không ổn" và chỉ được đúng chỗ không ổn là hai việc khác nhau.';
}
