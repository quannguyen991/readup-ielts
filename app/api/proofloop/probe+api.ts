import { AiError } from '@/services/ai/errors';
import { chatWithFallback } from '@/services/ai/fallback';
import { buildProbePrompt, parseProbeResponse } from '@/services/proofloop/build-probe';
import { probeFor } from '@/services/proofloop/probe-table';
import { classify } from '@/services/proofloop/state';
import type { EvidenceMark } from '@/services/proofloop/types';

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
 *
 * Đảo thứ tự — hỏi model "học sinh này nên làm phép thử nào" — là trao quyền
 * quyết định cho thứ không kiểm chứng được. Bảng ở `probe-table.ts` in ra giấy
 * được; một lời gọi model thì không.
 *
 * Chạy server-side để khoá proxy không xuống client.
 */

const SYSTEM = [
  'You build diagnostic probes for IELTS Reading learners.',
  'You never judge whether a learner has understood anything.',
  'A fixed rule engine makes that judgement; you only build the probe it asked for.',
  'You always answer with one JSON object and nothing else.',
].join(' ');

type Body = {
  answerCorrect?: boolean;
  mark?: EvidenceMark | null;
  truthParagraphIndex?: number | null;
  passage?: string;
  questionPrompt?: string;
  correctAnswer?: string;
  truthEvidenceText?: string;
};

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as Body;

    if (typeof body.answerCorrect !== 'boolean') {
      return Response.json({ error: 'Thiếu answerCorrect.' }, { status: 400 });
    }
    if (!body.passage || !body.questionPrompt || !body.correctAnswer) {
      return Response.json(
        { error: 'Thiếu passage, questionPrompt hoặc correctAnswer.' },
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

    const input = {
      kind,
      passage: body.passage,
      questionPrompt: body.questionPrompt,
      correctAnswer: body.correctAnswer,
      truthEvidenceText: body.truthEvidenceText ?? '',
      learnerPhrase: body.mark?.phrase ?? null,
    };

    const ctx = { passage: body.passage, expectedKind: kind };
    const prompt = buildProbePrompt(input);

    /*
      THỬ ĐÚNG HAI LẦN.

      Model trượt luật kiểm là chuyện thường — hay gặp nhất là chép evidenceText
      không nguyên văn. Một lần thử lại vớt được phần lớn.

      Nhưng KHÔNG thử lại mãi: hỏng hai lần liên tiếp thường là bài đọc thật sự
      không đỡ nổi phép thử loại này, và lúc đó câu trả lời đúng là nói ra chứ
      không phải quay tiếp cho tới khi model bịa ra thứ lọt lưới.
    */
    let lastReason = 'unknown';
    for (let attempt = 1; attempt <= 2; attempt++) {
      const result = await chatWithFallback({
        purpose: 'questions',
        system: SYSTEM,
        user: prompt,
        temperature: attempt === 1 ? 0.3 : 0.1,
      });

      const parsed = parseProbeResponse(result.text, ctx);
      if (parsed.ok) {
        return Response.json({ state, kind, draft: parsed.draft, model: result.model });
      }

      lastReason = parsed.reason;

      // Model tự nhận bài không đủ căn cứ. Đó là câu trả lời đúng, không phải
      // lỗi tạm thời — thử lại chỉ ép nó đổi ý mà không có thêm thông tin nào.
      if (parsed.reason === 'insufficient-evidence') break;
    }

    return Response.json({ state, kind, draft: null, reason: lastReason });
  } catch (err) {
    if (err instanceof AiError) {
      return Response.json({ error: err.message, code: err.code }, { status: 502 });
    }
    return Response.json({ error: 'Không dựng được phép thử.' }, { status: 500 });
  }
}
