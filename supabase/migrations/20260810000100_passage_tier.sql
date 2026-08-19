-- Tier passage bám cấu trúc Reading của IELTS: 3 passage tăng dần độ dài/độ khó,
-- cộng ba loại ngoài đề thi (abstract ngắn, tin tức chỉ tiêu đề, đề official).
--
-- Danh sách phải khớp union `PassageTier` trong src/types/database.ts.
-- Phần mở rộng cho SAT nằm ở 20260810000200_exam_sat.sql.
create type passage_tier as enum (
  'p1',
  'p2',
  'p3',
  'short_academic',
  'headline',
  'official_practice'
);

alter table articles
  add column passage_tier passage_tier;

-- Lọc theo tier là truy vấn chính của màn Library.
create index articles_passage_tier_idx on articles (passage_tier);
create index articles_track_tier_idx on articles (track, passage_tier);

-- Bài không có toàn văn thì không thể là passage: chặn ở tầng DB cho chắc,
-- cùng tinh thần với CHECK constraint bản quyền đã có.
alter table articles
  add constraint articles_tier_needs_body check (
    passage_tier is null
    or passage_tier in ('headline', 'official_practice')
    or body_text is not null
  );

-- Câu hỏi sinh từ sổ từ không có đoạn văn nào để trỏ tới, nên
-- evidence_paragraph_index phải cho phép null.
alter table questions
  alter column evidence_paragraph_index drop not null;
