# Kho bài theo tier + Section hoá Library

Ngày: 2026-08-10 · Trạng thái: chờ review

## Mục tiêu

Kho bài hiện có 126 bài nhưng **chỉ 8 bài có độ dài đúng đề IELTS thật**. Spec này
làm hai việc:

- **A** — cào rộng lên ~1000 bài đọc được, và cắt mỗi bài về đúng khổ passage
  thay vì lấy nguyên văn.
- **B** — đổi Library từ danh sách phẳng sang **bám đúng cấu trúc Reading của
  IELTS**: track (Academic / General Training) → tier (Passage 1/2/3) → chủ đề →
  dạng câu; bổ sung dạng câu cho đủ chuẩn official; thêm chế độ Guided và chế độ
  Exam 60 phút / 40 câu.

Ngoài scope: hệ vocab kiểu Quizlet/OpenQuiz (spec riêng, đã thống nhất làm sau).
Spec này chỉ dựng **khớp nối** để spec C dùng lại lớp sinh đề — xem B3b.

Đã chốt cho spec C (ghi lại để khỏi mất): 4 đường nhập từ (dán text kiểu Quizlet
export, upload CSV/TSV, lưu từ khi đang đọc, AI sinh danh sách theo chủ đề) và 5
learn mode (Flashcards, Learn, Test, Match game tính giờ, Write) cộng **sinh câu
hỏi ôn tập từ sổ từ**.

## Hiện trạng đo được

Đo trên `src/data/seed/articles.json` sau lần ingest ngày 2026-08-10 (126 bài):

| Dải độ dài | Số bài |
|---|---|
| <400 từ | 31 |
| 400–699 | 6 |
| 700–899 | 3 |
| 900–1099 | 2 |
| 1100–1399 | 3 |
| ≥1400 từ | 37 |

Trung bình theo nguồn: Wikipedia 2845 từ · Simple Wikipedia 900 từ ·
NASA 416 từ · PLOS ONE 228 từ · arXiv 207 từ.

Kết luận: Simple Wikipedia trúng khổ passage; Wikipedia dài gấp 2–3 lần cần cắt;
PLOS/arXiv là abstract, không bao giờ thành passage.

## Ràng buộc đã xác minh

Bốn điều đã kiểm bằng request thật, không phải giả định:

1. **`exlimit` bị hạ xuống 1** cho extract toàn bài → không gộp được nhiều bài
   trong một request. 1000 bài = 1000 request. Ingest thành job 5–8 phút (sleep
   400ms, concurrency 2), nên **buộc phải checkpoint được**.
2. **Category crawl chạy được**: `Category:Climate_change` trả 134 thành viên.
   Nhưng lẫn rác thật — ví dụ `1st Special Envoy for Drought and climate change
   of Somalia` — nên cần quality gate.
3. **VOA Learning English đã chết** (HTTP 000, site đóng sau khi VOA bị cắt ngân
   sách 2025). NIH/NOAA/USGS/EPA/Smithsonian đều 403/404/405. Trong các nguồn RSS
   Loại A chỉ **NASA còn sống**.
4. **CDC trả 0 bài không phải vì URL chết** — feed HTTP 200 với 1836 item, nhưng
   không có `content:encoded` và `description` chỉ ~14 từ, nên bị chặn ở
   `countWords < 180`. Đây là nguồn bị **phân loại sai**, phải chuyển sang
   `HEADLINE_FEEDS`.

## A1. Mô hình tier

Thêm field vào `IngestedArticle`:

```ts
passageTier: 'p1' | 'p2' | 'p3' | 'short_academic' | 'headline' | null
```

| Tier | Min để vào tier | Khổ mục tiêu | CEFR kỳ vọng | Nguồn chính |
|---|---|---|---|---|
| `p1` | 650 từ | 750 ± 100 từ | A2 · B1 | Simple Wikipedia |
| `p2` | 800 từ | 900 ± 100 từ | B2 | Simple Wikipedia dài + Wikipedia cắt |
| `p3` | 950 từ | 1050 ± 150 từ | C1 · C2 | Wikipedia cắt |
| `short_academic` | 150 từ | giữ nguyên, 150–649 từ | — | PLOS, arXiv, NASA |
| `headline` | — | không body | — | 7 feed Loại B (gồm CDC chuyển sang) |
| `official_practice` | — | không body, link PDF | — | ielts.org, British Council |

