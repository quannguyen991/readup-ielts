# Kế hoạch chi tiết: "Du ngoạn Band 9" — game du lịch thế giới bằng bài tập

Bản nháp 02/10/2026. Nguồn ý tưởng: yêu cầu của người dùng (Bến Dừa nhưng chủ đề du lịch, châu Âu + Singapore, điểm đến là bài tập, trả lời câu hỏi và ôn tập để đổi vé máy bay), cộng ba bài tham khảo trên Threads (game ô lục giác, opportunity.city, Slow Rail). Mọi con số trong tài liệu là **đề xuất** để duyệt; mục 15 liệt kê các điều cần bạn chốt.

---

## 1. Tóm tắt một đoạn

Người học là một lữ khách pixel bắt đầu ở sân bay Nội Bài. Muốn bay tới Singapore, London, Paris, Rome hay Amsterdam phải có **vé máy bay**. Vé kiếm bằng cách **làm bài và ôn tập** (câu hỏi, từ vựng, nghe chép, dịch câu). Tới nơi, mỗi thành phố là một **bản đồ pixel 2D nhìn từ trên xuống** (như Bến Dừa) có các địa điểm: quán cà phê, khách sạn, ga tàu, chợ, bảo tàng và **biểu tượng thành phố** (Big Ben, Marina Bay, Tháp Eiffel, Đấu trường Colosseum, nhà kênh Amsterdam). **Mỗi địa điểm là một "quán bài tập"**: bước vào là làm một lượt 6–8 câu về đúng chủ đề tiếng Anh du lịch của chỗ đó (gọi món, hỏi đường, đặt phòng, mua vé…). Làm tốt thì được con dấu hộ chiếu, quà lưu niệm, xu, và mở địa điểm kế tiếp. Muốn đi thành phố khác thì ra sân bay, dùng vé, xem cảnh **bay qua các thành phố** (chuyến bay đang làm), rồi hạ cánh.

Mục tiêu giáo dục: luyện từ vựng và nghe nói theo **tình huống thật** (đặt phòng, hỏi đường, gọi món, du lịch) gắn với các bộ từ nghe IELTS đã có, qua một vòng chơi có đích đến rõ ràng và phần thưởng nhìn thấy được.

Không làm: không thay Thành phố Tri thức (3D, xây dựng), không thay Chuyến bay (cảnh ngắm), không dùng nhân vật hay tranh của Bến Dừa, không đua đòi Bến Dừa về nông trại.

---

## 2. Vòng chơi cốt lõi (core loop)

```
Kiếm vé  →  Bay  →  Khám phá thành phố  →  Làm bài ở các địa điểm  →  Phần thưởng  →  (lặp)
  ▲                                                           │
  └────────── ôn tập từ cũ cũng ra vé ◄─────────────────────┘
```

1. **Kiếm vé** (ở "Quầy đổi vé" sân bay hoặc từ phần thưởng):
   - Làm "bài kiểm tra hải quan": 5 câu hỗn hợp từ các bộ từ đã học. Đúng ≥ 4/5 → 1 vé.
   - **Ôn tập đúng hạn** (hàng đợi ôn lặp có sẵn): mỗi 10 từ ôn xong → 1 vé (bonus "vé ôn tập").
   - Đổi sao thành vé (cho linh hoạt như người dùng muốn): 150 ⭐ = 1 vé, tối đa 3 vé/ngày bằng sao.
2. **Bay**: chọn điểm đến trên bản đồ thế giới, trả vé, xem cảnh bay (tái dùng cảnh Chuyến bay), hạ cánh sân bay thành phố đó.
3. **Khám phá**: đi bộ (chạm/WASD) trong thành phố. Có NPC, thời tiết, ngày đêm, hiệu ứng.
4. **Làm bài** ở các địa điểm: "Lượt tham quan" 6–8 câu. Hoàn thành địa điểm lần đầu mở khoá địa điểm sau.
5. **Phần thưởng**: con dấu, quà lưu niệm, xu, kinh nghiệm hành trình, bưu thiếp, mảnh ghép "Cuốn nhật ký".
6. **Vòng lớn**: hoàn thành một thành phố → "Hộ chiếu cấp mới" + mở thành phố kế trên tuyến (xem mục 4).

Độ dài mong muốn: một thành phố ≈ 25–40 phút học rải nhiều buổi; 5 thành phố ≈ 3–4 giờ nội dung đầu tiên.

---

## 3. Kinh tế game

