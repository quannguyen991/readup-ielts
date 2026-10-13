# Du học: căn hộ, làm thêm và tiền riêng — thiết kế

Ngày: 11/10/2026. Trạng thái: **chờ bạn duyệt spec** trước khi lập kế hoạch triển khai.

## 1. Mục tiêu

Biến chiến dịch Du học (5 chương, 5 thành phố) thành trải nghiệm sống như du học sinh: mỗi thành phố có một căn hộ để trang trí, có việc làm thêm để kiếm tiền riêng, và mọi tình huống làm việc đều là tiếng Anh thật.

Không làm nông trại, chăn nuôi, hay một hệ nhà 8×8 mới. Căn hộ dùng lại hệ nội thất ký túc xá đang có.

## 2. Phạm vi

**Trong phạm vi:**
- Căn hộ ở từng thành phố của chiến dịch.
- Việc làm thêm (part-time), 2 việc mỗi thành phố.
- Tiền riêng ghi sổ cái, đồng bộ nhiều máy không cộng đôi.

**Ngoài phạm vi (giai đoạn này):**
- Mở quán riêng (giai đoạn sau, cần spec riêng).
- Hà Nội và TP.HCM (làm sau, vẽ lại theo địa lý thật).
- Nông trại, chăn nuôi, thú cưng.

## 3. Thứ tự thành phố

Theo đúng chương của chiến dịch:

| Chương | Thành phố | Địa điểm đã có trên bản đồ |
|---|---|---|
| 1 | Singapore | 12 |
| 2 | London | 14 |
| 3 | Paris | 15 |
| 4 | Tokyo | 6 |
| 5 | New York | 6 |

Tokyo và New York chỉ có 6 địa điểm. Đủ cho việc làm giai đoạn đầu, nhưng để chơi lâu cần thêm địa điểm; việc này để sau.

## 4. Căn hộ

- Mỗi thành phố có một căn hộ, mở khi hoàn thành nhiệm vụ đầu tiên của chương tương ứng.
- Trang trí bằng 5 vị trí hiện có: giường, bàn, tường, góc, kệ (`DormSlot` trong [src/data/study-abroad-dorm.ts](src/data/study-abroad-dorm.ts)).
- Mỗi thành phố có bộ đồ riêng. Vật phẩm mới dùng ký tự `glyph` như các vật phẩm hiện có, nên không cần vẽ ảnh mới.
- Cơ chế mở khoá đã có sẵn: `unlockMission` của từng vật phẩm, kiểm trong `setDecoration`.
- Tiền thuê: trừ một lần mỗi **tuần học** (7 ngày học của chiến dịch). Ngày học tính theo [src/data/study-abroad-schedule.ts](src/data/study-abroad-schedule.ts), không dùng đồng hồ thật.
- Thiếu tiền thuê: không trừ tiền, không khoá tiến độ học. Chỉ đánh dấu "chưa đóng", và khi chưa đóng thì không mua được đồ mới.

## 5. Việc làm thêm

- Mỗi thành phố có 2 việc, làm tại một địa điểm **có sẵn** trên bản đồ, để không phải vẽ thêm.

| Thành phố | Việc 1 (mở khi vào thành phố) | Việc 2 (mở khi xong chương) |
|---|---|---|
| Singapore | Phục vụ quầy Hawker | Thu ngân tiệm kopitiam |
| London | Phục vụ quán trà chiều | Bán hàng ở chợ Borough |
| Paris | Phục vụ quán cà phê vỉa hè | Phụ bếp quán bánh crêpe |
| Tokyo | Phục vụ quán ramen nhỏ | Phụ bán ở chợ Tsukiji |
| New York | Phục vụ tiệm pizza Brooklyn | Hướng dẫn khách ở bảo tàng Met |

- Mỗi ca gồm 4 tình huống. Mỗi tình huống dùng đúng cấu trúc `StudyAbroadMission` (câu thoại, 4 đáp án, đáp án đúng, gợi ý, giải thích), để tái dùng màn chơi nhiệm vụ.
- Lương: mỗi câu đúng được 10 đồng du học. Ca được tính lương khi đạt từ 3/4 câu trở lên.
- Tối đa 2 ca mỗi ngày học.

## 6. Tiền riêng