Cột "min" là ngưỡng để tier đó thành ứng viên ở bước 2 dưới đây. Ba ngưỡng
650/800/950 kề nhau liên tục nên không có bài nào rơi vào khoảng trống giữa hai
tier — lỗi hở khoảng 650–699 đã sửa trong lần self-review.

**Về khổ mục tiêu:** ba tier cộng lại ≈ 2700 từ, khớp dải 2150–2750 từ thường được
dẫn cho một đề Academic Reading. Cần nói rõ: **`ielts.org` không công bố tổng số
từ** — trang official chỉ nêu 3 passage · 60 phút · 40 câu. Nên 2700 là con số
hiệu chỉnh để bộ ba passage đọc hết trong 60 phút, không phải chuẩn chính thức.
Đổi được bằng cách sửa đúng bảng này.

Thuật toán gán tier — thuần, không AI, chạy lại cho cùng kết quả:

1. Lấy extract đầy đủ; chấm độ khó trên **~800 từ đầu** (mẫu ổn định, không lệch
   theo độ dài bài).
2. `available` = tổng số từ. Tier ứng viên = những tier có `min ≤ available`.
3. Trong số ứng viên, chọn tier có CEFR đo được nằm trong dải kỳ vọng. Không tier
   nào khớp → lấy tier lớn nhất khả thi.
4. Cắt tại **ranh giới đoạn**, cộng dồn cho tới khi đạt khổ mục tiêu.
5. Chấm lại lần cuối trên đúng văn bản đã cắt — đây mới là metadata hiển thị.

`available < 650` (dưới min của `p1`) → `short_academic` nếu ≥150 từ, dưới 150 thì
loại bỏ.

Cần migration `passage_tier` cho bảng `articles`, và map thêm field trong
`pushToSupabase` (`scripts/ingest.ts`).

## A2. Cào rộng

Giữ `TOPIC_TITLES` (36 tiêu đề đã kiểm bằng mắt) làm sàn chất lượng, thêm tầng
crawl bên cạnh:

- **`src/services/ingest/sources/category-map.ts`** (mới) — map 10 chủ đề của dự
  án → danh sách category Wikipedia (en + simple). File duy nhất phải sửa khi
  thêm/bớt chủ đề.
- **`fetchWikipediaCategories()`** — `list=categorymembers`, phân trang
  `cmcontinue`, `cmnamespace=0`.
- **`src/services/ingest/pipeline/quality-gate.ts`** (mới) — loại: trang định
  hướng (`may refer to`), `List of …`, stub, tỉ lệ văn xuôi thấp, dưới 4 đoạn, tỉ
  lệ ký tự không phải Latin cao.
- **`sources/science.ts`** — PLOS `rows` 4 → 25, arXiv `max_results` 4 → 25, thêm
  query/category. Tất cả vào `short_academic`.
- **`sources/feeds.ts`** — chuyển CDC từ `FULL_TEXT_FEEDS` sang `HEADLINE_FEEDS`.
  Không thêm VOA (đã chết).
- **`sources/wikipedia.ts`** — `cleanExtract` đổi từ cắt cứng 14 đoạn sang cắt
  theo **số từ mục tiêu của tier**.
- **`sources/official-practice.ts`** (mới) — đề luyện chính thức miễn phí do
  ielts.org và British Council phát hành. Danh sách tĩnh, không crawl, vì đây là
  vài tài liệu cố định chứ không phải feed:

  | Tài liệu | Dạng |
  |---|---|
  | Academic Reading sample tasks | PDF 934 KB · 46 trang |
  | Academic Reading answer sheet | PDF 734 KB · 1 trang |
  | General Training Reading sample tasks | PDF 1 MB · 33 trang |
  | General Training Reading answer sheet | PDF 734 KB · 1 trang |
  | Academic / GT online practice test | trang web British Council |

  Vào tier `official_practice`, `licenseType = 'headline_only'`, `bodyText = null`
  — **không tải, không parse, không lưu nội dung PDF**. App chỉ lưu tiêu đề + link
  + mô tả, bấm vào mở bằng `expo-web-browser` đúng như 7 feed Loại B.

  Hạn chế phải nói rõ: đây là **link ra ngoài, không phải passage đọc trong app**.
  Không tô màu, không tra từ, không sinh đề trên chúng được. Giá trị của chúng là
  đề thật chuẩn official để bạn tự làm trên giấy, cạnh kho passage sinh đề được.