| Tài nguyên | Cách có | Dùng để |
|---|---|---|
| ✈️ Vé | Hải quan 4/5 đúng (1 vé); ôn 10 từ (1 vé); hoàn thành thành phố (thưởng 1 vé); đổi 150 ⭐ (≤3/ngày) | Bay tới thành phố khác |
| 🪙 Xu hành trình | Làm bài ở địa điểm (5–15 xu/lượt tuỳ độ khó) | Mua quà lưu niệm, đồ trang phục, nâng cấp hành lý (xem dưới) |
| 🏷️ Quà lưu niệm | Hoàn thành địa điểm lần đầu, bí mật khi đạt 100% | Sưu tập, trưng bày trong "Vali" |
| 🛂 Con dấu hộ chiếu | Hoàn thành thành phố | Mốc tiến độ, khoe, mở cấp hộ chiếu |
| ⭐ Sao (chung toàn app) | Đã có | Đổi vé, mua đồ cửa hàng |

**Giá vé** theo khoảng cách (vé tính đơn vị, không phải tiền thật):

| Từ → Tới | Vé |
|---|---|
| Hà Nội → Singapore | 1 |
| Singapore → London | 2 |
| London → Paris | 1 |
| Paris → Amsterdam | 1 |
| Paris → Rome | 1 |
| Quay về Hà Nội (về nhà) | 0 (luôn miễn phí) |

Hạng ghế (tuỳ chọn giai đoạn sau): "Phổ thông" (mặc định), "Thương gia" (+1 vé: tặng +50% xu khi hạ cánh). Chưa làm ở bản đầu.

**Chống lạm dụng**: vé ôn tập tối đa 3/ngày; hải quan tối đa 6 lần/ngày; mỗi câu chỉ được tính 1 lần/ngày cho vé; mọi số liệu ghi sổ có mã (`ledger id`) để đồng bộ nhiều máy không cộng đôi. Tất cả số trên cấu hình trong một tệp `economy.ts` có test.

---

## 4. Thế giới và nội dung năm điểm đầu

Điểm xuất phát: **Hà Nội — Sân bay Nội Bài** (cảnh nhỏ: quầy đổi vé, cổng lên máy bay, quán phở, bảng chuyến bay).

Tuyến mở khoá: Hà Nội → Singapore → London → (Paris, Amsterdam, Rome mở song song sau London). Mỗi thành phố có yêu cầu mở: hoàn thành ≥ 60% thành phố trước.

### 4.1 Singapore (độ khó dễ-vừa, band 5–6.5)
Biểu tượng: **Marina Bay Sands** (ba toà tháp nối bằng "con tàu" trên đỉnh), Merlion, Supertree.
Địa điểm (6 + 1 bí mật):
1. **Sân bay Changi** — kiểm tra hộ chiếu: từ vựng thông tin cá nhân, đánh vần tên, số điện thoại (bộ `listening-personal-details`, `listening-numbers-dates-money`).
2. **Tàu điện MRT** — mua vé, hỏi đường, giờ giấc (`listening-directions-maps`, chủ đề `transport`).
3. **Khách sạn** — đặt phòng, giá, tiện nghi (`listening-accommodation`, `housing`).
4. **Hawker centre** (khu ăn vặt) — gọi món, dị ứng, thanh toán (`food`, `listening-shopping-services`).
5. **Vườn Gardens by the Bay** — mô tả cảnh, thời tiết, môi trường (`environment`, `weather-climate`).
6. **Marina Bay Sands** — tham quan, mua vé, hỏi giờ mở cửa (`tourism`, `listening-tourism-tours`).
7. Bí mật: **Merlion lúc 20:00** (chỉ mở sau khi đạt 100% các chỗ khác) — thử thách tổng hợp 10 câu.

### 4.2 London (vừa, band 6–7)
Biểu tượng: **Big Ben**, Tower Bridge, London Eye, xe buýt hai tầng đỏ, hộp điện thoại đỏ.
Địa điểm: Heathrow (nhập cảnh), Tube (tàu điện ngầm, "mind the gap"), nhà trọ phố cổ (đặt phòng, quy định), quán trà chiều, chợ Borough (mua sắm, thương lượng), bảo tàng (`history`, `architecture`), bên bờ sông Thames — bí mật: **Big Ben đúng giờ** (nghe chép một bài thông báo).

### 4.3 Paris (vừa-khó, 6.5–7)
Biểu tượng: **Tháp Eiffel**, Khải Hoàn Môn, bảo tàng Louvre (kim tự tháp kính), quán cà phê vỉa hè. Nội dung: `art`, `fashion`, `culture`, `festivals`, hội thoại nhà hàng, khiếu nại dịch vụ.

### 4.4 Amsterdam (vừa, 6–7)
Biểu tượng: nhà kênh nghiêng, cối xay gió, xe đạp, hoa tulip. Nội dung: `transport` (xe đạp), `environment`/`energy` (gió), `agriculture`, `leisure`.

### 4.5 Rome (khó, 7+)
Biểu tượng: **Đấu trường Colosseum**, đài phun nước Trevi, Vatican. Nội dung: `history`, `architecture`, `culture`, bài nghe Section 4 kiểu bài giảng ngắn.

