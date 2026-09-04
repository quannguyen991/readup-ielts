# ReadUp ProofLoop — thiết kế

> Ngày 5/9/2026 · nhánh dự kiến `proofloop`
> Đích gần: nộp AI for SDGs — Global Youth AI Future Innovation Competition 2026,
> hạn **15/9/2026**. Đích xa: bán kết 1–15/10, chung kết 26/11 tại Macau.

---

## §0 — MỘT CÂU

> **ReadUp không dùng AI để đoán vì sao học sinh sai. ReadUp dùng AI để thiết kế
> phép thử nhỏ nhất làm rõ điều chưa biết, rồi để một bộ luật cố định kết luận.**

Bản tiếng Anh dùng cho hồ sơ dự thi:

> *ReadUp is an evidence-grounded AI system that actively tests what a learner
> understands before deciding how to teach next.*

---

## §1 — VÌ SAO ĐỔI, VÀ ĐỔI TỪ ĐÂU SANG ĐÂU

| | Trước | Sau |
|---|---|---|
| Định vị | kho đề IELTS/SAT + lộ trình + vài tính năng AI | hệ thống AI chủ động kiểm chứng hiểu biết |
| Vai của AI | tính năng trả phí (chatbox, chấm Writing) | bộ não điều khiển vòng lặp học |
| Tín hiệu | đáp án đúng/sai | đáp án **+ bằng chứng người học chọn** |
| Kết luận | điểm số | trạng thái quan sát được, và mastery chỉ sau chuyển giao |

Ngách "luyện IELTS bằng AI" rất đông. Thứ phân biệt không phải danh sách tính
năng mà là **một khẳng định kiểm chứng được**. ProofLoop là khẳng định đó.

---

## §2 — RÀNG BUỘC BẤT BIẾN

Bốn điều dưới đây không được phá. Muốn đổi thì dừng lại và hỏi người dùng.

### 2.1 Model không có chỗ để ghi kết luận

Lược đồ trả về của AI **không có** các trường: `state`, `diagnosis`, `mastery`,
`skillLevel`, `nextLesson`, `understood`. Model trả về thì tầng kiểm phải loại.

Đây là lý do kiến trúc, không phải sở thích: nếu model được phép ghi
"học sinh đã hiểu", thì một lời giải thích trôi chảy sẽ tự phong cho mình là
bằng chứng học tập. Quyền kết luận nằm ở bộ luật, và bộ luật được công bố.

### 2.2 Không tuyên bố thứ chưa quan sát được

Tên trạng thái phải là **điều nhìn thấy**, không phải điều suy ra:

| Được viết | Không được viết |
|---|---|
| `evidence-aligned` | "hiểu thật" |
| `evidence-misaligned` | "đoán bừa" |
| `mastery-confirmed` (sau chuyển giao) | "đã nắm được kỹ năng" |
| `unobserved` | gộp vào "chọn sai" |

`unobserved` — người học không đánh dấu bằng chứng nào — **là một trạng thái
riêng**, không được nhập vào `misaligned`. Không đo được khác với đo rồi không
thấy gì.

### 2.3 Mastery chỉ đến từ chuyển giao

Một vi-kỹ-năng chỉ được ghi `mastery-confirmed` khi người học vượt phép thử
**P1 Transfer trên một bài đọc khác**. Xem lời giải xong không phải bằng chứng.
Làm lại đúng câu cũ không phải bằng chứng. Không có mức "có vẻ đã hiểu".

### 2.4 Thiếu bằng chứng thì phải nói ra

Nếu bài đọc không đủ căn cứ cho một phép thử, hệ thống hiện
**"Chưa đủ dữ liệu để kết luận"** và không dựng phép thử. Không suy đoán bù.

---

## §3 — VÒNG LẶP

```
Observe  →  Probe  →  Intervene  →  Transfer  →  Update
   │          │          │             │           │
   │          │          │             │           └─ luật cố định ghi hồ sơ
   │          │          │             └─ AI dựng câu mới, bài khác
   │          │          └─ AI giải thích, bắt buộc trích dẫn
   │          └─ luật chọn LOẠI, AI dựng BẢN THỂ
   └─ đáp án + đoạn + cụm từ người học đánh dấu
```

### 3.1 Observe — cái máy nhìn thấy

Mỗi lượt trả lời ghi thêm hai thứ so với hiện nay:

```ts
type EvidenceMark = {
  paragraphIndex: number;
  phrase: string;        // cụm người học khoanh trong đoạn đó
  startOffset: number;
  endOffset: number;
};
```

