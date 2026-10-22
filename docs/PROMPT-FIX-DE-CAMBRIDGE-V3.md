# Prompt fix bộ đề Cambridge / Actual Test Vol / IELTS public — bản 3 (sau đối chiếu web)

Bạn sửa dữ liệu đề thi cho ReadUp (Band 9), repo `D:\Claude\readup-ielts` (Expo SDK 57, Zustand,
Supabase, Vercel). Đọc `AGENTS.md` trước khi viết mã.

## 1. Mục tiêu

Mỗi đề trong app phải đúng với đề thật: đủ dạng câu hỏi, số câu đúng (40 cho Reading và Listening),
đáp án được xác nhận, bài đọc và transcript là nội dung thật, không lẫn chữ thừa hay chữ dính,
Listening có audio đúng đề, Writing và Speaking có đề thật. Đề không xác minh được thì ẩn, không bịa.

## 2. Ràng buộc cứng

- Không bịa đáp án, bài đọc, transcript, đề Writing hay Speaking. Thiếu nguồn thì ẩn đề.
- Không đưa nguyên văn bài đọc hay transcript có bản quyền vào `src/`, `app/`, `public/`.
  Dữ liệu gốc chỉ đọc từ `.local-private/`, thư mục này gitignore và không deploy.
- Đáp án chỉ được coi là xác nhận khi có ít nhất hai trang độc lập cùng kết quả, hoặc có trang đáp án in.
  Các trang sao chép nhau (giống hệt hoặc khác nhau dưới 3 câu) tính là một nguồn.
- Lưu URL nguồn cho từng đáp án đã sửa.
- Không đưa khoá API vào mã, tài liệu hay commit.
- Repo đang có nhiều thay đổi chưa commit từ nhiều phiên và từ Antigravity. Trước khi sửa: `git status`,
  `git diff <file>`. Không revert thay đổi không phải của bạn. Chỉ stage file của mình.
  Không commit hay deploy khi chưa được yêu cầu.

## 3. Báo cáo đã có (đọc trước)