**Checkpoint:** ghi seed sau mỗi category, kèm `.ingest-state.json` lưu category
đã xong. `npm run ingest -- --resume` chạy tiếp từ chỗ dừng.

**Nhịp gọi:** giữ backoff 429 trong `http.ts`, sleep ~400ms, concurrency 2 →
~5–8 phút cho 1000 bài. User-Agent giữ email thật theo yêu cầu Wikimedia.

## A3. Tách index khỏi body

Lý do: `src/data/articles.ts` đang `import seed from './seed/articles.json'`, tức
cả kho bài bị nhồi vào JS bundle. 126 bài đã 1.8MB; 1000 bài sẽ ~14MB.

Ingest ghi ba thứ:

```
src/data/seed/
  index.json              ~700KB · metadata 1000 bài, KHÔNG có bodyText
  bodies/chunk-00.json    { [articleId]: bodyText } · ~50 bài mỗi chunk
  bodies/registry.ts      map tĩnh chunk → require(), do script sinh
```

`registry.ts` phải **tĩnh** vì Metro cần thấy `require()` lúc build:

```ts
export const CHUNKS = {
  0: () => require('./chunk-00.json'),
  1: () => require('./chunk-01.json'),
} as const;
```

**`src/data/article-repository.ts`** (mới) giữ `getArticleBody(id): Promise<string | null>`
— tra chunk từ index, gọi loader, memo hoá. `articles.ts` giữ nguyên chữ ký công
khai (`filterArticles`, `libraryStats`, `isReadable`, `getArticleById`) nên Library
không phải sửa.

**Chỗ vỡ phải sửa:** `app/read/[id].tsx` đang đọc `article.bodyText` đồng bộ →
chuyển sang nạp async có trạng thái loading. Đây là edit lớn nhất của phần A
ngoài ingest.

## B1. Section bám đúng cấu trúc Reading của IELTS

Cấu trúc **đã xác minh trên `ielts.org`**: Academic Reading có **3 passage · 60
phút · 40 câu**. Dự án đã có sẵn `ArticleTrack = 'academic' | 'general_training'`
trong `src/types/database.ts`, nên Library dựng hai track song song:

```
Library
├─ [ Academic ] [ General Training ]        ← chọn track trước, đúng như đề thật
│
├─ Academic (3 passage · 60 phút · 40 câu)
│   ├─ Passage 1 · 750 từ · A2-B1
│   ├─ Passage 2 · 900 từ · B2
│   └─ Passage 3 · 1050 từ · C1-C2
│
├─ General Training (3 section · 60 phút · 40 câu)
│   ├─ Section 1 · Social survival    — văn bản ngắn, thực dụng
│   ├─ Section 2 · Workplace survival — văn bản liên quan công việc
│   └─ Section 3 · General reading    — một bài dài, phức tạp hơn
│
└─ Ngoài đề thi
    ├─ Abstract học thuật  (<650 từ)
    ├─ Tin tức             (chỉ tiêu đề → link gốc)
    └─ Đề chính thức       (PDF ielts.org / British Council → link ra ngoài)
```

**Cảnh báo về độ tin cậy của phần GT:** cấu trúc 3 section với nhãn *social
survival / workplace survival / general reading* là mô tả được dẫn rộng rãi, nhưng
**tôi không xác minh được nó trên `ielts.org`** — trang official cho GT chỉ nêu 60
phút và danh sách dạng câu, không mô tả từng section. Phần Academic thì đã xác
minh. Nếu bạn cần GT chính xác tuyệt đối thì kiểm lại từ tài liệu official trước
khi tôi code phần đó.

Thêm nữa, nguồn hiện tại (Wikipedia, PLOS, arXiv, NASA) **toàn là văn bản học
thuật/thông tin** — không có thông báo, quảng cáo, thời khoá biểu, hợp đồng lao
động, tức đúng loại văn bản mà GT Section 1–2 cần. Nên thực tế: **track Academic
lấp được đầy, track GT sẽ gần như rỗng ở Section 1–2**.

