# ReadUp IELTS

App học Reading tiếng Anh / luyện IELTS, một codebase chạy cả web, iOS và Android.

Stack: Expo SDK 57 + expo-router · TypeScript strict · Supabase · NativeWind ·
Zustand · TanStack Query · ts-fsrs · Recharts (web) / victory-native (mobile) ·
Claude API cho tính năng AI · API tương thích OpenAI cho sinh icon/ảnh.

## Chạy dự án

```bash
npm install
cp .env.example .env.local     # rồi điền giá trị thật
npm run web                    # hoặc: npm run android / npm run ios
npm run typecheck
```

## Biến môi trường

`.env.local` (đã nằm trong `.gitignore`, không bao giờ commit):

| Biến | Phía | Dùng để |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | client | endpoint Supabase |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | client | key công khai + RLS |
| `SUPABASE_SERVICE_KEY` | server | ingest pipeline, ghi dữ liệu hệ thống |
| `ANTHROPIC_API_KEY` | server | sinh đề, giải thích, chatbox |
| `OPENAI_API_KEY` | server | sinh icon / thumbnail / illustration |
| `OPENAI_BASE_URL` | server | proxy tự host tương thích OpenAI |

Mọi lời gọi có key đều chạy server-side (Expo Router API route hoặc Supabase Edge
Function). Client không bao giờ đọc key bí mật — xem `src/lib/env.ts`.

## Cấu trúc

```
app/                     route (expo-router, file-based)
  _layout.tsx            providers + font + AppShell
  dashboard.tsx          Dashboard (ảnh tham chiếu 4)
  practice|library|vocabulary|progress|...   các trang còn lại
src/
  components/ui/         Card, StatCard, Badge, Button, ProgressBar, Icon, HeroBanner...
  components/layout/     AppShell, Sidebar, TopNav, BottomTabs, Screen, Grid
  navigation/            khai báo mục điều hướng dùng chung web + mobile
  theme/tokens.ts        design tokens (màu, bo góc, chữ, bóng, gradient)
  lib/                   env, supabase client
  types/database.ts      kiểu dữ liệu khớp schema
supabase/migrations/     SQL migration
```

## Hệ thiết kế

Bám theo 5 ảnh tham chiếu: nền `#F7F8FC`, card trắng bo 16px + bóng rất nhẹ,
primary `#2563EB`, accent `#7C3AED`, banner gradient xanh → tím, icon đặt trong
hình tròn nền pastel cùng tông, chữ Plus Jakarta Sans.

Web: top nav ngang + sidebar trái cố định 9 mục. Đáy sidebar là card streak/động
viên (thay cho card "Upgrade to Premium" trong ảnh, vì đây là bản dùng cá nhân).
Dưới 1024px: sidebar thu thành bottom tab 5 mục + tab **More**.

## Database

Migration: `supabase/migrations/20260809000100_init.sql`

Áp dụng bằng Supabase CLI:

```bash
npx supabase link --project-ref <ref>
npx supabase db push
```

Điểm đáng chú ý:

- **Bản quyền được ràng buộc ở tầng DB.** Bài Loại B (`license_type =
  'headline_only'`) bị CHECK constraint chặn không cho lưu `body_text`, và bắt
  buộc phải có `source_url` để mở link gốc.
- **RLS bật trên mọi bảng.** Dữ liệu cá nhân lọc theo `user_id = auth.uid()`;
  bài đọc chung ai cũng đọc được, bài tự dán (`is_private`) chỉ chủ sở hữu thấy.
- `questions` bắt buộc `evidence_text`, `evidence_paragraph_index`,
  `explanation` — nền tảng cho màn Test Review (ảnh 1).
- `vocab_entries.source_sentence` là `not null`: mỗi từ luôn lưu kèm nguyên câu
  gốc nơi gặp.

## Cào bài đọc (bước 3)

```bash
npm run ingest                    # cào tất cả nguồn, ghi src/data/seed/articles.json
npm run ingest -- --limit 40      # số bài tối đa mỗi nguồn
npm run ingest -- --only wikipedia --only plos
npm run ingest -- --rescore       # chấm lại độ khó, không gọi mạng
npm run ingest -- --push          # đẩy tiếp lên Supabase (cần service key)
```

**Loại A — lưu toàn văn** (public domain / Creative Commons, có attribution):
Wikipedia, Simple Wikipedia, NASA, CDC, PLOS ONE, arXiv abstracts.

**Loại B — chỉ tiêu đề** (`license_type='headline_only'`, `body_text=null`):
BBC, The Guardian, The Economist, NPR, ScienceDaily, Phys.org. App chỉ lưu
tiêu đề + mô tả có sẵn trong RSS + ảnh + link gốc + ngày; bấm vào mở trang gốc
bằng expo-web-browser. Ràng buộc này được chặn ở cả tầng code lẫn tầng DB.