Mỗi thành phố: 6–7 địa điểm × 6–8 câu = 40–55 câu, có thể làm lại với câu mới (xem 5.4).

---

## 5. Hệ thống câu hỏi

### 5.1 Tái dùng nội dung có sẵn (không viết lại từ đầu)
- Bộ từ: 50 chủ đề IELTS + 21 bộ nghe IELTS (`src/data/vocab-topics.ts`, `vocab-listening.ts`) — lấy từ, nghĩa, câu ví dụ, collocation làm câu hỏi.
- Mẫu câu hỏi đã có: `makeQuestion` / `thpt-quiz` (điền chỗ trống, gần nghĩa, trái nghĩa, định nghĩa), nghe chép (`/sentence/dictation`), dịch câu (`/sentence/translate`), cloze, bài nghe có phụ đề, đề nói Part 1 (`/speaking`).
- Ôn lặp: `useTopicStudyStore` (`stages`, `reviews`, `lapses`) — mọi câu làm trong game **cập nhật cùng bộ lịch ôn** để học trong game không tách rời học thường.

### 5.2 Loại câu theo địa điểm (mỗi địa điểm 2–3 loại)
| Loại | Dùng ở | Cách chơi |
|---|---|---|
| Điền từ | Mọi nơi | Câu có chỗ trống, 4 đáp án |
| Gọi món / chọn câu đáp | Quán, khách sạn | Tình huống hội thoại ngắn, chọn câu đáp tự nhiên |
| Nghe chép | Sân bay, ga, chợ | Nghe một câu (TTS), gõ lại |
| Nghe chọn | Ga, thông báo | Nghe giờ/số/đường đi, chọn đúng |
| Sắp xếp câu | Khách sạn | Kéo từ vào câu hỏi/câu trả lời |
| Dịch câu | Chợ, bảo tàng | Dịch câu Việt → Anh, so với đáp án chấp nhận được |
| Nói (tuỳ chọn) | Quán cà phê | Trả lời một câu hỏi ngắn bằng micro (dùng engine Speaking có sẵn) |

### 5.3 Độ khó và tiến cấp
- Mỗi địa điểm có 3 mức: **Dễ / Vừa / Khó**; mức quyết định band của từ và loại câu. Lượt đầu mặc định theo trình độ thành phố; làm tốt (≥ 80%) mở mức cao hơn của chính địa điểm đó.
- Người học có sẵn trình độ từ **Lộ trình học** (IELTS band mục tiêu) → chọn mức bắt đầu hợp lý.

### 5.4 Chọn câu và chống lặp
- Hàm thuần `pickVisitQuestions({poi, level, seen, due, rng})`: ưu tiên (1) từ **đến hạn ôn**, (2) từ chưa gặp, (3) từ hay sai (`lapses`), loại các câu vừa làm trong 24 giờ.
- Seed ổn định theo `(poiId, lượt thứ n)` để test được và để "làm lại" ra câu mới.
- Mọi đáp án do code kiểm; không có AI sinh đề lúc chạy (tiết kiệm và không sai).

### 5.5 Chấm và phần thưởng một lượt
- Điểm = số đúng; ≥ 80%: "Xuất sắc" (3 sao), ≥ 60%: "Đạt" (2 sao), < 60%: "Thử lại" (0 xu, không mất gì).
- Thưởng xu: `base × (1 + 0.25 × sao)`; lần hoàn thành đầu: quà lưu niệm + dấu mốc.
- Sai thì xem lời giải tức thì (đã có kiểu "chạm là hiện đúng/sai"), câu sai vào hàng ôn.

---

## 6. Màn hình và trải nghiệm

Lộ `/quest/du-ngoan` (nhãn sidebar "Du ngoạn thế giới"). Ba màn chính:

### 6.1 Bản đồ thế giới (World Map)
- Nền: bản đồ pixel thế giới đơn giản hoá (biển xanh, lục địa mờ), 6 chấm thành phố, đường bay đứt nét vàng, vật bay nhỏ đi dọc tuyến vừa bay.
- Mỗi chấm: tên, con dấu (đã có/chưa), số địa điểm xong, khoá/mở, **giá vé**.
- Panel dưới: số vé, xu, nút "Quầy đổi vé" (dẫn về sân bay), "Hộ chiếu", "Vali".
- Chạm một thành phố: thẻ chi tiết (cảnh nhỏ, nội dung, trình độ) + nút **"Bay (−N vé)"** hoặc "Chưa đủ vé — Kiếm vé".

