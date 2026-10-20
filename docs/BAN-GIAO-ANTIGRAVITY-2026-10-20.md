# Bàn giao ReadUp (Band 9) cho Antigravity — cập nhật 20/10/2026

Tài liệu này nói **dự án đang làm gì và đang ở đâu**. Các luật cứng, bẫy kỹ thuật và quy ước mã vẫn đúng trong `docs/ban-giao-antigravity.md` (bản 27/09). Đọc cả hai.

## 1. Dự án là gì

ReadUp (tên thương hiệu hiện tại: **Band 9**, tên miền **9band.com**) là ứng dụng luyện thi IELTS, SAT, từ vựng và kỹ năng tiếng Anh cho học sinh, sinh viên Việt Nam. Một mã nguồn chạy trên web (Expo web), iOS và Android.

Người dùng học theo các mảng: **Từ vựng, Writing, Listening, Speaking, Reading, IELTS, SAT**. Học xong có chuỗi ngày (streak), sao thưởng, thống kê và lịch sử làm bài.

## 2. Ngăn xếp và cách chạy

- Expo SDK 57, react-native-web, expo-router, Zustand, Supabase, Vercel. **Đọc tài liệu Expo v57 trước khi viết mã đụng tới Expo** (`AGENTS.md`).
- Thư mục: `D:\Claude\readup-ielts`, nhánh làm việc `proofloop`.
- Chạy: `npm run web` → http://localhost:8081.
- Kiểm kiểu: `npx tsc --noEmit -p .` (có sẵn một số lỗi ở `app/hsa`, `src/components/hsa`, `Band9Arcade`, không cần sửa hết).
- Test: `npm test`. Có khoảng 365 file test. Một số test bản đồ du lịch (`maps.test.ts`, `hanoi.grid.test.ts`) đang lỗi từ trước, cùng lỗi trên HEAD cũ.
- Triển khai: `npx vercel deploy --prod --yes`, nên làm từ một worktree sạch đã commit. Thư mục `.vercel` nằm ở gốc repo, cần copy sang worktree. Dự án Vercel tên `readup-ielts`. Vercel đang bật bảo vệ SSO nên các URL công khai trả về 302, phải đăng nhập Vercel mới xem được.
- Repo có `origin` trỏ tới GitHub (`quannguyen991/readup-ielts`). Tài liệu cũ ghi "không có remote" là đã lỗi thời. **Không tự push** khi chưa được yêu cầu.

## 3. Trạng thái các mảng (20/10/2026)

**Từ vựng**
- 50 bộ IELTS, mỗi bộ có các mức B1, B2, C1, C2. Oxford 3000 có 18 chủ đề (A1–C1), Vocabulary for IELTS và Advanced cũng có mức.
- Luồng đã chốt: bấm chủ đề → **bước chọn cấp độ trước** (chỉ hiện mức có từ, kèm số từ) → vào "Cách luyện" của đúng mức đó. Mỗi mức có tiến độ riêng. Không gộp B1/B2/C1 vào một luồng.
- Có Quiz ôn tập, FSRS (lịch ôn ngắt quãng), ngọn lửa streak khi đúng liên tiếp, và lưu vòng học dở theo từng bộ.
- Trắc nghiệm THPT: chỉ là trắc nghiệm sinh từ bộ từ vựng (35 câu mỗi bài, `/vocabulary/thpt`). **Chưa có đề thi THPT Quốc gia thật.** Chưa có mục THPT trong sidebar.

**Âm thanh phát âm**
- Giọng chính là **Aoede** (Gemini `gemini-2.5-flash-preview-tts`, cấu hình ở `src/data/pronunciation-voice.json`). Kho clip Aoede có khoảng 5.700 mục.
- Từ chưa có clip Aoede được dự phòng bằng giọng **Alice** (ElevenLabs qua Vibi, voice_id `Xb7hH8MSUJpSbSDYk0k2`). Kho `public/audio/words/alice/` có 4.173 clip, sinh bằng `scripts/listening/gen_alice_words.mjs`. Thứ tự tra: Aoede → Alice → giọng máy.
- Hạn mức Gemini TTS miễn phí: 10 lượt/ngày/mô hình. Hết hạn mức là tool dừng, không tự đổi giọng.

**Thuyết minh lịch sử (tiếng Anh)**
- Chủ đề `vn-khang-chien-chong-phap`: 12 cảnh. Đã tạo lại bằng Aoede. Chỉ s09, s10, s11, s12 có `audio.json` chỉ tới bản mới (s11 đã đổi). `scenes.json` **không** rebuild vì build sẽ publish cả 12 cảnh và mất dữ liệu `motion`.

**Speaking, Listening, Reading, Writing, Hub**
- Phòng Nói (Speaking) và Hub (nhập vai, gọi điện, hội thoại) đều đọc bằng Aoede.
- Listening: có 5 bộ đề. Audio `band9-t1` còn thiếu section 4. Hội thoại hai người cần hai giọng, chưa toàn Aoede được.
- Bài kiểm tra đầu vào IELTS: phần **Reading** đã dựng (3 bài, 40 câu, đề gốc không sao chép đề thật). Listening và chấm Writing chưa làm.

**Oxford**
- Trang Oxford đã đồng bộ với luồng IELTS: thẻ chủ đề có bìa minh hoạ, bước chọn cấp độ, nút "Tất cả bộ từ" quay về thư viện.

