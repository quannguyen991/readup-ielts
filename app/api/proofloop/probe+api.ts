import { AiError } from '@/services/ai/errors';
import { chatWithFallback } from '@/services/ai/fallback';
import { buildBlindPrompt, judgeBlindAnswer, readBlindAnswer } from '@/services/proofloop/blind-check';
import {
  buildProbePrompt,
  parseProbeResponse,
  retryNoteFor,
  type RetryReason,
} from '@/services/proofloop/build-probe';
import { checkProbeValidity, type ProbeWarning } from '@/services/proofloop/probe-validity';
import { probeFor } from '@/services/proofloop/probe-table';
import { classify } from '@/services/proofloop/state';
import type { EvidenceMark } from '@/services/proofloop/types';
import { errorText, msg } from '@/lib/server-locale';

/**
 * POST /api/proofloop/probe
 *
 * Dựng MỘT phép thử chẩn đoán cho một lượt trả lời.
 *
 * THỨ TỰ Ở ĐÂY LÀ HỢP ĐỒNG, KHÔNG ĐƯỢC ĐẢO:
 *
 *   1. `classify()` ra trạng thái — thuần, không gọi model
 *   2. `probeFor()` ra LOẠI phép thử — tra bảng cố định, không gọi model
 *   3. chỉ khi đó mới gọi model, và chỉ để DỰNG BẢN THỂ của loại đã định
 *   4. bản nháp đi qua BA hàng rào trước khi tới tay người học
 *
 * Đảo thứ tự — hỏi model "học sinh này nên làm phép thử nào" — là trao quyền
 * quyết định cho thứ không kiểm chứng được. Bảng ở `probe-table.ts` in ra giấy
 * được; một lời gọi model thì không.
 *
 * BA HÀNG RÀO, VÀ VÌ SAO CẦN CẢ BA:
 *
 *   · `validateDraft` — đúng hình dạng, chữ có thật trong bài, không ghi trường cấm
 *   · `checkProbeValidity` — có đo được gì không: đúng nguồn, đúng đoạn, không mớm
 *   · phép thử bịt mắt — che bài đi mà vẫn trả lời được thì câu đó không đo đọc hiểu
 *
 * Hàng rào một bắt lỗi hình thức, hàng rào hai bắt lỗi thiết kế đề, hàng rào ba
 * bắt thứ không luật nào bắt được. Một câu lọt cả hai hàng đầu vẫn có thể vô
 * dụng: "According to the passage, is water wet?" đúng định dạng, trích dẫn
 * nguyên văn, đủ phương án — và trả lời được mà không cần mở bài ra.
 *
 * Chạy server-side để khoá proxy không xuống client.
 */

const SYSTEM = [
  'You build diagnostic probes for IELTS Reading learners.',
  'You never judge whether a learner has understood anything.',
  'A fixed rule engine makes that judgement; you only build the probe it asked for.',
  'You always answer with one JSON object and nothing else.',
].join(' ');

const BLIND_SYSTEM = 'You answer multiple-choice questions. You always reply with one JSON object.';

type Body = {
  answerCorrect?: boolean;
  mark?: EvidenceMark | null;
  truthParagraphIndex?: number | null;
  passage?: string;
  questionPrompt?: string;
  correctAnswer?: string;
  truthEvidenceText?: string;
  /** Nguồn nơi khó khăn xuất hiện. */
  sourceId?: string;
  /** Bài KHÁC để chạy phép thử chuyển giao, và định danh của nó. */
  transferPassage?: string;
  transferSourceId?: string;
};

