-- ============================================================================
-- ReadUp IELTS — schema khởi tạo (bước 1)
-- Postgres / Supabase. Mọi bảng dữ liệu cá nhân đều có user_id + RLS.
-- ============================================================================

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- ---------------------------------------------------------------------------
-- ENUM
-- ---------------------------------------------------------------------------
create type cefr_level as enum ('A1', 'A2', 'B1', 'B2', 'C1', 'C2');

-- Loại A = lưu toàn văn (public domain / CC). Loại B = chỉ tiêu đề + link gốc.
create type license_type as enum (
  'public_domain',
  'cc_by',
  'cc_by_sa',
  'gov_open',
  'user_pasted',
  'headline_only'
);

create type article_track as enum ('academic', 'general_training');

create type question_type as enum (
  'true_false_not_given',
  'yes_no_not_given',
  'matching_headings',
  'matching_information',
  'multiple_choice',
  'sentence_completion',
  'summary_completion',
  'short_answer'
);

create type word_status_kind as enum ('new', 'learning', 'familiar', 'known', 'ignored');

create type highlight_color as enum ('yellow', 'green', 'blue', 'purple', 'pink');

-- Trạng thái thẻ theo ts-fsrs: 0 New, 1 Learning, 2 Review, 3 Relearning.
create type fsrs_state as enum ('new', 'learning', 'review', 'relearning');

create type chat_role as enum ('user', 'assistant', 'system');

create type study_activity as enum ('practice', 'mock_test', 'review', 'reading_library');

-- ---------------------------------------------------------------------------
-- Hàm tiện ích: tự cập nhật updated_at
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles — hồ sơ người dùng, gắn 1-1 với auth.users
-- ---------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  target_band numeric(2, 1) default 7.0 check (target_band between 4.0 and 9.0),
  target_date date,
  daily_goal_minutes int not null default 60 check (daily_goal_minutes > 0),
  locale text not null default 'vi',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at
before update on profiles
for each row execute function set_updated_at();

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function handle_new_user();

-- ---------------------------------------------------------------------------
-- topics — 10 chủ đề cố định
-- ---------------------------------------------------------------------------
create table topics (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  name_vi text,
  icon_url text,
  color text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

insert into topics (slug, name, name_vi, sort_order) values
  ('environment', 'Environment', 'Môi trường', 1),
  ('technology', 'Technology', 'Công nghệ', 2),
  ('education', 'Education', 'Giáo dục', 3),
  ('health', 'Health', 'Sức khoẻ', 4),
  ('science', 'Science', 'Khoa học', 5),
  ('business', 'Business', 'Kinh doanh', 6),
  ('society', 'Society', 'Xã hội', 7),
  ('culture', 'Culture', 'Văn hoá', 8),
  ('history', 'History', 'Lịch sử', 9),
  ('psychology', 'Psychology', 'Tâm lý học', 10);

-- ---------------------------------------------------------------------------
-- articles — bài đọc
--   Loại A: body_text có nội dung, license_type ≠ 'headline_only'
--   Loại B: body_text = null, license_type = 'headline_only', bấm mở source_url
-- ---------------------------------------------------------------------------
create table articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique,
  source_name text,
  source_url text,
  topic_id uuid references topics (id) on delete set null,
  topic text,
  track article_track not null default 'academic',
  cefr_level cefr_level,
  band_range text,
  word_count int check (word_count >= 0),
  est_minutes int check (est_minutes >= 0),
  body_text text,
  summary text,
  thumbnail_url text,
  license_type license_type not null default 'public_domain',
  attribution text,
  -- Điểm dễ đọc tự chấm ở bước 3 (Flesch-Kincaid + tần suất từ hiếm).
  readability_score numeric(5, 2),
  rare_word_ratio numeric(5, 4),
  -- Bài do người dùng tự dán vào: chỉ chủ sở hữu thấy.
  created_by uuid references auth.users (id) on delete cascade,
  is_private boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Bản quyền: bài 'headline_only' tuyệt đối không được lưu toàn văn.
  constraint headline_only_has_no_body
    check (license_type <> 'headline_only' or body_text is null),
  constraint headline_only_has_source
    check (license_type <> 'headline_only' or source_url is not null)
);

create index articles_topic_idx on articles (topic_id);
create index articles_track_idx on articles (track);
create index articles_license_idx on articles (license_type);
create index articles_published_idx on articles (published_at desc nulls last);
create index articles_owner_idx on articles (created_by);
create index articles_title_trgm_idx on articles using gin (title gin_trgm_ops);

create trigger articles_updated_at
before update on articles
for each row execute function set_updated_at();

