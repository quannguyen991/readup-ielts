-- Năm dạng bài IELTS Reading bổ sung (10/2026) + cột `extra` cho dữ liệu nhóm.
--
-- Phải khớp union `QuestionType` trong src/types/database.ts.
--
-- `questions.extra` (jsonb): nhóm câu chung (Choose TWO), khuôn bảng/sơ đồ/ghi
-- chú, giới hạn số từ và đáp án thay thế. Cột rỗng với mọi bộ đề cũ.
alter type question_type add value if not exists 'multiple_choice_multi';
alter type question_type add value if not exists 'note_completion';
alter type question_type add value if not exists 'table_completion';
alter type question_type add value if not exists 'flow_chart_completion';
alter type question_type add value if not exists 'diagram_label_completion';

alter table questions add column if not exists extra jsonb;
