# ReadUp IELTS — bàn giao cho Claude

Ngày bàn giao: 2026-09-22  
Commit hiện tại: `6de5761` — `Polish learning workspace and quest experience`

## 1. Mục tiêu sản phẩm

ReadUp là ứng dụng luyện IELTS và SAT, chạy bằng Expo Router trên web, iOS và Android.
Ứng dụng kết hợp học theo bài, chấm câu, tiến độ, đồng bộ tài khoản, AI tutor và một chế độ game học SAT tên **ReadUp Quest**.

Nguyên tắc quan trọng:

- Không làm hỏng logic câu hỏi/chấm điểm hiện có khi chỉnh giao diện.
- Câu hỏi SAT trong Quest phải lấy từ ngân hàng hiện tại, không nhân đôi logic chấm.
- Key bí mật chỉ nằm server-side trong `.env.local`; không đưa API key vào client hoặc commit.
- Khi chỉnh UI, ưu tiên responsive web nhưng không phá native layout.

## 2. Stack và cách chạy

- Expo SDK 57 + Expo Router.
- TypeScript strict.
- React Native Web + NativeWind.
- Zustand, TanStack Query, Supabase.
- `react-native-reanimated`, `react-native-svg`, `expo-linear-gradient` cho motion và visual.

```bash
npm install
Copy-Item .env.example .env.local
# Điền biến môi trường cần thiết vào .env.local
npm run web -- --port 8082
```

Mở:

- `http://localhost:8082/intro` — trang giới thiệu/trang chủ.
- `http://localhost:8082/quest` — Quest home.
- `http://localhost:8082/sentence/videos` — thư viện video luyện nghe.
- `http://localhost:8082/sentence/youtube?v=pEO9-iPZQWA` — workspace chép chính tả theo video.

Kiểm tra trước khi bàn giao tiếp:

```bash
npm run typecheck
npx eslint src/components/layout/Sidebar.tsx src/components/layout/TaskShell.tsx app/sentence/youtube.tsx
npm test
npm run build:web
```

## 3. Những phần đã hoàn thành

### ReadUp Quest

Các route:

- `app/quest.tsx` — Quest home.
- `app/quest/map/[mapId].tsx` — bản đồ và node tiến trình.
- `app/quest/battle/[battleId].tsx` — màn chiến đấu SAT.
- `app/quest/result/[battleId].tsx` — kết quả, XP, sao và phần thưởng.

Các phần dùng chung:

- `src/services/quest/types.ts` — kiểu dữ liệu Quest.
- `src/services/quest/maps.ts` — ba map Iron Frontier, Fjord of Runes, Infinite Dungeon.
- `src/services/quest/combat.ts` — damage, combo, phản công, sao và XP.
- `src/services/quest/question-pool.ts` — adapter câu hỏi SAT cho battle.
- `src/store/useQuestStore.ts` — cache tiến trình Quest bằng Zustand.
- `src/components/quest/QuestHud.tsx` và `QuestVisual.tsx` — HUD/visual battle.

Assets Quest nằm trong `assets/quest/`:

- background map/battle cho ba khu vực;
- sprite nhân vật/quái;
- sticker nền trong suốt và quest world background.

Combat hiện có đúng/sai, combo, HP, damage, boss, screen shake/feedback và hiệu ứng âm thanh nền tảng. Cần tiếp tục kiểm tra trên desktop và mobile.

### Workspace luyện video YouTube

File chính: `app/sentence/youtube.tsx`.

Đã có:

- Shadowing, Chép chính tả, Quiz trên cùng workspace.
- Video YouTube nhúng trực tiếp trong iframe chính thức, không mở tab ngoài từ app.
- Thumbnail làm lớp phía sau trong lúc player tải.
- Transcript tự động nếu server lấy được; fallback dán transcript thủ công.
- Lưu transcript/video đã chuẩn bị vào `useVideoTranscriptStore`.
- Danh sách câu, letter board, nghe lại, xem đáp án, câu tiếp theo.

Giới hạn cần nhớ: YouTube có thể chặn iframe hoặc phụ đề tùy browser/video. Không được giả vờ rằng mọi video đều lấy được transcript tự động; phải giữ fallback rõ ràng.

### Nền và layout