/** Biên nhận: từng hàng rào đã làm gì. Đây là thứ đếm được và công bố được. */
type Receipt = {
  attempts: number;
  /** Lý do loại của từng lần thử, theo thứ tự. */
  rejections: string[];
  warnings: ProbeWarning[];
  blind: string | null;
};

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as Body;

    if (typeof body.answerCorrect !== 'boolean') {
      return Response.json({ error: msg(request, 'Thiếu answerCorrect.', 'answerCorrect is required.') }, { status: 400 });
    }
    if (!body.passage || !body.questionPrompt || !body.correctAnswer) {
      return Response.json(
        { error: msg(request, 'Thiếu passage, questionPrompt hoặc correctAnswer.', 'passage, questionPrompt or correctAnswer is missing.') },
        { status: 400 },
      );
    }

    const state = classify({
      answerCorrect: body.answerCorrect,
      mark: body.mark ?? null,
      truthParagraphIndex: body.truthParagraphIndex ?? null,
    });

    const kind = probeFor(state);

    // `unobserved`: chưa quan sát được gì thì chưa có điều chưa biết nào để làm
    // rõ. Trả về ngay — gọi model ở đây là đốt tiền để hỏi một câu vô nghĩa.
    if (kind === null) {
      return Response.json({ state, kind: null, reason: 'unobserved' });
    }

    const difficultySourceId = body.sourceId ?? 'unknown';

    /*
      PHÉP THỬ CHUYỂN GIAO PHẢI CHẠY TRÊN BÀI KHÁC, KHÔNG CÓ NGOẠI LỆ.

      Đây là điều kiện duy nhất sinh ra `confirmed` trong sổ bằng chứng, nên nó
      cũng là chỗ dễ bị bào mòn nhất: dựng đại một câu trên chính bài cũ thì màn
      hình vẫn chạy, người học vẫn thấy có phép thử, và cái sổ vẫn ghi "đã công
      nhận" — chỉ có điều nó không còn tách được "đã hiểu" khỏi "nhớ bài này".

      Không có bài khác thì nói thẳng là không chạy được. Trả về `null` kèm lý do
      là câu trả lời trung thực; dựng bừa mới là hỏng.
    */
    const isTransfer = kind === 'transfer';
    if (isTransfer && (!body.transferPassage || !body.transferSourceId)) {
      return Response.json({ state, kind, draft: null, reason: 'no-transfer-source' });
    }

    const probePassage = isTransfer ? (body.transferPassage as string) : body.passage;
    const probeSourceId = isTransfer ? (body.transferSourceId as string) : difficultySourceId;
    const paragraphs = probePassage.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

    const ctx = { passage: probePassage, expectedKind: kind };
    const promptFor = (because: RetryReason | null) =>
      buildProbePrompt({
        kind,
        passage: probePassage,
        questionPrompt: body.questionPrompt as string,
        correctAnswer: body.correctAnswer as string,
        truthEvidenceText: body.truthEvidenceText ?? '',
        learnerPhrase: body.mark?.phrase ?? null,
        retryBecause: because,
      });

    const receipt: Receipt = { attempts: 0, rejections: [], warnings: [], blind: null };

    /*
      THỬ VÀI LẦN RỒI DỪNG — chuyển giao ba lần, ba loại còn lại hai.

      Model trượt luật kiểm là chuyện thường, hay gặp nhất là chép evidenceText
      không nguyên văn, và một lần thử lại vớt được phần lớn. Mỗi lần thử lại
      đều được NÓI CHO BIẾT vì sao lần trước bị loại; không nói thì chỉ là quay
      xúc xắc thêm lượt nữa với đúng lời dặn cũ.

      Chuyển giao được thêm một lần vì nó phải qua thêm một hàng rào, nên xác
      suất trượt cao hơn hẳn. Cùng số lần thử thì loại khó nhất lại là loại hay
      bỏ cuộc nhất, mà đó là loại duy nhất sinh ra `confirmed`.

      Nhưng KHÔNG thử lại mãi: hỏng hết lượt thường là bài đọc thật sự không đỡ
      nổi phép thử loại này, và lúc đó câu trả lời đúng là nói ra chứ không phải
      quay tiếp cho tới khi model bịa ra thứ lọt lưới.
    */
    const maxAttempts = isTransfer ? 3 : 2;
    let because: RetryReason | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      receipt.attempts = attempt;

      const result = await chatWithFallback({
        purpose: 'questions',
        system: SYSTEM,
        user: promptFor(because),
        temperature: attempt === 1 ? 0.3 : 0.5,
      });

      const parsed = parseProbeResponse(result.text, ctx);
      if (!parsed.ok) {
        receipt.rejections.push(parsed.reason);
        because = retryNoteFor(parsed.reason) ? (parsed.reason as RetryReason) : null;
        // Model tự nhận bài không đủ căn cứ. Đó là câu trả lời đúng, không phải
        // lỗi tạm thời — thử lại chỉ ép nó đổi ý mà không có thêm thông tin nào.
        if (parsed.reason === 'insufficient-evidence') break;
        continue;
      }

      const validity = checkProbeValidity({
        draft: parsed.draft,
        kind,
        paragraphs,
        probeSourceId,
        difficultySourceId,
        originalStem: body.questionPrompt,
        originalEvidenceText: body.truthEvidenceText ?? '',
      });
      receipt.warnings = validity.warnings;

      if (!validity.ok) {
        receipt.rejections.push(validity.reason);
        because = retryNoteFor(validity.reason) ? (validity.reason as RetryReason) : null;
        continue;
      }

      /*
        HÀNG RÀO BA — CHỈ CHẠY CHO PHÉP THỬ CHUYỂN GIAO.

        Không phải để tiết kiệm, mà vì đây là loại duy nhất sinh ra `confirmed`.
        Một phép thử chuyển giao hỏng thì cái sổ công nhận nhầm — thiệt hại lớn
        hơn hẳn ba loại còn lại, vốn chỉ dẫn tới một câu hỏi nữa.

        Hỏng lời gọi thì ĐI TIẾP với phép thử đã dựng, và ghi vào biên nhận là
        chưa kiểm được. Chặn người học lại vì hàng rào tự nó hỏng là phạt nhầm
        người; nói dối rằng đã kiểm mới là điều không được phép.
      */
      if (isTransfer) {
        try {
          const blind = await chatWithFallback({
            purpose: 'questions',
            system: BLIND_SYSTEM,
            user: buildBlindPrompt(parsed.draft),
            temperature: 0,
          });
          const answer = readBlindAnswer(blind.text, parsed.draft.options.length);
          if (answer === null) {
            receipt.blind = 'unreadable';
          } else {
            const verdict = judgeBlindAnswer(parsed.draft, answer);
            receipt.blind = verdict.note;
            if (!verdict.ok) {
              receipt.rejections.push(verdict.note);
              because = 'answerable-without-passage';
              continue;
            }
          }
        } catch {
          receipt.blind = 'check-failed';
        }
      }

      return Response.json({ state, kind, draft: parsed.draft, model: result.model, receipt });
    }

    return Response.json({
      state,
      kind,
      draft: null,
      reason: receipt.rejections[receipt.rejections.length - 1] ?? 'unknown',
      receipt,
    });
  } catch (err) {
    if (err instanceof AiError) {
      return Response.json({ error: errorText(request, err, err.message, "Couldn't build the check question right now. Please try again shortly."), code: err.code }, { status: 502 });
    }
    return Response.json({ error: msg(request, 'Không dựng được phép thử.', "Couldn't build the check question.") }, { status: 500 });
  }
}