### 6.2 Cảnh thành phố (City Scene) — chính của game
- Nhìn từ trên xuống (3/4 top-down), ô 16×16 px phóng to số nguyên (×3 màn hình thường, ×2 điện thoại), nhân vật di chuyển bằng chạm-để-đi hoặc WASD/phím mũi tên; chạm địa điểm → nhân vật tự đi tới cửa → hỏi "Vào [tên]?".
- HUD gọn: vé, xu, tên thành phố, nút bản đồ thế giới, nút ba lô (quà), nút trợ giúp. Chữ rất ít.
- Camera theo nhân vật, mượt (lerp), dừng ở mép bản đồ.
- NPC có bong bóng thoại 1 dòng (hướng dẫn, thông tin vui về thành phố, tiếng Anh thực tế).
- Cửa địa điểm có biển tên + chấm sáng nhấp nháy khi còn bài chưa xong, tick xanh khi xong.

### 6.3 Lượt làm bài (Visit)
- Mở như một hộp thoại bên trong cảnh (nền cảnh hơi mờ): tiêu đề địa điểm, thanh tiến độ 6–8 chấm, câu hỏi, đáp án, đồng hồ không bắt buộc.
- Dùng cùng bộ thành phần câu hỏi của app (không viết lại), giao diện nền kem + khung gỗ vàng pixel cho hợp game (xem mục 7.4).
- Kết quả: màn tổng kết 3 sao, xu, quà mới, con dấu nếu mở khoá; nút "Làm tiếp chỗ khác" / "Ở lại".

### 6.4 Phụ
- **Quầy đổi vé** (cảnh sân bay): bài kiểm tra hải quan, đổi sao → vé, xem lịch sử vé.
- **Hộ chiếu**: trang con dấu theo thành phố, ngày đến, số lượt, thống kê từ đã học.
- **Vali**: quà lưu niệm đã có theo thành phố (lưới), mô tả một dòng, "đặt lên kệ nhà" (tính năng sau).
- **Bưu thiếp**: sau khi hoàn thành thành phố, một ảnh bưu thiếp (pixel) có thể chia sẻ/tải.

### 6.5 Luồng lần đầu (onboarding)
1. Giới thiệu 3 slide tối đa (đủ 1 câu/slide).
2. Đặt tên và chọn "áo" lữ khách (3 mẫu).
3. Phát **2 vé miễn phí** + hướng dẫn tới quầy hải quan làm bài đầu → bay Singapore.
4. Gợi ý nhỏ (tooltip) dẫn tới địa điểm đầu tiên.

---

## 7. Đồ hoạ và hiệu ứng

### 7.1 Hướng nghệ thuật
- Pixel 2D, đồ hoạ nhiều lớp chi tiết như Bến Dừa nhưng **bảng màu riêng của Band 9**: nền kem, xanh navy, vàng kim làm điểm nhấn, thêm màu đặc trưng từng thành phố (đỏ London, xanh lơ Paris, xanh lá-vàng Singapore, cam Rome, nâu-đỏ gạch Amsterdam).
- Mỗi thành phố một bảng ≤ 32 màu để thống nhất, chia tông sáng/tối cho ngày/đêm.

### 7.2 Cách có hình (đã chốt: vẽ bằng mã)
Không có hình ngoài. Có ba lớp tự sinh:
1. **Tileset**: ô 16×16 sinh bằng hàm (cỏ, đường lát, nước có viền bọt, đá lát, mái ngói, tường, cửa, lan can, cây, bụi hoa…), mỗi thành phố một biến thể màu/hoa văn. Nhiều biến thể mỗi ô (4–8) để không lặp.
2. **Sprite vẽ tay bằng lưới ký tự** (palette-indexed ASCII như các sprite pixel trước đây) cho vật thể lớn: biểu tượng thành phố (Big Ben ~64×112 px, MBS ~128×96, Eiffel ~64×128, Colosseum ~128×80, nhà kênh ×3 kiểu, cối xay gió), nhà, xe buýt, máy bay, người đi bộ (4 hướng × 3 khung bước), NPC (8 kiểu), động vật (chim, bồ câu, mèo).
3. **Cảnh sinh theo thủ tục (procedural)**: bố cục bản đồ từ mô tả (đường chính, quảng trường, khối nhà) + tô điểm ngẫu nhiên có seed (cây, ghế, đèn, thùng hoa).

**Trung thực về chất lượng**: vẽ bằng mã khó đạt độ tinh xảo như tranh AI/hoạ sĩ của Bến Dừa. Mình đặt mục tiêu "sạch, có hồn, nhất quán"; riêng **biểu tượng thành phố** sẽ được dồn công nhiều nhất. Có đường lui: nếu bạn muốn chất lượng cao hơn, thay các sprite quan trọng bằng ảnh pixel do công cụ tạo ảnh/hoạ sĩ làm, vì code đã tách `Atlas` nạp ảnh; xem mục 14 (rủi ro).