**Nền tảng**
- Ảnh WebP: 759 PNG trong `public/` đã đổi sang WebP lossless (79,7 MB → 46,7 MB). Icon PWA và ảnh trong `src/assets` vẫn là PNG. Commit `072fb0c4`.
- Lỗi trắng trang trên production do `CatSticker` gọi hook không điều kiện: đã sửa ở `ee4a3e29`.
- Build web chạy với `NODE_ENV=production` để minify (commit `4f5a6f49`).

**Streak và dữ liệu người dùng**
- Vòng học dở được lưu theo từng bộ; streak và sao thưởng có ở các màn học.
- Có phiên riêng đang làm dữ liệu thật, thống kê và rà Listening. Phần này còn đang dở, chưa commit.

**Trang chủ**
- Lưới mảng học vẫn là 12 thẻ + Đọc báo song ngữ. Thử gộp thành 7 mảng đã bị hoàn tác vì chưa rõ TOEIC·TOEFL và Clip tiếng Anh đặt ở đâu. **Câu hỏi này chưa được trả lời.**

## 4. Việc đang dở (chưa commit)

Working tree có khoảng 60 file thay đổi từ nhiều phiên làm song song. Trước khi sửa file dùng chung, chạy `git status` và `git diff <file>`. Không revert thay đổi của phiên khác. Một số nhóm đang chờ:

- Dữ liệu người dùng thật, streak, thống kê, rà Listening (phiên riêng, đã dừng ở một lượt, có báo cáo chưa commit).
- Hình nền học: 6 ảnh Wikimedia và đã gỡ 6 nền CSS (chưa kiểm trên trình duyệt).
- Thêm đồng nghĩa và trái nghĩa cho 50 bộ IELTS (8.500 từ), 90 từ để trống vì không có đồng nghĩa thật.
- Tách mục bỏ chọn/chọn lại ở trang IELTS và SAT: đã làm, chờ commit.
- Thư mục deploy tạm `D:/Claude/readup-deploy-c8c3` chưa xoá. Đây là worktree tạm, bị khoá quyền một lần trước đó.

## 5. Việc chưa giải quyết

1. **Đề THPT thật**: chưa có. Cần chủ dự án quyết định nguồn đề trước khi làm.
2. **Giọng Alice**: clip nằm trong `public/audio/words/alice/`, chưa được kiểm nghe đủ. Khoá Vibi nằm ở `D:\Claude\.secrets\vibi.key`, không trong repo. Khoá này đã từng dán vào chat, nên cần đổi khoá trên Vibi.
3. **Clip Aoede còn thiếu**: hạn mức Gemini và lỗi 503/522 từ Vibi làm tiến độ chậm. Có job nền `Band9-DailyVoiceAudio` chạy 15:30 mỗi ngày, cần kiểm nhật ký `scripts/listening/daily.log`.
4. **Listening**: audio `band9-t1` chưa đủ 4 section. Cần rà toàn bộ bài theo format IELTS (đọc đề, khoảng dừng, 30 giây kiểm tra cuối mỗi section).
5. **TOEIC·TOEFL**: đang đặt ở trạng thái "đang phát triển" có thông báo.
6. **Hiệu năng chuyển trang**: đo trên dev thấy mỗi lần chuyển tốn 100–180 ms chặn luồng chính. Trên production, entry JS khoảng 40 MB và chỉ có 16 chunk, nên phần khởi tạo còn nặng. Chưa sửa.
7. **Đồng bộ chưa phủ hết**: mục 8.2 trong tài liệu 27/09 chưa được kiểm lại từ đầu, nên xem như còn hiệu lực cho tới khi kiểm.

## 6. Luật cứng (lấy từ tài liệu cũ và các phiên làm việc)

- **Không commit, không deploy, không push** khi chủ dự án chưa yêu cầu rõ ràng. Có yêu cầu thì commit kèm dòng `Co-Authored-By: Claude Haiku 5.5 <noreply@anthropic.com>`.
- **Không đưa khoá API vào mã, tài liệu, commit hay log.** Khoá nằm trong `.env.local`, `.secrets/` và biến môi trường Vercel.
- **Trước khi tiêu tiền** (Gemini, Vibi, ElevenLabs, sinh ảnh hàng loạt): kiểm số dư, ước tính chi phí, chọn model rẻ, hỏi chủ dự án.
- **Không tự publish** nội dung lịch sử khi chưa được duyệt (xem mục 3, `scenes.json`).
- Đa phiên trên cùng thư mục: kiểm `git status` trước khi sửa, chỉ stage file của mình.
- Giao diện phụ thuộc dữ liệu trên máy dùng `useHydrated`, tránh lệch HTML server.

## 7. Đọc thêm

- `docs/ban-giao-antigravity.md`: luật cứng, bẫy kỹ thuật, quy ước mã (27/09).
- `docs/readup-tom-tat-du-an.md`: tóm tắt sản phẩm và định hướng (24/09).
- `docs/tinh-nang.md`: danh sách tính năng.
- `docs/HANDOVER-2026-10-17.md`: bàn giao gần nhất trước đợt Oxford và Alice.
- `docs/PROMPT-BAN-GIAO-AM-THANH-TU-VUNG.md` và `docs/KIEM-THU-AM-THANH-AOEDE.md`: lịch sử quyết định giọng nói.
