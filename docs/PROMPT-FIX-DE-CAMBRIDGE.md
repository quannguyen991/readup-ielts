# Prompt: sửa và đối chiếu bộ đề Cambridge / Actual Test Vol / IELTS public

Bạn là kỹ sư sửa dữ liệu đề thi cho dự án ReadUp (Band 9) — repo `D:\Claude\readup-ielts`
(Expo SDK 57, Zustand, Supabase, Vercel). Đọc `AGENTS.md` trước khi viết mã.

## 1. Mục tiêu

Mỗi đề trong app phải đúng với đề thật: đúng số câu (40 cho Reading/Listening), đúng đáp án
đã in, bài đọc/transcript là nội dung thật (không sinh tự động), có audio nếu là Listening.
Đề không chứng minh được thì **không hiển thị**, không được bịa.

## 2. Ràng buộc cứng

- **Không bịa đáp án, không bịa nội dung bài.** Thiếu nguồn thì đánh dấu `unverified` và ẩn đề.
- **Không copy nguyên văn bài đọc có bản quyền vào repo public** (`src/`, `app/`, `public/`).
  Dữ liệu gốc chỉ đọc từ `.local-private/` (đã gitignore và loại khỏi deploy).
- **Không đưa khoá API vào mã, tài liệu hay commit.**
- Repo dùng chung nhiều phiên. Trước khi sửa file: `git status`, `git diff <file>`. Không revert
  thay đổi không phải của bạn. Chỉ stage file của mình.
- Không commit/deploy khi chưa được người dùng yêu cầu.
- Nguồn chuẩn để đối chiếu, theo thứ tự ưu tiên:
  1. Trang đáp án in trong sách và PDF trong `.local-private/ielts-ocr/`
     (`cambridgeNN-book-page-*.webp`, `cambridge21-book.pdf`, `cambridge20-key-*.docx`).
  2. `.local-private/ielts-ocr/source-tests.json` và các file crawl
     (`cambridge-crawled-full.json`, `cambridge-crawled-authentic.json`,
     `cambridge-10-16-reading-crawled.json`, `cambridge-10-16-crawled.json`).
  3. Bank `src/data/ielts-cam-vol-bank.ts` (chỉ để so sánh; đây là nơi đã từng sai).

## 3. Báo cáo kiểm tra đã có (đọc trước khi làm)

