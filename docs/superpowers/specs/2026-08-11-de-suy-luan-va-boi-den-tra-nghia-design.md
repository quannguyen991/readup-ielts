# Đề suy luận + bôi đen tra nghĩa

Ngày: 2026-08-11

## Vấn đề

Hai việc, cùng một màn hình đọc.

**1. Bộ đề IELTS offline quá dễ.** Cả năm dạng đang sinh đều giải được mà không
cần đọc hiểu:

| Dạng | Cách giải không cần hiểu |
|---|---|
| Matching Headings | "Tiêu đề" là 9 từ đầu của chính đoạn đó, hỏi theo đúng thứ tự đoạn 1→5 |
| True/False/Not Given | TRUE = câu trong bài đổi 4 từ; FALSE = câu trong bài chèn "not"; NOT GIVEN luôn kết thúc bằng cùng một mệnh đề template |
| Sentence Completion | Chép nguyên câu trong bài rồi khoét một từ |
| Short Answer | "Con số nào nêu trong câu này?" — chép lại con số |
| Multiple Choice | Bốn lựa chọn là 9 từ đầu của đoạn 1–4, đáp án luôn là đoạn 1 |

Bộ sinh đề SAT trong cùng dự án đã theo chuẩn nghiêm hơn hẳn (có test
"KHÔNG sinh dạng giải được bằng đối chiếu chuỗi", và cố tình từ chối sinh dạng
nào mà đáp án không kiểm chứng được). Bộ IELTS chưa từng được áp chuẩn đó.

**2. Tra từ đang tốn thao tác.** Muốn tra một cụm phải bật chế độ "Chọn cụm từ"
rồi chạm từ đầu, chạm từ cuối. Người đọc chỉ muốn bôi đen như mọi trang web
khác.

## Nguyên tắc chốt

Chỉ sinh dạng câu nào thoả **cả hai**:

1. Đáp án **kiểm chứng được** từ chính bài — không suy đoán bằng thủ thuật văn bản.
2. **Không giải được bằng đối chiếu chuỗi** với bài đọc.

Dạng nào không đạt cả hai thì không sinh offline, để dành cho nhánh Claude. Thà
ít câu còn hơn câu sai đáp án hoặc câu Ctrl-F ra ngay.

Độ khó nhắm: band 6–7, xếp tăng dần trong một bộ đề.

## Phần A — Bộ sinh đề IELTS offline

### Bỏ hẳn

Matching Headings kiểu cũ, Sentence Completion, Short Answer hỏi con số,
Multiple Choice ý chính. Sentence Completion và Short Answer là dạng có thật
trong đề IELTS, nhưng sinh offline thì không ra được bản tử tế: cả hai đều rút
thẳng chuỗi từ bài nên luôn giải được bằng Ctrl-F.

### Bốn dạng mới

**1. Words in Context** — khoét một từ nội dung trong câu, bốn lựa chọn là từ có
thật ở chỗ khác trong bài.
- Kiểm chứng: đáp án là từ gốc trong câu, luôn đúng.
- Chống Ctrl-F: từ bị che nên không dò ngược được; nhiễu cũng có trong bài nên
  không loại được bằng cách "từ nào lạ thì sai".

**2. Matching Information** — "Ý này nằm ở đoạn nào?", chọn nhãn đoạn.
- Thứ tự câu hỏi **không** theo thứ tự đoạn.
- Nhận định rút từ đoạn nhưng viết lại, không giữ nguyên chuỗi.

**3. True/False/Not Given dựng lại**
- FALSE: tráo số liệu hoặc thực thể trong câu bằng một số liệu/thực thể **khác
  có thật trong bài** → mâu thuẫn thật, và không còn mẹo "câu nào có chữ not".
- TRUE: giữ nhưng phải đổi cấu trúc câu, không chỉ thay từ đồng nghĩa.
- NOT GIVEN: ghép chủ thể của bài với một mệnh đề lấy từ **bài khác cùng chủ
  đề** trong kho, thay cho mệnh đề template hiện tại.

**4. Câu kết đoạn hợp lý nhất** — cắt câu cuối một đoạn, nhiễu là câu cuối của
các đoạn khác trong cùng bài.
- Kiểm chứng: đáp án là câu thật của đoạn đó.
- Đòi nắm mạch lập luận cả đoạn; câu đã bị lấy khỏi đoạn nên không đối chiếu
  chuỗi được.

### Sắp xếp

Words in Context → Matching Information → True/False/Not Given → Câu kết đoạn.
Rút luân phiên giữa các dạng (dùng lại `interleave` của bộ SAT) để dạng nhiều
nguồn không át dạng ít nguồn.

### Test

Thêm `offline-generator.test.ts`, mô phỏng test đã có của bộ SAT:

- Không câu nào giải được bằng đối chiếu chuỗi với bài đọc.
- Không đáp án nhiễu nào xuất hiện sẵn trong chính câu hỏi.
- Câu hỏi không đi theo thứ tự đoạn.
- Sinh xác định theo id bài: mở lại ra đúng bộ đề đó.
- Bài quá ngắn thì trả bộ rỗng, không ném lỗi.

## Phần B — Prompt Claude

Thêm vào `IELTS_SYSTEM_PROMPT` một mục **CẤM** liệt kê đúng những anti-pattern
trên, và ba ràng buộc:

- Paraphrase phải xa: không lặp lại quá ba từ liên tiếp của câu gốc.
- Không hỏi theo thứ tự đoạn.
- Neo độ khó theo CEFR của bài, xếp câu dễ trước khó sau.

## Phần C — Bôi đen tra nghĩa

Bôi đen bất kỳ đoạn nào trong bài → hiện ngay thẻ nghĩa ngay cạnh chỗ bôi.

### Nguồn nghĩa

Đã có sẵn trong `lookup.ts`, không cần thêm gì:

| Tầng | Nguồn | Cần key? |
|---|---|---|
| Nghĩa Anh, IPA, ví dụ, phát âm | dictionaryapi.dev | Không |
| Nghĩa Việt | MyMemory | Không |
| Nghĩa theo đúng ngữ cảnh câu | Claude qua `/api/define` | Có — thiếu thì bỏ qua |

Nên tính năng chạy được trên bản public hiện tại; có key thì thêm tầng ngữ cảnh.

### Cơ chế

Chỉ web. Trên iOS/Android không có API đọc vùng bôi đen từ JS, nên native giữ
nguyên đường cũ (chạm từ, hoặc chế độ "Chọn cụm từ").

- Nghe `mouseup`/`touchend` trong khối bài đọc, đọc `window.getSelection()`.
- Vùng bôi rỗng hoặc nằm ngoài bài đọc → không làm gì.
- Suy ra `mode` theo độ dài: một từ → `word`, nhiều từ → `phrase`, có dấu kết
  câu hoặc quá 200 ký tự → `sentence`.
- Ngữ cảnh câu lấy bằng `sentenceAround` sẵn có, tính từ vị trí đầu vùng bôi.

### Xung đột phải xử lý

Mỗi từ trong đoạn đang là một `<Text onPress>`. Kéo chuột chọn xong thì trình
duyệt vẫn bắn `click` vào từ cuối cùng → mở nhầm thẻ tra một từ, đè lên vùng vừa
bôi. Nên `onWordPress` phải bỏ qua khi đang có vùng bôi khác rỗng.

## Ngoài phạm vi

- Không đụng bộ sinh đề SAT: đã đạt chuẩn.
- Không thêm nguồn từ điển mới.
- Không làm bôi đen trên native.
