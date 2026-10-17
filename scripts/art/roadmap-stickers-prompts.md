# Prompt ChatGPT cho nhãn dán và huy hiệu bản đồ lộ trình

Đính kèm ảnh tham chiếu (bản đồ lộ trình) vào mỗi lượt để giữ phong cách. Mỗi tấm lưới vẽ trên nền trắng
thuần, không chữ, không bóng đổ trên nền. Sau khi tải về, cắt bằng:

    python scripts/art/cut-stickers.py <tam-luoi.png> public/roadmap/<thu-muc> <tien-to> 1500 10

Tên file đầu ra theo thứ tự đọc (trên xuống, trái sang). Đối chiếu `manifest.json` rồi đổi tên sang tên trong
`src/components/roadmap/stickers.ts` (cột `file`).

---

## Tấm A: nhãn dán trang trí (6 hình, lưới 3 x 2)

> Create a sheet of six cute sticker illustrations arranged in a 3 by 2 grid on a plain pure white background,
> in the same style as the reference image: soft pastel watercolor-cartoon, thick dark navy outline, a thin
> white die-cut border around each sticker, warm gold and green palette, no text, no shadows on the background.
> Each sticker is one isolated object with even spacing. Left to right, top to bottom:
> (1) a round leafy green tree with a few yellow flowers, (2) a tall rounded bush tree, (3) a navy cast-iron
> park lamp post with a warm glowing lantern, (4) a wooden park bench with green metal legs,
> (5) a stone circular fountain with blue water splashing, (6) a low bush with pink and white flowers.

Tên đề xuất: `tree-round`, `tree-tall`, `lamp`, `bench`, `fountain`, `bush-flowers`.

## Tấm B: công trình, biển, mây, biển chỉ đường (4 hình, lưới 2 x 2)

> Create a sheet of four cute sticker illustrations in a 2 by 2 grid on a plain pure white background, same
> style as the reference (soft pastel cartoon, thick dark navy outline, thin white die-cut border, no text).
> (1) a charming cream and red-roofed town hall with a small clock tower and arched windows, (2) a seaside
> promenade scene: a curved steel bridge over turquoise water with a railing, (3) two fluffy light-blue and
> white clouds as one sticker, (4) a wooden signpost with two arrow boards pointing left and right.

Tên đề xuất: `town-hall`, `sea-bridge`, `cloud-1`, `signpost`.

## Tấm C: huy hiệu các mốc (6 hình, lưới 3 x 2)

> Create six round milestone badge icons in a 3 by 2 grid on a plain pure white background, same style as the
> reference (glossy cartoon, thick dark navy outline, soft highlight, no text, no background):
> (1) gold coin with a white play triangle, (2) green coin with a white headphones icon,
> (3) green coin with a white open book icon, (4) green coin with a white pencil icon,
> (5) grey coin with a white padlock icon, (6) gold coin with a white check mark.

Tên đề xuất: `badge-play`, `badge-listen`, `badge-read`, `badge-write`, `badge-lock`, `badge-done`.
Các huy hiệu này đổi cho `BADGE_READY` trong `PathMap.tsx` theo kỹ năng (ví dụ `listening` ↔ `badge-listen`).

## Tấm D: linh vật cầm bản đồ (1 hình)

> Create one cute sticker of the same white lion mascot with a yellow mane and a green backpack, standing and
> holding an open blue folded map with both paws, winking, on a plain pure white background, same style as the
> reference, thick dark navy outline, no text.

Tên đề xuất: `lion-map` (dùng cho banner giai đoạn).

---

## Ghi chú

- Mỗi tấm lưới là một lượt ChatGPT. Mở một cuộc trò chuyện mới cho mỗi lô (xem ghi chú về Chrome treo khi
  trang chat quá dài).
- Sau khi cắt, kiểm tra trực quan từng PNG trước khi đổi `ready` sang true.
