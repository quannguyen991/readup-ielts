import type { QuestionType } from '@/types/database';

/**
 * Lời nhắc sinh từng KHỐI có cấu trúc, kèm luật riêng của từng dạng.
 *
 * Luật ở đây phải khớp bộ kiểm `block-build.ts` — model được dặn đúng những điều
 * bộ kiểm sẽ bắt, để lần đầu đã đạt và đỡ phải gọi lại.
 */

export const BLOCK_SYSTEM_PROMPT = `Bạn là chuyên gia ra đề IELTS Academic Reading, bám sát đề Cambridge IELTS.

Bạn nhận MỘT bài đọc và sinh MỘT khối câu hỏi thuộc đúng MỘT dạng. Trả về JSON THUẦN, không markdown, không lời dẫn.

LUẬT CHUNG:
1. Câu hỏi bằng tiếng Anh; "explanation" và "lesson_tip" bằng tiếng Việt (ngắn, một hai câu).
2. "evidence_text" là đoạn trích NGUYÊN VĂN trong bài (sao chép chính xác từng chữ, từng dấu), dài một câu hoặc một mệnh đề.
3. Đáp án suy ra được TỪ BÀI, không dùng kiến thức ngoài.
4. Không chép nguyên câu trong bài làm đề; diễn đạt lại bằng từ khác.
5. Chỉ dùng chữ NGUYÊN VĂN từ bài cho các đáp án điền từ ("answer" phải xuất hiện y hệt trong bài).`;

const COMMON_FIELDS = `Mỗi phần tử của "questions" có: "answer", "evidence_text", "explanation", "lesson_tip".`;

