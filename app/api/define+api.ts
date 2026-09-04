import { chatWithFallback } from '@/services/ai/fallback';

/**
 * POST /api/define  { word, sentence, mode? }
 *
 * mode 'word'     → nghĩa của từ ĐÚNG theo ngữ cảnh câu đó
 * mode 'phrase'   → dịch cả cụm (collocation quan trọng hơn từ lẻ ở band 7+)
 * mode 'sentence' → giải thích cấu trúc ngữ pháp + dịch cả câu
 *
 * Đi qua bộ hai proxy. Bản trước gọi thẳng SDK Anthropic bằng
 * `ANTHROPIC_API_KEY` — biến chưa bao giờ được cấu hình, nên tra từ trả 503.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as {
      word?: string;
      sentence?: string;
      mode?: 'word' | 'phrase' | 'sentence';
    };

    const target = body.word?.trim();
    const sentence = body.sentence?.trim() ?? '';
    const mode = body.mode ?? 'word';

    if (!target && mode !== 'sentence') {
      return Response.json({ error: 'Thiếu từ cần tra.' }, { status: 400 });
    }

    const prompt =
      mode === 'sentence'
        ? [
            `Câu tiếng Anh: "${sentence}"`,
            '',
            'Trả về JSON thuần (không markdown fence):',
            '{"structure":"phân tích cấu trúc ngữ pháp bằng tiếng Việt, ngắn gọn","translation":"dịch cả câu sang tiếng Việt"}',
          ].join('\n')
        : [
            `${mode === 'phrase' ? 'Cụm từ' : 'Từ'}: "${target}"`,
            `Câu chứa nó: "${sentence}"`,
            '',
            'Trả về JSON thuần (không markdown fence):',
            '{"definitionContext":"nghĩa tiếng Anh ĐÚNG theo ngữ cảnh câu này, một dòng",',
            '"definitionVi":"nghĩa tiếng Việt theo đúng ngữ cảnh đó",',
            '"examples":["câu ví dụ 1","câu ví dụ 2"]}',
          ].join('\n');

    const { text } = await chatWithFallback({
      purpose: 'define',
      system:
        'Bạn là trợ giảng IELTS. Trả lời bằng JSON thuần, không markdown fence, không lời dẫn.',
      user: prompt,
      temperature: 0.2,
    });

    return Response.json(parseJson(text));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi không xác định';
    return Response.json({ error: message }, { status: 502 });
  }
}

function parseJson(raw: string): Record<string, unknown> {
  const cleaned = raw.replace(/^\s*```(?:json)?/i, '').replace(/```\s*$/, '');
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) return {};

  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return {};
  }
}