`highlights` đã có sẵn `paragraph_index`, `start_offset`, `end_offset` và
`is_evidence_for_question_id`. Không cần đổi lược đồ cho phần này.

### 3.2 Phân loại trạng thái — thuần xác định, không gọi model

```
mark == null                         → UNOBSERVED
correct && paragraphKhớp             → ALIGNED_CORRECT
correct && !paragraphKhớp            → MISALIGNED_CORRECT
!correct && paragraphKhớp            → ALIGNED_WRONG
!correct && !paragraphKhớp           → MISALIGNED_WRONG
```

`paragraphKhớp` = `mark.paragraphIndex === question.evidenceParagraphIndex`.

Trùng cụm từ là **tín hiệu thứ hai, mịn hơn**: cụm người học khoanh có giao với
cụm quyết định không. Dùng cho P2, không dùng để phân loại trạng thái.

### 3.3 Bảng chọn loại phép thử — cố định và công bố

| Trạng thái | Điều chưa rõ | Phép thử | Biến được cô lập |
|---|---|---|---|
| `ALIGNED_CORRECT` | có thể hiểu, có thể may | **P1 Transfer** | nội dung |
| `MISALIGNED_CORRECT` | bắt từ khoá, hay đánh dấu nhầm | **P2 Evidence re-selection** | định vị bằng chứng |
| `ALIGNED_WRONG` | paraphrase, suy luận vượt, hay F/NG | **P3 Entailment** | quan hệ suy ra |
| `MISALIGNED_WRONG` | chưa định vị được | **P4 Locate** | định vị |
| `UNOBSERVED` | — | **không có phép thử** | — |

Bảng này là một hằng số trong mã, có test khoá. Nó được in nguyên vào hồ sơ dự
thi: giám khảo đọc được toàn bộ logic quyết định trên một trang.

### 3.4 Bốn phép thử

**P1 · Transfer** — bài **khác**, cùng vi-kỹ-năng, khác chủ đề. Vượt được mới
ghi `mastery-confirmed`. Đây là phép thử duy nhất sinh ra mastery.

**P2 · Evidence re-selection** — **không giải thích trước**. Trả lại bài, yêu
cầu chọn lại đoạn *và khoanh cụm quyết định*. Ra được → lần trước là đánh dấu
nhầm. Vẫn không ra → xác nhận đang chọn theo từ khoá.

**P3 · Entailment** — đưa đúng câu bằng chứng, kèm ba mệnh đề: một **được suy
ra**, một **mâu thuẫn**, một **không đủ thông tin**. Bỏ hẳn bước đi tìm, chỉ đo
quan hệ suy ra. Tách được ba nguyên nhân đang lẫn vào nhau.

**P4 · Locate** — **không hỏi đáp án**. Chỉ hỏi câu này được trả lời ở đoạn nào.
Bỏ bước suy luận để xem có phải hỏng ở khâu định vị không.

### 3.5 Vi-kỹ-năng — chỉ bốn

`locate` · `paraphrase` · `entailment` · `quantifier`

Bốn trục này là bốn trục mà phép so bằng chứng trực tiếp đỡ được. Không dựng
bản đồ tám trục: với vài chục lượt làm bài thì phần lớn ô rỗng, và một bản đồ
rỗng là nhiễu chứ không phải chẩn đoán.

---

## §4 — HỢP ĐỒNG VỚI MODEL

```ts
/** AI trả về ĐÚNG hình dạng này. Không có trường nào cho kết luận. */
type ProbeDraft = {
  kind: ProbeKind;              // chép lại từ luật, model KHÔNG được chọn
  stem: string;
  options: string[];
  correctOption: number;
  evidenceText: string;         // phải nguyên văn trong bài
  evidenceParagraphIndex: number;
  decisivePhrase: string;       // phải là chuỗi con của evidenceText
  whyEachWrong: string[];       // đúng options.length - 1 phần tử
  insufficientEvidence: boolean;
};
```

**Năm luật kiểm sau khi model trả về.** Vi phạm bất kỳ luật nào thì loại bản
nháp và thử lại; hai lần liên tiếp thì hiện "Chưa đủ dữ liệu để kết luận":

1. `evidenceText` xuất hiện **nguyên văn** trong passage
2. `decisivePhrase` là **chuỗi con** của `evidenceText`
3. `whyEachWrong.length === options.length - 1`
4. `correctOption` nằm trong khoảng hợp lệ
5. `kind` khớp đúng loại mà bảng §3.3 đã định

