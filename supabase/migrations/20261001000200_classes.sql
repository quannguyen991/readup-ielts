-- ============================================================================
-- Lớp học của giáo viên (01/10/2026).
--
-- Giáo viên tạo lớp → nhận MÃ LỚP 6 ký tự → học sinh nhập mã để vào lớp →
-- giáo viên giao bài và xem tiến độ cả lớp. Miễn phí cho giáo viên; đây là cửa
-- vào để sau này bán gói cho trung tâm.
--
-- CHỈ MÁY CHỦ ĐỌC GHI: bật RLS mà KHÔNG có policy nào, lại thu hồi quyền mức
-- BẢNG của anon/authenticated (thu hồi theo cột không trừ được quyền mức bảng).
-- Mọi truy cập đi qua `app/api/classes/**` bằng service key, và chính các route
-- đó kiểm tra ai là giáo viên của lớp, ai là thành viên. Lý do: học sinh không
-- được đọc danh sách bạn cùng lớp hay tiến độ của nhau, mà viết policy chéo
-- giữa ba bảng (lớp ↔ thành viên ↔ bài giao) rất dễ để lọt một đường đọc.
--
-- GIỚI HẠN (kiểm ở API, `src/services/classes/rules.ts`): tối đa 20 lớp đang mở
-- mỗi giáo viên, 200 học sinh mỗi lớp, 100 bài giao mỗi lớp.
--
-- Mã lớp dùng cùng bảng chữ với mã nhóm mua chung: bỏ 0/O, 1/I/L và U/V dễ đọc
-- nhầm khi giáo viên viết lên bảng.
-- ============================================================================

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[23456789ABCDEFGHJKMNPQRSTVWXYZ]{6}$'),
  name text not null check (char_length(btrim(name)) between 1 and 60),
  teacher_id uuid not null references auth.users (id) on delete cascade,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists classes_teacher_idx on public.classes (teacher_id, created_at desc);

create table if not exists public.class_members (
  class_id uuid not null references public.classes (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  -- Tên hiện cho giáo viên. Mặc định là tên hiển thị trong hồ sơ; KHÔNG BAO GIỜ
  -- là email (giáo viên không thấy email học sinh).
  display_name text not null check (char_length(btrim(display_name)) between 1 and 40),
  joined_at timestamptz not null default now(),
  primary key (class_id, user_id)
);

create index if not exists class_members_user_idx on public.class_members (user_id);

create table if not exists public.class_assignments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  -- Chỉ những loại bài mà máy chủ TỰ NHẬN RA được là đã làm hay chưa, từ dữ
  -- liệu học đã đồng bộ (`src/services/classes/assignments.ts`).
  kind text not null check (kind in ('vocab_deck', 'sat_chapter', 'math_set', 'speaking')),
  ref text not null check (char_length(ref) between 1 and 80),
  title text not null check (char_length(title) between 1 and 120),
  due_on date,
  created_at timestamptz not null default now()
);

create index if not exists class_assignments_class_idx on public.class_assignments (class_id, created_at desc);

alter table public.classes enable row level security;
alter table public.class_members enable row level security;
alter table public.class_assignments enable row level security;

revoke all on table public.classes from anon, authenticated;
revoke all on table public.class_members from anon, authenticated;
revoke all on table public.class_assignments from anon, authenticated;
