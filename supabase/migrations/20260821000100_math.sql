-- ============================================================================
-- Module SAT Math.
--
-- Chưa dùng tới khi app còn chạy hoàn toàn cục bộ (đề sinh tại chỗ từ template,
-- lịch sử nằm trong zustand + persist). Viết trước để chốt hình dạng dữ liệu,
-- đúng như đã làm với `articles` và `writing_prompts`.
--
-- Khác hai module kia ở một điểm: đề Math KHÔNG có kho seed. Câu được sinh từ
-- template bằng RNG gieo hạt, nên `math_items.id` chính là công thức tái lập
-- ('<template_slug>:<seed>') và bảng này chỉ là bộ nhớ đệm cho những câu người
-- học đã gặp — mất bảng thì sinh lại y hệt, không mất mát gì.
--
-- Mọi enum ở đây phải khớp union trong `src/lib/math/types.ts`.
-- `src/lib/math/enum-parity.test.ts` giữ hai bên không trôi khỏi nhau.
-- ============================================================================

create type math_domain as enum (
  'algebra',
  'advanced_math',
  'problem_solving_data',
  'geometry_trig'
);

create type math_skill as enum (
  'linear_equations_one_var',
  'linear_equations_two_var',
  'linear_functions',
  'systems_linear_two_var',
  'linear_inequalities',
  'equivalent_expressions',
  'nonlinear_equations',
  'nonlinear_functions',
  'ratios_rates_units',
  'percentages',
  'one_var_data',
  'two_var_data',
  'probability',
  'sample_inference',
  'statistical_claims',
  'area_volume',
  'lines_angles_triangles',
  'right_triangles_trig',
  'circles'
);

create type math_format as enum ('mcq', 'grid_in');

create type math_difficulty as enum ('easy', 'medium', 'hard');

create type math_session_mode as enum ('diagnostic', 'lesson', 'drill', 'mock');

create type math_error_tag as enum (
  'sign_flip',
  'solved_for_wrong_var',
  'forgot_distribute',
  'moved_term_wrong_side',
  'off_by_one',
  'used_diameter_not_radius',
  'percent_of_wrong_base',
  'percent_added_instead_of_multiplied',
  'swapped_rise_run',
  'confused_area_perimeter',
  'used_wrong_trig_ratio',
  'forgot_square_root',
  'inverted_fraction',
  'dropped_unit_conversion',
  'rounded_too_early',
  'stopped_too_early',
  'wrong_denominator',
  'confused_mean_median',
  'swapped_slope_intercept',
  'dropped_a_solution',
  'forgot_flip_inequality',
  'ignored_margin_of_error',
  'confused_correlation_causation',
  'expanded_without_middle_term',
  'confused_supplementary_complementary'
);

-- ---------------------------------------------------------------------------
-- math_items — câu đã sinh, đệm lại để mở lại không phải dựng lại
-- ---------------------------------------------------------------------------
create table math_items (
  -- '<template_slug>:<seed>'. Text chứ không phải uuid: id ở đây LÀ công thức
  -- tái lập câu, sinh uuid mới là mất đúng cái tính chất ấy.
  id text primary key,
  template_slug text not null,
  skill math_skill not null,
  domain math_domain not null,
  difficulty math_difficulty not null,
  format math_format not null,
  stem text not null,
  figure jsonb,
  -- mcq: mảng 4 phần tử { display, errorTag }. grid_in: null.
  choices jsonb,
  correct_index int,
  -- grid_in: đáp án giữ nguyên dạng phân số. Lưu numeric thì 1/3 thành 0.333…
  -- và chấm bài sẽ oan đúng ở những câu đáp án lặp vô hạn.
  answer_num int,
  answer_den int,
  steps jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),

  -- Hai định dạng có hai bộ cột riêng, không được lẫn: câu trắc nghiệm thiếu
  -- correct_index thì không chấm được, còn câu grid-in mà có choices thì màn
  -- hình vẽ ra bốn lựa chọn cho một câu đáng lẽ phải tự gõ.
  constraint math_items_mcq_shape check (
    format <> 'mcq' or (
      choices is not null
      and jsonb_array_length(choices) = 4
      and correct_index between 0 and 3
      and answer_num is null
      and answer_den is null
    )
  ),
  constraint math_items_grid_in_shape check (
    format <> 'grid_in' or (
      choices is null
      and correct_index is null
      and answer_num is not null
      and answer_den is not null
      and answer_den <> 0
    )
  ),
  constraint math_items_domain_matches_skill check (
    domain = case
      when skill in (
        'linear_equations_one_var', 'linear_equations_two_var', 'linear_functions',
        'systems_linear_two_var', 'linear_inequalities'
      ) then 'algebra'::math_domain
      when skill in (
        'equivalent_expressions', 'nonlinear_equations', 'nonlinear_functions'
      ) then 'advanced_math'::math_domain
      when skill in (
        'ratios_rates_units', 'percentages', 'one_var_data', 'two_var_data',
        'probability', 'sample_inference', 'statistical_claims'
      ) then 'problem_solving_data'::math_domain
      else 'geometry_trig'::math_domain
    end
  )
);

