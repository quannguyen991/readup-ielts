# Bàn giao dự án ReadUp cho Antigravity

Viết cho agent tiếp quản. Đọc hết trước khi sửa dòng mã đầu tiên. Mục 5, 6, 7 là
phần đắt nhất: những thứ đã trả giá bằng thời gian gỡ lỗi hoặc bị chủ dự án bắt
làm lại, không đoán ra được từ mã nguồn.

Cập nhật: 27/09/2026 · nhánh `proofloop` · commit `d3c8930` · 2.488 test xanh.
Tài liệu cũ hơn: `docs/ban-giao-chatgpt.md` (20/09). Chỗ nào hai tài liệu khác
nhau thì **tài liệu này đúng**.

---

## 0. Đọc trong 60 giây

| Việc | Câu lệnh |
|---|---|
| Thư mục gốc | `D:\Claude\readup-ielts` (Windows) |
| Chạy dev | `npm run web` → http://localhost:8081 |
| Kiểm kiểu | `npx tsc --noEmit -p .` |
| Lint | `npx eslint app src --quiet` |
| Test | `npm test` — phải **2488 pass / 0 fail** (hoặc hơn) |
| Build web | `rm -rf dist && npx expo export -p web` |
| Xem bản build | `npx expo serve --port 5055` |
| **Triển khai** | `npx vercel deploy --prod --yes` |
| Bản chạy thật | https://readup-ielts.vercel.app |

**Git không có remote.** "Đẩy lên" = `vercel deploy --prod`. Vẫn commit đầy đủ
vào nhánh `proofloop` ở máy.

Tài liệu Expo: **SDK 57 khác nhiều bản cũ** — tra
https://docs.expo.dev/versions/v57.0.0/ trước khi viết mã đụng tới Expo
(xem `AGENTS.md`).

---

## 1. Dự án là gì

ReadUp — app luyện thi IELTS + SAT cho học sinh cấp 3 Việt Nam. Một codebase
chạy web (chính), iOS, Android. Đã có người dùng thật (đăng ký bằng email +
mật khẩu), có gói trả phí và học thử.

Stack: **Expo SDK 57 + expo-router** · TypeScript strict · **NativeWind** ·
Zustand (persist) · TanStack Query · **Supabase** (auth + đồng bộ) · ts-fsrs ·
Reanimated · Vercel (web output `server`, API route `app/api/*+api.ts`).

**Các mảng** (thanh bên = Trang chủ + 6 mục lớn, `src/navigation/nav-items.ts`):

- **Trang chủ** `/intro` — app LUÔN mở vào đây (`app/index.tsx`).
- **Hôm nay** `/dashboard` — Lộ trình, Tiến độ, Hồ sơ lỗi, Sổ bằng chứng.
- **IELTS** — thi thử Reading, kho bài đọc, đọc báo song ngữ, Writing (chấm AI),
  nghe & chép, đọc theo VOA.
- **SAT** — SAT Math (chẩn đoán, drill 19 kỹ năng), SAT Verbal (624 câu),
  bài lý thuyết, thi thử SAT đầy đủ 98 câu.
- **Từ vựng** — thư viện bộ từ (50 chủ đề IELTS × 50 từ + SAT), trong mỗi bộ có
  7 cách luyện: Học xen kẽ, **Quiz ôn tập (A/B/C/D kiểu đề THPT)**, Nghe chép,
  Điền vào câu, Phát âm, Kiểm tra, Bóng bay; thẻ lật có tự chấm; ba nhóm
  Đã nhớ / Chưa nhớ / Cần ôn tập.
- **Quest** — game khi học (chém quái khi trả lời đúng), xếp hạng, đổi quà.
- **Cá nhân** — hồ sơ, mời bạn, gói học, cài đặt, trang giáo viên.
- **Quản trị** `/admin` — chỉ tài khoản có `role = 'admin'` trong bảng
  `profiles` (Supabase). Có bộ đếm lượt truy cập (bảng `page_views`).

---

## 2. Chạy, biến môi trường, triển khai

```bash
npm install
cp .env.example .env.local   # điền giá trị thật — hỏi chủ dự án, KHÔNG tự bịa
npm run web
```

- `EXPO_PUBLIC_*` bị **inline vào bundle** → chỉ để thứ công khai.
- Khoá bí mật (`SUPABASE_SERVICE_KEY`, `OPENAI_API_KEY`, `AI_*_API_KEY`,
  `IMAGE_API_KEY`…) chỉ đọc trong API route. **Không in, không log, không commit.**