**Mặc định của spec: làm Academic đầy đủ trước, tab General Training vẫn dựng
nhưng hiện empty state trung thực** — *"Chưa có văn bản phù hợp GT Section 1–2.
Nguồn hiện tại toàn văn bản học thuật."* Lý do chọn mặc định này: Academic là track
đã xác minh được cấu trúc official, đã có nguồn lấp đầy, và là track phần lớn người
học IELTS thi. Dựng tab GT rỗng còn hơn giả vờ nó không tồn tại, và khi có nguồn
thì chỉ việc đổ dữ liệu vào, không phải sửa UI.

Hai đường mở rộng GT về sau, nếu bạn muốn: tìm nguồn văn bản thực dụng public
domain (thông báo, hướng dẫn của cơ quan công), hoặc sinh văn bản GT bằng Claude.
Cả hai đều là spec riêng.

`app/library.tsx` đổi từ danh sách phẳng 6 filter sang: track chọn bằng tab ở
trên, tier bằng segmented control, chủ đề + dạng câu là chip cuộn ngang.
`ArticleFilters` thêm `tier` và `questionType` (đã có `track`). `filterArticles`
chỉ đọc index nên vẫn tức thì.

Sort: thêm **`popular`** cạnh `newest` — quy thành *bài mở nhiều nhất / có nhiều
từ đã lưu nhất*, đọc từ `useStudyStore`.

## B1b. Bổ sung dạng câu cho đủ chuẩn official

`ielts.org` liệt kê 14 dạng; dự án đang có 8. Bổ sung cho khớp:

| Dạng official | Trong dự án |
|---|---|
| Multiple choice | ✓ `multiple_choice` |
| Identifying information | ✓ `true_false_not_given` |
| Identifying writer's views/claims | ✓ `yes_no_not_given` |
| Matching information | ✓ `matching_information` |
| Matching headings | ✓ `matching_headings` |
| Sentence completion | ✓ `sentence_completion` |
| Summary completion | ✓ `summary_completion` |
| Short answer | ✓ `short_answer` |
| Matching features | **thêm** `matching_features` |
| Matching sentence endings | **thêm** `matching_sentence_endings` |
| Note completion | **thêm** `note_completion` |
| Table completion | **thêm** `table_completion` |
| Flow-chart completion | **thêm** `flow_chart_completion` |
| Diagram label completion | **bỏ** — xem lý do dưới |

**Bỏ `diagram_label_completion` có chủ ý:** dạng này cần một sơ đồ/hình vẽ để dán
nhãn. Kho bài là văn bản thuần cào từ Wikipedia, không có sơ đồ, nên sinh đề dạng
này chỉ ra thứ giả. Thà thiếu một dạng và nói rõ, hơn là có 14 chip trong đó một
chip cho ra đề vô nghĩa. Tổng: **13 dạng**.

`table_completion` và `flow_chart_completion` thì làm được — Claude dựng bảng /
lưu đồ từ nội dung bài — nhưng chất lượng phụ thuộc bài có cấu trúc tuần tự hay
không, nên đánh dấu là dạng "tuỳ bài".

Kéo theo: migration mở rộng enum `question_type` trong DB, cập nhật
`QUESTION_TYPE_LABEL` (`src/services/questions/types.ts`) và
`offline-generator.ts` cho 5 dạng mới.

## B2. Trục dạng câu và chuyện nó rỗng lúc đầu

Vì sinh đề theo yêu cầu (quyết định ở B3), filter theo dạng câu **ban đầu sẽ
không có bài nào**. Xử lý cho khỏi trông như bug:

- Index mang thêm `availableQuestionTypes: QuestionType[]`, rỗng khi chưa sinh đề.
- Chip dạng câu chưa có bài → hiện mờ kèm số `0`; bấm vào ra empty state:
  *"Chưa có bài nào sinh đề dạng này. Mở một bài rồi bấm Tạo đề — dạng này sẽ
  xuất hiện ở đây."*
- Nút **"Sinh đề cho 10 bài tier này"** để chủ động làm dày.

## B3. Sinh đề lúc đọc + cache

- Cache key `${articleId}:${tier}` — passage đã cắt theo tier nên đề phải khớp
  đúng văn bản đó.
- `availableQuestionTypes` ghi vào **overlay index** trong AsyncStorage (không sửa
  được `index.json` đã bundle), merge lúc chạy: `index ∪ overlay`.
- `src/services/questions/offline-generator.ts` đã có fallback → không API key vẫn
  chạy, chỉ là đề bám chữ trong bài.

