# Bàn giao cho Codex — Band 9 (readup-ielts)

Ngày bàn giao: 02/10/2026. Từ đây Codex làm tiếp. Repo: `D:\Claude\readup-ielts` (Expo SDK 57 web, expo-router, react-native-web, Zustand + Supabase, deploy Vercel). **Đọc `AGENTS.md` trước**: Expo đã đổi, đọc docs v57 trước khi viết code.

## 1. Việc đang dở: chủ đề "Lịch sử Việt Nam song ngữ"

Brief gốc: `C:\Users\admin\.claude\uploads\6b6dbe6c-fc23-4061-ad64-417daf6d470c\941cc56d-Band9_Prompt_Claude_Lich_su_Viet_Nam.md` (một chủ đề, 12 cảnh, đoạn Việt–Anh ghép cặp, thuyết minh tiếng Anh từng cảnh, ảnh pixel, nguồn + bảng đối chiếu, cổng xuất bản).

**Đã xong và đã commit** (commit `6974c9e`, chưa deploy, chưa push GitHub):
- 12 cảnh `s01…s12`, 53 khẳng định, 33 nguồn đã mở đọc, mức đối chiếu `verified` / `single-source` (không có `disputed`/`unverified`).
- 12 ảnh pixel đã duyệt: `public/history/vn-khang-chien-chong-phap/images/sNN.webp`.
- Giao diện: `app/history/index.tsx`, `app/history/[topic].tsx`, `src/components/history/*`, `src/store/useHistoryStore.ts` (khoá sync `history`), thẻ trang chủ, liên kết từ bản đồ Du ngoạn (`topic.json` → `mapLinks`, hướng dẫn ở `app/quest/du-ngoan/guide/[poi].tsx`).
- **Điện thoại không hiện ảnh** (yêu cầu của chủ dự án 02/10): ảnh chỉ hiện ở màn rộng (`wide`), cả thẻ trang chủ lẫn trang chủ đề.
- `tsc` sạch, `npm test` 4736/4736.

**CHƯA xong — việc kế tiếp, theo thứ tự:**
1. **Thuyết minh tiếng Anh (chặn xuất bản).** Cảnh chỉ hiện với người dùng khi có ảnh + audio + mọi khẳng định ổn (`src/services/history/gating.ts`). Hiện chưa có file mp3 nào nên cả mục đang ẩn (trang `/history/...` hiện "Sắp ra mắt"; xem bản dev bằng `?dev=1`).
   - Tạo: `D:/khkt-venv-lap/Scripts/python.exe scripts/history/make_narration.py vn-khang-chien-chong-phap s01,s02,s03,s04` (rồi `s05..s08`, `s09..s12`). Mỗi nhóm 4 cảnh = 1 lượt Gemini TTS (`gemini-3.1-flash-tts-preview`, giọng Kore). Script đọc đúng văn bản đã chốt, gọi TTS một lần, cắt theo cảnh bằng Whisper (mốc từng chữ), ghi mốc câu THẬT vào `<id>.sentences.json`. **Chưa chạy lần nào, cần chạy thử và nghe lại**; nếu độ khớp Whisper < 85% thì script tự bỏ mốc câu (player chỉ tô sáng cấp cảnh).
   - Hạn mức: 10 lượt/ngày/mô hình (tính theo giờ Thái Bình Dương, reset ≈ 14:00 giờ VN). Hôm nay (02/10) đã dùng hết 10/10 của khoá cũ. Tác vụ Windows `Band9-DailyVoiceAudio` (15:30 mỗi ngày) đã được thêm bước (0) chạy 3 nhóm thuyết minh này trước Listening/âm từ, rồi tự gọi `build_content.py`. Chủ dự án vừa đưa một khoá Gemini mới; **khoá nằm trong chat, CHƯA lưu vào đâu** — hỏi chủ dự án nếu muốn dùng, lưu vào `D:\Claude\.secrets\google-api-2.key` và thêm cờ `--key-file` cho `make_narration.py` (hiện script chỉ đọc `D:\Claude\.secrets\google-api.key`). Không dán khoá vào code hay chat.
   - Sau khi có mp3: `python scripts/history/build_content.py` (dựng lại JSON; cảnh nào đủ ảnh+audio+khẳng định thì tự thành `published`), rồi `npm test`. Kiểm bằng trình duyệt: thẻ trang chủ → trang chủ đề → phát tiếng → đổi cảnh → tra từ → từ bản đồ Du ngoạn. Nghe thử từng cảnh xem có cắt nhầm ranh giới không.