- Trên Vercel biến môi trường đã khai sẵn; deploy không cần truyền gì thêm.
- **Bản local nói chuyện với Supabase THẬT.** Không tạo tài khoản thật, không
  xoá dữ liệu, không chạy migration khi chưa hỏi.

**Cửa AI.** Mọi lời gọi AI qua `src/services/ai/fallback.ts`: nhiều proxy độc
lập, hỏng cửa này sang cửa khác. Một cửa **nuốt vai `system`** → phải gộp chỉ dẫn
vào tin nhắn người dùng (`foldSystemIntoUser`). Thêm cửa mới thì phải đo.
**Trước khi tiêu tiền AI** (sinh ảnh, sinh hàng loạt): kiểm số dư, ước tính chi
phí, chọn model rẻ, **hỏi chủ dự án**.

**Học thử**: 5 ngày gói Plus hoặc Pro, mỗi tài khoản một lần; **lượt AI vẫn ở mức
Free** trong lúc học thử (chi phí vận hành). Đừng cho trial nâng hạn mức AI.

**Đăng ký**: `/api/auth/sign-up` tạo user phía máy chủ (`email_confirm: true`),
không gửi thư; client rồi `signInWithPassword`.

---

## 3. Bản đồ mã nguồn

```
app/                        route (expo-router, file-based)
  _layout.tsx               providers, font, AppShell, PageTransition, <title>ReadUp
  index.tsx                 → /intro
  api/*+api.ts              endpoint máy chủ (nơi DUY NHẤT thấy khoá)
  vocabulary/topic/[slug]/  trang bộ từ + 7 màn luyện (learn, quiz, dictation…)
src/
  components/layout/        AppShell, Sidebar, Screen, Grid, LightHero, GridBackdrop
  components/vocab/         DeckLibrary, DeckCard (xấp thẻ), study/* (FlipCard, StudyKit…)
  components/effects/       SkyEffect (bầu trời sáng: sao, sao băng, mây)
  navigation/nav-items.ts   KHAI BÁO ĐIỀU HƯỚNG DÙNG CHUNG web + mobile
  navigation/focus-routes.ts màn tập trung / màn học từ vựng (nền chàm)
  services/                 logic thuần, có test cạnh bên (foo.ts + foo.test.ts)
  store/                    Zustand + persist
  services/sync/stores.ts   store nào được đồng bộ lên Supabase
  theme/tokens.ts           màu, gradient — NGUỒN MÀU DUY NHẤT (cùng tailwind.config.js)
supabase/migrations/        SQL
docs/                       tài liệu, gồm tệp này
```

---

## 4. Quy ước viết mã

1. **Chú thích tiếng Việt, giải thích VÌ SAO** (quyết định, cái bẫy, số đo), kèm
   ngày khi đó là yêu cầu của chủ dự án. Xem `src/services/ai/fallback.ts`.
2. Chữ hiển thị: tiếng Việt. Tên biến/hàm: tiếng Anh.
3. Logic nằm ở `src/services/**` có test (`tsx --test`); màn hình chỉ gọi service.
   Không test component.
4. Màu lấy từ token (`src/theme/tokens.ts` + `tailwind.config.js`), không rải mã màu.
5. Không thêm phụ thuộc mới khi chưa hỏi (phải chạy cả web lẫn mobile).
6. Commit tiếng Việt, tiêu đề nói KẾT QUẢ, thân nói vì sao. Chỉ `git add` đúng
   tệp mình sửa.

---

## 5. Bẫy kỹ thuật đã trả giá

1. **NativeWind + `Pressable`: `style` dạng hàm bị bỏ qua** khi có `className`.
   Dùng `useState` + `onHoverIn/onHoverOut`.
2. **react-native-web lọc mất `animation`/CSS variable trong `style` của View.**
   Hiệu ứng CSS (keyframes, `--var`) phải vẽ bằng `React.createElement('div')`
   + thẻ `<style>` chèn một lần. Mẫu: `SkyEffect.tsx`, `ProfileEffect.tsx`.