Thư mục: `C:\Users\admin\AppData\Local\Temp\claude\D--Claude\2038161e-58e0-439d-8fb5-e420795e2a81\scratchpad\`

- `verify-cam-8-13.json`: Cam 8–13. 10 đạt, 20 lỗi, 30 chưa xác minh.
- `verify-cam-14-16.json`: Cam 14–16. 0 đạt. 22 đề rò khối đáp án của website trong trang cuối.
- `verify-cam-17-21.json`: Cam 17–21. 22 đạt, 50 lỗi, 8 chưa xác minh.
- `verify-vol-iot.json`: Actual Test Vol 7–12 và bộ IELTS public. Chỉ VOL 10 KEY đạt.
- `bank-fix-17-19.json`, `bank-fix-20-21.json`: bản sửa bank đã đối chiếu cho Cam 17–21 Reading.
  Đã áp dụng vào working tree của `src/data/ielts-cam-vol-bank.ts`, chưa commit.

Đọc các file này để biết chính xác đề nào, câu nào lỗi, trước khi đụng vào dữ liệu.

## 4. Lỗi đã xác định

**A. Rò đáp án (ưu tiên cao, lỗi bảo mật nội dung)**
- 22 đề Cam 14–16 có khối đáp án của website ("Answer Cam NN …", "View Answers") nằm trong
  trang cuối. Cần cắt bỏ khỏi trang nội dung và chuyển sang đáp án có cấu trúc.
- Chỉ Cam 15 Listening 4 và Cam 16 Listening 4 là sạch.

**B. Đáp án sai**
- Cam 17: 17-L2 sai 35/40; 17-R3 sai nhiều.
- Cam 18: 18-L2, L3, L4, R2, R3, R4 lệch 3–35 câu.
- Cam 19: 19-R2 lệch nhiều.
- Cam 16 Reading 4: đáp án trùng 40/40 với Cam 16 Reading 1 → sai.
- Cam 21-R2 Q21: nguồn ghi TRUE, sách in D.
- Cam 20-L3 Q1 (139 vs 239), 20-R3 Q30 (C vs A), 20-R4 Q14 (D vs C): xung đột giữa docx và nguồn.
  Cần kiểm trang đáp án in để chọn.

**C. Nội dung sai**
- Cam 21 Listening: transcript và câu hỏi không khớp sách (ví dụ "Charlotte Abernathy").
  21-L2 có 11 đáp án, 21-L4 có 10 đáp án là chữ giữ chỗ "evidence".
- Cam 8 và Cam 9 Reading: bài sinh tự động ("The study of Cambridge N · Reading Test N represents…").
- Cam 9: không có nguồn in nào, nhưng bị gắn cờ `answerKeyVerified: true`. Bỏ cờ đó.
- Actual Test Vol 7, 8, 9, 11, 12: đáp án là hằng số hard-code trong `scripts/ielts/add-50-tests.mjs`,
  bài đọc sinh tự động. Không dùng lại.
- Bộ IELTS public (`src/data/ielts-external-tests.json`): 101 đáp án Reading là một khoá duy nhất,
  108 đáp án Listening là một khoá khác, đều bị gắn cờ đã xác minh. Transcript Listening dùng chung.

**D. Thiếu**
- Audio Listening: Cam 8, Cam 9, Vol 9, Vol 11, Vol 12 (20 đề).
  Vol 7 và Vol 8 tham chiếu 8 mp3 không tồn tại.
- Writing và Speaking: không có cho Cam 9–16 và Vol. Có cho Cam 8 và Cam 17–21, nhưng không có đáp án.
- General Training: chỉ Cam 8 có.
- Ảnh bìa Cam 21: chưa có.

**E. Dữ liệu bẩn**
- Cam 17–19: bài nghe mỗi đề là một file ghép ("Mix by audio-joiner.com").
- Chữ quảng cáo tiếng Trung lọt vào trang đáp án support của 8 đề Cam 17–19 trong `source-tests.json`.
- Nhiều đề Writing Cam 17–20 bị dính chữ do PDF ("Themapsbelowshowanindustrialarea…").
- 10 đề Reading Cam 17–19 có trang Writing/Speaking nằm trong Part 3; 8 đề Listening có trang
  Reading làm Part 4.
- Vài lỗi nhỏ: 19-L4 Q11–14 có "C hoặc E"; 19-R3 Q28–40 có tiền tố số; 17-R4 Q35 là "34Not given";
  20-R2 ghi "A, C" cho cả Q23 và Q24.

## 5. Thứ tự làm

1. **Ẩn trước** mọi đề không đạt khỏi danh sách public (trong `app/ielts-source-practice.tsx`
   và `app/api/ielts/local-ocr+api.ts`, bằng cờ `hidden` hoặc danh sách loại trừ). Chỉ giữ 22 đề
   Cam 17–21 đã đạt và các đề đã sửa xong. Ghi danh sách vào một file để có thể bật lại.
2. **Cắt rò đáp án** ở Cam 14–16: loại khối đáp án của website khỏi trang nội dung. Đảm bảo không
   còn chuỗi "Answer Cam" hay "View Answers" trong trang đề.
3. **Sửa đáp án** Cam 17–19 và 16-R4 theo trang đáp án in. Ghi nguồn trang vào mỗi thay đổi.
   Không thay đáp án nếu chỉ có một nguồn không in.
4. **Cam 21 Listening:** thay transcript và câu hỏi bằng nội dung thật của sách, hoặc để ẩn.
5. **Cam 8 và 9 Reading, Vol 7–12, bộ IELTS public:** ẩn. Không sửa bằng nội dung sinh tự động.
6. **Audio:** chỉ đánh dấu những đề có file thật. Không tham chiếu file không tồn tại.
7. **Bank:** giữ các gói đã đối chiếu. Thêm gói chỉ khi có nguồn in.

## 6. Tiêu chí xong (cho từng đề)

- Số câu đúng (40 cho Reading/Listening) và có đủ khoá 1–40.
- Mọi đáp án khớp trang đáp án in, hoặc đánh dấu `unverified` và ẩn.
- Bài đọc và transcript là nội dung thật, không lặp, không chữ giữ chỗ.
- Audio tồn tại và đúng đề, nếu là Listening.
- Không có khối đáp án của website trong trang nội dung.
- `npx tsc --noEmit -p .` không tăng lỗi so với nền. Lỗi có sẵn ở `SourceExamRoom.tsx`
  (`useCallback` thiếu, `ExamPart.title`) do phiên khác gây ra, cần sửa riêng.
- `npx tsx --test src/services/ielts/source-catalog.test.ts` và `scoring.test.ts` đều xanh.

## 7. Báo cáo cuối

Với mỗi đề: trạng thái (đạt / đã sửa / ẩn / chưa xác minh), nguồn đã dùng (file và trang),
và những gì đã thay đổi. Không báo "đã xác minh" khi chưa có trang đáp án in.