2. **Deploy** (xem mục 3) rồi push GitHub (`quannguyen991/readup-ielts`).
3. **Nâng mức đối chiếu** (tuỳ chọn, trước khi tuyên bố chắc chắn): các ý còn `single-source` — đặc biệt cảnh 11 "Tuyên bố cuối cùng không được các đoàn ký" (chỉ có nguồn thứ cấp, nên tìm FRUS/học thuật) và cảnh 10 "Pháp tiếp tế chủ yếu bằng đường không" (chưa trích nguồn riêng). Danh sách đầy đủ ở mục `openIssues` của từng cảnh trong `scripts/history/content/scenes_*.py`.
4. Cảnh 12 chưa có phần tái thiết Hà Nội (chưa có nguồn chi tiết đã đọc) — bổ sung sau nếu muốn.

### Cấu trúc & cách sửa nội dung
- **Nguồn soạn tay (sửa ở đây, không sửa JSON):** `scripts/history/content/scenes_01_04.py`, `scenes_05_08.py`, `scenes_09_12.py`, `sources_catalog.py`. Mỗi khẳng định có `status`, `independentSources`, `notes`, và nguồn kèm vị trí trích.
- **Dựng dữ liệu:** `python scripts/history/build_content.py` → ghi `src/data/history/vn-khang-chien-chong-phap/{topic,scenes,sources,claims,images,audio}.json`; ảnh lấy từ `tmp-art/hist_sNN__0.png` (gitignore, nếu mất thì ảnh `.webp` đã nằm trong `public/history/…`).
- **Hợp đồng dữ liệu & luật:** `src/services/history/types.ts` (đọc kỹ), `gating.ts`, `validate.test.ts`. Quy tắc: `audio.json.textSha256` = SHA-256 văn bản các đoạn EN nối bằng dòng trống — **sửa chữ sau khi có audio là test đỏ**, phải dựng lại audio. `verified` cần ≥ 2 nguồn độc lập; `single-source` đúng 1; `disputed`/`unverified` chặn xuất bản. Mốc câu phải do đo thật.
- **Công cụ đối chiếu nguồn:** `scripts/history/grep_src.py <url> "<regex>"` (tải + lưu đệm + in ngữ cảnh), `verify_claims.py` (máy kiểm thô, không thay việc đọc nguồn).
- **Ảnh:** tạo bằng ChatGPT (không xác định được model — `createdWith` đã ghi đúng như vậy). Quy tắc ảnh: pixel thật, 16:9, không chữ/cờ/biểu ngữ, không đồ hiện đại, người vô danh; không dùng AI vẽ bản đồ/sơ đồ; chú thích cố định "Minh họa pixel tái dựng, không phải ảnh tư liệu". Quy trình cũ: nhớ ghi chú `readup-anh-pixel-tu-chatgpt-plus` trong bộ nhớ của Claude (mô tả: ChatGPT Plus, tự động hoá bằng trình duyệt; chat dài thì treo → mỗi lô một chat mới).
- **Không được tuyên bố** có chuyên gia sử học thẩm định (dòng miễn trừ ở `HISTORY_DISCLAIMER`); không nói "Luna 6" hay model nào chưa xác nhận.
- Lưu ý nội dung: không nói Việt Nam thống nhất năm 1954; phân biệt ngày ký hiệp định (20/7/1954), ngày có hiệu lực (24 giờ 22/7/1954, giờ Giơnevơ), ngày Tuyên bố cuối cùng (21/7/1954, không ký). Giờ giấc/tên nhà máy điện/ngày kết thúc chiến dịch Biên giới/số dân công **cố ý không nêu** vì các nguồn lệch nhau hoặc cùng một gốc.

