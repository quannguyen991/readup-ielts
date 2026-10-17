# Du ngoạn: phong cách cozy kiểu Fields of Mistria và Gather Town — thiết kế

Ngày: 14/10/2026. Trạng thái: **nháp, chờ bạn duyệt** trước khi lập kế hoạch. Chưa có code cho phần này.

Liên quan: [du học và căn hộ](2026-10-11-du-hoc-can-ho-lam-them-design.md), [quán và pha chế](2026-10-11-du-ngoan-quan-pha-che-design.md), [Hà Nội và TP.HCM](2026-10-11-du-ngoan-ha-noi-hcm-chi-tiet-design.md).

## 1. Mục tiêu

Du ngoạn chuyển từ "bản đồ để đi và bấm địa điểm" sang "thế giới để sống trong". Người học đi trong một thành phố, bước vào căn hộ và quán có nội thất dày, bấm vào đồ vật để tương tác, thấy bạn bè trong cùng phòng. Mọi tương tác vẫn là tiếng Anh thật.

Bản PixelVerse (spec đa người chơi, dùng Phaser và Socket.IO) được đọc và điều chỉnh. Giữ ý về phong cách và cách vận hành. Bỏ những phần không hợp với app học tập của học sinh 15–18 tuổi và không hợp với hạ tầng đang có.

## 2. Đối chiếu với PixelVerse

| Hạng mục | PixelVerse đề nghị | Du ngoạn làm | Lý do |
|---|---|---|---|
| Engine | Phaser 3 | Giữ engine tự viết (`src/components/travel/engine`) | Đã có A*, lớp đi được theo ảnh, sắp chiều sâu, ánh sáng theo giờ, hạt, cửa vào nhà. Thêm engine thứ hai sẽ phải làm lại tất cả. |
| Realtime | Socket.IO server riêng | Supabase Realtime (presence và broadcast), khi tới D5 | App chạy trên Vercel, hàm serverless không giữ kết nối lâu. Supabase đã là nơi lưu dữ liệu. |
| Giao diện | Tailwind và Lucide | Giữ thành phần có sẵn (`hudKit`, `kit`) | App là Expo và React Native Web. |
| Chat | Tự do, tin nhắn riêng, kết bạn với người lạ | Không có chat tự do. Chỉ gửi câu mẫu tiếng Anh chọn từ menu, chỉ giữa bạn bè đã kết nối bằng mã mời | Người dùng là học sinh 15–18 tuổi. Câu mẫu không cần kiểm duyệt nội dung, và chính nó là luyện nói. |
| Voice chat (WebRTC) | Có, khi cấu hình được | Bỏ | Không kiểm soát được nội dung giọng nói của trẻ vị thành niên. |
| Block, mute, report | Bắt buộc | Giữ, chỉ áp dụng cho bạn bè và câu mẫu | Vẫn cần khi có tương tác giữa người với người. |
| Minigame | Bóng bàn, câu cá, đố vui, phản xạ | Đưa ba game ôn từ đã làm (Ghép cặp, Đoán chữ, Xếp câu) vào máy arcade. Bỏ bóng bàn ở bản đầu. Câu cá đã có ở Thành phố Tri thức, không làm lại | Tái dùng code đã có test. Mỗi game đã có đủ vòng chơi. |
| Emoji | Không dùng emoji làm đồ họa môi trường | Thay glyph emoji trong `study-abroad-dorm.ts` và các vật phẩm mới bằng sprite pixel | Emoji lệch phong cách với mọi sprite khác. Ảnh hưởng đến spec du học, xem mục 7. |
| Tiền | Tiền game và cosmetic | Dùng đồng du học và vé đã có. Không mua bằng tiền thật | Khớp yêu cầu chỉ cosmetic, không pay-to-win. |
| Công cụ admin, map editor | Có | Bỏ ở bản đầu. Dùng pipeline ảnh và `builder.ts` hiện có | Editor là khối việc lớn, không phục vụ người học. |
| Tuỳ chỉnh nhân vật | Tóc, màu da, mặt, áo, phụ kiện | Giữ ba bộ áo hiện có. Mở rộng ở D6 | Nội thất và HUD được ưu tiên trước. |
| Ngày đêm, thời tiết | Có | Giữ (`Lighting.ts`, `Particles.ts`) | Đã có. |

