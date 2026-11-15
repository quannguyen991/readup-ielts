# Đối chiếu 7 bộ từ vựng tiếng Anh với sách gốc

Ngày rà soát: 15/11/2026  
Danh sách trong app: `src/data/book-vocab.json`  
OCR tham chiếu: `.local-private/book-vocab-ocr/`

## Kết quả

| Bộ sách | Mục trong app | Khớp nguyên dạng / khác biệt dàn trang | Khớp dạng từ gốc | Chưa xác minh trong text |
|---|---:|---:|---:|---:|
| Erica’s Vocabulary: A New Approach | 203 | 198 | 0 | 5 |
| SAT Power Vocab (Princeton Review) | 232 | 232 | 0 | 0 |
| English Vocabulary in Use: Elementary | 665 | 665 | 0 | 0 |
| English Vocabulary in Use: Pre-intermediate | 1.308 | 1.305 | 2 | 1 |
| English Vocabulary in Use: Upper-intermediate | 1.463 | 1.454 | 8 | 1 |
| English Vocabulary in Use: Advanced | 949 | 949 | 0 | 0 |
| 1100 Words You Need to Know, 6th Edition | 1.181 | 1.176 | 0 | 5 |

“Khớp nguyên dạng” gồm từ tìm được trong PDF sau khi chuẩn hoá chữ hoa/thường, dấu câu, ngắt dòng và từ bị bẻ qua dòng. “Khớp dạng từ gốc” chỉ áp dụng khi sách có dạng gốc rõ ràng, chẳng hạn `fees` → `fee`. “Chưa xác minh” nghĩa là chưa tìm được từ đó trong text PDF/OCR; không tự xoá các mục này.

## Các mục cần phân biệt

- **Erica:** OCR xác nhận 198/203 mục. Chưa tìm thấy `take in`, `bet on`, `shed light on`, `appreciate`, `considerable`. PDF Erica là bản scan không có lớp text, nên 5 mục này được giữ như từ bổ sung chưa xác minh; OCR có thể bỏ sót chữ trong ảnh.
- **Pre-intermediate:** `fees` và `loans` được sách thể hiện ở dạng gốc `fee` và `loan`. `owed` chưa tìm thấy trong sách; giữ là mục bổ sung chưa xác minh.
- **Upper-intermediate:** 8 mục có dạng gốc tương ứng trong PDF: `plots` → `plot`, `hips` → `hip`, `cells` → `cell`, `ruled` → `rule`, `heads` → `head`, `debts` → `debt`, `glows` → `glow`, `mice` → `mouse`. `lord` chỉ được tìm thấy bên trong `landlord`, nên không tính là khớp; giữ như mục bổ sung.
- **1100 Words:** 1.138 mục lõi trong app khớp chính xác với danh sách cấu trúc OCR của sách (950 headwords và 188 idioms; không thiếu, không thừa). Topic map đã tách 43 từ bổ sung của app thành “Additional vocabulary”. Năm mục `verse`, `stem`, `dam`, `align`, `fuse` không xuất hiện trong text sách và đều thuộc nhóm bổ sung này.

## Về con số 132 của Upper-intermediate

Không tái hiện được 132 mục chưa khớp trên dữ liệu hiện tại. Đối chiếu lại toàn bộ PDF cho kết quả: 1.454 mục khớp nguyên dạng hoặc khác biệt do dàn trang, 8 mục có dạng từ gốc tương ứng, và 1 mục (`lord`) là từ bổ sung chứ không được xác nhận trong sách. Vì vậy, danh sách hiện tại có 1 mục chưa xác minh, không phải 132. Con số cũ có thể đến từ một bản dữ liệu hoặc cách so khớp trước đó; cần đúng snapshot cũ mới xác định được nguồn chênh lệch.

## Kiểm tra lại số 1100 Words

Trong working copy này và tại `HEAD`, `src/data/book-vocab.json` đều có **1.181 mục** cho `book-1100-words`. Con số **529** nằm trong trường `oldAppEntries` của `.local-private/book-vocab-ocr/1100-import-report.json`, tức số mục của app trước lần nhập dữ liệu đó, không phải tổng hiện tại. Báo cáo nhập ghi 1.138 mục lõi từ sách và 43 mục bổ sung; 1.138 + 43 = 1.181. Trong 43 mục bổ sung, 38 tìm thấy trong text PDF và 5 (`verse`, `stem`, `dam`, `align`, `fuse`) chưa xác minh.

## Nhóm chủ đề và buổi học