- `src/components/layout/TaskShell.tsx` hỗ trợ `tone="brand"` và `tone="paper"`.
- Thêm prop `paperGrid` để workspace dùng nền sáng giống trang chủ nhưng không có lưới.
- Workspace YouTube hiện dùng nền sáng `tone="paper"`, `paperGrid={false}`; phần video và dictation vẫn giữ panel tối để dễ tập trung.
- `src/components/layout/AuroraBackdrop.tsx` là nền tối loang; `GridBackdrop.tsx` là nền sáng xanh–tím.

### Sidebar

File: `src/components/layout/Sidebar.tsx`.

Hành vi mới:

- rail rộng hơn một chút (`76px`);
- icon lớn hơn;
- tác vụ đang active hiển thị label cố định bên dưới icon;
- tác vụ không active chỉ hiện tooltip khi hover;
- tooltip không bắt pointer để tránh chớp tắt hover.

Navigation source of truth: `src/navigation/nav-items.ts`.

## 4. Cấu trúc thư mục cần biết

```text
app/                         Expo Router routes và API routes
src/components/layout/       AppShell, Sidebar, TaskShell, backdrop
src/components/ui/           Button, Card, Icon, Badge, ProgressBar...
src/components/quest/        Quest HUD và visual battle
src/navigation/               NAV_GROUPS, activeNavKey, bottom tabs
src/services/quest/           combat, map, question adapter, types
src/services/youtube/         parse video, transcript, InnerTube/fallback
src/store/                    Zustand stores
src/theme/tokens.ts           màu, typography, spacing, shadow
assets/quest/                 visual assets của Quest
supabase/migrations/          schema database
```

## 5. Biến môi trường và bảo mật

File thật là `.env.local`, không commit. Các nhóm chính:

- `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` — client Supabase.
- `SUPABASE_SERVICE_KEY` — server-side only.
- `ANTHROPIC_API_KEY` — Claude API server-side.
- `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_TEXT_MODEL`, `OPENAI_IMAGE_MODEL` — provider tương thích OpenAI server-side.
- Các biến `AI_*`, `*_MODEL`, `TRANSLATE_MODEL`, `WRITING_MODEL`, `QUESTIONS_MODEL` — cấu hình model và timeout.

Nếu API key từng được dán vào chat, terminal output hoặc commit, phải rotate key đó và thay trong `.env.local`; tuyệt đối không ghi key vào tài liệu bàn giao.

## 6. Việc cần Claude tiếp tục

Ưu tiên theo thứ tự:

1. Chạy typecheck, lint, test và web build; sửa lỗi thực tế trước khi thêm tính năng.
2. Kiểm tra thủ công ba map Quest: node thường, câu đúng, câu sai, combo, boss, result và reload.
3. Kiểm tra responsive ở desktop rộng, tablet và mobile; đặc biệt sidebar/BottomTabs.
4. Kiểm tra video iframe trên Chrome thật và in-app browser; nếu YouTube bị CSP/X-Frame chặn thì hiển thị trạng thái lỗi/fallback trong chính khung, không tự mở tab mới.
5. Bổ sung test cho progression, reward, transcript parser và route state nếu phát hiện thiếu.
6. Chỉ sau khi các kiểm tra trên ổn định mới tiếp tục polish animation, sound effect hoặc tích hợp API ngoài.

## 7. Quy tắc làm việc

- Đọc file hiện tại trước khi sửa; repo có nhiều thay đổi giao diện liên quan nhau.
- Dùng `apply_patch` cho chỉnh sửa file.
- Không dùng `git reset --hard`, không xóa thay đổi người dùng.
- Không commit `.env.local`, token, API key, transcript riêng tư hoặc dữ liệu tài khoản.
- Giữ tiếng Việt cho copy UI hiện có; tên kỹ năng thi như Reading, Writing, Shadowing, Quiz có thể giữ tiếng Anh.
- Sau mỗi nhóm thay đổi lớn, chạy ít nhất `npm run typecheck` và lint file liên quan.

## 8. Trạng thái Git tại thời điểm bàn giao

Working tree đã sạch sau commit `6de5761`. Commit này bao gồm Quest, visual assets, workspace YouTube, nền layout, sidebar, tutor knowledge base và các thay đổi UI liên quan đã có trong workspace.
