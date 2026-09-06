# Đối chứng người thật cho hàng rào bịt mắt

*Giao thức chạy với 3–8 bạn. Soạn ngày 07/09/2026, trước khi chạy buổi đầu.*

---

## Việc này đo cái gì

ReadUp có một hàng rào: mỗi câu hỏi đọc hiểu do AI sinh ra đều bị **một model
thứ hai trả lời thử khi chưa được đọc bài**. Trả lời được mà không cần đọc bài
thì câu đó không đo đọc hiểu — nó đo kiến thức nền, hoặc đo hình dáng bốn phương
án — và nó bị loại.

Nhưng model thứ hai **cũng là model**. Nếu chỉ có nó phán xử thì cả phép đo là AI
chấm AI: một cỗ máy tuyên bố về hành vi của một cỗ máy khác, không có gì neo tuyên
bố ấy vào thế giới.

Các bạn là cái neo đó.

> **Câu hỏi được trả lời:** khi model bịt mắt nói *"câu này trả lời được mà không
> cần đọc bài"*, người thật có thấy như vậy không?

## Vì sao 3–8 người là đủ, và đủ cho việc gì

Cỡ mẫu này **không** đỡ nổi một nghiên cứu học tập — kiểu "cơ chế này giúp học tốt
hơn bao nhiêu". Ép nó ra một con số như vậy là tự lừa mình.

Nhưng nó **thừa sức** đỡ một chỉ số đồng thuận: hai bên cùng làm một việc trên
cùng một bộ câu hỏi, đếm xem khớp nhau bao nhiêu phần trăm. Đó là lý do việc của
các bạn là việc này chứ không phải việc kia.

## Thu thập gì, và không thu thập gì

**Có:** đáp án các bạn chọn cho từng câu, và ô "chắc hay đoán".

**Không:** tên, trường, lớp, điểm số, bất cứ thứ gì nói lên các bạn là ai. Phiếu
chỉ mang một mã do chính bạn tự chọn (`HS-01`, `HS-02`…). Nếu người tổ chức có giữ
bảng nối mã với tên thì bảng ấy nằm lại chỗ người ấy và **không bao giờ đi vào bất
kỳ tệp nào được công bố**.

**Không ai bị chấm.** Trả lời sai là kết quả **tốt** cho phép đo này — nó nói rằng
câu hỏi ấy thật sự cần đọc bài mới làm được.

---

## Giấy đồng ý (dành cho bạn dưới 18 tuổi)

> **Kính gửi phụ huynh,**
>
> Em ……………………………… được mời tham gia một buổi kiểm tra chất lượng **câu hỏi**
> trong một phần mềm luyện thi tiếng Anh do học sinh làm.
>
> **Em sẽ làm gì:** trả lời khoảng 100 câu hỏi trắc nghiệm tiếng Anh trong 25–30
> phút, tại lớp hoặc ở nhà. Các câu hỏi này **cố ý không kèm bài đọc**.
>
> **Đây không phải bài kiểm tra năng lực của em.** Chúng tôi đang đo xem những câu
> hỏi kia có tốt hay không, chứ không đo em. Không có điểm, không xếp hạng, không
> báo về trường hay giáo viên.
>
> **Chúng tôi lưu gì:** chỉ các ô em đánh dấu trên phiếu, gắn với một mã do em tự
> chọn. **Không** lưu tên, trường, lớp hay bất cứ thông tin cá nhân nào.
>
> **Tự nguyện hoàn toàn.** Em có thể dừng bất cứ lúc nào, không cần nêu lý do, và
> yêu cầu xoá phiếu của mình. Không tham gia thì cũng không mất mát gì — không mất
> giờ học, không bị đối xử khác.
>
> **Kết quả dùng để làm gì:** một hồ sơ dự thi và một báo cáo kỹ thuật công khai.
> Trong đó chỉ có **con số gộp** (ví dụ "8 người, khớp 82%"), không có phiếu của
> riêng ai.
>
> Đồng ý cho em tham gia: ……………………………………  Ngày …… / …… / 2026
>
> Người tổ chức: ………………………………  Liên hệ: ………………………………

---

## Kịch bản buổi chạy

**Chuẩn bị:** in phiếu (`npx tsx scripts/build-human-check.ts --items 100`), mỗi
bạn một bản. Không đưa `dap-an.json` cho ai.

**Nói đúng những câu này, đừng thêm:**

1. *"Đây không phải bài kiểm tra. Mình đang kiểm tra chất lượng CÂU HỎI, không kiểm tra các bạn."*
2. *"Các bạn sẽ không được đọc bài. Cố ý đấy, không phải quên in."*
3. *"Không biết thì cứ để trống hoặc đoán — nhưng đoán thì đánh dấu vào ô 'đoán'."*
4. *"Ô 'chắc hay đoán' quan trọng ngang đáp án. Đoán trúng vẫn là đoán."*
5. *"Đừng tra Google, đừng hỏi AI. Cái mình cần đo là kiến thức sẵn có của các bạn."*

**KHÔNG được nói:**

- ❌ *"Câu nào trả lời được là câu dở"* — nói ra thì các bạn sẽ cố tình để trống
  cho "đúng ý", và phép đo hỏng.
- ❌ *"AI cho rằng câu này trả lời được"* — mớm đáp án của bên kia vào là hết đối chứng.

Cùng lý do mà lời dặn cho model bịt mắt cũng không nói nó đang bị dùng làm hàng rào
chất lượng — xem `src/services/provenance/blind-gate.ts`.

**Thời lượng:** 25–30 phút. Ai xong sớm thì nộp, không phải ngồi đợi.

---

## Chấm và đối chiếu

Với mỗi câu, hai bên cùng cho ra một phán quyết theo **cùng một luật**:

| | Người | Model |
|---|---|---|
| Trả lời đúng **và** đánh dấu "chắc" | *trả lời được khi không có bài* | `answerable-without-passage` |
| Trả lời đúng nhưng đánh dấu "đoán" | *đoán trúng* | `guess-hit` |
| Trả lời sai | *không trả lời được* | `answered-wrong` |
| Để trống | *không trả lời được* | `could-not-answer` |

Rồi đếm:

- **Đồng thuận:** bao nhiêu phần trăm số câu hai bên cho cùng phán quyết.
- **Model báo động giả:** model loại, nhưng đa số người không trả lời được.
- **Model bỏ lọt:** model cho đỗ, nhưng đa số người trả lời được và đều chắc.
  ← **đây là con số quan trọng nhất**, vì đó là câu vô dụng đã đi thẳng tới người học.

## Nói trước: kết quả nào cũng công bố

Đồng thuận thấp thì **vẫn công bố**, và kết luận là hàng rào bịt mắt chưa đo đúng
thứ nó tự nhận đang đo. Cùng kỷ luật với ngưỡng phủ định 8% đã ghi thẳng vào
`src/services/provenance/ledger.ts` trước khi phép đo chạy lần đầu.

Một hồ sơ dựng trên tính trung thực mà giấu một chỉ số xấu thì hỏng từ gốc, và
hỏng nặng hơn là chỉ số ấy xấu.