## B3b. Khớp nối cho spec C dùng lại lớp sinh đề

Spec C sẽ có tính năng **từ sổ từ sinh câu hỏi ôn tập** (kiểu OpenQuiz). Việc đó
dùng đúng cùng một thứ với B3: gọi Claude, cache theo khoá, bắt buộc có
`explanation`, có fallback offline. Chỉ khác **đầu vào**.

Nếu B3 viết chết vào `articleId` thì spec C phải dựng lớp thứ hai gần y hệt. Nên
ngay trong spec này, `services/questions` nhận một **nguồn đề** thay vì một bài:

```ts
type QuestionSource =
  | { kind: 'passage'; articleId: string; tier: PassageTier; text: string }
  | { kind: 'vocab'; setId: string; entries: VocabEntry[] };   // spec C dùng

generateQuestions(source: QuestionSource): Promise<QuestionSet>
```

Cache key đổi từ `${articleId}:${tier}` sang `${source.kind}:${id}:${variant}` —
cùng một store phục vụ cả hai. `QuestionSet` giữ nguyên hình dạng nên màn Test
Review (evidence + explanation + LESSON) dùng lại được cho quiz từ vựng, không
phải viết màn kết quả riêng.

**Trong spec này chỉ làm nhánh `passage`** — nhánh `vocab` là của spec C. Đây là
khớp nối, không phải tính năng: chi phí bây giờ là một type union và một hàm đổi
tham số, đổi lại spec C không phải sửa lại `services/questions` và
`useQuestionStore`.

Một chỗ khác biệt phải lường trước: câu hỏi từ vựng **không có `evidence_paragraph_index`**
vì không có đoạn văn nào để trỏ tới. Nên field đó phải cho phép `null` khi
`source.kind === 'vocab'` — nếu không, ràng buộc `not null` ở tầng DB sẽ chặn khi
spec C lưu quiz từ vựng lên Supabase. Sửa ở migration của spec này luôn, rẻ hơn
sửa sau.

## B4. Chế độ Guided và chế độ Exam

Hai nguyên tắc học từ YouPass (xem Phụ lục), dựng trên thứ đã có:

- **Guided** — đọc → làm từng nhóm câu → xem evidence từng câu → tổng kết. Khác
  chế độ hiện tại là làm hết rồi mới review một lần.
- **Exam** — dựng đúng thông số đã xác minh trên `ielts.org`: **3 passage liên
  tiếp · 60 phút · 40 câu**. Chọn P1→P2→P3 từ index theo track đang mở, khoá tra
  từ và highlight, mở lại sau khi submit. Dùng bộ đếm giờ của bước 6.

  40 câu chia cho 3 passage → **13/13/14 câu**. Vì sinh đề theo yêu cầu, một phiên
  Exam cần cả 3 passage đã có đề; thiếu bài nào thì sinh trước khi bấm bắt đầu, và
  hiện rõ tiến trình thay vì để người dùng chờ một màn trắng.

## Lỗi

| Chỗ | Xử lý |
|---|---|
| Một trang Wikipedia lỗi | try/catch **theo từng bài**, không giết cả category |
| Ingest dừng giữa đường | seed đã checkpoint + `--resume` |
| Bài bị loại | báo cáo **số lượng theo lý do**, không chỉ in 20 dòng đầu như hiện tại |
| `getArticleBody` không thấy chunk | trả `null` → màn đọc hiện thông báo + link nguồn, không crash |
| Overlay index parse lỗi | bỏ overlay, dùng index gốc, Library vẫn sống |
| Lọc ra 0 bài | empty state kèm số bài của từng chip để thấy chip nào có hàng |

## Test

Dự án **chưa có test nào** (không có `test` script, không jest/vitest). Thêm
`node:test` chạy qua `tsx --test` — không thêm dependency — cho các hàm thuần dễ
sai nhất:

1. Gán tier (`assignTier`) — gồm ca biên: bài ngắn hơn mọi tier, CEFR không khớp
   tier khả thi nào.
2. Cắt theo khổ (`truncateToTier`) — cắt đúng ranh giới đoạn, không vượt khổ.
3. Quality gate — loại đúng trang định hướng / `List of` / stub.
4. Map bài → chunk, và merge `index ∪ overlay`.
5. `filterArticles` với tổ hợp bốn trục (track × tier × chủ đề × dạng câu).
6. Chọn P1/P2/P3 cho chế độ Exam, gồm ca thiếu bài ở một tier.
7. Chia 40 câu thành 13/13/14 cho 3 passage.

