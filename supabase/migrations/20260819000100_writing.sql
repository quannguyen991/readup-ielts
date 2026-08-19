-- ============================================================================
-- Module Writing — IELTS Task 1/2.
--
-- Chưa dùng tới khi app còn chạy hoàn toàn cục bộ (đề nằm ở seed JSON, bài làm
-- nằm trong zustand + persist). Viết trước để chốt hình dạng dữ liệu, đúng như
-- đã làm với `articles`: có lược đồ rồi thì chuyển sang Supabase chỉ là đổi
-- ruột repository, không phải thiết kế lại.
--
-- Mọi enum ở đây phải khớp union trong `src/lib/writing/types.ts`.
-- `src/lib/writing/enum-parity.test.ts` giữ hai bên không trôi khỏi nhau.
-- ============================================================================

create type writing_task as enum ('ielts_task1', 'ielts_task2');

create type task1_chart as enum ('line', 'bar', 'pie', 'table', 'mixed', 'process', 'map');

create type task2_essay as enum (
  'opinion',
  'discussion',
  'advantage_disadvantage',
  'problem_solution',
  'two_part'
);

create type writing_mode as enum ('full', 'drill');

create type drill_part as enum (
  'brainstorm',
  'outline',
  'introduction',
  'overview',
  'body',
  'conclusion'
);

-- ---------------------------------------------------------------------------
-- writing_prompts — đề bài, dùng chung Task 1 và Task 2
-- ---------------------------------------------------------------------------
create table writing_prompts (
  id uuid primary key default gen_random_uuid(),
  task writing_task not null,
  prompt_text text not null,
  chart_kind task1_chart,
  chart_data jsonb,
  essay_kind task2_essay,
  topic_slug text not null references topics (slug),
  difficulty_band numeric(2, 1) not null check (difficulty_band between 4.0 and 9.0),
  time_limit_seconds int not null check (time_limit_seconds > 0),
  min_words int not null check (min_words > 0),
  source text not null check (source in ('generated', 'official', 'curated')),
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Có kind mà thiếu data thì màn hình vẽ ra khung rỗng và người học không làm
  -- được bài — nên hai cột này phải cùng có hoặc cùng không.
  constraint writing_prompts_chart_pair check (
    (chart_kind is null) = (chart_data is null)
  ),
  constraint writing_prompts_chart_only_task1 check (
    chart_kind is null or task = 'ielts_task1'
  ),
  constraint writing_prompts_task1_needs_chart check (
    task <> 'ielts_task1' or chart_kind is not null
  ),
  constraint writing_prompts_essay_only_task2 check (
    essay_kind is null or task = 'ielts_task2'
  ),
  constraint writing_prompts_task2_needs_essay check (
    task <> 'ielts_task2' or essay_kind is not null
  )
);

create trigger writing_prompts_updated_at
before update on writing_prompts
for each row execute function set_updated_at();

-- Người học chọn task trước rồi mới lọc tiếp, nên đây là cột đầu của mọi truy vấn.
create index writing_prompts_task_idx on writing_prompts (task) where is_published;
create index writing_prompts_topic_idx on writing_prompts (topic_slug);

-- ---------------------------------------------------------------------------
-- writing_submissions — bài làm
-- ---------------------------------------------------------------------------
create table writing_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  prompt_id uuid not null references writing_prompts (id) on delete cascade,
  mode writing_mode not null,
  drill_part drill_part,
  body_text text not null,
  word_count int not null check (word_count >= 0),
  duration_seconds int not null check (duration_seconds >= 0),
  submitted_at timestamptz not null default now(),

  -- drill_part có mặt khi và chỉ khi đang ở chế độ drill. Cho phép lệch thì màn
  -- kết quả không biết nên chấm theo tiêu chí cả bài hay tiêu chí một phần.
  constraint writing_submissions_drill_part_matches_mode check (
    (mode = 'drill') = (drill_part is not null)
  )
);

create index writing_submissions_user_idx on writing_submissions (user_id, submitted_at desc);
create index writing_submissions_prompt_idx on writing_submissions (prompt_id);

-- ---------------------------------------------------------------------------
-- writing_evaluations — kết quả chấm, mỗi bài làm nhiều nhất một bản
-- ---------------------------------------------------------------------------
create table writing_evaluations (
  submission_id uuid primary key references writing_submissions (id) on delete cascade,
  band_low numeric(2, 1) not null check (band_low between 1.0 and 9.0),
  band_high numeric(2, 1) not null check (band_high between 1.0 and 9.0),
  task_band numeric(2, 1) not null,
  coherence_band numeric(2, 1) not null,
  lexical_band numeric(2, 1) not null,
  grammar_band numeric(2, 1) not null,
  summary_vi text not null,
  strengths jsonb not null default '[]'::jsonb,
  improvements jsonb not null default '[]'::jsonb,
  annotations jsonb not null default '[]'::jsonb,
  model text,
  evaluated_at timestamptz not null default now(),

  -- Band luôn là một khoảng. Chấm AI không đủ tin cậy để trả một số cứng, nên
  -- lược đồ không cho phép biểu diễn "một số cứng" ngay từ đầu.
  constraint writing_evaluations_band_range check (band_low <= band_high)
);

-- ---------------------------------------------------------------------------
-- writing_model_essays — bài mẫu do AI soạn, đã chấm ngược
-- ---------------------------------------------------------------------------
create table writing_model_essays (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid not null references writing_prompts (id) on delete cascade,
  target_band numeric(2, 1) not null check (target_band between 4.0 and 9.0),
  body_text text not null,
  notes jsonb not null default '[]'::jsonb,

  -- Band đo lại được sau khi chấm ngược chính bài mẫu này. Để null nghĩa là
  -- chưa kiểm — màn hình phải nói rõ "chưa kiểm định" chứ không được im lặng
  -- hiển thị target_band như thể đó là band thật.
  verified_band_low numeric(2, 1),
  verified_band_high numeric(2, 1),
  generated_at timestamptz not null default now(),

  constraint writing_model_essays_verified_pair check (
    (verified_band_low is null) = (verified_band_high is null)
  ),
  constraint writing_model_essays_verified_range check (
    verified_band_low is null or verified_band_low <= verified_band_high
  ),
  unique (prompt_id, target_band)
);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table writing_prompts enable row level security;
alter table writing_submissions enable row level security;
alter table writing_evaluations enable row level security;
alter table writing_model_essays enable row level security;

create policy writing_prompts_read_published on writing_prompts
  for select using (is_published);

create policy writing_model_essays_read on writing_model_essays
  for select using (
    exists (
      select 1 from writing_prompts p
      where p.id = writing_model_essays.prompt_id and p.is_published
    )
  );

create policy writing_submissions_own on writing_submissions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Bản chấm đi theo bài làm: ai sở hữu bài thì thấy bản chấm của bài đó.
create policy writing_evaluations_own on writing_evaluations
  for all using (
    exists (
      select 1 from writing_submissions s
      where s.id = writing_evaluations.submission_id and s.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from writing_submissions s
      where s.id = writing_evaluations.submission_id and s.user_id = auth.uid()
    )
  );