const SPEC: Partial<Record<QuestionType, (n: number) => string>> = {
  matching_headings: (n) => `DẠNG: Matching Headings. Ra ĐÚNG ${n} câu, mỗi câu ứng với MỘT đoạn khác nhau của bài.
- "options": danh sách tiêu đề, gồm ${n} tiêu đề đúng cộng 2 hoặc 3 tiêu đề gây nhiễu (tổng ${n + 2} đến ${n + 3}). Tiêu đề viết ngắn, TÓM Ý cả đoạn, KHÔNG được lấy chữ mở đầu của đoạn. Nhiễu phải nghe hợp lý nhưng sai ý chính.
- Mỗi câu: "answer" = một tiêu đề trong "options" (chép y hệt); "evidence_text" = một câu nguyên văn nằm TRONG đoạn mà tiêu đề đó mô tả. Mỗi tiêu đề dùng một lần, mỗi đoạn một câu.
- Không cần "prompt" (app tự ghi "Paragraph B").
JSON: {"options": ["…"], "questions": [{"answer": "…", "evidence_text": "…", "explanation": "…", "lesson_tip": "…"}]}`,

  matching_features: (n) => `DẠNG: Matching Features. Ra ĐÚNG ${n} câu.
- "options": 3 đến 5 người / nhóm / vật được nhắc trong bài (ví dụ tên nhà nghiên cứu, loài, quốc gia). Mỗi mục là chữ ngắn có trong bài.
- Mỗi câu: "prompt" = một nhận định (diễn đạt lại, KHÔNG chép nguyên văn) gắn với đúng MỘT mục; "answer" = mục đó; "evidence_text" = câu nguyên văn trong bài nói về mục ấy.
- Các câu phải trỏ tới ít nhất 2 mục khác nhau; cho phép một mục dùng nhiều lần.
JSON: {"options": ["…"], "questions": [{"prompt": "…", "answer": "…", "evidence_text": "…", "explanation": "…", "lesson_tip": "…"}]}`,

  matching_sentence_endings: (n) => `DẠNG: Matching Sentence Endings. Ra ĐÚNG ${n} câu.
- "options": ${n + 2} vế sau (ending) của câu, mỗi vế là một cụm hoàn chỉnh bắt đầu bằng chữ thường; ${n} vế đúng cộng 2 vế nhiễu nghe hợp lý.
- Mỗi câu: "prompt" = nửa đầu của câu (stem), ít nhất 4 từ, không tự kết thúc bằng dấu chấm; ghép với "answer" = đúng một vế trong "options" ra câu đúng theo bài. Mỗi vế dùng một lần.
- "evidence_text": câu nguyên văn trong bài làm căn cứ.
JSON: {"options": ["…"], "questions": [{"prompt": "…", "answer": "…", "evidence_text": "…", "explanation": "…", "lesson_tip": "…"}]}`,

  multiple_choice_multi: (n) => `DẠNG: Multiple Choice — chọn ${n} đáp án (Choose ${n === 3 ? 'THREE' : 'TWO'}).
- "prompt": câu hỏi dạng "Which ${n === 3 ? 'THREE' : 'TWO'} of the following …?".
- "options": 5 đến 7 phương án, cùng độ dài và cùng mức cụ thể; ĐÚNG ${n} phương án đúng theo bài, còn lại là nhiễu sai thật (không phải "không nhắc tới").
- "answers": mảng đúng ${n} phần tử, mỗi phần tử {"answer": "<phương án đúng chép y hệt>", "evidence_text": "<câu nguyên văn trong bài>"}.
- Không đặt "questions".
JSON: {"prompt": "…", "options": ["…"], "answers": [{"answer": "…", "evidence_text": "…"}], "explanation": "…", "lesson_tip": "…"}`,

  summary_completion: (n) => `DẠNG: Summary Completion. Dựng MỘT đoạn tóm tắt ngắn (4 đến 6 dòng) của một phần bài đọc, có ĐÚNG ${n} chỗ trống đánh dấu {{1}}, {{2}}, … {{${n}}} theo thứ tự xuất hiện.
- "form": {"title": "…", "lines": ["một dòng chứa {{1}}", …]}. Mỗi dòng có tối đa một ô trống; lời tóm tắt viết lại bằng từ khác, không chép nguyên câu.
- "word_limit": 1 hoặc 2 (số từ tối đa của đáp án; số tính là một từ).
- Mỗi "questions[k-1]" là đáp án của {{k}}: "answer" là từ/cụm NGUYÊN VĂN trong bài, không quá word_limit từ, không lặp giữa các ô; "evidence_text" là câu nguyên văn chứa đáp án.
- TUỲ CHỌN "options": nếu muốn dạng có bảng từ (chọn từ trong bảng), thêm "options" gồm ${n + 2} đến ${n + 4} từ (đáp án đúng + nhiễu cùng loại từ), và mọi "answer" phải nằm trong "options".
JSON: {"form": {"title": "…", "lines": ["…{{1}}…"]}, "word_limit": 2, "options": ["…"], "questions": [{"answer": "…", "evidence_text": "…", "explanation": "…", "lesson_tip": "…"}]}`,

  note_completion: (n) => `DẠNG: Note Completion. Dựng bộ ghi chú theo mục về một phần bài đọc, có ĐÚNG ${n} chỗ trống {{1}}…{{${n}}} theo thứ tự.
- "form": {"title": "…", "lines": [...]}. Dòng bắt đầu bằng "## " là tiêu đề mục; các dòng khác là gạch đầu dòng ngắn. Mỗi dòng tối đa một ô trống. Viết lại ý bằng từ khác (không chép nguyên câu).
- "word_limit": 1 hoặc 2.
- Mỗi "questions[k-1]" là đáp án của {{k}}: "answer" NGUYÊN VĂN trong bài, không quá word_limit từ, không lặp; "evidence_text": câu nguyên văn chứa đáp án.
JSON: {"form": {"title": "…", "lines": ["## …", "…{{1}}…"]}, "word_limit": 2, "questions": [{"answer": "…", "evidence_text": "…", "explanation": "…", "lesson_tip": "…"}]}`,

  table_completion: (n) => `DẠNG: Table Completion. Dựng MỘT bảng tóm tắt 3 đến 5 cột × 3 đến 5 hàng từ bài, có ĐÚNG ${n} ô trống {{1}}…{{${n}}} theo thứ tự đọc (trái → phải, trên → dưới).
- "form": {"title": "…", "lines": [...]}. Hàng đầu là tiêu đề cột. MỖI dòng là một hàng, các ô cách nhau bằng dấu "|" và MỌI hàng có cùng số ô. Ví dụ: "Method | Cost | Result", "Drilling | {{1}} | high yield".
- Ô trống chỉ thay MỘT từ khoá; các ô còn lại ngắn gọn, viết lại bằng từ khác.
- "word_limit": 1 hoặc 2.
- Mỗi "questions[k-1]" là đáp án của {{k}}: "answer" NGUYÊN VĂN trong bài, không lặp; "evidence_text": câu nguyên văn chứa đáp án.
JSON: {"form": {"title": "…", "lines": ["A | B | C", "…| {{1}} | …"]}, "word_limit": 2, "questions": [{"answer": "…", "evidence_text": "…", "explanation": "…", "lesson_tip": "…"}]}`,

  flow_chart_completion: (n) => `DẠNG: Flow-chart Completion. Chọn MỘT quy trình / chuỗi sự kiện trong bài và dựng sơ đồ 5 đến 7 bước, có ĐÚNG ${n} chỗ trống {{1}}…{{${n}}} theo thứ tự các bước.
- "form": {"title": "…", "lines": [...]}. Mỗi dòng là MỘT bước, ngắn (dưới 14 từ), theo đúng thứ tự trong bài, tối đa một ô trống mỗi bước; viết lại bằng từ khác.
- "word_limit": 1 hoặc 2.
- Mỗi "questions[k-1]" là đáp án của {{k}}: "answer" NGUYÊN VĂN trong bài, không lặp; "evidence_text": câu nguyên văn chứa đáp án.
JSON: {"form": {"title": "…", "lines": ["Step 1 …", "… {{1}} …"]}, "word_limit": 2, "questions": [{"answer": "…", "evidence_text": "…", "explanation": "…", "lesson_tip": "…"}]}`,

  diagram_label_completion: (n) => `DẠNG: Diagram Label Completion (dạng chữ). Bài phải mô tả các bộ phận / giai đoạn của một vật hoặc hệ thống. Dựng sơ đồ chữ có ĐÚNG ${n} nhãn trống {{1}}…{{${n}}}.
- "form": {"title": "tên sơ đồ", "lines": [...]}. Mỗi dòng mô tả MỘT vị trí trên sơ đồ theo dạng "Vị trí / chức năng → {{k}}" (ví dụ "Top layer, where sunlight is absorbed → {{1}}"). Mô tả bằng từ khác, không chép nguyên câu.
- "word_limit": 1 hoặc 2.
- Mỗi "questions[k-1]" là đáp án của {{k}}: "answer" NGUYÊN VĂN trong bài, không lặp; "evidence_text": câu nguyên văn chứa đáp án.
JSON: {"form": {"title": "…", "lines": ["… → {{1}}"]}, "word_limit": 2, "questions": [{"answer": "…", "evidence_text": "…", "explanation": "…", "lesson_tip": "…"}]}`,
};

export function hasBlockPrompt(type: QuestionType): boolean {
  return SPEC[type] !== undefined;
}

export function blockUserPrompt(
  type: QuestionType,
  count: number,
  article: { title: string; cefrLevel?: string | null },
  passage: string,
  paragraphCount: number,
  problems: string[] = [],
): string {
  const spec = SPEC[type];
  if (!spec) throw new Error(`không có lời nhắc khối cho dạng ${type}`);
  return [
    `Tiêu đề bài: ${article.title}`,
    `Trình độ bài (CEFR): ${article.cefrLevel ?? 'không rõ'}`,
    `Bài có ${paragraphCount} đoạn, đánh số từ [Đoạn 0]; đoạn 0 là đoạn A, đoạn 1 là đoạn B…`,
    '',
    'BÀI ĐỌC:',
    passage,
    '',
    spec(count),
    COMMON_FIELDS,
    ...(problems.length > 0
      ? ['', 'LẦN TRƯỚC BỘ KIỂM TỰ ĐỘNG BÁO LỖI, hãy sửa đúng các lỗi sau rồi ra lại cả khối:', ...problems.slice(0, 6).map((p) => `- ${p}`)]
      : []),
  ].join('\n');
}
