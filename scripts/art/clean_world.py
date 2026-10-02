"""Tạo bản "biển sạch" của bản đồ thế giới Du ngoạn: xoá mây, tàu, cá voi, hải âu VẼ SẴN trong ảnh
để các thứ đó do mã vẽ và CHUYỂN ĐỘNG (không bị bóng ma đứng yên bên dưới).
  python scripts/art/clean_world.py
Vào : public/travel/maps/world.png (1672×940 = lưới pixel 418×235 phóng 4×)
Ra  : public/travel/maps/world-clean.png (cùng cỡ) + public/travel/maps/world-sea.json (mặt nạ biển, nén RLE, để mã biết chỗ nào là nước)
Cách làm: với mỗi vùng cần xoá, tìm trong ảnh một mảnh BIỂN THUẦN có viền khớp nhất rồi chép đè (vá theo mẫu); không mờ, giữ nguyên kết cấu pixel.
Không đụng đất liền, điểm sáng thành phố, đường bay, hay cụm đảo/đá ở Việt Nam."""
import json, pathlib, sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

sys.stdout.reconfigure(encoding="utf-8")
ROOT = pathlib.Path(__file__).resolve().parents[2]
SRC = ROOT / "public/travel/maps/world.png"
OUT = ROOT / "public/travel/maps/world-clean.png"
SEA = ROOT / "public/travel/maps/world-sea.json"

big = np.array(Image.open(SRC).convert("RGB"))
H4, W4 = big.shape[:2]
assert (W4, H4) == (1672, 940), (W4, H4)
im = big[::4, ::4].copy()          # 235 × 418
H, W = im.shape[:2]
r, g, b = [im[..., i].astype(int) for i in range(3)]

water = (b > r + 55) & (b >= g - 5)
light = (np.minimum(np.minimum(r, g), b) > 150) & ((np.maximum(np.maximum(r, g), b) - np.minimum(np.minimum(r, g), b)) < 55)

# ----- mây: thành phần sáng có viền chủ yếu là nước
lab, n = ndi.label(ndi.binary_dilation(light, iterations=1), structure=np.ones((3, 3)))
cloud = np.zeros((H, W), bool)
for i in range(1, n + 1):
    comp = lab == i
    area = comp.sum()
    if area < 6:
        continue
    ring = ndi.binary_dilation(comp, iterations=3) & ~comp
    if ring.sum() and water[ring].mean() >= 0.5:
        cloud |= comp

