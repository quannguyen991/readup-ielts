import type { GeneratedQuestion } from './types';

export type LinearStep1 = {
  chips: Array<{ en: string; vi: string }>;
  intent: string;
};

export type LinearStep2 = {
  strategy: string;
  keywords: string[];
  paragraphIndex: number;
  evidenceQuote: string;
};

export type LinearStep3 = {
  evidenceText: string;
  analysis: string;
  comparison: string;
  conclusion: string;
  trapNote?: string;
};

export type LinearExplanationData = {
  step1: LinearStep1;
  step2: LinearStep2;
  step3: LinearStep3;
};

/**
 * Sinh cấu trúc giải thích chi tiết theo phương pháp Linearthinking (3 bước)
 * tương tự mô hình của DOL / IELTS test chuẩn.
 */
export function buildLinearExplanation(
  question: GeneratedQuestion,
  userAnswer: string | null | undefined,
  isCorrect: boolean,
  paragraphs: string[],
): LinearExplanationData {
  const pIndex = question.evidenceParagraphIndex ?? 0;
  const paragraphText = paragraphs[pIndex] ?? '';
  const evidence = question.evidenceText || (paragraphText ? paragraphText.slice(0, 160) + '...' : '');
  const prompt = question.prompt.replace(/^[–-]\s*/, '').trim();
  const correct = question.correctAnswer.trim();
  const user = (userAnswer ?? '').trim();

  // Step 1: Simplify prompt into components
  const step1 = generateStep1(question, prompt);

  // Step 2: Locate strategy
  const step2 = generateStep2(question, prompt, pIndex, evidence);

  // Step 3: Read evidence and compare
  const step3 = generateStep3(question, prompt, correct, user, isCorrect, evidence, pIndex);

  return { step1, step2, step3 };
}

function generateStep1(question: GeneratedQuestion, prompt: string): LinearStep1 {
  const words = prompt.split(/\s+/);
  const chips: Array<{ en: string; vi: string }> = [];

  // Tách câu thành các cụm có nghĩa (chủ ngữ, vị ngữ, bổ ngữ)
  if (words.length <= 6) {
    chips.push({ en: prompt, vi: translatePromptChunk(prompt) });
  } else {
    // Tách vế đầu (chủ ngữ / điều kiện) và vế sau (vị ngữ / kết quả)
    const mid = Math.min(Math.ceil(words.length / 2), 6);
    const part1 = words.slice(0, mid).join(' ');
    const part2 = words.slice(mid).join(' ');
    chips.push({ en: part1, vi: translatePromptChunk(part1) });
    chips.push({ en: part2, vi: translatePromptChunk(part2) });
  }

  let intent = '';
  switch (question.type) {
    case 'true_false_not_given':
    case 'yes_no_not_given':
      intent = `Cần kiểm tra: Thông tin trong bài có xác nhận hoặc mâu thuẫn với nhận định "${prompt}" hay không. Chú ý các từ hạn định (all, only, no other, always, depends on...).`;
      break;
    case 'summary_completion':
    case 'sentence_completion':
    case 'note_completion':
    case 'table_completion':
    case 'flow_chart_completion':
    case 'short_answer':
      intent = `Cần tìm: Từ hoặc cụm từ nguyên văn trong bài để điền vào chỗ trống, đảm bảo đúng ngữ pháp và giới hạn từ cho phép.`;
      break;
    case 'matching_headings':
      intent = `Cần xác định: Ý chính (Main Idea) bao quát toàn bộ đoạn văn, tránh nhầm lẫn với chi tiết phụ (Supporting Detail) hoặc ví dụ minh họa.`;
      break;
    case 'matching_information':
      intent = `Cần tìm: Đoạn văn nào chứa thông tin cụ thể được đề cập trong câu hỏi.`;
      break;
    case 'matching_features':
    case 'matching_sentence_endings':
      intent = `Cần đối chiếu: Nối đúng đặc điểm hoặc vế kết thúc phù hợp dựa trên nội dung bài đọc.`;
      break;
    default:
      intent = `Cần chọn: Phương án trả lời chính xác nhất được khẳng định bởi dẫn chứng trong bài.`;
      break;
  }

  return { chips, intent };
}

function generateStep2(
  question: GeneratedQuestion,
  prompt: string,
  pIndex: number,
  evidence: string,
): LinearStep2 {
  // Trích các từ khoá nổi bật (tên riêng, số, thuật ngữ, danh từ)
  const capitalized = prompt.match(/\b[A-Z][a-z]+\b/g) ?? [];
  const numbers = prompt.match(/\b\d+\b/g) ?? [];
  const importantWords = prompt
    .split(/\s+/)
    .map((w) => w.replace(/[^a-zA-Z0-9]/g, ''))
    .filter((w) => w.length > 4 && !['about', 'their', 'which', 'there', 'where', 'these', 'those'].includes(w.toLowerCase()));

  const keywords = Array.from(new Set([...capitalized, ...numbers, ...importantWords.slice(0, 3)]));

  const kwStr = keywords.length > 0 ? keywords.slice(0, 3).map((k) => `"${k}"`).join(', ') : `các từ khoá chính`;
  const strategy = `Câu hỏi có từ khoá định vị ${kwStr}; ta scan nhanh trong bài đến khi gặp từ khoá hoặc cụm đồng nghĩa tương đương. Ở đoạn ${pIndex + 1} có cụm thông tin liên quan => Đây là vùng cần đọc kĩ.`;

  return {
    strategy,
    keywords,
    paragraphIndex: pIndex,
    evidenceQuote: evidence,
  };
}