create index math_items_skill_idx on math_items (skill, difficulty);

-- ---------------------------------------------------------------------------
-- math_sessions — một lượt làm bài
-- ---------------------------------------------------------------------------
create table math_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  mode math_session_mode not null,
  -- Chỉ lượt drill và lượt học trong lộ trình mới thuộc về một kỹ năng. Chẩn
  -- đoán, mock và các bộ ôn trộn đều trải nhiều kỹ năng nên để trống.
  skill math_skill,
  -- Bộ đề trong lộ trình (`src/services/math/curriculum.ts`). null với chẩn
  -- đoán, mock và drill tự do.
  set_id text,
  raw_score int not null check (raw_score >= 0),
  total int not null check (total > 0),
  duration_ms bigint not null check (duration_ms >= 0),
  finished_at timestamptz not null default now(),

  constraint math_sessions_score_within_total check (raw_score <= total),
  constraint math_sessions_drill_needs_skill check (mode <> 'drill' or skill is not null),
  constraint math_sessions_skill_only_when_focused check (
    skill is null or mode in ('drill', 'lesson')
  ),
  constraint math_sessions_set_only_for_lesson check (set_id is null or mode = 'lesson')
);

create index math_sessions_user_idx on math_sessions (user_id, finished_at desc);

-- ---------------------------------------------------------------------------
-- math_attempts — từng câu trong một lượt
-- ---------------------------------------------------------------------------
create table math_attempts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references math_sessions (id) on delete cascade,
  item_id text not null references math_items (id) on delete cascade,
  order_index int not null check (order_index >= 0),
  -- Với mcq là chỉ số lựa chọn đã chọn viết dưới dạng text; với grid-in là đúng
  -- chuỗi người học đã gõ. Giữ nguyên chuỗi gõ vào chứ không chuẩn hoá trước
  -- khi lưu: '2/3' và '.6667' cùng đúng nhưng nói hai điều khác nhau về cách
  -- người học nghĩ, và màn Review cần biết điều đó.
  user_answer text,
  is_correct boolean not null,
  -- Nhiễu đã chọn mang lỗi gì. null khi làm đúng, khi bỏ trống, hoặc khi nhiễu
  -- ấy không quy được về một lỗi có tên.
  error_tag math_error_tag,
  time_spent_ms int not null check (time_spent_ms >= 0),

  unique (session_id, order_index),
  -- Làm đúng thì không thể đồng thời mang nhãn lỗi.
  constraint math_attempts_no_tag_when_correct check (not (is_correct and error_tag is not null))
);

create index math_attempts_session_idx on math_attempts (session_id, order_index);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table math_items enable row level security;
alter table math_sessions enable row level security;
alter table math_attempts enable row level security;

-- Đề Math không có gì riêng tư và không vướng bản quyền — nó do template sinh
-- ra, không phải văn bản của ai. Nên ai đọc cũng được.
create policy math_items_read on math_items for select using (true);

create policy math_sessions_own on math_sessions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy math_attempts_own on math_attempts
  for all using (
    exists (
      select 1 from math_sessions s
      where s.id = math_attempts.session_id and s.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from math_sessions s
      where s.id = math_attempts.session_id and s.user_id = auth.uid()
    )
  );