### 7.3 Hiệu ứng (lấy cảm hứng bài game ô lục giác)
- **Nước**: sóng pixel dịch chậm + bọt ven bờ, phản chiếu mờ biểu tượng; sông Thames/kênh Amsterdam/vịnh Marina.
- **Thời tiết** theo thành phố: London mưa nhẹ + vũng nước phản sáng, sương mỏng; Amsterdam gió (cối xay quay, cỏ rung); Singapore nắng gắt + cơn mưa chiều bất chợt; Rome nắng vàng; Paris hoàng hôn. Tuyết cho mùa đông (tuỳ chọn).
- **Ngày–đêm**: theo giờ địa phương thành phố (múi giờ có thật), đèn đường bật, cửa sổ sáng, đèn Eiffel lấp lánh mỗi giờ chẵn, Marina Bay có pháo hoa/ánh laser lúc 20:00.
- **Ánh sáng**: lớp "bóng mây" trôi trên mặt đất; viền sáng quanh địa điểm đang có bài; hiệu ứng "lấp lánh" khi nhặt quà.
- **Chuyển động**: người đi lại (đi theo đường), chim bay, xe buýt/xe điện chạy tuyến, thuyền trên sông, máy bay trên trời với vệt khói, bồ câu bay lên khi nhân vật lại gần.
- **Phản hồi**: con dấu "đóng" xuống hộ chiếu có rung nhẹ + âm thanh; đồng xu bay lên HUD; vé xé khi bay; pháo giấy khi hoàn thành thành phố.
- **Hiệu ứng ô lục giác tham khảo**: viền khu vực đã khám phá phát sáng vàng trên bản đồ thế giới; "sương chiến tranh" nhạt phủ thành phố chưa mở; khói nhà máy/ống khói/tàu hơi nước nhỏ.
- Tôn trọng `prefers-reduced-motion`: tắt rung, giảm hạt, chậm chuyển động.

### 7.4 Giao diện (UI) kiểu game
- Khung gỗ/giấy kem, viền navy, phông pixel (VT323 hoặc Pixelify Sans, miễn phí) cho tiêu đề trong game; chữ nội dung câu hỏi giữ phông đọc dễ (Plus Jakarta) để học không mỏi mắt.
- Chữ trong game ngắn, nút lớn (≥ 44 px), tôn trọng cỡ chữ sàn 14 px.

---

## 8. Kiến trúc kỹ thuật

### 8.1 Cấu trúc thư mục
```
src/services/travel/            ← LOGIC THUẦN, có test
  world.ts          đồ thị thành phố, giá vé, điều kiện mở khoá
  economy.ts        vé/xu/chống lạm dụng/sổ cái
  content.ts        ánh xạ địa điểm → bộ từ/loại câu
  pick.ts           chọn câu cho một lượt (ưu tiên đến hạn ôn)
  rewards.ts        sao, xu, quà lưu niệm, con dấu
  maps/             dữ liệu bản đồ từng thành phố (lưới, địa điểm, NPC, đường đi)
  pathfinding.ts    A* trên lưới ô
  clock.ts          giờ địa phương, ngày/đêm, thời tiết theo thành phố
src/components/travel/          ← GIAO DIỆN
  TravelApp.web.tsx / TravelApp.tsx   (native: trang danh sách đơn giản, web: canvas)
  engine/           bộ vẽ canvas 2D: Atlas, Camera, Layer, Sprite, Particles, Lighting
  scenes/           WorldMap, CityScene, Airport, Visit overlay
  ui/               HUD, Passport, Suitcase, TicketCounter, Dialogs
src/data/travel/                ← DỮ LIỆU (bản đồ, địa điểm, quà, lời thoại)
src/store/useTravelStore.ts     ← kho Zustand, đồng bộ qua `user_state` khoá `travel`
app/quest/du-ngoan/*.tsx        ← route
```