Chấm độ khó: Flesch-Kincaid Grade + tỉ lệ từ nằm ngoài 5.000 từ phổ biến nhất,
quy ra CEFR và band range. Ngưỡng đã hiệu chỉnh trên chính kho bài đã cào.

Wikimedia yêu cầu User-Agent có email liên hệ thật, nếu không sẽ trả 429 —
đổi qua biến `INGEST_CONTACT` trong `.env.local`.

## Sinh icon / ảnh bằng AI (bước 2)

Toàn bộ ảnh được sinh **một lần** rồi lưu vào Supabase Storage (bucket `assets`)
và ghi lại trong bảng `generated_assets`. Client chỉ đọc URL từ bảng đó — không
bao giờ gọi OpenAI khi render.

```bash
npm run assets:plan                          # xem 31 tài nguyên sẽ sinh, không gọi API
npm run assets:generate                      # sinh những gì còn thiếu
npm run assets:generate -- --kind illustration
npm run assets:generate -- --key nav/library --force
npm run ai:layout -- "Panel evidence nên đặt bên phải hay dưới?"
```

Danh mục (`src/services/ai/asset-catalog.ts`): 9 icon điều hướng, 8 icon dạng câu
hỏi, 10 thumbnail theo chủ đề, 4 illustration 3D cho banner.

Chạy lại lệnh là an toàn: thứ đã có sẽ dùng cache, chỉ mục lỗi mới sinh lại.

Kiến trúc lời gọi AI (`src/services/ai/`):

| File | Vai trò |
|---|---|
| `client.ts` | khởi tạo SDK OpenAI với `baseURL` là proxy tự host; chặn nếu bị import từ client |
| `errors.ts` | chuẩn hoá lỗi thành `AiError` với mã và cờ `retryable` |
| `retry.ts` | retry luỹ thừa + jitter, chỉ thử lại lỗi tạm thời (429/5xx/mạng/timeout) |
| `prompts/` | template prompt riêng cho từng loại tài nguyên |
| `images.ts` | gọi endpoint images, nhận b64 hoặc URL |
| `assets.ts` | cache → sinh → upload Storage → ghi `generated_assets` |
| `layout-advisor.ts` | hỏi ý kiến bố cục khi dựng UI |

Phía client: `useAssetMap()` / `useAssetUrl(key)` và component `<AssetImage>`.
Tài nguyên chưa sinh thì UI tự rơi về icon vector nội bộ, không vỡ layout.

## Tiến độ

- [x] **Bước 1** — Khởi tạo Expo + Supabase + schema + migration + design tokens
      + bộ component nền (Card, StatCard, Badge, Button, ProgressBar) khớp ảnh
      tham chiếu.
- [x] **Bước 2** — Lớp gọi AI (retry + xử lý lỗi), danh mục 31 tài nguyên,
      pipeline sinh → upload Storage → cache, API route server-side, và
      component client tiêu thụ ảnh. *Chờ key thật để chạy sinh ảnh.*
- [x] **Bước 3** — Ingest pipeline + chấm CEFR. Đã cào thật **114 bài** từ 11
      nguồn (78 bài toàn văn Loại A, 36 bài chỉ tiêu đề Loại B).
- [x] **Bước 4** — Library, màn hình đọc 2 cột, tra từ theo ngữ cảnh, highlight
      5 màu, TTS, đếm WPM, tô sẵn từ đã lưu.
- [x] **Bước 5** — Sổ từ + FSRS (ts-fsrs) + 4 kiểu thẻ + Again/Hard/Good/Easy.
- [x] **Bước 6** — Sinh đề (Claude, có fallback offline) + bấm giờ + Test Review
      kèm evidence và LESSON.
- [x] **Bước 7** — Chatbox trợ giảng, streaming, prompt gợi ý + prompt tự lưu.
- [x] **Bước 8** — Dashboard + Progress với line chart, donut, heatmap, bar chart.

### Lưu trữ dữ liệu

Dữ liệu học (tiến độ, sổ từ, lịch FSRS, highlight, ghi chú, lượt làm bài) hiện
lưu **trên thiết bị** qua AsyncStorage/localStorage, nên app chạy được ngay
không cần tài khoản. Schema Supabase + RLS đã dựng sẵn ở bước 1; khi có key,
lớp store thay adapter là đồng bộ được lên cloud.

### Cần API key mới chạy

| Tính năng | Không có key | Có key |
|---|---|---|
| Sinh đề | Bộ offline bám câu chữ trong bài | Claude ra đề chuẩn IELTS 8 dạng |
| Tra từ | IPA + nghĩa tổng quát + dịch máy | Thêm nghĩa đúng theo ngữ cảnh câu |
| Chatbox | Báo chưa cấu hình | Trợ giảng streaming, trích số đoạn |
| Icon/ảnh | Icon vector nội bộ | Ảnh sinh sẵn trong Supabase Storage |
