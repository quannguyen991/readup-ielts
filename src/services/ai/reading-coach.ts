import { chatWithFallback, extractJson } from './fallback';

/**
 * Từ những câu SAI của một lượt Reading, chỉ ra CHIẾN LƯỢC làm bài.
 *
 * SERVER-ONLY.
 *
 * VÌ SAO KHÔNG PHẢI "GIẢI THÍCH TỪNG CÂU": app đã có sẵn lời giải và câu bằng
 * chứng cho mọi câu hỏi, sinh bằng code, miễn phí và luôn đúng. Gọi AI để nói
 * lại đúng thứ đó là đốt tiền cho một bản kém tin cậy hơn.
 *
 * Thứ code KHÔNG làm được là nhìn CẢ LƯỢT LÀM BÀI và trả lời: "bạn sai bốn câu,
 * ba trong đó cùng một kiểu bẫy — bạn đang đọc lướt tìm từ khớp thay vì đọc
 * nghĩa". Đó là chẩn đoán theo mẫu hình, và nó chỉ có nghĩa khi nhìn nhiều câu
 * cùng lúc.
 *
 * Nên bài này gửi lên: dạng câu, đề, đáp án đã chọn, đáp án đúng, câu bằng
 * chứng — và đòi về ba thứ: mẫu hình lỗi, chiến lược cho từng dạng, và MỘT việc
 * cần sửa trước tiên.
 */

export type WrongAnswer = {
  questionId: string;
  type: string;
  typeLabel: string;
  prompt: string;
  userAnswer: string | null;
  correctAnswer: string;
  evidenceText: string;
};

export type ReadingCoaching = {
  /** Một câu tóm tắt: lỗi lớn nhất của lượt này là gì. */
  headline: string;
  patterns: Array<{
    typeLabel: string;
    wrongCount: number;
    diagnosis: string;
    strategy: string[];
  }>;
  perQuestion: Array<{
    questionId: string;
    whyWrong: string;
    signal: string;
  }>;
  /** Việc cụ thể cần làm ở lượt sau. Đúng một việc, không phải một danh sách. */
  topPriority: string;
  model: string;
};

const SYSTEM = [
  'Bạn là giáo viên luyện IELTS/SAT Reading, đang xem lại một lượt làm bài của học viên.',
  '',
  'Bạn CHỈ nhận được những câu học viên làm SAI. Với mỗi câu có: dạng câu hỏi, đề bài,',
  'đáp án học viên chọn, đáp án đúng, và câu trong bài chứa bằng chứng.',
  '',
  'NHIỆM VỤ — theo thứ tự quan trọng:',
  '1. TÌM MẪU HÌNH. Nhiều câu sai cùng một kiểu bẫy thì đó mới là thứ đáng nói.',
  '   Đừng giải thích lại từng câu một cách rời rạc — app đã có lời giải sẵn cho việc đó.',
  '2. CHIẾN LƯỢC LÀM BÀI cho từng dạng học viên đang yếu: các bước cụ thể, làm được ngay',
  '   ở lượt sau. Không nói chung chung kiểu "đọc kỹ hơn" hay "luyện tập nhiều hơn".',
  '3. MỘT việc ưu tiên duy nhất. Không phải danh sách năm việc — người học chỉ sửa được',
  '   một thói quen mỗi lần.',
  '',
  'QUY TẮC:',
  '- Viết bằng TIẾNG VIỆT. Giữ nguyên tiếng Anh cho phần trích từ bài và từ khoá.',
  '- Nói rõ bẫy nằm ở đâu: từ đồng nghĩa, phủ định, giới hạn (only/all/some), thông tin',
  '  đúng nhưng không phải điều được hỏi, hay đọc lướt bắt từ khớp.',
  '- Không an ủi, không khen xã giao. Học viên cần biết mình hỏng ở đâu.',
  '',
  'Trả về DUY NHẤT một khối JSON:',
  '{',
  '  "headline": "một câu, nói thẳng lỗi lớn nhất của lượt này",',
  '  "patterns": [',
  '    {"typeLabel":"tên dạng câu","wrongCount":3,"diagnosis":"vì sao hay sai dạng này",',
  '     "strategy":["bước 1 làm gì","bước 2 làm gì","bước 3 làm gì"]}',
  '  ],',
  '  "perQuestion": [',
  '    {"questionId":"…","whyWrong":"vì sao đáp án đã chọn là bẫy",',
  '     "signal":"dấu hiệu trong đề hoặc trong bài lẽ ra phải nhận ra"}',
  '  ],',
  '  "topPriority": "một việc duy nhất cần sửa ở lượt sau"',
  '}',
].join('\n');

export async function coachReading(input: {
  articleTitle: string;
  total: number;
  correct: number;
  wrong: WrongAnswer[];
}): Promise<ReadingCoaching> {
  const body = {
    bai: input.articleTitle,
    ketQua: `${input.correct}/${input.total}`,
    cauSai: input.wrong.map((w) => ({
      id: w.questionId,
      dang: w.typeLabel,
      de: w.prompt,
      daChon: w.userAnswer ?? '(bỏ trống)',
      dapAnDung: w.correctAnswer,
      bangChung: w.evidenceText,
    })),
  };

  const result = await chatWithFallback({
    purpose: 'coach',
    system: SYSTEM,
    // Nhiệt độ thấp: chẩn đoán lỗi không phải chỗ để sáng tạo, và hai lần xem
    // lại cùng một lượt bài mà ra hai kết luận khác nhau thì không ai tin cả.
    temperature: 0.2,
    user: JSON.stringify(body),
  });

  const parsed = extractJson<Omit<ReadingCoaching, 'model'>>(result.text);

  return {
    headline: typeof parsed.headline === 'string' ? parsed.headline : '',
    patterns: Array.isArray(parsed.patterns) ? parsed.patterns.slice(0, 6) : [],
    /*
      Chỉ giữ phần chẩn đoán cho những câu THẬT SỰ có trong lượt này.

      Model đôi khi bịa thêm một `questionId` không tồn tại, và giao diện sẽ hiện
      một khối nhận xét không gắn với câu nào — người học đọc xong đi tìm câu đó
      trong bài mà không thấy.
    */
    perQuestion: (Array.isArray(parsed.perQuestion) ? parsed.perQuestion : []).filter((q) =>
      input.wrong.some((w) => w.questionId === q.questionId),
    ),
    topPriority: typeof parsed.topPriority === 'string' ? parsed.topPriority : '',
    model: result.model,
  };
}