### 8.2 Bộ vẽ (engine)
- Một `<canvas>` duy nhất, độ phân giải nội bộ cố định theo thành phố (ví dụ 480×270 → ×N số nguyên), `imageSmoothingEnabled = false`, `image-rendering: pixelated`, **chỉ phóng số nguyên** (bài học từ lỗi nền Chuyến bay bị vỡ: tránh scale lẻ, snap vị trí camera về pixel nguyên).
- **Hai tầng**: (1) tầng tĩnh vẽ một lần vào `OffscreenCanvas` (đất, đường, nhà, cây) và chỉ vẽ lại khi đổi giờ/ngày/mùa; (2) tầng động (người, xe, hạt, bóng) 30 fps.
- Sắp xếp theo `y` (depth sort) cho sprite có chiều cao; tầng trên (tán cây, mái nhô) vẽ sau nhân vật.
- Ánh sáng: lớp màu nhân (multiply) theo giờ + mặt nạ ánh sáng quanh đèn; không dùng blur nặng.
- Tải hình: `Atlas` sinh tileset/sprite từ mã một lần, lưu `ImageBitmap`; nạp lười theo thành phố (không nạp cả năm cùng lúc).
- Đầu vào: con trỏ (chạm/chuột) → ô → A*; bàn phím WASD/mũi tên; trên điện thoại có thể thêm cần điều khiển ảo tuỳ chọn. Vùng chạm ≥ 44 px, không chặn cuộn trang ngoài khung.
- Hiệu năng: mục tiêu ≥ 50 fps trên điện thoại tầm trung; tầng tĩnh cache; hạt tối đa ~150; tạm dừng khi tab ẩn (mẫu `IntersectionObserver` + `visibilitychange` đã dùng ở nền toa tàu).
- Âm thanh: Web Audio tổng hợp (như `sfx.ts` hiện có): bước chân, cửa, xu, vé, đóng dấu, chuông máy bay; nhạc nền nhẹ theo thành phố **tự tổng hợp** (không bản quyền) từ `music.ts`.

### 8.3 Dữ liệu bản đồ
```ts
type CityMap = {
  id: 'singapore' | 'london' | ...; name: Bi; tz: string; palette: PaletteId;
  size: { w: number; h: number };            // số ô
  layers: { ground: string[]; objects: string[]; roofs: string[] };  // lưới ký tự → tile id
  spawn: { x: number; y: number };
  pois: Poi[]; npcs: Npc[]; routes: Route[];  // đường xe/người đi
  ambience: { weather: WeatherPlan; sounds: SoundId[] };
};
type Poi = { id; name: Bi; door: {x,y}; footprint; kind: 'cafe'|'hotel'|...;
             content: { decks: string[]; types: QuestionType[]; level: 1|2|3 };
             unlock: { after?: PoiId; minStars?: number }; reward: { coins; souvenir?: SouvenirId } };
```
Bản đồ viết bằng lưới ký tự để dễ soát và có **test kiểm tính hợp lệ**: mọi cửa nối được với điểm xuất phát bằng A*, không địa điểm nào chồng nhau, mọi `deck` tồn tại trong kho từ vựng, mọi quà có mô tả vi/en.

### 8.4 Kho và đồng bộ
`useTravelStore` (khoá lưu `readup:travel`, khoá đồng bộ `travel` trong `src/services/sync/stores.ts`):
```ts
{ tickets: number; coins: number; city: CityId; pos: {x,y};
  visited: Record<CityId, { stamp: boolean; firstAt: string }>;
  poi: Record<PoiId, { best: 0|1|2|3; runs: number; level: 1|2|3; lastAt: string }>;
  souvenirs: Record<SouvenirId, true>; ledger: Record<string, number>;  // id sổ cái → số
  passportLevel: number; dailyCaps: { day: string; custom: number; review: number; stars: number };
  prefs: { name; outfit; sound; reducedMotion } }
```
Hàm gộp: `tickets/coins` tính từ **sổ cái** (cộng các khoản theo id, không cộng đôi), `poi.best` lấy max, `visited`/`souvenirs` hợp, vị trí lấy bản mới hơn. Đổi sao → vé ghi sổ cái cả hai phía để không mất sao.

### 8.5 Tích hợp với phần đã có
- **Chuyến bay** (agent đang làm): cảnh bay giữa hai thành phố dùng chính bộ vật bay (máy bay mặc định; vật bay khác mở bằng xu).
- **Sao & cửa hàng**: đổi sao ↔ vé, mua đồ trang phục lữ khách.
- **Ôn lặp**: câu làm trong game cập nhật `topic_study.reviews`; hàng ôn đến hạn tạo vé.
- **Lộ trình học / Lớp học**: thêm loại bài "du ngoạn" cho lớp (giáo viên giao "hoàn thành Singapore") ở giai đoạn sau.
- **Nhắc học**: thông báo "Còn 1 vé chưa dùng / 8 từ cần ôn để có vé".
- **Tìm kiếm**: thêm thành phố/địa điểm vào chỉ mục.
- **i18n**: mọi chữ qua `useL()`; tên địa điểm song ngữ; câu hỏi giữ tiếng Anh.

### 8.6 Trên điện thoại / máy tính bảng
Khác Thành phố Tri thức (3D, chỉ máy tính), game này 2D nên **chạy cả điện thoại**: chạm để đi, bảng làm bài chiếm màn hình, HUD thu gọn, nút chuyển đổi nhanh. Native (iOS/Android thật) giai đoạn đầu chỉ có trang "danh sách thành phố/địa điểm" làm bài không có canvas.

---

## 9. Mô hình dữ liệu nội dung