Thư mục: `C:\Users\admin\AppData\Local\Temp\claude\D--Claude\2038161e-58e0-439d-8fb5-e420795e2a81\scratchpad\`

- Đối chiếu web (kết quả chính):
  - `web-cam-8-13.json`: 48 đề Cam 8–13, mỗi câu có đáp án đang lưu, trạng thái, giá trị từng trang và URL.
  - `web-cam-14-16.json`: 24 đề Cam 14–16.
  - `web-cam-17-21.json`: 40 đề Cam 17–21.
  - `web-vol-iot.json`: Vol 7–12 và bộ public (mẫu).
- Đối chiếu bằng tài liệu in (lần hai): `pass2-cam-8-13.json`, `pass2-cam-14-16.json`, `pass2-cam-17-21.json`,
  `pass2-vol-iot.json`.
- OCR bài đọc: `ocr-reading-check.json`. Chữ thừa transcript: `listening-extra-text.json`.
- Thiết kế phòng thi: `design-defects.json`.
- Kiểm tra thay đổi của Antigravity: `check-antigravity-source.json`, `check-antigravity-scripts.json`,
  `check-antigravity-ui-bank.json`.

Đọc các file này để biết chính xác đề, câu và trường cần sửa trước khi đụng vào dữ liệu.

## 4. Kết quả đối chiếu web (tóm tắt)

**Cam 8–13** (160 câu mỗi phần, 4 đề mỗi cuốn):
- Cam 9 Reading và Listening: 150/160 câu khác đáp án web. Q1–2 giống nhau ở cả 4 đề mỗi phần. Phải làm lại.
- Cam 10 Reading và Listening: khớp web.
- Cam 11 Reading 1: Q26 đang "curiosity", web "locks"; Q27 đang "B", web "D" (hai trang mỗi bên).
- Cam 12 Listening 2 Q1: đang "4", ba trang ghi "2.45".
- Cam 8: chưa có đáp án trong dữ liệu, chỉ có từ web. Cần đưa vào.
- Cam 12 Reading 4: hai nguồn mâu thuẫn Q8 ("Excise" và "taxes"). Chưa giải quyết.
- Cam 11, 12, 13 Reading: phần lớn chỉ có một nguồn (các trang giống nhau). Ghi là đơn nguồn.

**Cam 14–16** (960 câu): 909 xác nhận, 51 mâu thuẫn.
- Cam 16 Reading 4: trùng Reading 1 và chỉ đúng 1/40. Làm lại từ đầu.
- Cam 14 Reading 1: Q4–5 đang "traffic/crime" ở cả hai ô (đúng: traffic và crime, mỗi câu một ô); Q19–22 lệch.
- Cam 14 Listening 4 Q40: đang "win", ba trang ghi "wine".
- Cam 15 Reading 1: Q23, Q24, Q26 lệch (ba trang).
- Cam 15 Listening 4 Q38: "harbour/harbor" trong khi bốn trang ghi "lighting". Có thể lỗi sao chép.
- Cam 16 Listening 2 Q38: đang "370 calories", trang ghi "calories".

**Cam 17–21** (1.600 câu): 1.145 xác nhận, 405 đơn nguồn, 8 mâu thuẫn, 42 không có nguồn.
- Sai nặng: Cam 17 Listening 2 (35/40); Cam 18 Listening 2–4 và Reading 2–4 (mỗi đề 29–32 câu sai);
  Cam 17 Reading 3 (14 câu); Cam 17 Listening 4 Q31–40 (10 câu).
- Hỏng: Cam 21 Listening 2 và 4 có đáp án "evidence" giữ chỗ. Cam 21 Listening 2 không kiểm được.
- Mâu thuẫn thật: Cam 20 Listening 3 Q1 (239 vs 139, một nguồn ghi 239, dữ liệu và onthiielts ghi 139).
- Cam 21 Reading 2 Q21: dữ liệu TRUE, web B hoặc D (đơn nguồn).
- Cam 21 Reading 1 Q1–7: tuhoc.dolenglish.vn lệch dữ liệu và onthiielts; nguồn tuhoc chưa rõ.
- Cam 20 Reading 1 Q14 và Q30: web xác nhận C, dữ liệu đúng.
- Cam 19 Reading 2 Q24–26: lệch ba câu.
- Đúng: Cam 17 Listening 1 và 3, Cam 19 Listening 1–4, Reading 1, 3, 4, Cam 18 Reading 1.
- Cam 21 và Cam 20 Reading 2–4 chỉ có onthiielts làm nguồn.

**Vol 7–12 và bộ IELTS public:**
- Vol 7: chỉ có một nguồn công khai (PDF IZONE "Recent Actual Test 7"), mâu thuẫn với đáp án đang lưu ở gần như mọi câu. Cách đánh số chưa khớp, mapping chưa chắc chắn.
- Vol 8–12: không có nguồn công khai.
- Vol 10 KEY: 240 đáp án khớp PDF của bạn. Chưa có nguồn công khai thứ hai. File chưa được xác nhận là Cambridge.
- Bộ public (~209 đề): đáp án Reading và Listening là hằng số; transcript Listening giống nhau ở 108 đề; cờ `answerKeyVerified=true` gán cứng tại `scripts/ielts/convert-all-to-internal.mjs` dòng 599 và 611. Mẫu 6 đề không đề nào được trang thứ hai xác nhận.

## 5. Lỗi do Antigravity (phải xử lý trước)

- `scripts/ielts/add-cam10-16-writing-speaking.py`: 140 đề Writing và Speaking Cam 10–16 bị gõ sẵn, không có nguồn trong máy, nhưng gắn `contentVerified=true` và `sourceCheckedAt=2026-10-21`. Gỡ hoặc đặt `contentVerified=false`. Không được xuất hiện trên app.
- `scripts/ielts/fix-cam21-listening-worksheets.py`: gõ tay nội dung Cam 21 Listening, khác sách PDF (Test 1 Q11, bảng Test 2 Part 1, form Test 4, Test 1 Part 3). Khôi phục từ PDF hoặc bản OCR trước khi sửa.
- `scripts/ielts/fix-cam11-12-keys.py`: đáp án Cam 11 R2 Q25–26 và Cam 12 R2 Q10–13 không có trang in làm căn cứ. Cập nhật `answerKey` nhưng không cập nhật mảng `answers`. Phải đối chiếu lại.
- Các script scrape (`apply-cam-10-11-listening.py`, `apply-cam-10-13-reading.py`, `apply-cam16-vol10-keys.py`): chấp nhận bộ đáp án dưới 40 câu nhưng vẫn gắn cờ xác minh. Đặt ngưỡng 40.
- `clean-listening-transcripts.py`: không chạy lại. Regex không neo, có thể cắt mất đoạn transcript.
- Bank `src/data/ielts-cam-vol-bank.ts`: 6 gói Cam 17–19 Reading có `answerKeyVerified` không xác định, bị ép thành true. Chỉ Cam 21 Reading 1 có căn cứ đầy đủ. Cam 20 Reading 1 có căn cứ docx.
- `src/components/ielts/SourceExamRoom.tsx`: đã sửa biến `isListeningImage2` chưa khai báo và bỏ dòng hướng dẫn "Write ONE WORD ONLY" tự sinh. `tsc` còn 0 lỗi. Chưa commit.
- Link `/ielts` trên trang chủ: không có `app/ielts/index.tsx`. Sửa hoặc bỏ.

## 6. Lỗi nội dung và thiết kế (từ kiểm tra OCR và thiết kế)

- **Bài đọc Cam 8, Cam 9, Vol 7–9, 11, 12 (khoảng 30 đề):** sinh tự động, có câu mẫu "The study of Cambridge N · Reading Test N represents…". Ẩn cho đến khi có nguồn.
- **Cam 21 Reading Passage 1 (cả 4 đề):** câu hỏi giả ("The research team documented…", "Investigators identified special […]"). Câu 8–13 thật là TFNG. Làm lại hoặc ẩn.
- **Cam 21 Reading:** giải thích tiếng Việt nằm lẫn trong trang bài đọc (đề 1, 3, 4). Tách ra.
- **Chữ dính do OCR:** khoảng 190 token ở Cam 17–20 Reading và Listening (ví dụ "readingpassage1", "concretemixes"). Sửa từ text layer của PDF.
- **Chữ thừa:** "Test 1 READING PASSAGE 3" còn trong Passage 2 của Cam 17-1; "effcient", "profesional", "materiall", "lridium" trong Cam 18–19; "《" lạc ở Cam 19-L3.
- **Quảng cáo tiếng Trung:** trong trang đáp án support của 8 đề Cam 17–19 trong `source-tests.json`. Xoá.
- **Transcript Listening có chữ thừa:** nhãn "Answer Cam NN", "Cam NN Listening Test NN", tiêu đề trang, số folio. Cam 8 và Cam 21 transcript không khớp sách (Cam 21 L1 là cuộc gọi dịch vụ, sách là buổi nói chuyện về trang điểm). Làm lại từ sách hoặc ẩn.
- **Khối đáp án website** nằm trong trang nội dung của 22 đề Cam 14–16. Cắt khỏi trang nội dung.
- **Cam 15 L3, Cam 15 R2, Cam 15 R3:** khoá có "&amp;amp;", nhãn TRUE cho câu YES/NO, tiền tố "section A –" làm hỏng chấm chính xác.
- **Writing và Speaking:** Cam 17–20 không có đáp án, nhiều prompt dính chữ. Cam 21 W1 thiếu số từ. Cam 8 Writing 1–4 và GT Writing B thiếu số từ (250 hoặc 150).
- **Thiếu:** audio Listening Cam 8, Cam 9, Vol 9, 11, 12. Vol 7 và 8 trỏ đến 8 mp3 không tồn tại. Cam 21 chưa có ảnh bìa. Bank chỉ có 8 gói Reading của Cam 17–21, không có Listening, Writing hay Speaking.

## 7. Thiết kế phòng thi (làm sau khi dữ liệu đúng)

Theo `design-defects.json`:
- Hướng dẫn tự sinh theo loại câu hỏi đầu. Dùng hướng dẫn in của từng nhóm câu.
- Khoảng câu hỏi phải theo tiêu đề in ("Questions N–M"), không chia cố định.
- Reading: "READING PASSAGE N" và hai cột. Dưới 1024px đang xếp chồng, sửa.
- Listening: không có cột đoạn văn; "PART N", rồi "Questions N–M", rồi hướng dẫn; audio ở trên đầu.
- Bỏ nền hồng, màu đỏ-hồng, thanh sóng giả, nút emoji. Phông gần với sách in.
- Nút "Tiếp" chuyển đến câu đầu của Part kế tiếp, không nhảy +4.
- Xoá component `SourceAudio` không dùng, hoặc gắn đúng chỗ.

## 8. Thứ tự làm

1. **Ẩn trước** mọi đề không xác minh được (mục 4 chưa xác nhận, mục 6 nội dung giả, toàn bộ Vol 8–12, Cam 9, bộ public chưa xác nhận). Ghi danh sách vào file để bật lại.
2. **Gỡ dữ liệu Antigravity giả** (mục 5): Writing/Speaking Cam 10–16, các cờ xác minh gán cứng. Khôi phục Cam 21 Listening từ PDF.
3. **Cắt rò đáp án** Cam 14–16.
4. **Sửa đáp án xác nhận được** (từ mục 4, hai nguồn trở lên hoặc trang in). Ghi URL nguồn cho từng đáp án. Đơn nguồn không tự sửa.
5. **Sửa chữ dính, chữ thừa, quảng cáo** (mục 6), từ PDF text layer.
6. **Thêm đáp án Cam 8** và đề còn thiếu, chỉ khi có nguồn.
7. **Thiết kế phòng thi** (mục 7).
8. **Kiểm tra cuối**: `npx tsc --noEmit -p .` không tăng lỗi. Test `source-catalog` và `scoring` xanh.

## 9. Tiêu chí xong (cho từng đề)

- Số câu đúng (40 cho Reading và Listening), đủ khoá 1–40.
- Mỗi đáp án có nguồn (trang in, hoặc hai trang độc lập, kèm URL), hoặc đề bị ẩn.
- Bài đọc và transcript là nội dung thật, không lặp, không chữ giữ chỗ, không chữ dính, không chữ thừa.
- Audio tồn tại và đúng đề (nếu là Listening).
- Không có khối đáp án website trong trang nội dung. Không có text quảng cáo.
- Writing và Speaking có đề thật, hoặc không hiển thị.

## 10. Báo cáo cuối

Với mỗi đề: trạng thái (đạt / đã sửa / ẩn / chưa xác minh), nguồn (file, trang, URL), thay đổi đã làm.
Không báo "đã xác minh" khi chưa có trang in hoặc hai nguồn độc lập.