## 2. Các việc khác còn tồn
- **Listening `band9-t1`:** chỉ section 1 có audio; section 2–4 chờ hạn mức TTS (đã nằm trong `scripts/listening/pending.json`, tác vụ hằng ngày tự làm). Sau khi có audio còn phải chạy `scripts/listening/build_test.py` và đăng ký đề vào chỉ mục.
- **Migration SQL chưa chạy:** `20261002000100_ielts_reading_full_types.sql` — chủ dự án tự chạy trên Supabase (gói free, không có CLI tự động).
- Thư mục worktree deploy `readup-deploy*` đôi khi không xoá được ("Permission denied") — dọn tay.
- Bản đồ Du ngoạn: chưa thêm POI mới cho lịch sử (chỉ gắn vào POI sẵn có); nếu thêm POI thì cần sprite mới trên từng bản đồ.

## 3. Quy trình bắt buộc
- **Chạy test:** `npm test` (tsx --test, phải xanh) và `npx tsc --noEmit`. Đừng dùng `npx jest`.
- **Chạy web:** preview `readup-web` trong `.claude/launch.json` (cổng 8081). Popup "quà cuối tháng" hay chắn màn hình — bấm "Để sau".
- **Deploy lên Vercel:** `vercel` lấy cả thư mục làm việc. Nếu có việc dở của phiên khác trong cây làm việc thì **deploy từ một git worktree sạch** (build mất ~13 phút). Kiểm `git status` trước khi sửa file dùng chung; nhiều phiên có thể cùng làm trong thư mục này.
- **Không sửa source bằng PowerShell `Get-Content/Set-Content`** (làm hỏng UTF-8). Dùng công cụ sửa file hoặc Python. Heredoc Python nuốt dấu thoát (`\n` thành xuống dòng thật).
- **Ổ C đầy** thì build treo/ảnh trắng: kiểm `Get-PSDrive C`; cache npm/pip ở `D:\dev-cache`.
- **Khoá/credential:** không bao giờ để khoá API vào code frontend, vào repo hay vào chat/báo cáo. Khoá Gemini cũ ở `D:\Claude\.secrets\google-api.key`; khoá OpenAI/proxy ở `D:\Claude\.secrets`.
- **Báo cáo trung thực:** chỉ nói "đã chạy" khi thật sự chạy; tách rõ đã chạy / đã chuẩn bị / bị chặn.

## 4. Quy ước sản phẩm nên giữ
- Band 9 (trước là ReadUp), màu vàng kim; giao diện không giống khuôn TID; chữ phụ ngắn, không giải thích cơ chế.
- Nhân vật trong game nói **toàn tiếng Anh**; giọng đọc mọi phần nói là Gemini Kore/Fenrir.
- Số liệu cá nhân (band mục tiêu, tiến độ) phải thật; chưa đo thì hiện "—", cấm mặc định 7.0.
- Animation Reanimated: đừng dùng `entering=` trên web (làm trắng trang), dùng shared value.
- Cỡ chữ tối thiểu 14px ở app; ưu tiên tối ưu cho điện thoại (một tay, vùng chạm ≥ 44px).
- AI: ba cửa Groq → ai-box → codex; ai-box đã chuyển sang `qwen3.8-flash` (gửi `enable_thinking=false`); codex nuốt vai `system`. Đừng tiêu tiền API khi chưa kiểm số dư và hỏi lại.

## 5. Tệp nên đọc đầu tiên
1. `AGENTS.md`, rồi tệp này.
2. `src/services/history/types.ts`, `gating.ts`.
3. `scripts/history/make_narration.py`, `build_content.py`.
4. `scripts/listening/daily_audio.py` (tác vụ hằng ngày), `daily.log`, `quota-state.json`.
5. `git log --oneline -10` để xem phiên trước đã làm gì.