- **Quà lưu niệm** (≈ 6 mỗi thành phố, có hiếm/thường): ví dụ "Mô hình Big Ben", "Sư tử biển Merlion", "Bánh croissant", "Cối xay gió nhỏ", "Dây chuyền mặt dây Colosseum". Mỗi quà có sprite 16×16, mô tả một dòng song ngữ, điều kiện nhận.
- **Nhật ký chuyến đi**: mỗi thành phố 3 "mẩu chuyện thú vị" (tiếng Anh dễ + dịch) mở dần; vừa là phần thưởng vừa là bài đọc ngắn.
- **Lời thoại NPC**: câu thật dùng trong du lịch (có dịch), ≥ 20 câu/thành phố, **kiểm chính tả và tính tự nhiên bằng tay**.

Nội dung do người viết (mình/agent) và có test hình thức; **không dùng AI sinh lúc chạy**.

---

## 10. Giai đoạn triển khai

Mỗi giai đoạn kết thúc bằng bản chạy được, có test, người dùng xem rồi mới sang giai đoạn sau.

**G0 — Nền móng và quyết định (1 phiên)**: chốt các điều ở mục 15; dựng `services/travel` (đồ thị thế giới, kinh tế, chọn câu) có test; kho `useTravelStore` + đồng bộ; route trống `/quest/du-ngoan` với bản đồ thế giới tĩnh.
*Nghiệm thu*: test kinh tế/gộp/chọn câu xanh; mở route thấy bản đồ và đổi sao → vé hoạt động.

**G1 — Engine 2D + Sân bay Hà Nội + Singapore (2–3 phiên)**: bộ vẽ canvas (Atlas, camera, tầng tĩnh/động, A*, đầu vào chạm/phím), cảnh sân bay (quầy đổi vé, hải quan), cảnh Singapore (Marina Bay Sands, 6 địa điểm), lượt làm bài đầy đủ, hộ chiếu, con dấu đầu tiên, bay (dùng cảnh Chuyến bay).
*Nghiệm thu*: chơi trọn vòng "kiếm vé → bay → làm 6 địa điểm → được con dấu"; ≥ 50 fps; hình nét ở ×1/×2 màn hình; không lệch pha chạm trên điện thoại.

**G2 — London (1–2 phiên)**: bản đồ, Big Ben, thời tiết mưa/sương, xe buýt/ Tube, nội dung; hiệu ứng nước sông Thames.
**G3 — Paris, Amsterdam, Rome (2–3 phiên, có thể song song bằng nhiều agent)**: ba bản đồ, biểu tượng, nội dung, hiệu ứng riêng.
**G4 — Hoàn thiện (1–2 phiên)**: ngày–đêm, pháo hoa, nhạc, Vali, bưu thiếp, onboarding, nhắc học, tìm kiếm, kiểm hiệu năng, kiểm dịch Anh.
**G5 — Mở rộng (sau)**: giao bài cho lớp, hạng ghế, thêm thành phố (Tokyo, New York, Sydney…), người chơi khác "đi ngang" (bóng ma) nếu muốn.

---

## 11. Kiểm thử

- **Logic**: kinh tế (không âm, hạn mức ngày, sổ cái không cộng đôi), gộp hai máy, chọn câu (ưu tiên hạn ôn, không lặp trong 24 giờ, seed ổn định), mở khoá tuyến, giá vé.
- **Bản đồ**: lưới hợp lệ, mọi cửa tới được, không chồng địa điểm, mọi `deck` có thật, mọi chuỗi có vi+en, mọi sprite khai báo có trong atlas.
- **Nội dung**: lời thoại NPC và câu hỏi: không rỗng, độ dài, không có tiếng Việt trong trường tiếng Anh, tên riêng đúng.
- **Hình**: tự kiểm bằng ảnh chụp: mỗi thành phố một ảnh ở ×2 và ×3 để soát độ nét; kiểm không có màu ngoài bảng.
- **Hiệu năng**: đo thời gian khung khi bản đồ lớn nhất; đo bộ nhớ sau khi đổi 5 thành phố.
- **Truy cập (a11y)**: mọi địa điểm cũng chọn được bằng danh sách (không bắt buộc đi bộ); chữ ≥ 14 px; tương phản đủ; hỗ trợ bàn phím.

---

## 12. Âm thanh

Tổng hợp bằng Web Audio, không bản quyền: bước chân theo bề mặt (cỏ/đá/gỗ), cửa, xu, vé xé, dấu đóng, chuông máy bay, nhạc nền ngắn lặp theo thành phố (giai điệu pentatonic nhẹ + nhạc cụ đặc trưng: gamelan-like cho Singapore, đàn accordion cho Paris, chuông cho London). Tắt mặc định ở lần đầu nếu trình duyệt chặn; có nút tắt tiếng; mọi âm lượng thấp.

---

## 13. Ngoài phạm vi (bản đầu)