## 3. Phong cách: lấy ngôn ngữ thiết kế, không lấy sprite

Ba ảnh người dùng gửi chỉ để lấy ngôn ngữ thiết kế: mật độ đồ, tỷ lệ HUD, cách bày phòng. Không lấy sprite, bố cục hay ảnh.

- **Fields of Mistria (ảnh 1):** HUD mỏng ở góc. Đồng hồ ngày và giờ ở góc trên phải, số tiền, hotbar ở đáy. Nội thất có thảm viền, tường gỗ có diềm, sofa có gối, đèn, cây và đồ trang trí ở các mép.
- **Nhà kiểu Stardew (ảnh 2):** đồ đạc dày. Cửa sổ có cảnh ban đêm. Bếp, lò sưởi, kệ sách cao tới trần.
- **Văn phòng kiểu Gather Town (ảnh 3):** nhiều người trong một phòng. Sofa góc, bàn làm việc, quầy, bảng treo tường, có thú cưng đi lại.

Quy tắc:
- Không vẽ lại hay truy từ ảnh tham chiếu. Ảnh 2 có ghi tên tác giả, không dùng làm nguồn.
- Bảng màu theo thành phố (`src/data/travel/palettes.ts`) giữ nguyên. Khung HUD dùng vàng kim và than của thương hiệu Band 9 để giữ nhận diện.
- Đồ đạc vẽ theo lưới 16 px. Không có vật to bằng cả phòng.

## 4. Vận hành

### 4.1 Vòng chơi trong thành phố

- Đi bằng click hoặc WASD (đã có). Bấm E gần vật để tương tác (đã có cho địa điểm).
- Vào nhà, căn hộ hoặc quán: nội thất có tương tác thật, xem bảng dưới.
- NPC có lịch theo giờ, như mục 5 của spec Hà Nội và TP.HCM.

### 4.2 Tương tác với đồ vật

| Vật | Tương tác | Dùng lại |
|---|---|---|
| Ghế | E để ngồi, đi để đứng | Mới: trạng thái ngồi trong engine |
| Kệ sách | Mở một đoạn đọc ngắn kèm từ vựng | Đoạn đọc có sẵn, không gọi AI |
| Máy arcade | Chơi Ghép cặp, Đoán chữ hoặc Xếp câu | `src/services/vocab/review-games.ts` và ba màn đã làm |
| Gương | Đổi trang phục | `OUTFITS` trong `Traveller.tsx` |
| Tủ quần áo | Đổi bộ đã mở | Cùng dữ liệu với gương |
| Bảng tin | Nhiệm vụ và sự kiện trong tuần | `src/services/travel/missions.ts` |
| Máy pha cà phê | Mở menu đồ uống | Spec quán và pha chế |
| Cửa sổ | Hiện cảnh sáng, tối theo giờ địa phương | `Lighting.ts` |

### 4.3 Nhiều người trong cùng phòng (D5, chưa làm)

- Chỉ bạn bè đã kết nối. Vào phòng bằng mã mời có hạn.
- Thấy vị trí và trang phục của bạn cùng phòng. Không thấy người lạ.
- Nói bằng câu mẫu hoặc emote. Không lưu nội dung câu mẫu sau khi phòng đóng.
- Nút chặn và báo cáo nằm ngay trên màn hình chính.

## 5. HUD kiểu Fields (D2)

- Góc trên trái: ảnh nhân vật, tên, cấp và thanh kinh nghiệm, lấy từ điểm hộ chiếu đã có.
- Góc trên phải: ngày, giờ địa phương, số dư đồng du học và vé.
- Đáy: hotbar sáu ô: Hộ chiếu, Vali, Sổ từ, Bản đồ, Nhiệm vụ, Quần áo. Ô chưa mở thì mờ, không ẩn.
- Không có thanh thể lực hay năng lượng. Người học không bị chặn bởi thời gian nghỉ, vì việc đó sẽ làm chậm việc học.
- Điện thoại: hotbar gọn xuống một hàng. Joystick giữ như hiện nay.

