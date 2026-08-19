-- Kho bài phục vụ hai kỳ thi. `track` (academic / general_training) chỉ có
-- nghĩa với IELTS, nên kỳ thi phải là một cột riêng chứ không nhét thêm giá trị
-- vào article_track.
create type exam_kind as enum ('ielts', 'sat');

-- Bốn loại văn bản mà SAT Reading and Writing lấy đề. null với mọi bài IELTS.
create type sat_text_type as enum (
  'literature',
  'history_social',
  'humanities',
  'science'
);

-- Khổ passage SAT: 'sat_short' là khổ của đề số hoá hiện hành (25–150 từ, mỗi
-- đoạn một câu hỏi), 'sat_long' là khổ đoạn dài 500–750 từ của SAT giấy.
alter type passage_tier add value 'sat_short';
alter type passage_tier add value 'sat_long';

alter table articles
  add column exam exam_kind not null default 'ielts',
  add column sat_text_type sat_text_type;

-- Loại văn bản SAT chỉ có nghĩa khi bài thuộc kỳ thi SAT.
alter table articles
  add constraint articles_sat_text_type_needs_sat check (
    sat_text_type is null or exam = 'sat'
  );

-- Người học chọn kỳ thi trước, rồi mới lọc tiếp trong đó — nên đây là cột đầu
-- của mọi truy vấn Library.
create index articles_exam_idx on articles (exam);
create index articles_exam_tier_idx on articles (exam, passage_tier);
create index articles_sat_text_type_idx on articles (sat_text_type)
  where sat_text_type is not null;