Nhiều người chơi thời gian thực; mua bán giữa người chơi; đồ họa 3D; nông trại/xây nhà (đó là Bến Dừa); hạng ghế và hành lý; chế độ lớp học; giao diện native riêng.

---

## 14. Rủi ro và cách xử lý

| Rủi ro | Mức | Cách xử lý |
|---|---|---|
| Hình vẽ bằng mã chưa đẹp như Bến Dừa | Cao | Dồn công vào biểu tượng + bảng màu; lặp ≥ 2 vòng chụp-soát cho mỗi cảnh; đường lui: thay sprite quan trọng bằng ảnh pixel do hoạ sĩ/công cụ tạo ảnh làm (cần bạn duyệt chi phí trước) |
| Phạm vi quá lớn | Cao | Chia G0–G4; chỉ làm Singapore thật tốt trước rồi nhân bản kiến trúc |
| Hiệu năng điện thoại | Vừa | Tầng tĩnh cache, hạt ít, nạp lười, đo FPS ở G1 |
| Nền bị vỡ (như Chuyến bay) | Vừa | Quy tắc phóng số nguyên, snap pixel, test ảnh chụp ở DPR 1 và 2 |
| Nội dung tiếng Anh sai/gượng | Vừa | Nội dung do người viết có kiểm tay + bạn đọc lại; không AI lúc chạy |
| Lạm dụng đổi vé | Thấp | Hạn mức ngày, sổ cái có mã, kiểm phía máy chủ khi đồng bộ |
| Trùng/giống Bến Dừa quá mức | Thấp | Chủ đề, nhân vật, bảng màu, UI riêng; không dùng hình của Bến Dừa |
| Bản quyền | Thấp | Tự vẽ; biểu tượng kiến trúc công cộng, không logo thương hiệu; nhạc tự sinh |

---

## 15. Những điều cần bạn chốt trước khi bắt đầu G0

1. **Tên** tính năng: "Du ngoạn Band 9" (đề xuất) hay tên khác? Nhãn sidebar "Du ngoạn thế giới" ổn không?
2. **Kinh tế**: giá vé theo bảng mục 3, hạn mức đổi sao 3 vé/ngày, hải quan 4/5 đúng — ổn không? Có muốn cho **người chơi tự do đi thành phố chưa mở nếu có vé** (bỏ ràng buộc "hoàn thành 60%")?
3. **Câu hỏi nói (micro)**: đưa vào bản đầu hay để sau?
4. **Chất lượng hình**: chấp nhận vẽ bằng mã cho bản đầu (có thể thay sau) hay muốn thử một số sprite biểu tượng bằng công cụ tạo ảnh (có phí)?
5. **Điện thoại**: ưu tiên chạy tốt trên điện thoại ngay từ G1 (đề xuất có) hay máy tính trước?
6. **Nhân vật**: tự chọn 3 mẫu lữ khách hay dùng chung nhân vật "Bút Sĩ" mới của Quest (đề xuất tách riêng để cảnh khác chất)?
7. **Thứ tự thành phố** sau Singapore: London trước (đề xuất) hay Paris trước?
8. **Mức chơi lại**: làm lại địa điểm đã xong có cho xu không (đề xuất xu giảm 50% để tránh cày)?

---

## 16. Hình dung bố cục (phác thảo chữ)

```
┌──────────────── BẢN ĐỒ THẾ GIỚI ───────────────────────────┐
│ ✈ 3   🪙 120                         [Quầy vé] [Hộ chiếu]   │
│                                                              │
│            ● London ─ ─ ─ ● Amsterdam                        │
│             \             \                                  │
│              ● Paris ─ ─ ─ ● Rome         ● Singapore        │
│                                          /                   │
│                                  ● Hà Nội ◄ (bạn ở đây)      │
│  [Chạm thành phố]  →  Singapore · 6 chỗ · dễ · Bay (−1 vé)  │
└──────────────────────────────────────────────────────────────┘

┌─────────────── SINGAPORE (cảnh pixel top-down) ─────────────┐
│ ✈ 2  🪙 140  Singapore                    [Bản đồ] [Ba lô]  │
│    [Marina Bay Sands ▲▲▲]      ~~~ vịnh ~~~                 │
│ [Khách sạn ✓]     [Hawker ●(còn bài)]    (nhân vật)         │
│ [MRT]  [Gardens]                       [Changi]             │
└──────────────────────────────────────────────────────────────┘

┌──────── Hawker centre · Dễ ───────── 3/8 ─────────┐
│  "Can I have a bowl of chicken rice, please?"      │
│  Chọn câu đáp tự nhiên: A … B … C … D …            │
└────────────────────────────────────────────────────┘
```

---

*Kết thúc bản kế hoạch. Sau khi bạn trả lời mục 15 mình sẽ cập nhật tài liệu và bắt đầu G0.*
