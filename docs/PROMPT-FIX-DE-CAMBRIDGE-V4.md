# Prompt fix nốt bộ đề Cambridge / Actual Test Vol / IELTS public — bản 4 (sau kiểm lại 21/10/2026)

Bạn sửa dữ liệu đề thi cho ReadUp (Band 9), repo `D:\Claude\readup-ielts` (Expo SDK 57, Zustand,
Supabase, Vercel). Đọc `AGENTS.md` trước khi viết mã.

Bản này tiếp nối `docs/PROMPT-FIX-DE-CAMBRIDGE-V3.md`. Đọc V3 để biết lỗi nội dung và thiết kế;
bản này chỉ ghi trạng thái hiện tại đã kiểm lại và thứ tự làm nốt.

## 1. Mục tiêu

Mỗi đề đang hiện trong app phải đúng với đề thật: 40 câu cho Reading và Listening, đáp án có nguồn
xác nhận, bài đọc và transcript là nội dung thật, Listening có audio đúng đề. Đề không xác minh được
thì ẩn. Không bịa.

## 2. Ràng buộc cứng

- Không bịa đáp án, bài đọc, transcript, đề Writing hay Speaking. Thiếu nguồn thì ẩn đề.
- Không đưa nguyên văn bài đọc hay transcript có bản quyền vào `src/`, `app/`, `public/`.
  Dữ liệu gốc chỉ đọc từ `.local-private/` (gitignore, không deploy).
- Đáp án chỉ được coi là xác nhận khi có trang đáp án in, hoặc hai trang độc lập cùng kết quả.
  Các trang sao chép nhau tính là một nguồn. Ghi URL nguồn cho từng đáp án đã sửa.
- Không đưa khóa API vào mã, tài liệu hay commit.
- Repo có nhiều thay đổi chưa commit, từ nhiều phiên và từ Antigravity. Trước khi sửa: `git status`,
  `git diff <file>`. Không revert thay đổi không phải của bạn. Chỉ stage file của mình.
- Không commit hay deploy khi chưa được yêu cầu.

## 3. Trạng thái đã kiểm lại (21/10/2026)