Nếu `insufficientEvidence === true`: không dựng phép thử, hiện câu ở §2.4.

Luật 1 và 2 là bản sao của ràng buộc `evidence_text not null` đã có trong lược
đồ. Chúng biến "AI không được bịa" từ lời hứa trong prompt thành điều kiện
kiểm được sau khi model đã nói.

---

## §5 — AI LÀ LÕI Ở CHỖ NÀO

Câu hỏi mà ban giám khảo sẽ hỏi: *bỏ model đi thì còn chạy không?*

| Việc | Ai làm | Bỏ AI thì sao |
|---|---|---|
| Phân loại trạng thái | luật | vẫn chạy |
| Chọn **loại** phép thử | luật | vẫn chạy |
| **Dựng bản thể phép thử** | **AI** | **không còn sản phẩm** |
| **Chấm cụm từ người học khoanh** | **AI** | **không còn sản phẩm** |
| Kết luận mastery | luật | vẫn chạy |

Hai dòng in đậm là hai việc luật không làm nổi:

1. Sinh một câu hỏi **cùng vi-kỹ-năng nhưng khác bài, khác chủ đề**, có bằng
   chứng kiểm chứng được trong bài mới. Đây là việc hiểu ngôn ngữ.
2. Phán "cụm học sinh khoanh có tương đương ngữ nghĩa với cụm quyết định
   không" — `always` với `at all times`, `choir` với `a group of singers`.
   Không phải so chuỗi.

Vậy AI là lõi thật. Nhưng nó **không được** nói học sinh đã hiểu.

---

## §6 — ĐO CÁI GÌ, VÀ KHÔNG ĐO CÁI GÌ

### 6.1 Không đo hiệu quả học tập trước 15/9

Thiết kế trước–sau với 10–20 học sinh, một tuần, không nhóm đối chứng, cho ra
con số không có nghĩa: điểm tăng vì quen dạng đề chứ không vì hệ thống. Nghiên
cứu đó để dành VISEF, ở đó có 12 tuần.

### 6.2 Không đo "độ chính xác chẩn đoán"

Việc phân loại trạng thái là **một phép so xác định**, đúng theo định nghĩa.
Đem dán nhãn tay rồi so với chính quy tắc sinh ra nhãn là đo vòng tròn.

### 6.3 Hai thứ đo được, và cần đo

**A · Tính hợp lệ của phép thử.** Sinh 100 phép thử, người đánh giá độc lập
chấm hai câu hỏi cho mỗi cái:
- phép thử này có đúng cô lập biến mà bảng §3.3 nói không?
- với P1: nó có thật sự cùng vi-kỹ-năng và khác bài không?

Người chấm **không thấy** loại phép thử mà máy đã gán. Double-label 30 ca để đo
đồng thuận giữa hai người chấm. Báo cáo confusion matrix và agreement.

**B · Độ chuẩn của việc chấm cụm từ.** Lấy các câu đã có `evidenceText` và cụm
quyết định, dựng bộ cụm người học khoanh (đúng, gần đúng, sai), rồi đo AI phán
khớp bao nhiêu phần trăm so với nhãn người.

Câu viết vào hồ sơ:

> *The probe-construction engine achieved X% agreement with independently coded
> cases (n=100, two raters, κ=Y on 30 double-coded items).*

Không viết: *"AI hiểu chính xác tâm lý học sinh."*

---

## §7 — PHẠM VI TỚI 15/9

Một lát cắt dọc chạy thật cho IELTS Reading, live trên web. Không làm cả IELTS.

**Vào phạm vi:**

1. Đánh dấu bằng chứng ở màn đọc — đoạn + cụm từ. Dùng lại `useTextSelection`,
   `phraseMode`, `sentenceAround` đã có.
2. `src/services/proofloop/state.ts` — phân loại 5 trạng thái, thuần, có test.
3. `src/services/proofloop/probe-table.ts` — bảng cố định §3.3, có test khoá.
4. `src/services/proofloop/draft-schema.ts` — năm luật kiểm §4, có test.
5. `src/services/proofloop/mastery.ts` — sổ mastery, thuần, có test.
6. **P2 và P3 chạy đầu-cuối.** Hai phép thử này nằm gọn trong cùng một bài đọc
   nên rẻ hơn hẳn, và **P2 chính là khoảnh khắc demo**.
7. Bảng "Proof" ở màn review: trạng thái · phép thử đã chạy · mastery.