function generateStep3(
  question: GeneratedQuestion,
  prompt: string,
  correct: string,
  user: string,
  isCorrect: boolean,
  evidence: string,
  pIndex: number,
): LinearStep3 {
  // Nếu câu hỏi đã có explanation sẵn từ bộ đề, ưu tiên tích hợp
  const rawExpl = question.explanation ? question.explanation.trim() : '';

  let analysis = '';
  let comparison = '';
  let conclusion = '';
  let trapNote: string | undefined = undefined;

  const isTFNG = question.type === 'true_false_not_given' || question.type === 'yes_no_not_given';

  if (isTFNG) {
    const cNorm = correct.toUpperCase();
    const isNotGiven = cNorm.includes('NOT') || cNorm.includes('GIVEN');
    const isTrue = !isNotGiven && (cNorm.includes('TRUE') || /\bYES\b/.test(cNorm));
    const isFalse = !isNotGiven && (cNorm.includes('FALSE') || /\bNO\b/.test(cNorm));

    if (isTrue) {
      analysis = `Đoạn ${pIndex + 1} nêu: "${evidence}". Thông tin này khẳng định đúng sự thật được nêu trong đề bài.`;
      comparison = `Nội dung câu hỏi hoàn toàn trùng khớp / paraphrase lại đúng ý của câu trong bài đọc.`;
      conclusion = `Đáp án chính xác là ${correct}.`;
    } else if (isFalse) {
      analysis = `Đoạn ${pIndex + 1} nêu: "${evidence}". Thông tin trong bài trái ngược trực tiếp với nhận định của đề bài.`;
      comparison = `Có sự mâu thuẫn trực tiếp (contradiction) giữa dữ kiện bài đọc và câu khẳng định.`;
      conclusion = `Đáp án chính xác là ${correct}.`;
      if (!isCorrect && (user.toUpperCase().includes('NOT') || user.toUpperCase().includes('GIVEN'))) {
        trapNote = `Bẫy thường gặp: Nhầm lẫn giữa FALSE và NOT GIVEN. Khi bài đọc có thông tin nói về vấn đề nhưng nội dung NGƯỢC LẠI, đáp án phải là FALSE/NO.`;
      }
    } else {
      // NOT GIVEN
      analysis = `Đoạn ${pIndex + 1} có nhắc đến các yếu tố liên quan: "${evidence}", nhưng KHÔNG hề khẳng định hay phủ định điều mà đề bài đưa ra.`;
      comparison = `Không có đủ căn cứ trong bài để xác minh câu khẳng định này. Ta không được tự suy diễn ngoài đời thực.`;
      conclusion = `Đáp án chính xác là ${correct}.`;
      if (!isCorrect) {
        trapNote = `Bẫy thường gặp: Người học hay suy luận logic thông thường hoặc nhầm lẫn giữa thông tin chung (ví dụ về loài chim nói chung) với thông tin riêng (loài vẹt này). Vì bài không xác nhận nên phải chọn NOT GIVEN.`;
      }
    }
  } else if (question.type === 'summary_completion' || question.type === 'sentence_completion' || question.type === 'note_completion') {
    analysis = `Đoạn ${pIndex + 1} chứa câu dẫn: "${evidence}".`;
    comparison = `Đối chiếu cấu trúc ngữ pháp và từ ngữ xung quanh chỗ trống, từ cần điền là "${correct}" (nguyên văn từ bài đọc).`;
    conclusion = `Đáp án chính xác là "${correct}".`;
    if (!isCorrect && user) {
      trapNote = `Lưu ý: Cần viết đúng chính tả và tuân thủ giới hạn số từ cho phép (ONE WORD ONLY / NO MORE THAN TWO WORDS).`;
    }
  } else {
    // Multiple choice / matching
    analysis = `Dẫn chứng ở đoạn ${pIndex + 1}: "${evidence}".`;
    comparison = `Phương án ${correct} phản ánh chính xác nhất nội dung được đề cập trong bài đọc.`;
    conclusion = rawExpl || `Do đó, đáp án đúng là ${correct}.`;
    if (!isCorrect && user) {
      trapNote = `Phương án bạn chọn (${user}) không được bài đọc hỗ trợ hoặc chứa thông tin gây nhiễu (distractor).`;
    }
  }

  if (rawExpl && !analysis.includes(rawExpl)) {
    analysis = `${analysis} (${rawExpl})`;
  }

  return {
    evidenceText: evidence,
    analysis,
    comparison,
    conclusion,
    trapNote,
  };
}

function translatePromptChunk(text: string): string {
  const t = text.toLowerCase();
  if (t.includes('no other species of parrot')) return 'Không loài vẹt nào khác';
  if (t.includes('lives to the age a vaira can reach')) return 'sống đến độ tuổi vaira có thể đạt tới';
  if (t.includes('whether the vaira breeds')) return 'việc loài vaira có sinh sản hay không';
  if (t.includes('depends on how much food is available')) return 'phụ thuộc vào lượng thức ăn có sẵn';
  if (t.includes('chicks are cared for entirely by the female')) return 'con non được nuôi hoàn toàn bởi con cái';
  if (t.includes('male taking no part')) return 'con đực không tham gia';
  if (t.includes('feeds on ferns')) return 'ăn dương xỉ';
  if (t.includes('lays its eggs inside')) return 'đẻ trứng bên trong';
  if (t.includes('came from')) return 'xuất phát từ';
  if (t.includes('how stress affects')) return 'căng thẳng ảnh hưởng ra sao';
  return 'Ý nghĩa cụm từ trong câu';
}