## 6. Giai đoạn

| Giai đoạn | Nội dung | Nghiệm thu |
|---|---|---|
| D1 | Căn hộ Singapore (chương 1) làm chuẩn: tường có diềm, thảm có viền, ghế ba hướng, kệ sách có sách màu, đèn có quầng sáng, cửa sổ theo giờ. Bốn vật tương tác. | Chụp ở máy tính và điện thoại, so với ảnh 2 và 3 về mật độ. Kiểm đường đi tới mọi vật bằng A*. |
| D2 | HUD kiểu Fields (mục 5) | Chụp hai kích thước. Số liệu hiện đúng với store. |
| D3 | Thay glyph emoji bằng sprite pixel. Sửa spec du học mục 4 | Kiểm tra dữ liệu: không còn glyph emoji trong vật phẩm nội thất. |
| D4 | Arcade ở Singapore và Tokyo, ba game ôn từ | Mỗi game có đủ bắt đầu, chơi, kết quả, thoát. |
| D5 | Phòng chung bạn bè (mục 4.3) | Hai trình duyệt thấy nhau. Có giới hạn tần suất. Không lộ người lạ. Có chính sách truy cập theo dòng (RLS). |
| D6 | Mở rộng trang phục, nhạc nền tắt mặc định, đàn mèo đi dạo (đã có trong mascot) | Không tự phát âm thanh. Hiệu năng ổn trên điện thoại. |

Trước D1, chụp lại cảnh hiện tại để so sánh. Hiện mình đọc code, chưa chạy game để nhìn trực quan.

## 7. Sửa spec đang chờ

Spec [du học và căn hộ](2026-10-11-du-hoc-can-ho-lam-them-design.md) mục 4 viết: "Vật phẩm mới dùng ký tự glyph như các vật phẩm hiện có, nên không cần vẽ ảnh mới." Đề nghị sửa thành: vật phẩm mới là sprite pixel. Mỗi thành phố cần ít nhất năm sprite, một cho mỗi vị trí `DormSlot`. Các vật có glyph hiện nay cũng thay theo D3.

## 8. Kiểm thử

- Logic: mọi vật tương tác đều đi tới được từ một ô đi được. Không vật nào chắn ô đi được của nhân vật.
- Dữ liệu: không còn glyph emoji trong vật phẩm nội thất. Mỗi câu mẫu có cả bản tiếng Việt và tiếng Anh.
- An toàn: không có đường dẫn gửi tin nhắn tự do. Không có endpoint trả về người lạ.
- Giao diện: chụp ở máy tính và điện thoại theo quy tắc đã có.

## 9. Rủi ro

- **An toàn trẻ vị thành niên:** đã xử lý ở mục 2. D5 cần duyệt riêng trước khi làm.
- **Khối lượng sprite:** vẽ tay là chậm nhất. Đồ đơn giản vẽ bằng code (`drawInterior` trong `interior.ts`). Đồ phức tạp dùng ảnh ChatGPT theo pipeline đã có.
- **Hiệu năng điện thoại:** hạt giữ trần 150. NPC và mèo vẽ động, nền tĩnh.
- **Nội dung:** mọi câu mẫu và đoạn đọc viết và kiểm bằng tay. Không dùng AI lúc chạy.

## 10. Chờ bạn chốt (đề xuất mặc định)

1. D5 (phòng chung) làm sau D4 và chỉ cho bạn bè. Mặc định: hoãn, cần duyệt riêng.
2. Chat chỉ bằng câu mẫu, không gõ tự do. Mặc định: có.
3. Không có thanh thể lực. Mặc định: có.
4. Giờ thật chỉ dùng cho ngày, đêm và cửa sổ. Tiền thuê và nhiệm vụ vẫn theo ngày học. Mặc định: có.
5. Sửa spec du học để dùng sprite thay glyph. Mặc định: có.
6. Thành phố làm chuẩn: Singapore (chương 1, 12 địa điểm). Mặc định: có.