-- Bản đơn giản hoá (C1 -> B1) của một bài khó, tạo ở bước 8.
create table article_simplifications (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references articles (id) on delete cascade,
  target_level cefr_level not null,
  body_text text not null,
  model text,
  created_at timestamptz not null default now(),
  unique (article_id, target_level)
);

-- ---------------------------------------------------------------------------
-- article_progress — tiến độ đọc từng bài
-- ---------------------------------------------------------------------------
create table article_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  article_id uuid not null references articles (id) on delete cascade,
  percent_completed numeric(5, 2) not null default 0
    check (percent_completed between 0 and 100),
  last_position int not null default 0 check (last_position >= 0),
  last_read_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, article_id)
);

create index article_progress_user_idx on article_progress (user_id, last_read_at desc);

create trigger article_progress_updated_at
before update on article_progress
for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- vocab_entries — sổ từ. Bắt buộc lưu nguyên câu gốc nơi gặp từ.
-- ---------------------------------------------------------------------------
create table vocab_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  word text not null,
  lemma text not null,
  definition_context text,
  definition_general text,
  definition_vi text,
  phonetic text,
  part_of_speech text,
  example_sentence text,
  source_sentence text not null,
  article_id uuid references articles (id) on delete set null,
  paragraph_index int,
  mastery_percent numeric(5, 2) not null default 0
    check (mastery_percent between 0 and 100),
  is_collocation boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, lemma, article_id)
);

create index vocab_entries_user_idx on vocab_entries (user_id, created_at desc);
create index vocab_entries_lemma_idx on vocab_entries (user_id, lemma);
create index vocab_entries_article_idx on vocab_entries (article_id);

create trigger vocab_entries_updated_at
before update on vocab_entries
for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- fsrs_cards — trạng thái spaced repetition (ts-fsrs) cho từng từ
-- ---------------------------------------------------------------------------
create table fsrs_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  vocab_id uuid not null references vocab_entries (id) on delete cascade,
  card_kind text not null default 'word_to_meaning',
  due timestamptz not null default now(),
  stability numeric(10, 4) not null default 0,
  difficulty numeric(10, 4) not null default 0,
  elapsed_days numeric(10, 4) not null default 0,
  scheduled_days numeric(10, 4) not null default 0,
  reps int not null default 0,
  lapses int not null default 0,
  state fsrs_state not null default 'new',
  last_review timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (vocab_id, card_kind)
);

create index fsrs_cards_due_idx on fsrs_cards (user_id, due);

create trigger fsrs_cards_updated_at
before update on fsrs_cards
for each row execute function set_updated_at();

-- Nhật ký từng lần ôn (Again / Hard / Good / Easy) để tính lại lịch và thống kê.
create table fsrs_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  card_id uuid not null references fsrs_cards (id) on delete cascade,
  rating smallint not null check (rating between 1 and 4),
  state fsrs_state not null,
  due timestamptz,
  stability numeric(10, 4),
  difficulty numeric(10, 4),
  elapsed_days numeric(10, 4),
  last_elapsed_days numeric(10, 4),
  scheduled_days numeric(10, 4),
  review_at timestamptz not null default now(),
  duration_ms int
);

create index fsrs_reviews_card_idx on fsrs_reviews (card_id, review_at desc);

-- ---------------------------------------------------------------------------
-- word_status — 5 mức trạng thái của mọi từ đã gặp (dùng để tô màu trong bài)
-- ---------------------------------------------------------------------------
create table word_status (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lemma text not null,
  status word_status_kind not null default 'new',
  times_seen int not null default 1 check (times_seen >= 0),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, lemma)
);

create index word_status_user_status_idx on word_status (user_id, status);

