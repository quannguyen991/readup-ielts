# Module Writing — IELTS Task 1/2 + SAT Writing

Ngày: 2026-08-19

## Vấn đề

Dự án hiện chỉ phục vụ kỹ năng Đọc. Người luyện IELTS cần viết, và Writing là
phần dễ nâng điểm nhất nhưng khó tự học nhất: không ai chấm, nên người học viết
20 bài mà vẫn mắc đúng lỗi của bài đầu.

Ba việc, cùng một module.

**1. Không có chỗ viết.** Không có đề, không có phòng viết, không có chấm.

**2. SAT Reading and Writing mới phủ một nửa.** Bộ sinh đề SAT hiện có đã làm
hai domain đầu; hai domain còn lại — đúng phần "Writing" của kỳ thi — chưa có gì:

| Domain | Kỹ năng | Trạng thái |
|---|---|---|
| Information and Ideas | central idea, command of evidence, inferences | đã có |
| Craft and Structure | words in context, text structure | đã có |
| **Expression of Ideas** | **transitions, rhetorical synthesis** | **chưa có** |
| **Standard English Conventions** | **boundaries, form/structure/sense** | **chưa có** |

**3. Luyện cả bài là cách học kém hiệu quả nhất cho người mới.** Viết trọn bài
250 từ rồi nhận về một điểm số không cho biết phải sửa gì. Người mới cần tách
kỹ năng: hôm nay chỉ luyện overview, hôm sau chỉ luyện thân bài.

## Nguyên tắc chốt

1. **Mọi tính năng AI đều có đường lui offline.** Theo đúng quy ước đã có ở
   `app/api/questions+api.ts`. Với chấm bài, đường lui không phải bản chấm giả —
   xem Phần B.
2. **Không bịa band.** Chấm AI trả **khoảng** (6.0–6.5), không trả một số cứng.
   `band.ts` đã xử lý band null cho SAT; module này dùng lại, không tự
   `.toFixed()`.
3. **Không cào bài mẫu có bản quyền.** Đề bài là dữ kiện, tái tạo được. Bài mẫu
   thì tự sinh và tự kiểm định.
4. **Task 1 lưu dữ liệu, không lưu ảnh.** Biểu đồ dựng từ JSON bằng
   `victory-native`. Ảnh thì không sửa được, không đọc được bằng screen reader,
   và không sinh biến thể được.
5. **Với SAT, chỉ sinh offline dạng nào đáp án kiểm chứng được từ chính bài và
   không giải được bằng đối chiếu chuỗi** — nguyên tắc đã chốt ở spec
   2026-08-11, áp nguyên cho hai domain mới.

## Phạm vi — sáu lát

| Lát | Nội dung | Phụ thuộc |
|---|---|---|
| 1 | Migration + types + repository | — |
| 2 | Kho đề: nguồn ingest, bộ sinh đề Task 1, trang `/write` | 1 |
| 3 | Phòng viết + chấm AI + trang kết quả | 1, 2 |
| 4 | Bài mẫu AI có kiểm định band | 2, 3 |
| 5 | Drill tách kỹ năng | 3 |
| 6 | SAT Writing — 4 dạng của hai domain còn thiếu | 1 |

Lát 6 không phụ thuộc lát 2–5, làm song song được.

---

## Phần A — Dữ liệu

### Dữ liệu nằm ở đâu — bám đúng thực tế hiện tại

Dự án hiện **không đọc nội dung từ Supabase**: `articles.ts` nạp từ
`seed/index.json`, và không có chỗ nào query bảng `articles`. Dữ liệu người dùng
cũng chưa lên Supabase — chưa có luồng đăng nhập, mọi tiến độ nằm trong zustand
+ persist (`useStudyStore`). Migration trong repo là schema dọn đường.

Module Writing giữ nguyên cách đó, không tự ý đi trước:

| Loại | Lưu ở đâu bây giờ | Lối lên Supabase sau này |
|---|---|---|
| Đề bài, bài mẫu | seed JSON tĩnh, do script sinh | migration viết sẵn; repository giữ nguyên chữ ký hàm, chỉ đổi ruột |
| Bài làm, kết quả chấm | `useWritingStore` (zustand + persist) | như trên |

