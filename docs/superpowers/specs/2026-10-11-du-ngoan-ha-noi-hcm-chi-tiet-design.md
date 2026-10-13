# Du ngoạn: map Hà Nội và TP.HCM chi tiết — thiết kế

Ngày: 11/10/2026. Trạng thái: **nháp, chờ bạn duyệt** trước khi lập kế hoạch. Chưa có code cho phần này.

## 1. Mục tiêu

Hà Nội và TP.HCM có bản đồ mang đúng đặc trưng từng thành phố, đến mức người chơi nhận ra ngay: phố nghề đúng tên, lòng đường có xe máy, vỉa hè có ghế nhựa và quán trà đá, biển báo kiểu Việt Nam, cờ đỏ sao vàng ở các trục đường, đèn đường, cây xanh.

Hiện nay hai map dùng chung một bố cục quảng trường với các khối đất trống (đã ghi trong nhật ký ngày 11/10). Spec này thay thế bố cục đó bằng địa lý thật.

## 2. Phạm vi

**Hà Nội** (chia khu theo quận):
- Hoàn Kiếm: hồ Hoàn Kiếm, Tháp Rùa, Đền Ngọc Sơn, cầu Thê Húc, phố cổ (Hàng Bạc, Hàng Gai, Hàng Đào, Hàng Mã), Nhà hát Lớn, chợ Đồng Xuân, Ga Hà Nội.
- Ba Đình: Lăng Chủ tịch, Hoàng thành Thăng Long, Chùa Một Cột.
- Đống Đa: Văn Miếu – Quốc Tử Giám.
- Tây Hồ: hồ Tây, đường ven hồ.
- Long Biên: cầu Long Biên (mép sông Hồng).

**TP.HCM** (chia khu theo quận):
- Quận 1: đường Nguyễn Huệ đi bộ, Chợ Bến Thành, Nhà thờ Đức Bà, Bưu điện Trung tâm, Dinh Độc Lập, tháp Bitexco, phố đi bộ Bùi Viện.
- Quận 5: Chợ Lớn, chùa Bà Thiên Hậu.
- Bình Thạnh: Landmark 81 và Sky Deck.
- Củ Chi: địa đạo.
- Bến thuyền: đổi "Bến thuyền sông Mê Kông" thành bến sông Sài Gòn (Bạch Đằng). Mê Kông không chảy qua trung tâm TP.HCM.

**Ngoài phạm vi:** các thành phố khác; quán và pha chế (spec riêng); lưu lượng xe thật theo giờ.

## 3. Các lớp trên bản đồ

Mỗi bản đồ gồm năm lớp, vẽ từ dưới lên:

1. **Nền:** lòng đường, vỉa hè, dải phân cách, bờ hồ, mặt sông, công viên, sân.
2. **Đường đi:** vạch sang đường (có đèn xanh đỏ), mép vỉa hè, cửa hàng đặt sát vỉa hè.
3. **Vật thể đứng:** nhà ống phố cổ, cây, cột điện, cột đèn, biển báo, cờ đỏ sao vàng ở trục đường lớn, xe đậu.
4. **Đồ đặc trưng đường phố:** quán trà đá vỉa hè (ghế nhựa, bàn nhựa, bình trà), xe bán hàng rong, xe phở và bún, hàng nước mía, xe đạp điện.
5. **Xe cộ và NPC:** xe máy và ô tô chạy trên làn đường theo tuyến; xe buýt ở tuyến chính; NPC đi bộ trên vỉa hè, có lịch (sáng bán hàng, chiều đông khách).

## 4. Cách vẽ

Hai cách, chọn theo lớp:

- **Lớp nền và vỉa hè:** tạo bằng code từ mô tả địa lý (tile theo lưới). Lợi: đúng vị trí, dễ kiểm đường đi, không tốn ảnh.
- **Công trình, cây, đồ trang trí, xe:** sprite pixel vẽ bằng code hoặc ảnh tạo từ ChatGPT Plus theo quy trình đã có (ghép bảng sprite, cắt, ép pixel). Mọi công trình có thật phải tra ảnh tham chiếu trước khi vẽ, và xem phóng to trước khi chốt (quy tắc đã ghi ngày 08/10).

