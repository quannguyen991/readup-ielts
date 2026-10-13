# Du ngoạn: quán và pha chế (sandbox khởi nghiệp) — thiết kế

Ngày: 11/10/2026. Trạng thái: **nháp, chờ bạn duyệt** trước khi lập kế hoạch. Chưa có code cho phần này.

## 1. Mục tiêu

Người học tự mở quán ở một thành phố đã đến, tự chọn thực đơn, tự đặt tên quán và pha đồ uống theo đơn của khách và NPC. Mọi đơn được ra bằng tiếng Anh thật, nên người chơi vừa sáng tạo vừa luyện nghe và trả lời.

Trải nghiệm mong muốn: "thỏa sức sáng tạo". Người chơi chọn món, chọn công thức, đặt giá, bày quầy. Không có kịch bản cố định bắt buộc.

## 2. Phạm vi

**Trong phạm vi (giai đoạn đầu):**
- Một quán mỗi thành phố, bắt đầu ở Singapore và London.
- Thực đơn: đồ uống mở khoá bằng công thức đã học.
- Đơn hàng: khách và NPC gọi món bằng một câu tiếng Anh; người chơi chọn đúng đồ uống và tuỳ chọn.
- Pha chế: 3 bước (chọn ly, đong nguyên liệu chính, thêm sữa/đường/đá/topping).
- Doanh thu, chi phí nguyên liệu, lời lỗ theo từng đơn.
- Đặt tên quán và chọn màu biển hiệu.
- Món riêng: người chơi ghép công thức từ nguyên liệu có sẵn, đặt tên bằng danh sách từ có sẵn (không gõ tự do).

**Ngoài phạm vi:**
- Đơn do AI sinh lúc chạy. Mọi câu và đáp án do người viết và kiểm tay.
- Nhiều người chơi, giao hàng online, nhân viên thuê.
- Hà Nội và TP.HCM (quán ở đó làm sau, trong spec bản đồ).

## 3. Quan hệ với tiền du học

Hai lớp tiền, không lẫn:
- **Đồng du học** (đã có): tiền sinh hoạt và đồ trang trí căn hộ.
- **Vốn quán**: một khoản chuyển một lần từ đồng du học để mở quán, và doanh thu quán từ đó. Tiền tố `shop:` trong sổ cái riêng, cùng cơ chế với `pay:`.

Mở quán tốn 150 đồng du học (đề xuất). Sau khi mở, quán tự chi và thu bằng vốn quán; không trừ thêm đồng du học. Không mua bằng tiền thật.

## 4. Vòng chơi

1. **Mở quán:** chọn thành phố đã đến và một mặt bằng trống (mỗi thành phố một mặt bằng ở giai đoạn đầu). Trả vốn, đặt tên quán.
2. **Thực đơn:** món đầu tiên có sẵn: cà phê sữa đá, trà đá, trà sữa trân châu (đề xuất). Món mới mở khi học công thức trong các nhiệm vụ du học hoặc khi đạt số đơn.
3. **Đơn khách:** mỗi lượt có một khách (hoặc NPC quen). Khách nói một câu tiếng Anh, ví dụ "One iced latte, less sugar, please." Người chơi chọn đúng món và tuỳ chọn, rồi chọn một câu đáp đúng (nếu đơn cần đáp).
4. **Pha chế:** món được pha qua 3 bước. Bước sai thì món sai và khách không hài lòng (ít tiền, mất sao độ quen).
5. **Thu tiền:** đơn đúng cho doanh thu = giá bán − chi phí nguyên liệu. Đơn sai không có doanh thu nhưng cũng không trừ tiền ngoài chi phí đã dùng.
6. **Độ quen NPC:** NPC quen có sở thích riêng (ví dụ "ít đường"). Phục vụ đúng sở thích tăng độ quen, mở thêm lời thoại và đơn lớn hơn.

## 5. Dữ liệu và luật

- **Công thức:** mỗi món có danh sách bước, nguyên liệu, giá vốn và giá bán. Món riêng phải qua kiểm luật: tối đa 4 nguyên liệu, đúng loại (đồ uống không nhận nguyên liệu không uống được), không trùng món đã có.
- **Đơn:** mỗi đơn có mã, món, tuỳ chọn, câu khách và đáp án đúng. Kiểm bằng hàm thuần, không gọi AI.
- **Sổ cái:** `shop:sale:<ngày>:<mã đơn>` (dương), `shop:cost:<ngày>:<mã đơn>` (âm), `shop:rent:<ngày>` (âm), `shop:open:<mặt bằng>` (âm, một lần). Hạn mức đơn/ngày để không cày quá (đề xuất 12 đơn/ngày).

## 6. Kiến trúc

| Phần | File (dự kiến) |
|---|---|
| Luật thuần: doanh thu, công thức, đơn, độ quen | `src/services/startup/economy.ts`, `recipes.ts`, `orders.ts` |
| Dữ liệu món, mặt bằng, NPC quen | `src/data/startup-menu.ts`, `src/data/startup-npcs.ts` |
| Store (persisted, version 1, khoá đồng bộ `startup`) | `src/store/useStartupStore.ts` |
| Đồng bộ | `src/services/startup/sync.ts`, đăng ký trong `src/services/sync/stores.ts` |
| Màn quán và pha chế | `app/quest/study-abroad/cafe.tsx`, `src/components/startup/` |

Test: luật doanh thu và hạn mức ngày; kiểm công thức (hợp lệ, trùng, quá nguyên liệu); khớp đơn với món (đúng và sai tuỳ chọn); hợp sổ hai máy không cộng đôi.

## 7. Giai đoạn

- **S1 — Singapore:** một mặt bằng, 3 món cơ bản, đơn khách không NPC quen, pha chế 3 bước, một công thức món riêng.
- **S2 — London:** thêm mặt bằng và món; NPC quen và độ quen.
- **S3 — Sáng tạo:** tự đặt giá, chọn màu biển hiệu, nhiều món riêng, nâng cấp quầy.

## 8. Rủi ro

- **Cân đối kinh tế:** quán có thể làm đồng du học mất ý nghĩa, hoặc quá dễ kiếm. Giữ hạn mức đơn và vốn ban đầu nhỏ; chỉnh con số qua một file cấu hình.
- **Trên điện thoại:** pha chế 3 bước phải thao tác được bằng chạm, vùng chạm ≥ 44 px.
- **Nội dung tiếng Anh:** đơn và đáp án do người viết, cần kiểm tay từng câu.

## 9. Chờ bạn chốt (đề xuất mặc định)

- Vốn mở quán: 150 đồng du học.
- Đơn tối đa: 12 mỗi ngày.
- Món ban đầu: cà phê sữa đá, trà đá, trà sữa trân châu.
- Món riêng: tối đa 4 nguyên liệu.
- Đặt tên món: chọn từ danh sách, không gõ tự do.