Viết migration ngay từ lát 1 dù chưa dùng — đó là cách dự án đã làm với
`articles`, và nó buộc mình chốt hình dạng dữ liệu trước khi code.

### Enum mới

```
writing_task    := 'ielts_task1' | 'ielts_task2'
task1_chart     := 'line' | 'bar' | 'pie' | 'table' | 'mixed' | 'process' | 'map'
task2_essay     := 'opinion' | 'discussion' | 'advantage_disadvantage'
                 | 'problem_solution' | 'two_part'
writing_mode    := 'full' | 'drill'
drill_part      := 'brainstorm' | 'outline' | 'introduction' | 'overview'
                 | 'body' | 'conclusion'
```

`question_type` thêm 4 giá trị cho SAT (Phần E).

### Bảng (hình dạng dữ liệu — áp cho cả seed JSON lẫn migration)

**`writing_prompts`** — đề bài. Dùng chung cho Task 1 và Task 2.

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | uuid pk | |
| `task` | writing_task | |
| `prompt_text` | text | câu lệnh đề |
| `chart_kind` | task1_chart, null | null với Task 2 |
| `chart_data` | jsonb, null | dữ liệu vẽ biểu đồ, xem dưới |
| `essay_kind` | task2_essay, null | null với Task 1 |
| `topic_slug` | text fk topics | dùng lại 10 chủ đề đã có |
| `difficulty_band` | numeric(2,1) | band mục tiêu gợi ý |
| `time_limit_seconds` | int | 1200 cho Task 1, 2400 cho Task 2 |
| `min_words` | int | 150 / 250 |
| `source` | text | `'generated'` \| `'official'` \| `'curated'` |
| `is_published` | bool | đề nháp không hiện cho người học |

Ràng buộc: `chart_kind` và `chart_data` phải cùng null hoặc cùng khác null, và
chỉ khác null khi `task = 'ielts_task1'`. Tương tự `essay_kind` với Task 2. Đây
là cùng kiểu ràng buộc đã dùng cho `sat_text_type` — giữ nhất quán.

**`chart_data` — union có discriminant.** Mỗi loại biểu đồ một shape riêng, phân
biệt bằng `kind`. Không dùng một shape chung với các trường bỏ trống: shape
chung thì không có gì ngăn một đề `pie` mang `xLabels`, và lỗi kiểu đó chỉ lộ
ra lúc vẽ.

```jsonc
// line | bar
{ "kind": "line", "title": "...", "unit": "US cents per litre",
  "xLabels": ["2000", "2005"], "series": [{ "name": "Country A", "values": [45, 68] }],
  "analysisKey": { ... } }

// pie — mỗi hình tròn một phần tử trong `pies`
{ "kind": "pie", "title": "...", "unit": "%",
  "pies": [{ "caption": "1995", "slices": [{ "label": "Coal", "value": 52 }] }],
  "analysisKey": { ... } }

// table
{ "kind": "table", "title": "...", "unit": "litres",
  "headers": ["Country", "2000"], "rows": [["Australia", 340]], "analysisKey": { ... } }

// process
{ "kind": "process", "title": "...", "steps": ["..."], "isCycle": false, "analysisKey": { ... } }

// map
{ "kind": "map", "title": "...",
  "panels": [{ "caption": "1990", "items": [{ "shape": "green", "label": "Forest",
    "x": 0.08, "y": 0.1, "w": 0.34, "h": 0.34 }] }], "analysisKey": { ... } }

// mixed — hai hình, mỗi hình là một shape ở trên, không lồng tiếp mixed
{ "kind": "mixed", "title": "...", "parts": [ { ...line... }, { ...table... } ],
  "analysisKey": { ... } }
```

**`analysisKey`** có ở mọi loại — đây là thứ cho phép chấm drill Overview mà
không gọi AI:

```jsonc
{
  "trends": ["bottled water tang manh", "fruit juice giam deu"],
  "extremes": ["soft drinks cao nhat dau ky", "bottled water thap nhat dau ky"],
  "crossings": ["bottled water vuot soft drinks quanh 2020"],
  "grouping": [["bottled water"], ["fruit juice", "soft drinks"]]
}
```