Thêm `"test": "tsx --test"` vào `package.json`.

## Thứ tự thực hiện

1. A1 tier model + test → A2 cào rộng + nguồn official + checkpoint → chạy ingest
   thật
2. A3 index/chunk + sửa `read/[id].tsx`
3. B1 track + tier → B1b thêm 5 dạng câu → B2 chip dạng câu → B3 cache đề
4. B4 Guided + Exam

Mốc kiểm được sau bước 1–2: `npm run ingest` ra ~1000 bài phân bố đủ 3 tier, app
mở Library và đọc được bài, `npm run typecheck` + `npm test` sạch.

## Phụ lục — cấu trúc IELTS Reading, nguồn official

Đọc ngày 2026-08-10 từ `ielts.org`.

**Xác minh được:**

- Academic Reading: **3 passage · 60 phút · 40 câu**.
- Danh sách **14 dạng câu** official (xem bảng B1b).
- Có bộ **sample tasks PDF miễn phí** cho cả Academic (46 trang) và General
  Training (33 trang), kèm answer sheet.

**Không xác minh được, và spec ghi rõ ở chỗ dùng đến:**

- **Tổng số từ của một đề.** Trang official không nêu. Con số 2150–2750 thường
  được dẫn nhưng không có trên `ielts.org`, nên khổ 750/900/1050 trong bảng A1 là
  hiệu chỉnh của spec này.
- **Cấu trúc 3 section của General Training** (social survival / workplace
  survival / general reading). Trang GT official chỉ nêu 60 phút và danh sách dạng
  câu, không mô tả từng section.

Nguồn: [Academic sample test questions](https://ielts.org/take-a-test/preparation-resources/sample-test-questions/academic-test) ·
[General Training sample test questions](https://ielts.org/take-a-test/preparation-resources/sample-test-questions/general-training-test) ·
[General Training test type](https://ielts.org/take-a-test/test-types/ielts-general-training-test) ·
[British Council free practice tests](https://takeielts.britishcouncil.org/take-ielts/prepare/free-ielts-english-practice-tests/reading)

## Phụ lục — nghiên cứu YouPass

Nguồn: trang công khai `youpass.vn` và `youpass.vn/luyen-thi/ielts/reading`, đọc
ngày 2026-08-10. **Không lấy nội dung đề** — site có badge DMCA Protection và đề
của họ phần lớn dẫn từ Cambridge IELTS.

Nguyên tắc trình bày họ tự tuyên bố:

- "Luyện với giao diện y như thi thật" → nguồn của chế độ **Exam** (B4)
- "Chẻ nhỏ việc luyện đề theo từng bước logic" → nguồn của chế độ **Guided** (B4)
- "Giải thích đáp án siêu chi tiết" / "Không chỉ show điểm — bạn hiểu sai ở đâu"
  → dự án **đã có** từ bước 6 (`evidence_text` + `explanation` + LESSON bắt buộc
  ở tầng DB)

Trục lọc của họ, đọc từ nhãn trong payload trang: `Cambridge` (nguồn đề),
`Dạng bài`, sort `Mới nhất` / `Phổ biến`. **Không** thấy `Passage`, `Độ khó`,
`Chủ đề`, `Band`, `Academic`, `General Training`.

Nghĩa là họ chia theo **nguồn đề + dạng bài**, không theo độ khó hay chủ đề — hợp
lý vì họ dùng đề Cambridge thật. Trục "nguồn đề" không bê sang được (dự án không
có đề Cambridge), nên tier + chủ đề là thay thế; trục "dạng bài" thì giữ. Sort
"Phổ biến" lấy từ đây.

Không quan sát được layout render: pane browser trong session không composite
frame nên `screenshot` timeout, và trang Reading của họ là Next.js streaming
không hydrate xong (`bodyOffsetHeight: 0`). Sitemap trả 403 cả khi fetch
same-origin. Design phần B do đó bám cấu trúc đề IELTS thật + nguyên tắc trích
được, không bám layout cụ thể của họ.

Không dùng: logo, mascot, palette, CSS của YouPass. Dự án giữ design system
riêng trong `src/theme/tokens.ts`.