Số liệu đọc từ `.local-private/ielts-ocr/source-tests.json`, `src/data/ielts-external-tests.json`,
và bốn báo cáo trong scratchpad: `verify-cam-8-13.json`, `verify-cam-14-16.json`,
`verify-cam-17-21.json`, `verify-vol-iot.json`. Thư mục scratchpad:
`C:\Users\admin\AppData\Local\Temp\claude\D--Claude\2038161e-58e0-439d-8fb5-e420795e2a81\scratchpad\`

**Số câu:** mọi đề Reading và Listening đều 40/40. Không cần sửa số câu.

**Đề private (212):**
- 66 đề đã có `hidden: true` trong `source-tests.json`, và được liệt kê trong `docs/HIDDEN_UNVERIFIED_TESTS.json`.
- 146 đề đang hiện. Trong 146 đề này: 22 đạt kiểm tra, 116 chưa đạt (FAIL hoặc UNVERIFIED),
  8 chưa có trong báo cáo (Band 9 Master Prep 2 đề; VOL 10 KEY 6 đề, báo cáo vol-iot ghi đạt).
- 104 đề đang hiện có `answerKeyVerified: true`. Cờ này sai với đa số đề: toàn bộ Cam 10–16
  Reading và Listening (56 đề) đều có cờ nhưng báo cáo ghi FAIL hoặc UNVERIFIED.
- Cam 9 (8 đề) đã ẩn nhưng vẫn mang `answerKeyVerified: true`.

**Bộ public (421 bản ghi):**
- 209 bản ghi có `answerKey`, tất cả đều có cờ verified.
- 108 bản ghi Reading và Listening dùng chung một khóa đáp án giống hệt nhau. Không có bản ghi nào
  được trang thứ hai xác nhận.
- 212 bản ghi không có `answerKey` (chủ yếu là Writing/Speaking của IOT).
- Một bản ghi (Recent Mock Vol 4) có chữ Trung Quốc.

**Tài liệu:** `docs/IELTS_BANK_AUDIT_2026-10-20.json` ghi `verifiedScoringKeys: 112`. Con số này không
khớp báo cáo đối chiếu và phải được sửa.

**Chuỗi rò đáp án:** khớp "Answer Cam" hoặc "View Answers" trong khoảng 54 đề Cam 10–16. Đây là khớp
toàn bản ghi, không phải khớp trang. Phải xác nhận từng trang trước khi cắt.

**Chữ giữ chỗ:** Cam 8 (6 đề Writing), Cam 9 (4), Vol 7–12 (20), Cam 21 (4 Speaking hoặc Writing).

**Working tree:** `src/data/ielts-cam-vol-bank.ts` có diff 2.428 dòng so với HEAD. `docs/HIDDEN_UNVERIFIED_TESTS.json`
là file mới, chưa commit.

## 4. Việc phải làm nốt

### Bước 1. Đồng bộ cờ xác nhận với báo cáo (làm trước mọi thứ)

- Với mỗi đề private, đặt `answerKeyVerified = true` chỉ khi báo cáo verify ghi PASS.
  Mọi đề còn lại đặt `answerKeyVerified = false`.
- Với bộ public, đặt `answerKeyVerified = false` cho cả 209 bản ghi, trừ khi bạn tự đối chiếu được
  hai nguồn độc lập cho từng bản ghi đó.
- Gỡ cờ gán cứng tại `scripts/ielts/convert-all-to-internal.mjs` (dòng khoảng 599 và 611). Không
  được gán cờ true trong script.
- Trong `src/data/ielts-cam-vol-bank.ts`, bỏ việc ép `answerKeyVerified` thành true cho gói không rõ trạng thái.
  Dòng `answerKeyVerified: pkg.answerKeyVerified !== false` đang mặc định đúng cho mọi gói không ghi rõ,
  cần đổi thành mặc định false.
- Cập nhật `docs/IELTS_BANK_AUDIT_2026-10-20.json` và mọi tài liệu có con số 112 cho khớp kết quả mới.

### Bước 2. Ẩn đề chưa đạt

- Ẩn 116 đề private đang hiện chưa đạt. Ghi danh sách vào `docs/HIDDEN_UNVERIFIED_TESTS.json`,
  kèm lý do cho từng đề (ví dụ "FAIL: Cam 15 R1 Q23, Q24, Q26" hoặc "UNVERIFIED: chỉ một nguồn").
- Ẩn 108 đề public có khóa đáp án trùng nhau.
- Đặt `hidden: true` trong `source-tests.json`. Đặt `hidden` trong bank tương ứng nếu bank có đề đó.
- Tắt đề bị ẩn trên cả hai nguồn: `app/api/ielts/local-ocr+api.ts` (dòng khoảng 57 đang lọc `!t.hidden`) và
  bộ public trong `app/ielts-source-practice.tsx`.
- Với đề đã ẩn từ trước (66 đề), giữ nguyên, không xóa.

### Bước 3. Gỡ dữ liệu do Antigravity viết (mục 5 của V3)

- `scripts/ielts/add-cam10-16-writing-speaking.py`: 140 đề Writing và Speaking Cam 10–16 là nội dung gõ sẵn.
  Tìm nơi nội dung này được ghi (có thể không nằm trong `source-tests.json` mà ở chỗ khác), rồi gỡ
  hoặc đặt `contentVerified: false` và ẩn. Không để chúng hiện trong app.
- `scripts/ielts/fix-cam21-listening-worksheets.py`: khôi phục Cam 21 Listening từ PDF hoặc bản OCR trước khi sửa.
- `scripts/ielts/fix-cam11-12-keys.py`: Cam 11 R2 Q25–26 và Cam 12 R2 Q10–13 không có căn cứ in.
  Đặt lại từ nguồn, cập nhật cả `answerKey` lẫn mảng `answers`.
- Các script scrape (`apply-cam-10-11-listening.py`, `apply-cam-10-13-reading.py`,
  `apply-cam16-vol10-keys.py`): đặt ngưỡng 40 đáp án, không gắn cờ khi thiếu.
- `clean-listening-transcripts.py`: không chạy lại.

### Bước 4. Cắt rò đáp án Cam 10–16

- Xác nhận từng trang của 54 đề có chuỗi "Answer Cam" hoặc "View Answers".
- Cắt khối đáp án của website khỏi trang nội dung. Không để chuỗi này trong bài đọc hay transcript.
- Chuyển đáp án sang cấu trúc có trường riêng nếu cần.

### Bước 5. Sửa đáp án xác nhận được (theo mục 4 của V3)

- Chỉ sửa đáp án khi có trang in hoặc hai nguồn độc lập. Ghi URL nguồn.
- Đơn nguồn thì không tự sửa. Ẩn đề.
- Các lỗi đã biết theo V3: Cam 17 L2, Cam 18 L2–4 và R2–4, Cam 17 R3, Cam 16 R4 (làm lại), Cam 14 R1,
  Cam 14 L4 Q40, Cam 15 R1, Cam 16 L2 Q38, Cam 11 R1 Q26–27, Cam 12 L2 Q1.
- Cam 20 L3 Q1 (139 hay 239) và Cam 12 R4 Q8 (Excise hay taxes): mâu thuẫn, không sửa cho tới khi có trang in.

### Bước 6. Nội dung và chữ (theo mục 6 của V3)

- Ẩn bài đọc sinh tự động của Cam 8, Cam 9, Vol 7–9, 11, 12.
- Cam 21 Reading Passage 1: câu hỏi giả. Làm lại từ sách hoặc ẩn.
- Sửa chữ dính, chữ thừa, quảng cáo tiếng Trung từ PDF text layer. Xem `ocr-reading-check.json` và `listening-extra-text.json`.
- Sửa khóa Cam 15 L3, R2, R3: "&amp;amp;", nhãn TRUE cho câu YES/NO, tiền tố "section A –".

### Bước 7. Writing và Speaking

- Chỉ hiện đề thật có nguồn. Cam 17–20 không có đáp án Writing và Speaking, nhiều prompt dính chữ.
- Cam 21 W1 thiếu số từ. Cam 8 Writing 1–4 và GT Writing B thiếu số từ.
- Đề không có nguồn thì ẩn.

### Bước 8. Audio

- Thiếu audio Listening: Cam 8, Cam 9, Vol 9, 11, 12. Vol 7 và 8 trỏ tới 8 file mp3 không có.
- Không tham chiếu file không tồn tại. Đánh dấu đề thiếu audio là ẩn hoặc không có nút nghe.

### Bước 9. Thiết kế phòng thi (làm sau dữ liệu đúng, theo mục 7 của V3)

Xem `design-defects.json`.

### Bước 10. Kiểm tra cuối

- `npx tsc --noEmit -p .` không tăng lỗi so với nền.
- `npx tsx --test src/services/ielts/source-catalog.test.ts` và `scoring.test.ts` đều xanh.
- Chạy lại kiểm tra số liệu của mục 3, và lập lại bảng: đề hiện, đề đạt, đề ẩn, cờ verified khớp báo cáo.
- Đề xuất tài liệu mới `docs/IELTS_BANK_AUDIT_<ngày>.json` khớp với bảng này.

## 5. Tiêu chí xong (cho từng đề)

- Số câu đúng, đủ khóa 1–40 (Reading và Listening).
- Mỗi đáp án có nguồn (trang in, hoặc hai trang độc lập, kèm URL), hoặc đề bị ẩn.
- Cờ `answerKeyVerified` khớp với kết quả kiểm tra.
- Bài đọc và transcript là nội dung thật: không lặp, không giữ chỗ, không chữ dính, không chữ thừa,
  không khối đáp án website, không quảng cáo.
- Audio tồn tại và đúng đề (nếu là Listening).
- Writing và Speaking có đề thật, hoặc không hiện.

## 6. Báo cáo cuối

Với mỗi đề: trạng thái (đạt / đã sửa / ẩn / chưa xác minh), nguồn (file, trang, URL) và thay đổi đã làm.
Tổng hợp số đề hiện, số đề đạt, số đề ẩn và số cờ đã gỡ. Không báo "đã xác minh" khi chưa có trang in
hoặc hai nguồn độc lập.