**`writing_submissions`** — bài làm.

`id`, `user_id` (fk auth.users), `prompt_id`, `mode`, `drill_part` (null khi
`mode = 'full'`), `body_text`, `word_count`, `duration_seconds`, `submitted_at`.

Ràng buộc: `drill_part` khác null **khi và chỉ khi** `mode = 'drill'`.

**`writing_evaluations`** — kết quả chấm. Một submission có tối đa một bản chấm.

`submission_id` (unique fk), `band_low`, `band_high` (numeric 2,1 — luôn là
khoảng), `task_band`, `coherence_band`, `lexical_band`, `grammar_band`,
`summary_vi` (text), `strengths` (jsonb array), `improvements` (jsonb array),
`annotations` (jsonb array), `model` (text), `evaluated_at`.

**Hình dạng một annotation:**

```jsonc
{
  "start": 142, "end": 149,        // offset ký tự, neo ở server
  "quote": "toward",               // giữ lại để đối chiếu khi text đổi
  "category": "grammar",           // grammar|lexis|cohesion|expression|task
  "severity": "minor",             // minor|major
  "why_vi": "Sau động từ allocate dùng giới từ to.",
  "fix": "to"
}
```

**`writing_model_essays`** — bài mẫu.

`prompt_id`, `target_band`, `body_text`, `notes` (jsonb — chú giải từng câu),
`verified_band_low`, `verified_band_high` (kết quả chấm ngược), `generated_at`.

### RLS (cho migration, chưa hiệu lực khi còn chạy cục bộ)

`writing_prompts` và `writing_model_essays`: đọc công khai với hàng
`is_published`, ghi chỉ service key. `writing_submissions` và
`writing_evaluations`: `user_id = auth.uid()` cho cả bốn quyền — cùng khuôn với
`attempts` đã có.

Khi còn lưu cục bộ thì `user_id` bỏ trống; repository là chỗ duy nhất biết
chuyện đó, phần còn lại của app không cần quan tâm.

---

## Phần B — Chấm bài

### Hai lượt, không gộp

**Lượt 1 — band + nhận xét.** Đầu vào: đề, bài làm, band descriptor công khai
của bốn tiêu chí. Đầu ra JSON: khoảng band tổng, band từng tiêu chí, tóm tắt
tiếng Việt, 2–3 điểm mạnh, 2–3 việc cần sửa.

**Lượt 2 — annotation.** Đầu vào: bài làm + kết quả lượt 1. Đầu ra: danh sách
lỗi, mỗi lỗi trích nguyên văn đoạn sai.

Gộp một lượt thì model gần như luôn bỏ sót annotation ở nửa sau bài — nó đã
"tiêu" phần chú ý vào việc chấm điểm. Tách ra tốn thêm một lần gọi, đổi lại
annotation phủ đều cả bài.

### Neo annotation ở server

Model trả **chuỗi trích**, không trả offset — model đếm ký tự không đáng tin.
Server tìm chuỗi đó trong bài rồi tự tính `start`/`end`:

1. Khớp chính xác, lấy lần xuất hiện đầu chưa bị annotation khác chiếm.
2. Không thấy → khớp bỏ qua khoảng trắng và hoa thường.
3. Vẫn không thấy → **bỏ annotation đó**, không đoán vị trí.

Bỏ một annotation thì người học mất một gợi ý. Tô sai chỗ thì người học sửa
nhầm một câu vốn đúng — tệ hơn nhiều.

### Đường lui offline = phân tích tức thì

Không có bản "chấm AI giả". Thay vào đó là bộ phân tích không cần AI, chạy ngay
trong lúc gõ và luôn có mặt kể cả khi chấm AI hỏng:

| Chỉ số | Cách đo | Dùng để |
|---|---|---|
| Số từ, số đoạn | đếm | cảnh báo dưới ngưỡng |
| Có Overview | dò `Overall`/`In general` ở đoạn 2 | Task 1, ảnh hưởng TA |
| Lặp từ xu hướng | đếm lemma trong danh sách đóng | gợi ý LR |
| Mật độ từ nối | số từ nối / số câu | cảnh báo lạm dụng |
| Đa dạng độ dài câu | độ lệch chuẩn số từ mỗi câu | gợi ý GRA |
| Câu quá dài | > 45 từ | gợi ý tách câu |

