# ReadUp

App luyện thi tiếng Anh — IELTS (Reading, Writing, Vocabulary) và SAT (Reading &
Writing, Math). Một codebase chạy cả web, iOS và Android.

Tên gói (`slug`, `bundleIdentifier`) vẫn là `readup-ielts` và giữ nguyên như vậy:
đổi chúng là đổi cả dự án trên Vercel lẫn danh tính app trên cửa hàng, mà cái
người dùng nhìn thấy chỉ là `expo.name`.

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

Web: **chỉ một thanh điều hướng** — sidebar trái dạng THẺ NỔI (cách mép 12px, bo
16px, đổ bóng nhẹ). Thanh ngang phía trên đã bỏ; logo, thông báo và tài khoản
dời hết vào sidebar. Hai thanh cùng lúc bắt mắt phải quét hai chỗ cho một việc.
Đáy sidebar là card streak/động viên (thay cho card "Upgrade to Premium" trong
ảnh, vì đây là bản dùng cá nhân). Dưới 1024px: sidebar ẩn, thay bằng một thanh
đầu trang gọn (`MobileHeader`) + bottom tab 5 mục + tab **More**.

## Database

Migration: `supabase/migrations/` (10 file, chạy theo thứ tự tên).

Cách nhanh nhất — tạo project, đẩy lược đồ, cấu hình đăng nhập trong một lệnh
(cần một [access token](https://supabase.com/dashboard/account/tokens)):

```bash
npm run setup:supabase -- --token sbp_... --vercel
```

Chạy lại được: nó dùng lại project cũ và bỏ qua migration đã chạy (sổ ghi nằm ở
bảng `schema_migrations`).

Hoặc làm tay bằng Supabase CLI:

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
npm run ingest                     # cào tất cả nguồn, ghi index.json + bodies/
npm run ingest -- --limit 400      # số bài tối đa mỗi nguồn
npm run ingest -- --resume         # chạy tiếp sau khi bị ngắt
npm run ingest -- --replace        # bỏ kho cũ, cào lại từ đầu
npm run ingest -- --only sat       # chỉ cụm nguồn SAT
npm run ingest -- --only wikipedia --only plos
npm run ingest -- --push           # đẩy tiếp lên Supabase (cần service key)
```

Kho bài chia làm `src/data/seed/index.json` (metadata mọi bài, bundle sẵn để
Library duyệt và lọc tức thì) và `src/data/seed/bodies/chunk-NN.json` (toàn văn,
nạp lười qua `require()`). `bodies/registry.ts` do script sinh — đừng sửa tay.

Lần chạy `--limit 400 --replace` gần nhất cho **1450 bài: 614 IELTS + 836 SAT**,
`index.json` 1389 KB và 28 file chunk (7.8 MB). Lưu ý về dung lượng: `require()`
chỉ hoãn phần *parse*, chunk vẫn nằm trong bundle — bundle web hiện ~10.6 MB.
Muốn nhẹ hơn thì phải chuyển toàn văn sang Supabase hoặc tải chunk qua HTTP lúc
chạy, và khi đó `getArticleBody` phải đổi thành async.

**Loại A — lưu toàn văn** (public domain / Creative Commons, có attribution):
Wikipedia, Simple Wikipedia, NASA, PLOS ONE, arXiv abstracts, Project Gutenberg.

**Loại B — chỉ tiêu đề** (`license_type='headline_only'`, `body_text=null`):
BBC, The Guardian, The Economist, NPR, ScienceDaily, Phys.org, CDC. App chỉ lưu
tiêu đề + mô tả có sẵn trong RSS + ảnh + link gốc + ngày; bấm vào mở trang gốc
bằng expo-web-browser. Ràng buộc này được chặn ở cả tầng code lẫn tầng DB.

### Khổ passage theo kỳ thi

Mỗi bài được cắt về đúng khổ một passage đề thi rồi gán `passage_tier`, thay vì
lưu nguyên bài gốc dài ngắn tuỳ nguồn.

| Kỳ thi | Tier | Khổ | Ghi chú |
|---|---|---|---|
| IELTS | `p1` / `p2` / `p3` | 750 / 900 / 1050 từ | ba passage tăng dần độ khó |
| IELTS | `short_academic` | 150–649 từ | abstract, tin ngắn |
| IELTS | `official_practice` | — | link đề chính thức, không lưu nội dung |
| SAT | `sat_short` | 25–150 từ | khổ của đề số hoá hiện hành, mỗi đoạn một câu hỏi |
| SAT | `sat_long` | 500–750 từ | khổ đoạn dài của SAT giấy, để luyện đọc dài hơi |

Lưu ý: ielts.org không công bố tổng số từ của một đề, nên con số ~2700 từ cho ba
passage là hiệu chỉnh chứ không phải chuẩn official.

### Nguồn SAT

SAT Reading and Writing lấy đề từ bốn loại văn bản, và kho bài bám đúng bốn loại đó:

- **Văn học** — tiểu thuyết và truyện ngắn public domain (Austen, Dickens, Chopin,
  Wharton, Chesnutt, Sui Sin Far, Zitkala-Ša, Toomer…).
- **Lịch sử & khoa học xã hội** — nhóm văn kiện lập quốc và diễn văn mà đề thi hay
  gọi là "Great Global Conversation": Declaration of Independence, The Federalist
  Papers, Common Sense, Douglass, Jacobs, Equiano, Du Bois, Wollstonecraft, Mill.
- **Nhân văn** — Emerson, Thoreau, Plato, Marcus Aurelius, Helen Keller…
- **Khoa học** — kinh điển (Darwin, Faraday, Hooke, Einstein, Wallace) cộng một
  mảng khoa học đương đại cắt từ Wikipedia để có văn giải thích thời nay.

Danh mục tác phẩm nằm ở `src/services/ingest/sources/gutenberg-works.ts` — đó là
file duy nhất phải sửa khi muốn thêm/bớt bài SAT. Mọi id Gutenberg trong đó đã
đối chiếu thật với catalogue; đoán id là cào về nhầm sách mà không có gì báo lỗi.

Mỗi tác phẩm được cắt thành tối đa 5 đoạn khổ ngắn và 2 đoạn khổ dài, rải đều dọc
tác phẩm chứ không lấy liên tiếp — hai trích đoạn cạnh nhau trong cùng một chương
gần như trùng bối cảnh. Khổ dài được cắt trước, khổ ngắn bị cấm lấy đè lên, nên
không có bài ngắn nào nằm lọt trong một bài dài.

Chấm độ khó: Flesch-Kincaid Grade + tỉ lệ từ nằm ngoài 5.000 từ phổ biến nhất,
quy ra CEFR và band range. Ngưỡng đã hiệu chỉnh trên chính kho bài đã cào. Bài
SAT hiển thị bậc lớp Flesch-Kincaid thay cho band — SAT không có thang band.

### Sinh đề theo kỳ thi

`generateOfflineQuestionSet` rẽ nhánh theo `article.exam`, nên bài SAT không bao
giờ ra câu True/False/Not Given. Khác biệt cấu trúc: **mọi câu SAT đều là trắc
nghiệm đúng 4 lựa chọn**, và số câu bám khổ bài (đoạn ngắn 3 câu, đoạn dài 10).

| Dạng | Offline | Claude |
|---|---|---|
| Words in Context | ✅ | ✅ |
| Inferences | ✅ | ✅ |
| Central Ideas and Details | — | ✅ |
| Command of Evidence | — | ✅ |
| Text Structure and Purpose | — | ✅ |

Nhánh offline cố ý chỉ làm hai dạng — hai dạng mà đáp án **kiểm chứng được từ
chính bài** và không giải được bằng mẹo. Ba dạng còn lại hoặc đòi hiểu nghĩa cả
đoạn (đoán bằng thủ thuật văn bản sẽ ra đáp án SAI), hoặc dựng offline thì nhận
định gần như chép lại câu trả lời nên đối chiếu chuỗi là ra. Chi tiết lý do nằm
trong đầu file `src/services/questions/sat-generator.ts`.

Đo trên 833 bài SAT: 15 bài ra 0 câu, đều là đoạn chỉ gồm một câu văn dài — đoạn
một câu thì không còn từ nào làm đáp án nhiễu mà người đọc chưa nhìn thấy.

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
- [x] **Bước 3** — Ingest pipeline + chấm CEFR + cắt theo khổ passage. Đã cào
      thật **1450 bài** từ 14 nguồn (1400 bài toàn văn, 50 bài chỉ tiêu đề),
      gồm **614 passage IELTS** (p1/p2/p3 + bài học thuật ngắn) và **836 passage
      SAT** (588 đoạn ngắn, 245 đoạn dài, 4 loại văn bản của đề).
- [x] **Bước 4** — Library, màn hình đọc 2 cột, tra từ theo ngữ cảnh, highlight
      5 màu, TTS, đếm WPM, tô sẵn từ đã lưu.
- [x] **Bước 5** — Sổ từ + FSRS (ts-fsrs) + 4 kiểu thẻ + Again/Hard/Good/Easy.
- [x] **Bước 6** — Sinh đề (Claude, có fallback offline) + bấm giờ + Test Review
      kèm evidence và LESSON.
- [x] **Bước 7** — Chatbox trợ giảng, streaming, prompt gợi ý + prompt tự lưu.
- [x] **Bước 8** — Dashboard + Progress với line chart, donut, heatmap, bar chart.
- [x] **Bước 11** — Ba gói Free / Thường / VIP: ma trận tính năng, hạn mức theo
      chu kỳ (ngày / tuần ISO / tháng), bảng giá, khoá chặng Math, dùng thử VIP 7
      ngày, và lược đồ máy chủ đã siết quyền theo cột. *Chờ cổng thanh toán QR.*
- [x] **Bước 10** — Tài khoản (Google / Facebook / SMS OTP / email OTP), hồ sơ,
      xoá tài khoản chạy server, và đồng bộ hai chiều dữ liệu học với luật gộp
      riêng cho từng store. *Chờ key thật để bật.*
- [x] **Bước 9** — Module SAT Math: 19 template phủ đủ 4 domain, markup toán tự
      viết chạy chung web + mobile, chấm grid-in theo luật College Board, bài
      chẩn đoán 19 câu, drill theo kỹ năng, mock adaptive 2 module, và bảng nhãn
      lỗi gộp qua mọi kỹ năng. *Chạy đủ không cần API key.*

## SAT Math (bước 9)

Phủ đủ **19 kỹ năng / 4 domain** của Digital SAT Math. Khác mọi module trước ở
một điểm nền tảng: **không cần API key**, vì đáp án toán tính bằng code là chân
lý — AI không được phép tính.

```bash
npm test          # 19 property test bộ sinh đề, mỗi template chạy 200 hạt
npm run web       # rồi mở /math
```

**Có lộ trình, không phải một kho đề rời** (`src/services/math/curriculum.ts`).
Ba tầng: **chặng** (một domain) → **bài học** (một kỹ năng, có tên tiếng Việt và
một câu nói rõ cái bẫy) → **bộ đề**. Mỗi kỹ năng có **năm bộ**, và trục xuyên
suốt chúng là thời gian mỗi câu:

| Bộ | Số câu | Phút | Phút/câu | Để làm gì | Lời giải ngay |
|---|---|---|---|---|---|
| Làm quen dạng | 20 | 40 | 2,0 | Để sai. Nhận ra dạng bài trông thế nào | ✅ |
| Luyện cơ bản | 20 | 34 | 1,7 | Để hiểu, nhịp thong thả | ✅ |
| Luyện mở rộng | 24 | 38 | 1,58 | Nhiều câu hơn, siết dần | ✅ |
| Luyện tốc độ | 24 | 26 | **1,08** | NHANH HƠN đề thật, để quen áp lực đồng hồ | — |
| Chốt kỹ năng | 20 | 30 | 1,5 | Đúng nhịp đề thật. Đúng ≥70% là xong | — |

**Tối thiểu 20 câu mỗi bộ.** Dưới ngưỡng đó kết quả không nói lên điều gì: làm 6
câu đúng 4 là 67%, nhưng sai thêm một câu đã tụt 17 điểm phần trăm — quá mạnh để
phân biệt "chưa nắm kỹ năng" với "hôm nay đọc hụt một dòng".

**Lời giải ngay** chỉ bật ở ba bộ học đầu. Đọc lời giải lúc còn nhớ mình vừa nghĩ
gì thì sửa được cách nghĩ; đợi tới cuối bài 20 câu thì 19 câu trước đã trôi khỏi
đầu. Ba bộ sau mô phỏng phòng thi nên không có. Mở lời giải một câu là **khoá**
câu đó — xem đáp án xong còn sửa được thì con số đúng/sai vô nghĩa.

Màn xem lại giải thích **cả ba đáp án sai**, không chỉ cái vừa chọn: mỗi nhiễu
vốn đã dựng từ một sai lầm có tên, nên người làm đúng cũng học được ba cách hỏng
phổ biến nhất của dạng đó.

Bộ tốc độ cố ý gắt hơn cả bài kiểm tra đứng sau nó — luyện quá tốc độ rồi quay
về nhịp thật. Phần Math ép thời gian thật sự (44 câu / 70 phút), mà người biết
làm nhưng chậm và người không biết làm cùng ra một kết quả trên bảng điểm.

Cộng chặng tổng ôn: 8 bộ ôn trộn theo mảng (mỗi mảng một bộ 20 câu và một bộ dài
30 câu) và 10 đề khổ thật 22 câu × 35 phút. Tổng **113 bộ đề / 2.472 câu**.

Bộ sinh tạo được vô hạn câu, nhưng vô hạn câu không phải một chương trình học —
lớp này trả lời câu hỏi duy nhất người mới cần trả lời: *hôm nay làm bài nào*.
Mỗi bộ sinh từ hạt `<set id>:r<lượt>`, nên làm lại lần hai là đề khác hẳn mà vẫn
đúng kỹ năng ấy.

Trang `/math` có ba tab: **Lộ trình** (mặc định, mở sẵn đúng chặng đang học),
**Thư viện** (lọc theo mảng / kiểu bài / trạng thái như một thư viện đề), và
**Kết quả**. Bốn domain mỗi cái một màu dùng thống nhất mọi nơi
(`src/lib/math/theme.ts`) — màu ở đây là thông tin, không phải trang trí.

**Kho đề không có seed.** Mỗi kỹ năng có một `MathTemplate`; `build(rng)` dựng
tham số trước rồi suy ra đáp án từ chính tham số ấy, nên đề và đáp án không thể
lệch nhau. Id câu là `<template_slug>:<seed>` và bộ sinh là hàm thuần theo id,
nên lịch sử chỉ lưu id — mở màn Review là dựng lại đúng câu đó, đúng thứ tự lựa
chọn, đúng lời giải.

| Thành phần | Vai trò |
|---|---|
| `src/lib/math/expr.ts` | markup toán inline (`x^2`, `frac(a,b)`, `sqrt(x)`) + parser; KaTeX chỉ chạy web nên tự viết |
| `src/lib/math/value.ts` | số hữu tỉ chính xác — chấm bằng `number` là có ngày báo sai cho đáp án đúng |
| `src/services/math/grid-in.ts` | chấm student-produced response theo đúng luật ô điền của College Board |
| `src/services/math/templates/` | 19 template, chia theo domain |
| `src/services/math/diagnostic.ts` | bài chẩn đoán 19 câu, mỗi kỹ năng một câu |
| `src/services/math/mock.ts` | mock 2 module × 22 câu, module 2 đổi độ khó theo module 1 |
| `src/components/math/` | `MathText`, `MathFigure` (tam giác, bảng, scatterplot, hai đường song song), `MathRunner` |

**Nhiễu có nhãn lỗi.** Mỗi lựa chọn sai dựng từ đúng một sai lầm có tên
(`sign_flip`, `wrong_denominator`, `used_wrong_trig_ratio`…), nên chọn nhầm cái
nào thì màn Review gọi đúng tên cái đó. Nhãn cố ý để THÔ để gộp thống kê được
qua nhiều kỹ năng — sai dấu ở đại số và sai dấu ở hình học là cùng một thói quen;
phần riêng của từng câu viết vào `note` của lựa chọn.

**Ba chỗ nói rõ giới hạn thay vì im lặng đưa ra một con số:**

- Điểm 200–800 là **ước lượng**. College Board không công bố bảng quy đổi của đề
  số hoá. Nhánh module 2 dễ hơn bị chặn trần 600 — đó là tính chất có thật của đề.
- Ngưỡng chuyển module 60% là phỏng theo tài liệu luyện thi, không phải quy tắc
  chính thức.
- Bài chẩn đoán hỏi mỗi kỹ năng **đúng một câu**, nên nhận định cao nhất là "cần
  kiểm lại", không có nhãn "yếu". Drill riêng kỹ năng đó mới xác nhận được.

**Giới hạn đã biết:** độ khó hiện là thuộc tính của template chứ chưa phải tham
số sinh đề, nên "module khó hơn" khó hơn ở THÀNH PHẦN chứ chưa phải từng câu khó
lên. Sửa đúng nghĩa thì `build()` phải nhận thêm mức độ khó, và nó đụng cả 19
template.

## Gói Free / Thường / VIP (bước 11)

Định nghĩa ở `src/lib/billing/plans.ts`, luật chặn ở `entitlements.ts` (hàm thuần,
26 test).

| | Free | Thường | VIP |
|---|---|---|---|
| Giá tháng | 0đ | 99.000đ | 199.000đ |
| Giá năm | — | 890.000đ | 1.690.000đ |
| Lộ trình SAT Math | Trọn chặng Đại số (25 bộ) | Cả 113 bộ | Cả 113 bộ |
| Bài đọc | 5/ngày | Không giới hạn | Không giới hạn |
| Thi thử | 1/tuần | Không giới hạn | Không giới hạn |
| Sổ từ | 100 từ | Không giới hạn | Không giới hạn |
| Lượt AI | 3/tháng | 30/tháng | 300/tháng |
| Chấm Writing bằng AI | — | — | ✅ |

**Chia gói theo CHI PHÍ THẬT, không chặn bừa.** App có hai loại tính năng với hai
cấu trúc chi phí khác hẳn: mọi thứ gọi AI là tiền ra khỏi túi mỗi lượt, còn SAT
Math (sinh bằng code), kho bài đọc đã cào sẵn, FSRS và đồng bộ thì gần như bằng 0.
Nên bản Free được dùng THẬT — trọn bài chẩn đoán, trọn chặng Đại số hơn 500 câu —
đủ để học nghiêm túc vài tuần rồi tự quyết. Bản Free chỉ đủ nhìn thì người ta gỡ
app trước khi kịp thấy giá trị.

Đồng bộ nhiều thiết bị **không khoá ở gói nào**: nó gần như không tốn gì mà lại là
thứ giữ người dùng ở lại.

Hai luật gộp ngược chiều nhau khi đồng bộ (`mergeBilling`): **gói lấy bên cao hơn**
(đồng bộ không bao giờ được hạ gói — mua VIP trên điện thoại rồi mở máy tính mà bị
kéo về Free là mất tiền oan), còn **số lượt đã dùng cũng lấy bên cao hơn** (ngược
lại thì đổi máy là một cách reset hạn mức).

### ⚠️ Chưa phải tầng bảo mật

Gói hiện lưu ở client nên sửa được bằng DevTools. Chấp nhận được **lúc chưa có
thanh toán**. Migration `20260823000100_plans.sql` đã dựng sẵn phía máy chủ để lúc
nối cổng thanh toán không phải sửa lại mô hình:

- `profiles.plan` + `plan_expires_at`, và **thu hồi quyền UPDATE trên đúng ba cột
  đó** của vai trò `authenticated`. RLS là bảo mật theo HÀNG chứ không theo CỘT —
  không thu hồi thì ai cũng tự đặt `plan = 'vip'` bằng một lời gọi REST.
- Bảng `payments` với `unique (provider, provider_ref)`: một mã giao dịch chỉ cộng
  gói đúng một lần, kể cả khi webhook bị gửi lại.
- Khi nối thanh toán, mọi API tốn tiền (`/api/chat`, `/api/questions`,
  `/api/writing/*`) phải tự kiểm gói ở phía server, không tin client.

## Deploy (Vercel)

```bash
npx vercel deploy --prod --yes
```

**Lệnh build phải khai ở ĐÚNG MỘT CHỖ.** `vercel.json` giữ `buildCommand`, và
`package.json` **không được** có script tên `vercel-build` — Vercel tự chạy script
ấy nếu thấy nó, cộng với `buildCommand` là `expo export` chạy **hai lần**. Hash
bundle JS không tất định giữa hai lần chạy, nên lần hai render lại HTML trỏ tới
một hash mà `dist/client` không có → trang trắng, JS 404, còn CSS vẫn 200 (CSS
tất định nên hai lần ra cùng hash).

Triệu chứng để nhận ra ngay: `curl` trang thấy 200 nhưng bundle 404, và log build
in ra hai dòng `entry-*.js (11MB)`.

## Tài khoản & đồng bộ (bước 10)

Đăng nhập bằng **Google, Facebook, số điện thoại (OTP SMS) hoặc email (OTP)**.
Dữ liệu học đồng bộ hai chiều qua bảng `user_state`, gộp theo luật riêng của
từng store — **không bên nào ghi đè bên nào**.

**Đăng nhập là tuỳ chọn, không phải cửa vào.** App chạy đủ khi chưa có tài khoản;
mọi hàm trong `src/services/auth/` chịu được việc chưa cấu hình Supabase.

### Gói thuê bao

**Free · Plus · Pro · Max** — bậc thang chia theo chi phí thật: Plus mở hết nội
dung (sinh bằng code, chi phí ~0), Pro thêm chatbox và bài mẫu AI, Max cùng tính
năng Pro nhưng ngân sách AI gấp bốn. Max không có tính năng độc quyền nào khác và
trang giá nói thẳng như vậy.

**Thanh toán: QR chuyển khoản, đối chiếu tay.** Người dùng chọn gói → `/checkout`
sinh mã QR VietQR kèm mã đối chiếu → chuyển khoản → chủ app xác nhận ở `/admin`.
QR dựng tại chỗ bằng `src/lib/payment/vietqr.ts`, không gọi dịch vụ ngoài. Cần
khai `EXPO_PUBLIC_BANK_BIN`, `EXPO_PUBLIC_BANK_ACCOUNT`,
`EXPO_PUBLIC_BANK_ACCOUNT_NAME`; chưa khai thì trang nói thẳng "chưa cấu hình"
chứ không hiện QR trỏ vào hư không.

Cấp gói tay (không qua thanh toán) ở `/admin` (cần `role = 'admin'`) hoặc bằng
dòng lệnh:

```bash
npm run grant -- --email ban@example.com --plan max --role admin --forever
```

Cả hai đường đều ghi `admin_audit` kèm giá trị trước và sau.

### Bật đăng nhập

Việc duy nhất không tự động được là **tạo tài khoản Supabase**. Xong cái đó thì:

```bash
npm run setup:supabase -- --token sbp_... --vercel
```

Lệnh này dựng project ở Singapore, đợi database khoẻ, đẩy cả 10 migration, khai
Site URL + Redirect URL cho web/localhost/native, đổi mẫu email sang **mã 6 số**
(màn `app/auth/otp.tsx` đợi mã, không đợi liên kết), ghi `.env.local` và đặt biến
trên Vercel. Kiểm lại:

```bash
npm run setup:check
```

Sau bước này **đăng nhập bằng email chạy ngay**. Trên gói free, email gửi **liên
kết** chứ không gửi mã 6 số — Supabase không cho sửa mẫu email khi còn dùng SMTP
mặc định, và mẫu mặc định không chứa `{{ .Token }}`. Script tự phát hiện và đặt
`EXPO_PUBLIC_EMAIL_AUTH_MODE=link`; màn đăng nhập đổi theo. Nối SMTP riêng rồi
chạy lại script là quay về mã 6 số.

Màn đăng nhập chỉ vẽ cách nào đang bật thật (hỏi `/auth/v1/settings`), nên
Google, Facebook và SMS cần thêm khoá của bên thứ ba — chi tiết, mô hình bảo mật và danh sách việc phải bấm trong console
Google / Meta / Twilio: [`docs/tai-khoan-va-bao-mat.md`](docs/tai-khoan-va-bao-mat.md).

Script này nói thẳng thiếu biến nào và lấy ở đâu. Nó cũng **đọc `role` trong JWT**
để bắt lỗi dán nhầm `service_role` vào biến `EXPO_PUBLIC_` — lỗi này nguy hiểm
nhất trong cả nhóm, vì khoá đó bỏ qua RLS và sẽ nằm trong bundle client.

Ba điểm đáng nhớ nhất:

- **RLS là thứ bảo vệ dữ liệu**, không phải việc giấu khoá. `anon key` là khoá
  công khai theo thiết kế; `SUPABASE_SERVICE_KEY` chỉ đọc ở server và
  `supabase-admin.ts` ném lỗi nếu bị import vào client.
- **OAuth dùng PKCE**, không dùng luồng implicit — implicit trả token thẳng trên
  URL nên nó đi vào lịch sử trình duyệt và log của mọi proxy trên đường.
- **SMS tốn tiền thật** (~0,03–0,06 USD/tin về Việt Nam) và Supabase không tự
  gửi — phải nối Twilio hoặc tương đương. Email OTP miễn phí, nhưng SMTP mặc
  định của Supabase giới hạn vài mail mỗi giờ, dùng thật phải nối SMTP riêng.

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