3. **Reanimated: không dùng `entering=`** trên web — trang trắng. Dùng shared value.
4. **`flexBasis: 0` trong cột = cao 0.** `flex-1` chỉ an toàn trong hàng ngang.
5. **Trùng `id` gradient SVG** → sinh bằng `useId()`.
6. **`\b` của JS không hiểu chữ có dấu** → dùng `\p{L}` + cờ `u`.
7. **Định nghĩa component bên trong hàm render** → remount, ô nhập mất chữ.
8. **Enter bị `TextInput` RN-web nuốt** → nghe ở pha bắt (`addEventListener(..., true)`).
9. **PowerShell `Get-Content`/`Set-Content` làm hỏng tệp UTF-8** (tiếng Việt nát).
   Sửa tệp bằng công cụ sửa tệp, hoặc Python `encoding='utf-8'`.
10. **Heredoc/shell làm mất `\`** trong script sinh mã (`\b` thành ký tự backspace).
    Script dài: ghi ra tệp rồi chạy.
11. **Prettier của repo định dạng lại cả tệp** → đừng chạy prettier lên tệp
    người khác viết; diff sẽ phình to.
12. **`grep` sau `npm test` trong chuỗi `&&`** vẫn "thành công" dù có test hỏng →
    kiểm dòng `fail 0` thật sự trước khi commit/deploy.
13. **`npx vercel deploy` đôi khi báo "operation was aborted"** → chạy lại là được.
14. **Timezone**: trên Windows, `TZ=Asia/Ho_Chi_Minh` kiểu IANA bị hiểu thành UTC.

---

## 6. Luật cứng của chủ dự án — không được phá

1. **Không sao chép toàn văn báo có bản quyền.** Đọc song ngữ chỉ dùng VOA, NASA
   (public domain), Global Voices (CC BY), Wikinews, Wikipedia (CC BY-SA — bản
   dịch cùng giấy phép), bài tự viết. Mỗi bài có dòng nguồn + giấy phép.
2. **Không in / log / commit khoá API.**
3. **Đề luyện sinh bằng luật, không gọi API.** AI chỉ để chấm, giải thích, hội thoại.
4. **Riêng tư**: bảng xếp hạng chỉ hiện tên người dùng tự đặt, còn lại
   "Học viên ABCD"; thống kê người dùng chỉ ở dạng tổng hợp (không email/ID).
5. **Số liệu cá nhân phải THẬT**: band mục tiêu, tiến độ… lấy từ dữ liệu người
   dùng khai (`src/services/progress/goal.ts`: Lộ trình → hồ sơ). Chưa có thì
   hiện lời mời khai, **không dùng giá trị mặc định** (từng có "Target 7.0" giả
   bị bắt sửa). Chưa đo thì hiện "—".
6. **Nhiều phiên dùng chung thư mục**: luôn `git status` trước khi sửa; không
   commit hộ, không revert việc người khác. `docs/readup-tom-tat-du-an.md` để
   nguyên, không commit.
7. **Hỏi trước việc khó lùi**: xoá dữ liệu, migration Supabase thật, đổi cấu
   hình Vercel, tiêu tiền AI, gửi gì ra ngoài.
8. **Không làm app mới, không dựng lại từ đầu.** Không đổi slug `readup-ielts`.

---

## 7. Quyết định thiết kế đã chốt (bị bắt sửa nếu làm khác)

- **Không giống The IELTS Dictionary (TID).** Chủ dự án đang dùng TID làm tham
  chiếu độ GỌN, ÍT CHỮ — nhưng chép hình thức (thẻ màu kín có hoa văn sọc/chấm,
  khối vàng…) là bị chê "lộ liễu" và bắt làm lại. Học độ gọn, không chép dáng.
- **Nền app = xanh kẻ ô** (`CANVAS_STOPS` trong `GridBackdrop.tsx`) — **không
  đổi**. Đã thử nền kem → bị bắt trả lại.
- **Hero `LightHero`** (khung, ngôi sao 3D, dòng chốt trên khối màu) — giữ nguyên
  thiết kế. Khối đầu trang tối `gradient.hero` là **dải xanh**; than đá bị chê
  "đen lạc quẻ".
- **Tông màu chính = xanh nhạt `#7FA3F6 → #4A7FE8`** (27/09). Xanh đậm `#2563EB`
  và chàm `#4F46E5` đã bỏ trên toàn app. Bảng `primary`/`brand` ở
  `tailwind.config.js` + `tokens.ts`; trên web `.bg-primary-600/700`,
  `.bg-brand/-mid` có dải chuyển màu trong `global.css`. **Không dùng lại màu
  xanh–tím đậm.**
- **Thanh bên**: Trang chủ + 6 mục lớn, thu gọn được (chỉ còn biểu tượng); mục
  đang học tô **dải xanh, chữ trắng**, kèm tên trang con; trang con chỉ mở dưới
  mục đang học.
