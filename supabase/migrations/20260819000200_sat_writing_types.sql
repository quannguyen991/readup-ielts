-- Hai domain "Writing" của SAT Reading and Writing.
--
-- Bộ sinh đề SAT hiện có mới phủ hai domain đọc hiểu (Information and Ideas,
-- Craft and Structure). Bốn dạng dưới đây là hai domain còn lại — đúng phần mà
-- College Board gọi là kỹ năng viết, dù toàn bộ vẫn là câu hỏi trắc nghiệm.
--
-- Phải khớp union `QuestionType` trong src/types/database.ts.
alter type question_type add value 'sat_transitions';
alter type question_type add value 'sat_rhetorical_synthesis';
alter type question_type add value 'sat_boundaries';
alter type question_type add value 'sat_form_structure_sense';