create trigger word_status_updated_at
before update on word_status
for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- question_sets / questions — bộ đề sinh bằng AI hoặc nhập tay
-- ---------------------------------------------------------------------------
create table question_sets (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references articles (id) on delete cascade,
  user_id uuid references auth.users (id) on delete cascade,
  title text,
  track article_track not null default 'academic',
  difficulty text,
  total_questions int not null default 0,
  est_minutes int,
  generated_by text,
  model text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index question_sets_article_idx on question_sets (article_id);

create trigger question_sets_updated_at
before update on question_sets
for each row execute function set_updated_at();

create table questions (
  id uuid primary key default gen_random_uuid(),
  question_set_id uuid not null references question_sets (id) on delete cascade,
  order_index int not null,
  type question_type not null,
  prompt text not null,
  instruction text,
  options jsonb,
  correct_answer text not null,
  -- Bắt buộc theo spec: mỗi câu phải chỉ ra bằng chứng trong bài + bài học rút ra.
  evidence_text text not null,
  evidence_paragraph_index int not null,
  explanation text not null,
  lesson_tip text,
  created_at timestamptz not null default now(),
  unique (question_set_id, order_index)
);

create index questions_set_idx on questions (question_set_id, order_index);
create index questions_type_idx on questions (type);

-- ---------------------------------------------------------------------------
-- test_sessions / attempts — lượt làm bài và từng câu trả lời
-- ---------------------------------------------------------------------------
create table test_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  article_id uuid references articles (id) on delete set null,
  question_set_id uuid references question_sets (id) on delete set null,
  mode text not null default 'practice',
  raw_score int not null default 0 check (raw_score >= 0),
  total int not null default 0 check (total >= 0),
  estimated_band numeric(2, 1),
  accuracy numeric(5, 2) check (accuracy between 0 and 100),
  duration_ms int check (duration_ms >= 0),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create index test_sessions_user_idx on test_sessions (user_id, created_at desc);

create table attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  test_session_id uuid references test_sessions (id) on delete cascade,
  question_id uuid not null references questions (id) on delete cascade,
  user_answer text,
  is_correct boolean not null default false,
  time_spent_ms int check (time_spent_ms >= 0),
  marked_for_review boolean not null default false,
  created_at timestamptz not null default now()
);

create index attempts_session_idx on attempts (test_session_id);
create index attempts_user_question_idx on attempts (user_id, question_id);

-- ---------------------------------------------------------------------------
-- highlights — bôi màu trong bài, kể cả highlight evidence của từng câu hỏi
-- ---------------------------------------------------------------------------
create table highlights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  article_id uuid not null references articles (id) on delete cascade,
  text text not null,
  paragraph_index int not null,
  start_offset int,
  end_offset int,
  color highlight_color not null default 'yellow',
  note text,
  is_evidence_for_question_id uuid references questions (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index highlights_article_idx on highlights (user_id, article_id);

create trigger highlights_updated_at
before update on highlights
for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- chat_messages — lịch sử chatbox trợ giảng theo từng bài
-- ---------------------------------------------------------------------------
create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  article_id uuid references articles (id) on delete cascade,
  role chat_role not null,
  content text not null,
  model text,
  token_usage jsonb,
  created_at timestamptz not null default now()
);

create index chat_messages_article_idx on chat_messages (user_id, article_id, created_at);

-- Prompt tự tạo, tái sử dụng cho mọi bài.
create table custom_prompts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  body text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger custom_prompts_updated_at
before update on custom_prompts
for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- reading_sessions — đo tốc độ đọc (wpm)
-- ---------------------------------------------------------------------------
create table reading_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  article_id uuid references articles (id) on delete set null,
  words_read int not null default 0 check (words_read >= 0),
  wpm numeric(6, 2),
  duration_ms int not null default 0 check (duration_ms >= 0),
  activity study_activity not null default 'reading_library',
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

create index reading_sessions_user_idx on reading_sessions (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- notes / bookmarks
-- ---------------------------------------------------------------------------
create table notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  article_id uuid references articles (id) on delete cascade,
  question_id uuid references questions (id) on delete cascade,
  paragraph_index int,
  title text,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index notes_user_idx on notes (user_id, updated_at desc);

create trigger notes_updated_at
before update on notes
for each row execute function set_updated_at();

create table bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  article_id uuid references articles (id) on delete cascade,
  question_id uuid references questions (id) on delete cascade,
  vocab_id uuid references vocab_entries (id) on delete cascade,
  note text,
  created_at timestamptz not null default now(),
  constraint bookmark_targets_exactly_one check (
    (case when article_id is not null then 1 else 0 end)
    + (case when question_id is not null then 1 else 0 end)
    + (case when vocab_id is not null then 1 else 0 end) = 1
  )
);

create unique index bookmarks_unique_article on bookmarks (user_id, article_id)
  where article_id is not null;
create unique index bookmarks_unique_question on bookmarks (user_id, question_id)
  where question_id is not null;
create unique index bookmarks_unique_vocab on bookmarks (user_id, vocab_id)
  where vocab_id is not null;

-- ---------------------------------------------------------------------------
-- daily_goals / streaks — mục tiêu ngày, chuỗi ngày học, heatmap tuần
-- ---------------------------------------------------------------------------
create table daily_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  goal_date date not null default current_date,
  target_minutes int not null default 60 check (target_minutes > 0),
  minutes_studied int not null default 0 check (minutes_studied >= 0),
  questions_answered int not null default 0 check (questions_answered >= 0),
  words_reviewed int not null default 0 check (words_reviewed >= 0),
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, goal_date)
);