Hồ Hoàn Kiếm, Văn Miếu, Nhà hát Lớn, Bến Thành, Nhà thờ Đức Bà phải đối chiếu ảnh thật. Các mảng "dạng chung" không được chấp nhận.

## 5. Gameplay

- Người chơi đi bộ trên vỉa hè. Qua đường phải đi tới vạch sang đường và chờ đèn xanh; đi giữa lòng đường là không được.
- Xe chạy theo tuyến cố định trên làn đường, không đi xuyên công trình.
- NPC có lịch theo giờ. Ví dụ: bà bán trà đá buổi sáng và chiều, sinh viên quanh Bách Khoa (nếu có) buổi tối.
- Các điểm học (địa điểm trong `src/data/travel/pois.ts`) giữ nguyên nội dung và mã; chỉ thay vị trí và hình. Không đổi số lượng địa điểm ở bản đầu, trừ khi thêm để lấp khu trống.
- Vỉa hè liên thông: từ điểm xuất phát đi được tới mọi cửa hàng mà không băng đường qua lòng đường (trừ vạch có đèn).

## 6. Dữ liệu và kiểm thử

**File dự kiến:**
- `src/data/travel/maps/hanoi*.ts`, `hochiminh*.ts`: thay bố cục quảng trường bằng lưới khu, vỉa hè, tuyến xe, tuyến NPC.
- `src/data/travel/maps/districts.ts` (mới): quận, khu và toạ độ mỗi địa điểm, để test kiểm đúng quận.
- `public/travel/sprites/hanoi/`, `hochiminh/`: sprite mới theo quy trình ảnh.

**Test:**
- Mọi địa điểm nằm trong đúng khu/quận đã khai báo.
- Mọi cửa hàng đến được từ điểm xuất phát bằng đường đi bộ (A*), không băng lòng đường.
- Xe không đi qua ô công trình; mọi tuyến xe nối đầu–cuối.
- Mọi sprite khai báo tồn tại và kích thước khớp tệp.
- Tên địa điểm không chứa tên sông/hồ sai vị trí (ví dụ Mê Kông không còn ở TP.HCM).

## 7. Giai đoạn

- **H1 — Hoàn Kiếm (Hà Nội):** trung tâm, hồ, phố cổ, ga. Đây là khu nhìn thấy đầu tiên.
- **H2 — Ba Đình, Đống Đa (Hà Nội).**
- **H3 — Tây Hồ, Long Biên (Hà Nội).**
- **S1 — Quận 1 (TP.HCM):** Nguyễn Huệ, Bến Thành, Đức Bà, Bưu điện.
- **S2 — Quận 5, Bình Thạnh, Củ Chi (TP.HCM).**

Mỗi giai đoạn kết thúc bằng ảnh chụp ở chiều rộng máy tính và điện thoại, đối chiếu với ảnh tham chiếu.

## 8. Rủi ro

- **Khối lượng ảnh:** mỗi khu cần nhiều sprite. Ưu tiên lớp tile tạo bằng code để giảm ảnh.
- **Bản quyền ảnh tham khảo:** chỉ dùng ảnh công cộng (Wikimedia Commons) để đối chiếu hình dạng. Không sao chép ảnh vào game.
- **Hiệu năng:** map lớn trên điện thoại. Chia lớp nền thành ảnh tĩnh, lớp xe và NPC vẽ động.

## 9. Chờ bạn chốt (đề xuất mặc định)

- Bắt đầu bằng Hoàn Kiếm, rồi TP.HCM Quận 1 (hai khu nhìn thấy đầu tiên).
- Lớp nền dùng tile tạo bằng code; công trình dùng sprite ChatGPT.
- Tuyến xe: xe máy, ô tô, xe buýt. Không có xích lô ở bản đầu.
- Bến thuyền ở TP.HCM đổi thành bến sông Sài Gòn (Bạch Đằng).