# ----- vùng thủ công (px nguồn 1672×940 → /4): tàu, cá voi + vòi nước, hải âu
BOXES = [
    (10, 305, 105, 400),     # thuyền buồm trái
    (840, 625, 940, 715),    # thuyền buồm giữa
    (1200, 680, 1270, 755),  # thuyền nhỏ phải
    (90, 650, 205, 750),     # cá voi trái + vòi
    (795, 785, 1020, 885),   # cá voi dưới + vòi
    (1540, 535, 1655, 605),  # cá voi phải
    (740, 695, 840, 785),    # hải âu
    (845, 655, 945, 725),    # tàu còn sót
    (790, 795, 1010, 860),   # cá voi còn sót
    (40, 300, 90, 340),      # mảnh tàu trái
    (1540, 520, 1672, 620),  # cá voi phải + vòi
    (0, 770, 40, 840), (140, 860, 240, 910), (640, 850, 790, 900), (1050, 770, 1140, 840),  # mây còn sót
]
# máy bay VẼ SẴN trên đất liền (thay bằng máy bay chạy thật): vá bằng mẫu đất gần đó
LAND_BOXES = [(750, 205, 870, 280)]
manual = np.zeros((H, W), bool)
for x0, y0, x1, y1 in BOXES:
    manual[y0 // 4:y1 // 4 + 1, x0 // 4:x1 // 4 + 1] = True

landbox = np.zeros((H, W), bool)
for x0, y0, x1, y1 in LAND_BOXES:
    landbox[y0 // 4:y1 // 4 + 1, x0 // 4:x1 // 4 + 1] = True
plane_px = ndi.binary_dilation(landbox & (light | (np.maximum(np.maximum(r, g), b) < 70)), iterations=2) & landbox
target = ndi.binary_dilation(cloud | manual, iterations=1) | plane_px
# vùng đã "bẩn" (không được lấy làm mẫu)
dirty = ndi.binary_dilation(target, iterations=1)

out = im.copy()
lab_t, nt = ndi.label(target, structure=np.ones((3, 3)))
landish = ((r > b) | (g > b + 3)) & ~light
clean_water = ~landish & ~dirty
integral_ok = ndi.uniform_filter(clean_water.astype(float), size=1)  # giữ API đơn giản; kiểm theo từng mảnh bên dưới


def patch_ok(y, x, h, w):
    return clean_water[y:y + h, x:x + w].all()


rng = np.random.default_rng(7)
filled = skipped = 0
TILE = 8
todo = np.argwhere(target)
done = np.zeros((H, W), bool)
# tô theo ô vuông TILE×TILE: mỗi ô có phần mặt nạ thì vá một lần
for ty in range(0, H, TILE):
    for tx in range(0, W, TILE):
        m_full = target[ty:ty + TILE, tx:tx + TILE]
        if not m_full.any():
            continue
        Y0, X0 = max(0, ty - 1), max(0, tx - 1)
        Y1, X1 = min(H, ty + TILE + 1), min(W, tx + TILE + 1)
        h, w = Y1 - Y0, X1 - X0
        m = np.zeros((h, w), bool)
        m[ty - Y0:ty - Y0 + m_full.shape[0], tx - X0:tx - X0 + m_full.shape[1]] = m_full
        ring = ndi.binary_dilation(m, iterations=2) & ~m & ~target[Y0:Y1, X0:X1]
        tgt = out[Y0:Y1, X0:X1].astype(int)
        best, bs = None, 1e18
        is_land_tile = bool((plane_px[Y0:Y1, X0:X1] & m).any())
        for _ in range(9000 if is_land_tile else 6000):
            if is_land_tile:
                y = int(np.clip(Y0 + rng.integers(-60, 60), 0, H - h)); x = int(np.clip(X0 + rng.integers(-70, 70), 0, W - w))
                if dirty[y:y + h, x:x + w].any() or light[y:y + h, x:x + w].any():
                    continue
            else:
                y = int(rng.integers(0, H - h)); x = int(rng.integers(0, W - w))
                if not patch_ok(y, x, h, w):
                    continue
            cand = im[y:y + h, x:x + w].astype(int)
            d = ((cand - tgt) ** 2).sum(-1)[ring].mean() if ring.any() else 0
            d += 0.004 * np.hypot(y - Y0, x - X0)
            if d < bs:
                bs, best = d, (y, x)
        if best is None:
            skipped += 1
            print("không có mảnh sạch cho ô", (tx, ty))
            continue
        y, x = best
        out[Y0:Y1, X0:X1][m] = im[y:y + h, x:x + w][m]
        filled += 1

nt = filled + skipped

res = np.kron(out, np.ones((4, 4, 1), dtype=np.uint8))
Image.fromarray(res).save(OUT, optimize=True)

# mặt nạ biển SAU khi xoá (dùng để đặt tàu / sóng / mây ở nơi có nước)
r2, g2, b2 = [out[..., i].astype(int) for i in range(3)]
sea = (b2 > r2 + 55) & (b2 >= g2 - 5)
sea = ndi.binary_opening(sea, iterations=1)
rows = []
for yy in range(H):
    runs, x = [], 0
    while x < W:
        if sea[yy, x]:
            s = x
            while x < W and sea[yy, x]:
                x += 1
            runs.append([s, x - s])
        else:
            x += 1
    rows.append(runs)
SEA.write_text(json.dumps({"w": W, "h": H, "rows": rows}, separators=(",", ":")), encoding="utf-8")
print(f"mây {int(cloud.sum())} px, vùng thủ công {int(manual.sum())} px, đã vá {filled}/{nt} vùng → {OUT.name}; biển {sea.mean():.0%}")