- Tên hiển thị: **Đồng du học** (đề xuất, đổi được).
- Sổ cái trong store, tiền tố `pay:`, cùng cơ chế `ledgerAdd` của [src/services/travel/economy.ts](src/services/travel/economy.ts): mỗi khoản có mã duy nhất và ghi một lần.
- Mã khoản thu: `pay:shift:<ngày học>:<việc>:<ca>`. Mã khoản chi: `pay:rent:<tuần>:<thành phố>`, `pay:buy:<vật phẩm>:<vị trí>`.
- Số dư không âm. Không cho mua khi thiếu tiền.
- Không lẫn với vé hay xu của Du ngoạn. Không mua bằng tiền thật.

## 7. Đồng bộ

- `StudyAbroadPayload` thêm trường `ledger`.
- `normalizeStudyAbroad` và `mergeStudyAbroad` ở [src/services/study-abroad/sync.ts](src/services/study-abroad/sync.ts) hợp hai sổ cái theo mã, giống cách Du ngoạn làm.
- Dữ liệu cũ không có `ledger` thì coi như rỗng; không mất tiến độ hiện có.
- Cập nhật payload ở [src/services/sync/stores.ts](src/services/sync/stores.ts) quanh dòng 302.

## 8. Thay đổi chính

| File | Thay đổi |
|---|---|
| `src/data/study-abroad-campaign.ts` | Thêm danh mục việc làm và tình huống ca làm, theo thành phố |
| `src/data/study-abroad-dorm.ts` | Thêm vật phẩm riêng cho từng thành phố, có `unlockMission` |
| `src/services/study-abroad/economy.ts` (mới) | Hàm thuần: tính lương, tiền thuê, kiểm đủ tiền để mua |
| `src/store/useStudyAbroadStore.ts` | Thêm `ledger`, `workShift`, `payRent` |
| `src/services/study-abroad/sync.ts` | Hợp sổ cái |
| `app/quest/study-abroad/work.tsx` (mới) | Màn chọn việc và làm ca |
| `app/quest/study-abroad/dorm.tsx` | Hiện số dư và tiền thuê |

## 9. Kiểm thử

- **Logic** (`economy.test.ts`): số dư không âm; một mã khoản không cộng đôi; tiền thuê không khoá tiến độ; mở khoá việc đúng thứ tự.
- **Đồng bộ** (`sync.test.ts`): hợp hai máy không mất tiền; dữ liệu cũ không có `ledger` vẫn đọc được.
- **Dữ liệu** (`study-abroad-campaign.test.ts`): mỗi việc trỏ đến một địa điểm có thật trong [src/data/travel/pois.ts](src/data/travel/pois.ts) của đúng thành phố; mỗi tình huống có 4 đáp án và đáp án đúng hợp lệ; mọi chuỗi có cả tiếng Việt và tiếng Anh.
- **Giao diện:** chụp màn căn hộ và màn việc làm ở chiều rộng điện thoại và máy tính.

## 10. Giai đoạn

1. **G1 — Singapore:** căn hộ, tiền riêng, một việc (việc 1). Nghiệm thu: làm trọn chương 1 và trang trí được căn hộ.
2. **G2 — London, Paris:** thêm việc và căn hộ cho hai thành phố.
3. **G3 — Tokyo, New York:** thêm việc và căn hộ; cân nhắc thêm địa điểm.
4. **G4 — Quán:** cần spec riêng.
5. **G5 — Hà Nội, TP.HCM:** vẽ lại theo địa lý thật, cần spec riêng.

## 11. Rủi ro

- **Nội dung tình huống** phải viết và kiểm bằng tay, không dùng AI lúc chạy. Đây là luật sẵn có của dự án.
- **Cân bằng tiền:** nếu lương quá cao, người học chỉ đi làm mà không học. Giới hạn 2 ca mỗi ngày và chỉ trả lương theo câu đúng để giữ việc học ở trung tâm.
- **Tiền thuê:** không được tạo cảm giác bị phạt. Thiếu tiền chỉ ảnh hưởng đến việc mua đồ.

## 12. Đề xuất mặc định (chờ bạn sửa nếu cần)

- Tên tiền: Đồng du học.
- Lương: 10 đồng mỗi câu đúng; ca đạt từ 3/4 câu.
- Tối đa 2 ca mỗi ngày học; 4 câu mỗi ca.
- Tiền thuê căn hộ: 30 đồng mỗi tuần học.
- Giá đồ trang trí: từ 20 đến 60 đồng tuỳ món.