**Ngoài phạm vi (để sau 15/9):**

P1 Transfer cần chọn bài chéo — nặng hơn, làm sau nếu kịp. P4 Locate. Tám trục
năng lực. Dashboard giáo viên. Sinh đề hàng loạt. Dự đoán band. Camera. Nghiên
cứu trước–sau.

### 7.1 Hệ quả phải nói thẳng: bản 15/9 chưa xác nhận mastery cho ai

§2.3 nói mastery chỉ sinh ra từ P1 Transfer, mà P1 nằm ngoài phạm vi. Vậy trong
lát cắt này **mọi vi-kỹ-năng đều ở `not-confirmed`**, và sổ mastery chạy nhưng
chưa bao giờ chuyển trạng thái.

Đó là kết quả đúng, không phải thiếu sót — và giao diện phải nói đúng như vậy
chứ không được để trống cho người dùng tự hiểu. Hạ chuẩn mastery xuống "vượt
P2 hoặc P3 là đủ" để bảng trông đẹp hơn chính là thứ §2.3 sinh ra để chặn.

Trên sân khấu, đây là điểm mạnh chứ không phải điểm yếu: *"hệ thống chạy mười
ngày và chưa xác nhận một mastery nào, vì phép thử xác nhận mastery đòi một bài
đọc khác — chúng tôi chưa bật nó."* Một sản phẩm dám để trống ô đó đáng tin hơn
một sản phẩm nào cũng xanh.

---

## §8 — KHOẢNH KHẮC DEMO

Một học sinh **trả lời đúng** nhưng **khoanh sai đoạn**. ReadUp không chúc mừng:

> Đáp án đúng, nhưng đoạn bạn khoanh chưa đỡ được đáp án đó. Chưa ghi nhận là
> đã hiểu. Làm một phép thử ngắn nhé.

Rồi P2 chạy. Đây là câu chuyện của cả hồ sơ: **các nền tảng khác thưởng điểm cho
đáp án đúng; ReadUp phát hiện lỗ hổng nằm sau một đáp án đúng.**

Bản tiếng Anh cho hồ sơ:

> *Two students answer the same question correctly. Most platforms record two
> successes. ReadUp sees that one student marked the sentence that actually
> supports the answer, and the other marked an unrelated line. It does not
> assume. It runs the smallest next test to find out.*

---

## §9 — CẤU TRÚC MÃ

```
src/services/proofloop/
  state.ts           phân loại trạng thái          thuần · test
  state.test.ts
  probe-table.ts     bảng trạng thái → loại        hằng số · test khoá
  probe-table.test.ts
  draft-schema.ts    năm luật kiểm §4              thuần · test
  draft-schema.test.ts
  mastery.ts         sổ mastery, luật §2.3         thuần · test
  mastery.test.ts
  build-probe.ts     gọi model, dựng bản thể       gọi mạng
  judge-phrase.ts    chấm tương đương cụm từ       gọi mạng
  prompts/

app/api/proofloop/
  probe+api.ts       dựng phép thử (server-side)
  judge+api.ts       chấm cụm từ (server-side)

src/components/reader/
  EvidenceMarker.tsx bắt buộc khoanh trước khi nộp
  ProbePanel.tsx     hiện phép thử
```

Mọi lời gọi có khoá chạy server-side, theo đúng lệ đã có trong repo
(`src/lib/env.ts`). Client không đọc khoá bí mật.

Bốn tệp thuần đầu tiên viết theo TDD trước, vì chúng là chỗ chứa toàn bộ quyền
kết luận. Hai tệp gọi mạng viết sau.

---

## §10 — RỦI RO

| Rủi ro | Xử lý |
|---|---|
| Bắt khoanh bằng chứng làm chậm việc luyện, người dùng bỏ | Chỉ bắt buộc ở chế độ ProofLoop; chế độ luyện thường giữ nguyên |
| Model sinh phép thử không cô lập đúng biến | Đo ở §6.3-A trước khi đưa vào hồ sơ; không có số thì không khẳng định |
| `evidence_paragraph_index` cho phép null từ migration `passage_tier` | Câu thiếu đối chứng → `UNOBSERVED`, không đoán bù |
| Ôm quá phạm vi rồi không kịp 15/9 | P2 và P3 trước; P1 và P4 chỉ làm nếu còn giờ |
| Proxy sập, không sinh được phép thử | Hiện "Chưa đủ dữ liệu để kết luận" — đường lùi đã có tiền lệ trong repo |