Đã thay cách chia theo lát cắt chỉ mục bằng nhóm dựa trên cấu trúc nguồn: Index/unit của Cambridge, phần/chương của Erica và SAT Power Vocab, mục lục phần của Advanced, và tuần học của 1100 Words. Các unit liên quan được gom thành chủ đề rộng hơn để dễ học; nếu một chủ đề trên 50 từ, app tự tách thành nhiều buổi liên tiếp, mỗi buổi tối đa 50 từ.

| Bộ sách | Chủ đề | Buổi học | Chủ đề nhiều từ nhất | Tối đa mỗi buổi |
|---|---:|---:|---:|---:|
| Erica | 6 | 8 | 62 | 50 |
| SAT Power Vocab | 3 | 5 | 97 | 50 |
| Elementary | 8 | 17 | 135 | 50 |
| Pre-intermediate | 17 | 34 | 136 | 50 |
| Upper-intermediate | 20 | 38 | 143 | 50 |
| Advanced | 15 | 26 | 108 | 50 |
| 1100 Words | 49 | 49 | 43 | 43 |

### Danh sách chủ đề và số từ theo từng buổi

#### Erica’s Vocabulary · A New Approach

- **Vocabulary in context / Từ vựng trong ngữ cảnh** — 50 từ (50).
- **Passage-based vocabulary / Từ vựng trong đoạn đọc** — 57 từ (50 + 7).
- **Commonly confused words / Các từ thường dễ nhầm** — 62 từ (50 + 12).
- **Transitions & phrases / Từ nối và cụm diễn đạt** — 8 từ (8).
- **Key essay vocabulary / Từ vựng trọng tâm cho bài luận** — 21 từ (21).
- **Supplemental · OCR review / Từ bổ sung · cần kiểm tra OCR** — 5 từ (5).

#### SAT Power Vocab · The Princeton Review

- **Roots & etymology / Gốc từ và từ nguyên** — 97 từ (50 + 47).
- **Mnemonics & word associations / Mẹo ghi nhớ và liên tưởng từ** — 94 từ (50 + 44).
- **Practice & vocabulary in context / Luyện tập và từ vựng trong ngữ cảnh** — 41 từ (41).

#### English Vocabulary in Use · Elementary

- **People, relationships & feelings / Con người, quan hệ và cảm xúc** — 135 từ (50 + 50 + 35).
- **Food & home / Đồ ăn và nhà cửa** — 68 từ (50 + 18).
- **Work, study & communication / Công việc, học tập và giao tiếp** — 68 từ (50 + 18).
- **Travel, shopping & leisure / Du lịch, mua sắm và giải trí** — 93 từ (50 + 43).
- **Countries, weather & local places / Quốc gia, thời tiết và địa điểm quanh ta** — 89 từ (50 + 39).
- **Travel, media & social issues / Du lịch, truyền thông và vấn đề xã hội** — 62 từ (50 + 12).
- **Everyday verbs, movement & conversation / Động từ, vận động và giao tiếp hằng ngày** — 42 từ (42).
- **Time, places & word building / Thời gian, địa điểm và cấu tạo từ** — 108 từ (50 + 50 + 8).

#### English Vocabulary in Use · Pre-intermediate

- **Learning English & vocabulary tools / Học tiếng Anh và công cụ từ vựng** — 92 từ (50 + 42).
- **Countries, nature & weather / Quốc gia, thiên nhiên và thời tiết** — 94 từ (50 + 44).
- **People, body & relationships / Con người, cơ thể và các mối quan hệ** — 126 từ (50 + 50 + 26).
- **Daily life, home & health / Đời sống, nhà cửa và sức khỏe** — 82 từ (50 + 32).
- **Clothes, shopping & food / Quần áo, mua sắm và đồ ăn** — 68 từ (50 + 18).
- **Cities, countryside & transport / Thành phố, nông thôn và giao thông** — 67 từ (50 + 17).
- **School & education / Trường học và giáo dục** — 73 từ (50 + 23).
- **Jobs, careers & business / Việc làm, sự nghiệp và kinh doanh** — 116 từ (50 + 50 + 16).
- **Sport, culture & travel / Thể thao, văn hóa và du lịch** — 136 từ (50 + 50 + 36).
- **Media, communication & technology / Truyền thông, giao tiếp và công nghệ** — 77 từ (50 + 27).
- **Crime, politics & global issues / Tội phạm, chính trị và vấn đề toàn cầu** — 63 từ (50 + 13).
- **Time, numbers & objects / Thời gian, con số và đồ vật** — 68 từ (50 + 18).
- **Conversation, opinions & attitudes / Giao tiếp, quan điểm và thái độ** — 36 từ (36).
- **Word building & fixed phrases / Cấu tạo từ và cụm cố định** — 85 từ (50 + 35).
- **Senses, grammar & everyday expressions / Giác quan, ngữ pháp và cách diễn đạt** — 90 từ (50 + 40).
- **Writing, forms & messages / Viết, biểu mẫu và tin nhắn** — 34 từ (34).
- **Supplemental · not indexed / Từ bổ sung · không có trong mục lục** — 1 từ (1).

