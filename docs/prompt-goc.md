PROMPT: Xây dựng app học
Reading tiếng Anh / IELTS (bản
v2)
Dán toàn bộ nội dung dưới đây vào Claude Code. Nhớ
đính kèm 5 ảnh tham chiếu giao diện.
Bạn là senior full-stack engineer kiêm product
designer. Hãy giúp tôi xây dựng app học Reading tiếng
Anh / luyện IELTS, dùng cho cá nhân tôi, chạy trên cả
web và mobile từ một codebase.
Stack bắt buộc
Expo (SDK mới nhất) + expo-router, TypeScript
strict — build iOS, Android, Web
Supabase: Postgres + Auth + Storage
Claude API (claude-sonnet-4-6) cho tính năng
AI trong app
API tương thích OpenAI (cấu hình bên dưới) cho
việc sinh icon / hình minh hoạ
ts-fsrs cho spaced repetition

NativeWind styling, Zustand state, TanStack
Query data fetching
Recharts (web) / victory-native (mobile) cho biểu
đồ
Cấu hình API — KHÔNG hardcode key
Tạo ﬁle .env.local (thêm vào .gitignore) với các
biến:
EXPO_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_KEY=
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
OPENAI_BASE_URL=https://codex.hungnguyen.co
des/v1
Endpoint OpenAI là proxy tự host, tương thích chuẩn
OpenAI. Dùng SDK openai và truyền baseURL:
process.env.OPENAI_BASE_URL. Dùng nó cho: sinh
icon bộ, sinh ảnh thumbnail cho từng bài đọc theo chủ
đề, và hỏi ý kiến bố cục khi dựng UI. Toàn bộ lời gọi có
key phải chạy server-side (Supabase Edge Function
hoặc API route), không để lộ key xuống client.
Hệ thiết kế — bám theo 5 ảnh tham
chiếu đính kèm
Đọc kỹ ảnh và tái hiện đúng ngôn ngữ thiết kế đó:

Màu & nền
Nền app xám rất nhạt (#F7F8FC), card trắng, bo
góc 14–16px, đổ bóng rất nhẹ
Primary xanh dương (#2563EB), accent tím
(#7C3AED); banner dùng gradient xanh →  tím
Màu trạng thái: xanh lá = đúng, đỏ san hô = sai,
cam = độ khó trung bình
Icon trong stat card đặt trong hình tròn nền pastel
nhạt cùng tông
Layout
Web: sidebar trái cố định (Dashboard, Practice,
Library, Vocabulary, Progress, Mock Tests, Notes,
Bookmarks, Settings) + top nav ngang; đáy sidebar
là card "Upgrade" — ở bản cá nhân đổi thành card
streak/động viên
Mobile: sidebar thu thành bottom tab 5 mục chính,
phần còn lại vào tab "More"
Hàng stat card 4 ô ở đầu mỗi trang chính
Banner hero có illustration 3D phong cách sách
vở/bàn học
Typography: Inter hoặc Plus Jakarta Sans. Tiêu đề
trang 28–32px bold, tiêu đề card 16px semibold, body
14–15px, nhãn phụ 12px xám.
Icon & ảnh cần sinh qua OpenAI API

Bộ icon line-style bo tròn, nét đều, cho toàn bộ
mục navigation và loại câu hỏi
Thumbnail cho mỗi bài đọc theo chủ đề (rạn san
hô, sông băng, thành phố xanh, di tích, AI...) —
phong cách ảnh thực, tông màu trầm hài hoà với
UI
3–4 illustration 3D cho banner các trang chính
Lưu tất cả vào Supabase Storage, cache lại, không
sinh lại mỗi lần render
Kiến trúc dữ liệu
Schema Postgres đầy đủ + ﬁle migration SQL:
articles — title, source_name, source_url, topic,
cefr_level, band_range, word_count, est_minutes,
body_text (nullable), summary, thumbnail_url,
license_type, published_at
topics — Environment, Technology, Education,
Health, Science, Business, Society, Culture, History,
Psychology
article_progress — article_id,
percent_completed, last_position
vocab_entries — word, lemma,
deﬁnition_context, deﬁnition_general, deﬁnition_vi,
phonetic, part_of_speech, example_sentence,
source_sentence, article_id, mastery_percent

fsrs_cards — vocab_id, due, stability, diﬃculty,
reps, lapses, state, last_review
word_status — lemma, status (new / learning /
familiar / known / ignored), times_seen
question_sets / questions — type, prompt,
options (jsonb), correct_answer, evidence_text,
evidence_paragraph_index, explanation, lesson_tip
attempts — question_id, user_answer, is_correct,
time_spent_ms
test_sessions — article_id, raw_score, total,
estimated_band, duration_ms, accuracy
highlights — article_id, text, paragraph_index,
color, note, is_evidence_for_question_id
chat_messages — article_id, role, content
reading_sessions — article_id, wpm,
duration_ms
notes, bookmarks, daily_goals, streaks
Nguồn nội dung — đọc kỹ, quan trọng
Loại A — được lưu toàn văn (public domain / Creative
Commons). Viết ingest pipeline lưu full text:
VOA Learning English, Wikipedia & Simple Wikipedia
(REST API, CC BY-SA, lưu kèm attribution), NASA, NIH,
WHO, CDC, EU Open Data, PLOS ONE, arXiv abstracts,
ScienceDaily press releases, Project Gutenberg.

Loại B — báo có bản quyền (BBC, The Economist,
Guardian, Reuters, NYT): KHÔNG lưu toàn văn, không
bypass paywall. Chỉ đọc RSS công khai, lưu tiêu đề +
mô tả sẵn có trong feed + thumbnail + link gốc + ngày.
Hiển thị dạng card, bấm vào mở link gốc bằng expo-
web-browser. Đặt license_type='headline_only',
body_text=null.
Tính năng AI chỉ chạy trên bài Loại A hoặc văn bản do
tôi tự dán vào.
Tính năng
1. Dashboard (xem ảnh 4)
4 stat card: Daily Goal (phút/ngày, progress bar),
Estimated Band Score kèm mức tăng, Practice Streak,
Total Practice Time tuần này. Bên dưới: card
"Recommended Passage" có thumbnail, khối
"Question Types" hiển thị % đúng theo từng dạng, biểu
đồ cột "Weekly Progress" (thời gian + số câu). Cuối
trang: "Featured Practice" — hàng card bài đọc kèm
badge ACADEMIC / GENERAL TRAINING và progress
bar.
2. Màn hình đọc + luyện đề (xem ảnh 2)
Bố cục 2 cột: bài đọc trái, câu hỏi phải. Mobile
chuyển thành tab hoặc bottom sheet kéo lên.

Header: badge độ khó, thời gian ước tính, tiến độ
câu (12/40), đồng hồ đếm ngược có nút pause
Đoạn văn đánh số rõ ràng
Thanh công cụ dưới bài: nút Highlight với 5 màu
(vàng, xanh lá, xanh dương, tím, hồng), nút Notes,
chỉnh cỡ chữ A− / A / A+
Panel câu hỏi: lưới số câu để nhảy nhanh, tab lọc
theo dạng (Matching Headings, True/False/Not
Given, Multiple Choice, Sentence Completion), nút
Clear Answer, Mark for Review, Notes, Submit
Answers
Chạm vào từ →  bottom sheet: IPA, từ loại, nghĩa
theo đúng ngữ cảnh câu đó, nghĩa tiếng Việt, 2 ví
dụ, nút Lưu
Bôi kéo cả cụm từ →  dịch cả cụm (collocation
quan trọng hơn từ lẻ ở band 7+)
Bôi đen câu →  "Giải thích câu này": cấu trúc ngữ
pháp + dịch
Từ đã lưu ở bài trước được tô nhạt sẵn khi gặp lại
Text-to-speech đọc bài, chỉnh tốc độ 0.75–2x,
highlight câu đang đọc
Đếm WPM
3. Test Review (xem ảnh 1) — phần quan trọng
nhất
Đầu trang: vòng tròn điểm (32/40), Correct
Answers, Accuracy %, Estimated Band kèm mức

tăng, Time Used + trung bình mỗi câu
Nút Retry Mistakes (n) và Review Vocabulary
Danh sách câu hỏi lọc theo All / Correct / Incorrect
và theo dạng câu
Mỗi câu: badge dạng câu, câu hỏi, đáp án của tôi
vs đáp án đúng, trạng thái, accordion Explanation
trong đó highlight đúng cụm chữ trong bài chứa
đáp án, cộng một dòng LESSON rút ra bài học
chung (ví dụ: "'Can be seen' nghĩa là nhìn thấy
được, không phải không nhìn thấy")
Nút "Why this is correct" gọi Claude giải thích sâu
hơn theo yêu cầu
Panel phải: toàn văn passage với highlight màu
theo từng câu evidence, có chú giải "Q1 evidence /
Q2 evidence" và nút Clear all highlights
4. Progress (xem ảnh 3)
Banner có Goals: target band, % on track, ngày dự
kiến đạt
Bộ lọc 7 / 30 / 90 ngày
5 stat card: Current Band Estimate, Weekly Study
Time (kèm mini bar chart), Reading Speed (wpm),
Accuracy, Current Streak (7 chấm tròn theo thứ
trong tuần)
Band Score Progress: line chart theo thời gian, ghi
Initial Band vs Best Band

Performance by Question Type: thanh ngang từng
dạng câu kèm % và mũi tên tăng/giảm — đây là
thứ chỉ ra tôi nên luyện gì tiếp
Study Time Distribution: donut chia Practice /
Mock Tests / Review / Reading Library
Weekly Practice Calendar: heatmap kiểu GitHub +
"Best Day" và "Most Active Week"
Bảng Recent Mock Test Performance
Thêm: nút "Luyện dạng yếu nhất" — tự sinh bộ bài
tập riêng cho dạng câu có % thấp nhất
5. Library + Vocabulary (xem ảnh 5)
Banner có 3 số: số bài có sẵn, số từ đã lưu, số từ
đến hạn ôn hôm nay
Ô tìm kiếm chung cho bài đọc, chủ đề và từ vựng
Bộ lọc: All / Academic / General Training /
Diﬃculty / Topic, sắp xếp, chuyển grid ↔  list
Card bài đọc: thumbnail, badge, thời gian, số câu
hỏi, band range (Band 6–8), progress bar % hoàn
thành
Panel "My Vocabulary": mỗi từ có nghĩa, từ loại, nút
phát âm, câu ví dụ có tô đậm chính từ đó, thanh
Mastery %, nút Flashcards và Review
Dòng "Smart Review" dưới cùng: số từ đến hạn
hôm nay + nút Start Review
6. Sổ từ & Flashcard

Mỗi từ lưu kèm nguyên câu gốc nơi gặp — bắt
buộc
FSRS với 4 nút Again / Hard / Good / Easy
Kiểu thẻ xen kẽ: từ → nghĩa, nghĩa → từ, cloze
deletion điền từ vào câu gốc, và trắc nghiệm 4 đáp
án
Trạng thái từ 5 mức (new / learning / familiar /
known / ignored), tô màu khác nhau trong bài đọc
Mở bài mới hiện luôn: "bài này có 12% từ bạn chưa
biết"
7. Chatbox hỗ trợ
Nút chat nổi trong màn đọc, mở panel trượt lên
Toàn văn bài đọc đưa vào system prompt
Trợ giảng IELTS, trả lời tiếng Việt, luôn trích dẫn
đoạn số mấy trong bài
Prompt gợi ý sẵn: Tóm tắt bài, Ý chính từng đoạn,
Từ vựng band 7+ trong bài, Tạo 5 câu hỏi
Custom prompt do tôi tự tạo và lưu lại để tái sử
dụng cho mọi bài
Lưu lịch sử theo article_id, streaming response
8. Sinh đề & bài đọc bằng AI
Từ bài Loại A bất kỳ, gọi Claude sinh bộ đề đúng
format IELTS. Yêu cầu trả JSON thuần, không
markdown fence. Các dạng: True/False/Not Given,

Yes/No/Not Given, Matching Headings, Matching
Information, Multiple Choice, Sentence
Completion, Summary Completion, Short Answer.
Mỗi câu bắt buộc có evidence_text,
evidence_paragraph_index, explanation,
lesson_tip
Bản đơn giản hoá: sinh phiên bản dễ hơn của bài
khó (C1 →  B1) để đọc trước rồi đọc bản gốc
Chấm CEFR tự động bằng Flesch-Kincaid + tần
suất từ hiếm, quy ra band range
Nút "Dán văn bản của tôi": paste text bất kỳ →
dùng được toàn bộ tính năng
Thứ tự thực hiện
Làm tuần tự, chạy được ở mỗi bước, hỏi tôi trước khi
sang bước sau:
1. Khởi tạo Expo + Supabase + schema + migration +
design tokens và bộ component nền (Card,
StatCard, Badge, Button, ProgressBar) khớp ảnh
tham chiếu
2. Sinh bộ icon và illustration qua OpenAI API, lưu
Supabase Storage
3. Ingest pipeline (Loại A full text, Loại B RSS) + chấm
CEFR
4. Library + màn hình đọc + tra từ ngữ cảnh +
highlight

5. Sổ từ + FSRS + ﬂashcard
6. Sinh đề + chế độ thi có bấm giờ + Test Review kèm
evidence
7. Chatbox
8. Dashboard + Progress với đầy đủ biểu đồ
Giải thích ngắn gọn bằng tiếng Việt ở mỗi bước. Tách
toàn bộ lời gọi AI vào services/ai/ với prompt
template riêng từng tính năng, có retry và xử lý lỗi.
Bắt đầu từ bước 1.