create index daily_goals_user_date_idx on daily_goals (user_id, goal_date desc);

create trigger daily_goals_updated_at
before update on daily_goals
for each row execute function set_updated_at();

create table streaks (
  user_id uuid primary key references auth.users (id) on delete cascade,
  current_streak int not null default 0 check (current_streak >= 0),
  longest_streak int not null default 0 check (longest_streak >= 0),
  last_active_date date,
  updated_at timestamptz not null default now()
);

create trigger streaks_updated_at
before update on streaks
for each row execute function set_updated_at();

-- Thời gian học chia theo hoạt động — nguồn cho donut "Study Time Distribution".
create table study_time_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  activity study_activity not null,
  minutes numeric(8, 2) not null default 0 check (minutes >= 0),
  entry_date date not null default current_date,
  created_at timestamptz not null default now()
);

create index study_time_entries_user_idx on study_time_entries (user_id, entry_date desc);

-- Cache ảnh/icon sinh bằng OpenAI để không sinh lại mỗi lần render (bước 2).
create table generated_assets (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  cache_key text not null unique,
  prompt text,
  model text,
  storage_path text not null,
  public_url text,
  width int,
  height int,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table profiles enable row level security;
alter table topics enable row level security;
alter table articles enable row level security;
alter table article_simplifications enable row level security;
alter table article_progress enable row level security;
alter table vocab_entries enable row level security;
alter table fsrs_cards enable row level security;
alter table fsrs_reviews enable row level security;
alter table word_status enable row level security;
alter table question_sets enable row level security;
alter table questions enable row level security;
alter table test_sessions enable row level security;
alter table attempts enable row level security;
alter table highlights enable row level security;
alter table chat_messages enable row level security;
alter table custom_prompts enable row level security;
alter table reading_sessions enable row level security;
alter table notes enable row level security;
alter table bookmarks enable row level security;
alter table daily_goals enable row level security;
alter table streaks enable row level security;
alter table study_time_entries enable row level security;
alter table generated_assets enable row level security;

-- profiles: chỉ chính chủ
create policy profiles_select_own on profiles
  for select using (auth.uid() = id);
create policy profiles_update_own on profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
create policy profiles_insert_own on profiles
  for insert with check (auth.uid() = id);

-- topics: ai đăng nhập cũng đọc được, ghi qua service key
create policy topics_read on topics
  for select to authenticated using (true);

-- articles: bài chung đọc được; bài riêng (tự dán) chỉ chủ sở hữu
create policy articles_read on articles
  for select to authenticated
  using (not is_private or created_by = auth.uid());
create policy articles_insert_own on articles
  for insert to authenticated
  with check (created_by = auth.uid());
create policy articles_update_own on articles
  for update to authenticated
  using (created_by = auth.uid()) with check (created_by = auth.uid());
create policy articles_delete_own on articles
  for delete to authenticated using (created_by = auth.uid());

create policy article_simplifications_read on article_simplifications
  for select to authenticated
  using (
    exists (
      select 1 from articles a
      where a.id = article_simplifications.article_id
        and (not a.is_private or a.created_by = auth.uid())
    )
  );

-- question_sets / questions: bộ đề chung đọc được, bộ đề riêng theo chủ sở hữu
create policy question_sets_read on question_sets
  for select to authenticated
  using (user_id is null or user_id = auth.uid());
create policy question_sets_write_own on question_sets
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy questions_read on questions
  for select to authenticated
  using (
    exists (
      select 1 from question_sets qs
      where qs.id = questions.question_set_id
        and (qs.user_id is null or qs.user_id = auth.uid())
    )
  );
create policy questions_write_own on questions
  for all to authenticated
  using (
    exists (
      select 1 from question_sets qs
      where qs.id = questions.question_set_id and qs.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from question_sets qs
      where qs.id = questions.question_set_id and qs.user_id = auth.uid()
    )
  );

create policy generated_assets_read on generated_assets
  for select to authenticated using (true);

-- Các bảng dữ liệu cá nhân: một policy "toàn quyền trên hàng của mình".
do $$
declare
  t text;
begin
  foreach t in array array[
    'article_progress', 'vocab_entries', 'fsrs_cards', 'fsrs_reviews', 'word_status',
    'test_sessions', 'attempts', 'highlights', 'chat_messages', 'custom_prompts',
    'reading_sessions', 'notes', 'bookmarks', 'daily_goals', 'study_time_entries'
  ]
  loop
    execute format(
      'create policy %I_owner on %I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())',
      t, t
    );
  end loop;
end;
$$;

create policy streaks_owner on streaks
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