#### English Vocabulary in Use · Upper-intermediate

- **Learning vocabulary & reference skills / Học từ vựng và kỹ năng tra cứu** — 67 từ (50 + 17).
- **Countries & weather / Quốc gia và thời tiết** — 40 từ (40).
- **People & relationships / Con người và các mối quan hệ** — 72 từ (50 + 22).
- **Home & everyday problems / Nhà cửa và vấn đề thường ngày** — 39 từ (39).
- **Global problems / Vấn đề toàn cầu** — 30 từ (30).
- **Education, work & business / Giáo dục, công việc và kinh doanh** — 76 từ (50 + 26).
- **Sport, arts & entertainment / Thể thao, nghệ thuật và giải trí** — 80 từ (50 + 30).
- **Food, places & the natural world / Đồ ăn, địa lý và thế giới tự nhiên** — 102 từ (50 + 50 + 2).
- **Clothes, health & lifestyle / Quần áo, sức khỏe và lối sống** — 93 từ (50 + 43).
- **Travel, technology & communication / Du lịch, công nghệ và giao tiếp** — 100 từ (50 + 50).
- **Media, public life & money / Truyền thông, đời sống công cộng và tiền bạc** — 93 từ (50 + 43).
- **Objects, feelings & communication / Đồ vật, cảm xúc và giao tiếp** — 109 từ (50 + 50 + 9).
- **Numbers, time & description / Số lượng, thời gian và miêu tả** — 143 từ (50 + 50 + 43).
- **Linking ideas & discourse / Liên kết ý và diễn ngôn** — 79 từ (50 + 29).
- **Roots, affixes & abstract nouns / Gốc từ, phụ tố và danh từ trừu tượng** — 91 từ (50 + 41).
- **Compounds, word combinations & abbreviations / Từ ghép, kết hợp từ và chữ viết tắt** — 24 từ (24).
- **Pronunciation & similar-sounding words / Phát âm và các từ có âm giống nhau** — 73 từ (50 + 23).
- **Countability & collective nouns / Danh từ đếm được và danh từ tập hợp** — 73 từ (50 + 23).
- **Phrasal expressions, register & English varieties / Cụm từ, văn phong và biến thể tiếng Anh** — 78 từ (50 + 28).
- **Supplemental · not indexed / Từ bổ sung · không có trong mục lục** — 1 từ (1).

#### English Vocabulary in Use · Advanced

- **Work and study / Công việc và học tập** — 107 từ (50 + 50 + 7).
- **People and relationships / Con người và các mối quan hệ** — 60 từ (50 + 10).
- **Leisure and lifestyle / Giải trí và lối sống** — 73 từ (50 + 23).
- **Travel / Du lịch** — 22 từ (22).
- **The environment / Môi trường** — 97 từ (50 + 47).
- **Public services, beliefs & cultural history / Dịch vụ công, niềm tin và lịch sử văn hóa** — 84 từ (50 + 34).
- **Poverty, politics & global affairs / Nghèo đói, chính trị và các vấn đề toàn cầu** — 78 từ (50 + 28).
- **The media / Truyền thông** — 28 từ (28).
- **Health / Sức khỏe** — 41 từ (41).
- **Technology / Công nghệ** — 34 từ (34).
- **Basic concepts / Khái niệm cơ bản** — 108 từ (50 + 50 + 8).
- **Functional vocabulary / Từ vựng chức năng** — 77 từ (50 + 27).
- **Words and meanings / Từ và nghĩa** — 68 từ (50 + 18).
- **Fixed expressions and figurative language / Cụm cố định và ngôn ngữ hình tượng** — 34 từ (34).
- **Language variation / Biến thể ngôn ngữ** — 38 từ (38).

#### 1100 Words You Need to Know