Từ các chỉ số này ra một **ước lượng thô** hiển thị rõ là ước lượng, không phải
band. Đây chính là ô "Phân tích nhanh" trong thiết kế màn hình.

---

## Phần C — Nội dung

### Đề Task 2

Nguồn ingest mới `writing-prompts.ts` theo đúng khuôn các source đã có
(`official-practice.ts`). Lấy đề từ nguồn công khai, chuẩn hoá, gán chủ đề và
`essay_kind`. Bổ sung bằng bộ sinh đề theo công thức: mỗi `essay_kind` có khung
câu lệnh cố định, ghép với chủ đề trong `topics`.

### Đề Task 1

**Sinh hoàn toàn, không cào.** Bộ sinh nhận `chart_kind` + chủ đề rồi dựng
`chart_data` có tính chất sư phạm — không phải số ngẫu nhiên:

- Line: đảm bảo có ít nhất một cặp đường **cắt nhau** (đổi ngôi là ý overview
  mạnh nhất, đề không có giao cắt thì nhạt).
- Bar không trục thời gian: đảm bảo có cực trị rõ.
- Pie hai hình: đảm bảo thứ hạng đổi giữa hai mốc.
- Table: đảm bảo đọc ngang và đọc dọc cho ra hai kết luận khác nhau.

Mỗi bộ dữ liệu đi kèm **khoá phân tích** (`analysis_key` trong `chart_data`):
xu hướng lớn, cực trị, giao cắt, cách chia nhóm. Khoá này dùng để chấm phần
Overview trong drill mà không cần gọi AI.

### Bài mẫu

AI viết ở ba mức band 6.0 / 7.0 / 8.0, rồi **chấm ngược bằng chính đường chấm ở
Phần B**. Lệch quá 0.5 band so với mục tiêu thì loại và viết lại, tối đa ba lần.
Lưu `verified_band_low/high` để hiển thị trung thực.

Bài mẫu luôn gắn nhãn **"bài tham khảo do AI soạn"**, không gắn nhãn "Band 8
chính thức" — không có gì bảo chứng band của một bài AI viết.

---

## Phần D — Drill tách kỹ năng

Sáu phần, mỗi phần là một `drill_part`. Không phải phần nào cũng chấm bằng AI:

| Phần | Người học làm gì | Chấm thế nào |
|---|---|---|
| brainstorm | liệt kê ý, không viết câu | offline: đếm ý, đối chiếu `analysis_key` |
| outline | điền khung 4 đoạn | offline: kiểm đủ ô, đúng thứ tự |
| introduction | viết 1 câu paraphrase | AI: đo mức paraphrase so với đề |
| overview *(chỉ Task 1)* | viết 2 câu | **offline trước**: có số liệu không (Task 1 thì có số là sai), có bắt đúng xu hướng lớn trong `analysis_key` không. AI chỉ để nhận xét câu chữ |
| body | viết 1 đoạn thân bài | AI |
| conclusion *(chỉ Task 2)* | viết kết luận | AI. Task 1 không có kết luận |

Việc `overview` chấm được offline là một điểm đáng khai thác: đây là kỹ năng
quyết định nhất, và nhờ có `analysis_key` nên kiểm được mà không tốn token —
người học lặp lại bao nhiêu lần cũng được.

---

## Phần E — SAT Writing

### Bốn dạng mới

```
sat_transitions
sat_rhetorical_synthesis
sat_boundaries
sat_form_structure_sense
```

Thêm vào enum `question_type`, thêm nhãn vào `QUESTION_TYPE_LABEL`, và gom
thành `SAT_WRITING_QUESTION_TYPES` bên cạnh `SAT_QUESTION_TYPES` đã có.

### Dạng nào sinh offline được

Áp nguyên hai điều kiện của spec 2026-08-11:

| Dạng | Sinh offline? | Lý do |
|---|---|---|
| `sat_transitions` | **có** | Tìm câu trong kho mở đầu bằng từ nối thật, khoét đi. Đáp án là từ gốc nên kiểm chứng được. Nhiễu là từ nối **khác quan hệ logic** (nhân quả / tương phản / bổ sung / trình tự) nên không loại được bằng cảm giác. Từ bị che nên không Ctrl-F được. |
| `sat_boundaries` | **có** | Khoét dấu câu ở chỗ nối hai mệnh đề trong câu có thật. Đáp án là dấu gốc. Nhiễu là các dấu tạo lỗi thật: chấm phẩy sai chỗ, comma splice, thiếu dấu. |
| `sat_form_structure_sense` | **có** | Khoét một động từ đã chia hoặc một đại từ sở hữu, nhiễu là các biến thể hình thái của chính từ đó (`was/were`, `its/it's`, `their/there`). Đáp án là dạng gốc trong bài. |
| `sat_rhetorical_synthesis` | **không** | Đề dạng này cho **gạch đầu dòng ghi chú + một mục tiêu tu từ**, không phải văn xuôi. Rút gạch đầu dòng máy móc từ prose sẽ ra ghi chú vô nghĩa hoặc lộ đáp án. Để cho nhánh AI, đúng như đã làm với Central Ideas. |

Kho 833 passage SAT đã có là nguyên liệu sẵn, không cần ingest thêm.

### Giới hạn phải đo và ghi lại

Chạy bộ sinh trên toàn kho rồi ghi vào comment đầu file: bao nhiêu bài ra 0 câu
và vì sao — cùng cách `sat-generator.ts` đã làm. Không có số đo thì không biết
bộ sinh có thật sự dùng được không.

---

## Phần F — Màn hình và điều hướng

Thêm một mục vào `NAV_ITEMS`: `{ key: 'writing', label: 'Writing', href: '/write', icon: 'pencil' }`.
`practice` đang dùng icon `pencil`; đổi `practice` sang icon khác hoặc thêm icon
mới cho writing — quyết lúc làm lát 2.

| Route | Màn hình |
|---|---|
| `/write` | Kho đề. Ba tab: Task 1 / Task 2 / SAT Writing. Lọc theo chủ đề, dạng, band |
| `/write/[promptId]` | Phòng viết: đề bên trái, editor giữa, phân tích tức thì bên phải, đồng hồ |
| `/write/result/[submissionId]` | Kết quả: band 4 tiêu chí, bài viết có annotation, kế hoạch cải thiện |
| `/write/drill/[promptId]` | Drill, chọn `drill_part` |

API route mới: `app/api/writing/evaluate+api.ts`, `app/api/writing/model-essay+api.ts`,
`app/api/writing/prompts+api.ts`.

`useWritingStore` (zustand + persist, khuôn như `useStudyStore`) giữ cả bản
nháp đang gõ lẫn lịch sử bài đã nộp và kết quả chấm — đóng tab không mất bài,
và Progress đọc được lịch sử writing mà không cần Supabase.

---

## Không làm trong phạm vi này

- Không làm chấm chữ viết tay / OCR.
- Không làm so bài giữa người học với nhau.
- Không làm speaking.
- Không làm thanh toán, giới hạn lượt chấm. Nếu cần chặn lạm dụng thì làm sau,
  ở tầng route.
- Không đụng vào luồng Reading đang có, ngoài việc thêm một mục nav.

## Rủi ro đã biết

**Chấm AI lệch cao.** Model có xu hướng cho điểm rộng tay hơn giám khảo. Giảm
bằng cách: đưa band descriptor vào prompt, bắt trả khoảng thay vì số cứng, và
đối chiếu với bộ phân tích offline — chênh nhau quá 1 band thì hạ về phía thấp.

**Bài mẫu AI không đúng band như nhãn.** Vòng chấm ngược lọc được phần lớn, còn
lại xử lý bằng nhãn trung thực.

**Chi phí token.** Mỗi bài chấm hai lượt. Giảm bằng cách để bộ phân tích offline
gánh toàn bộ phản hồi tức thì, và drill `overview`/`brainstorm`/`outline` không
gọi AI.

**Kho đề Task 1 sinh máy có thể nhàm.** Bốn ràng buộc sư phạm ở Phần C giữ cho
mỗi đề có ít nhất một điểm đáng nói. Nếu vẫn nhàm thì bổ sung bộ đề do người
soạn, qua `source = 'curated'`.