- **Thẻ bộ từ** = xấp thẻ giấy trắng (hai tấm lệch phía sau, gáy màu, chữ cái
  đầu mờ, vòng % thuộc). Trang một bộ: đầu trang thẻ trắng có gáy màu → hàng
  "Cách luyện" (7 ô trắng) → ba nhóm Đã nhớ/Chưa nhớ/Cần ôn tập → thẻ lật (nút
  Lật thẻ, rồi Quên / Mơ hồ / Nhớ rồi, phím 1-2-3) → danh sách từ.
- **Thẻ học từ vựng có bầu trời SÁNG** (`SkyEffect`): sao màu, mưa sao băng, mây.
  **Nền vẫn sáng**, không chuyển sang nền đêm như TID.
- **Màn học một bộ từ** nằm trên nền chàm kẻ ô (`isVocabStudyRoute`); thẻ trắng.
- **Quiz ôn tập = trắc nghiệm A/B/C/D kiểu đề THPT** (`services/vocab/thpt-quiz.ts`):
  điền chỗ trống, CLOSEST, OPPOSITE (có bẫy đồng nghĩa), dự phòng "đúng định nghĩa".
- **Màn đang làm bài** dùng `TaskShell` compact (một hàng: Thoát · tên bài).
- **Ít chữ**: bỏ các câu kiểu "đề dựng bằng code, không gọi AI" khỏi giao diện.
- Trợ lý AI ghim góc mọi màn trừ lúc thi; linh vật đang đeo thay nút trợ lý.
- Trang đổi quà tên **"Đổi quà"** (không phải "Đổi sao").

---

## 8. Việc còn dang dở

1. **Ảnh minh hoạ AI trước mỗi mảng học** (ai-box, model `qwen-image-3.0`,
   `npm run assets:plan` / `assets:generate`, catalog ở
   `src/services/ai/asset-catalog.ts`, kiểu nét vẽ người phẳng). ~10 ảnh.
   **Chưa làm vì cần chủ dự án duyệt chi phí** — kiểm số dư, ước tính, hỏi trước.
2. **Đồng bộ chưa phủ hết.** `services/sync/stores.ts` chỉ đồng bộ: math, study,
   vocab, billing, weekly, satrw, game, reward, roadmap. **Chưa**: tiến độ bộ từ
   (`useTopicStudyStore` — Quiz ôn tập ghi vào đây), writing, sentence, mastery,
   reader… Đổi máy là mất phần đó. Nên làm tiếp theo.
3. **Trang pháp lý / liên hệ chưa có route**: `src/content/legal/` và
   `LegalTabs.tsx` đã viết, chưa có `app/legal.tsx`, `app/contact.tsx`. Biến
   liên hệ để trống thì im lặng, không bịa địa chỉ.
4. Gói 3 tháng — giá chưa được chốt, hỏi trước.
5. Nợ nội dung: 34 bài song ngữ đời đầu có đáp án đúng thường là phương án dài
   nhất; bộ mới đã có luật chặn, chưa chạy lại cho bộ cũ (chờ chủ dự án đồng ý).

---

## 9. Nghiệm thu một thay đổi

1. `npx tsc --noEmit -p .`, `npx eslint app src --quiet`, `npm test` → sạch,
   **đọc dòng `fail 0`**.
2. Build + mở màn vừa sửa trong trình duyệt, xem tận mắt; chụp màn hình khổ máy
   tính và khổ điện thoại (390px) nếu đụng bố cục. Đo bằng JS khi khẳng định bố cục.
3. Hiệu ứng động: dừng hoạt cảnh để chụp
   (`document.getAnimations().forEach(a => { a.currentTime = 1500; a.pause() })`).
4. Commit chỉ tệp mình sửa → `npx vercel deploy --prod --yes` → kiểm trên
   https://readup-ielts.vercel.app.
5. Báo cáo trung thực, bằng tiếng Việt, ngắn: làm gì, kiểm thế nào, còn gì chưa làm.

---

## 10. Cách làm việc với chủ dự án

- Nhắn ngắn, hay kèm ảnh chụp màn hình; trả lời bằng tiếng Việt.
- Muốn agent **tự làm tới cùng** (sửa → kiểm → commit → deploy), chỉ dừng khi cần
  mật khẩu/khoá hoặc việc tiêu tiền/khó lùi.
- Không đăng nhập hộ, không nhập mật khẩu; tới trang đăng nhập thì dừng để chủ
  dự án tự bấm.
