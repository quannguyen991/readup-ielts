-- Dạng câu hỏi của SAT Reading and Writing.
--
-- Bám đúng tên miền nội dung của College Board: Information and Ideas
-- (central idea, command of evidence, inferences) và Craft and Structure
-- (words in context, text structure and purpose).
--
-- Phải khớp union `QuestionType` trong src/types/database.ts.
alter type question_type add value 'sat_words_in_context';
alter type question_type add value 'sat_central_idea';
alter type question_type add value 'sat_command_of_evidence';
alter type question_type add value 'sat_inference';
alter type question_type add value 'sat_text_structure';