- **Week 1 / Tuần 1** — 24 từ (24).
- **Week 2 / Tuần 2** — 24 từ (24).
- **Week 3 / Tuần 3** — 24 từ (24).
- **Week 4 / Tuần 4** — 24 từ (24).
- **Week 5 / Tuần 5** — 24 từ (24).
- **Week 6 / Tuần 6** — 24 từ (24).
- **Week 7 / Tuần 7** — 24 từ (24).
- **Week 8 / Tuần 8** — 24 từ (24).
- **Week 9 / Tuần 9** — 24 từ (24).
- **Week 10 / Tuần 10** — 24 từ (24).
- **Week 11 / Tuần 11** — 24 từ (24).
- **Week 12 / Tuần 12** — 24 từ (24).
- **Week 13 / Tuần 13** — 24 từ (24).
- **Week 14 / Tuần 14** — 24 từ (24).
- **Week 15 / Tuần 15** — 24 từ (24).
- **Week 16 / Tuần 16** — 24 từ (24).
- **Week 17 / Tuần 17** — 24 từ (24).
- **Week 18 / Tuần 18** — 24 từ (24).
- **Week 19 / Tuần 19** — 24 từ (24).
- **Week 20 / Tuần 20** — 24 từ (24).
- **Week 21 / Tuần 21** — 24 từ (24).
- **Week 22 / Tuần 22** — 23 từ (23).
- **Week 23 / Tuần 23** — 24 từ (24).
- **Week 24 / Tuần 24** — 23 từ (23).
- **Week 25 / Tuần 25** — 24 từ (24).
- **Week 26 / Tuần 26** — 24 từ (24).
- **Week 27 / Tuần 27** — 23 từ (23).
- **Week 28 / Tuần 28** — 23 từ (23).
- **Week 29 / Tuần 29** — 24 từ (24).
- **Week 30 / Tuần 30** — 24 từ (24).
- **Week 31 / Tuần 31** — 24 từ (24).
- **Week 32 / Tuần 32** — 22 từ (22).
- **Week 33 / Tuần 33** — 24 từ (24).
- **Week 34 / Tuần 34** — 24 từ (24).
- **Week 35 / Tuần 35** — 23 từ (23).
- **Week 36 / Tuần 36** — 24 từ (24).
- **Week 37 / Tuần 37** — 24 từ (24).
- **Week 38 / Tuần 38** — 23 từ (23).
- **Week 39 / Tuần 39** — 24 từ (24).
- **Week 40 / Tuần 40** — 23 từ (23).
- **Week 41 / Tuần 41** — 23 từ (23).
- **Week 42 / Tuần 42** — 23 từ (23).
- **Week 43 / Tuần 43** — 24 từ (24).
- **Week 44 / Tuần 44** — 22 từ (22).
- **Week 45 / Tuần 45** — 24 từ (24).
- **Week 46 / Tuần 46** — 23 từ (23).
- **Bonus Week A / Tuần bổ sung A** — 24 từ (24).
- **Bonus Week B / Tuần bổ sung B** — 24 từ (24).
- **Additional vocabulary / Từ vựng bổ sung** — 43 từ (43).

Các mục chưa xác minh đã nằm trong nhóm riêng để không gộp nhầm vào từ được sách xác nhận: 5 mục OCR cần rà của Erica; `owed` ở Pre-intermediate; `lord` ở Upper-intermediate. 1100 Words giữ 43 mục ngoài danh sách lõi trong chủ đề “Từ vựng bổ sung”. Mỗi từ thuộc đúng một chủ đề; kiểm tra các khoảng chỉ mục xác nhận đủ toàn bộ 6.001 mục, không trùng và không bỏ sót.

Các chủ đề lớn được tách thành buổi, ví dụ Elementary có “Con người, quan hệ và cảm xúc” (135 từ) thành 3 buổi; Upper-intermediate có “Gốc từ, phụ tố và danh từ trừu tượng” (143 từ) thành 3 buổi; nhóm “Cấu tạo từ” cũ đã được tách thành bốn chủ đề nhỏ theo unit gốc. Advanced có “Dịch vụ công, niềm tin và lịch sử văn hóa” (84 từ) và “Nghèo đói, chính trị và các vấn đề toàn cầu” (78 từ), tách từ một phần nguồn quá rộng. Các chủ đề hiện đều tối đa 143 từ, tương đương không quá 3 buổi. 1100 Words được giữ theo tuần gốc (thường 22–24 từ/tuần), cộng hai tuần bổ sung và một chủ đề 43 từ ngoài danh sách lõi.

## Bìa sách

Đã thay bìa vẽ bằng code cho 7 bộ này bằng ảnh trang đầu trích từ PDF nguồn. Trang đầu của Erica là trang tiêu đề trong bản scan, được dùng làm ảnh đại diện sẵn có.

## Phạm vi và giới hạn

- Sáu PDF có text trích xuất được được đối chiếu trực tiếp với nội dung PDF; OCR được dùng để kiểm tra bổ sung.
- Riêng Erica, PDF là bản scan nên phải dựa vào OCR có sẵn.
- Đây là kiểm tra từ có xuất hiện trong nội dung sách, không khẳng định mọi từ xuất hiện đều là headword chính thức của sách. Các từ bổ sung được giữ tách biệt về mặt ghi nhận, không bị tính là từ nguồn khi báo cáo độ khớp.
- Kiểm tra coverage chủ đề so với `book-vocab.json`: mọi mục được gán đúng một lần; không chạy test suite trong lượt rà soát này.

