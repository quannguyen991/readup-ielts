import type { Ledger, SkillRecord, SkillStatus } from './types';
import { skillId } from './types';

/**
 * Gộp sổ bằng chứng của nhiều người học thành bức tranh của một lớp.
 *
 * VÌ SAO GIÁO VIÊN CẦN ĐÚNG THỨ NÀY, KHÔNG PHẢI MỘT BẢNG ĐIỂM. Bảng điểm nói ai
 * cao ai thấp — thứ giáo viên đã biết. Cái họ không biết là DẠY GÌ VÀO BUỔI SAU,
 * và câu ấy chỉ trả lời được khi thấy chỗ vướng CHUNG: mười tám em cùng chỉ sai
 * đoạn ở dạng câu suy luận là một tiết dạy, còn mười tám em vướng mười tám chỗ
 * khác nhau là mười tám cuộc trò chuyện riêng. Hai tình huống ấy hiện ra khác
 * hẳn nhau ở đây, mà một cột điểm trung bình thì không.
 *
 * KHÔNG CÓ TÊN, KHÔNG CÓ ĐIỂM. Đầu vào là những bản xuất ẩn danh; mỗi bản chỉ
 * mang một mã do người học tự đặt. Xếp hạng học sinh không phải việc mà cơ chế
 * này sinh ra để làm, và mở cửa cho nó sẽ kéo cả app về đúng chỗ nó đang tránh.
 *
 * CHẠY HOÀN TOÀN TRÊN MÁY. Giáo viên nhận file, mở lên, xem — không cần tài
 * khoản, không cần máy chủ, không cần mạng ổn định. Đó là điều kiện để dùng được
 * ở lớp học không có hạ tầng, chứ không phải một sự đơn giản hoá tạm thời.
 */

/** Một bản xuất từ máy người học. */
export type LearnerExport = {
  /** Mã do người học tự đặt. KHÔNG phải tên, và app không đối chiếu với ai cả. */
  learnerCode: string;
  exportedAt: string;
  ledger: Ledger;
};

export type SkillSummary = {
  domain: string;
  key: string;
  /** Số người học đã có quan sát ở kỹ năng này. */
  learners: number;
  counts: Record<SkillStatus, number>;
  /** Tổng số lượt quan sát trên toàn lớp — kỹ năng gặp nhiều hay ít. */
  observations: number;
  /**
   * Tỉ lệ người đang mắc: cần làm rõ hoặc chưa đủ căn cứ.
   *
   * Dùng để xếp thứ tự, và cố ý KHÔNG gọi là "tỉ lệ yếu": nó là tỉ lệ chưa có
   * bằng chứng, không phải một phán đoán về năng lực.
   */
  stuckRatio: number;
};

const EMPTY_COUNTS: Record<SkillStatus, number> = {
  unobserved: 0,
  'needs-probe': 0,
  probing: 0,
  confirmed: 0,
};

/**
 * Gộp nhiều bản xuất thành bảng theo kỹ năng.
 *
 * Bản xuất trùng `learnerCode` chỉ tính MỘT LẦN, lấy bản mới nhất: người học gửi
 * lại sau khi làm thêm là chuyện thường, và cộng dồn cả hai sẽ thổi phồng sĩ số
 * lớp lên gấp đôi ở đúng những kỹ năng chăm chỉ nhất.
 */
export function summariseCohort(exports: readonly LearnerExport[]): SkillSummary[] {
  const latest = new Map<string, LearnerExport>();
  for (const e of exports) {
    const cur = latest.get(e.learnerCode);
    if (!cur || e.exportedAt > cur.exportedAt) latest.set(e.learnerCode, e);
  }

  const bySkill = new Map<string, SkillSummary>();

  for (const e of latest.values()) {
    for (const rec of Object.values(e.ledger)) {
      const id = skillId(rec.skill);
      const cur =
        bySkill.get(id) ??
        ({
          domain: rec.skill.domain,
          key: rec.skill.key,
          learners: 0,
          counts: { ...EMPTY_COUNTS },
          observations: 0,
          stuckRatio: 0,
        } satisfies SkillSummary);

      cur.learners += 1;
      cur.counts[rec.status] += 1;
      cur.observations += rec.observations;
      bySkill.set(id, cur);
    }
  }

  const out = [...bySkill.values()];
  for (const s of out) {
    const stuck = s.counts['needs-probe'] + s.counts.probing;
    s.stuckRatio = s.learners === 0 ? 0 : stuck / s.learners;
  }

  /*
    Xếp theo SỐ NGƯỜI ĐANG MẮC, không theo tỉ lệ.

    Tỉ lệ đưa lên đầu những kỹ năng chỉ hai em chạm tới và cả hai đều mắc — 100%
    nghe rất khẩn cấp nhưng đó là hai em. Số tuyệt đối đưa lên đầu chỗ đáng dạy
    cho cả lớp, và tỉ lệ vẫn hiện bên cạnh cho ai muốn nhìn kỹ.
  */
  return out.sort((a, b) => {
    const sa = a.counts['needs-probe'] + a.counts.probing;
    const sb = b.counts['needs-probe'] + b.counts.probing;
    return sb - sa || b.observations - a.observations;
  });
}

/** Kỹ năng đáng dạy chung: đủ đông người mắc để bỏ ra một tiết. */
export function worthTeaching(summaries: readonly SkillSummary[], minLearners = 3): SkillSummary[] {
  return summaries.filter((s) => s.counts['needs-probe'] + s.counts.probing >= minLearners);
}

/**
 * Bản xuất ẩn danh từ sổ của một người học.
 *
 * Chỉ lấy đúng những trường cần cho việc gộp lớp. `lastSourceId` bị BỎ: nó là id
 * bài đọc hay id bài viết, tức là dấu vết người ấy đã làm gì và lúc nào — thứ
 * không cần cho bức tranh lớp học và không nên rời khỏi máy họ.
 */
export function buildExport(ledger: Ledger, learnerCode: string): LearnerExport {
  const clean: Ledger = {};
  for (const [id, rec] of Object.entries(ledger)) {
    clean[id] = stripSource(rec);
  }
  return { learnerCode: learnerCode.trim(), exportedAt: new Date().toISOString(), ledger: clean };
}

function stripSource(rec: SkillRecord): SkillRecord {
  return { ...rec, lastSourceId: null };
}

/** Đọc một file xuất, từ chối thứ không đúng hình dạng thay vì đoán. */
export function parseExport(raw: unknown): LearnerExport | { rejected: string } {
  const o = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : null;
  if (!o) return { rejected: 'không phải JSON hợp lệ' };
  if (typeof o.learnerCode !== 'string' || o.learnerCode.trim() === '') {
    return { rejected: 'thiếu mã người học' };
  }
  if (typeof o.exportedAt !== 'string') return { rejected: 'thiếu mốc thời gian' };
  if (typeof o.ledger !== 'object' || o.ledger === null) return { rejected: 'thiếu sổ' };

  return {
    learnerCode: o.learnerCode.trim(),
    exportedAt: o.exportedAt,
    ledger: o.ledger as Ledger,
  };
}
