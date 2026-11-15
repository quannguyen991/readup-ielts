"""Tách nền đen khỏi ảnh chữ/họa tiết neon do ChatGPT vẽ (nền đen thuần) thành PNG nền trong suốt.

Cách làm: độ trong suốt = độ sáng lớn nhất của điểm ảnh (có đường cong nhẹ), màu = màu gốc chia lại cho độ trong suốt,
nên vầng sáng neon mờ dần tự nhiên khi đặt lên nền màu. Cắt theo thành phần liên thông rồi xếp theo hàng/cột.

Dùng:  python neon_key.py titles <ảnh> <thư mục ra> tên1,tên2,tên3     (mỗi tên là một hàng chữ, từ trên xuống)
       python neon_key.py grid   <ảnh> <thư mục ra> cột hàng tên1,...   (lưới cột x hàng, đọc từ trái sang phải)
"""
import sys, os
import numpy as np
from PIL import Image
from scipy import ndimage as ndi


def key(im: Image.Image, floor=26, ceil=235):
    a = np.asarray(im.convert('RGB')).astype(np.float32)
    m = a.max(axis=2)
    alpha = np.clip((m - floor) / (ceil - floor), 0, 1)
    alpha = alpha ** 0.85
    safe = np.maximum(alpha * 255.0, 1.0)[..., None]
    rgb = np.clip(a * (255.0 / np.maximum(m, 1.0))[..., None], 0, 255)
    rgb = np.where(alpha[..., None] > 0, rgb, 0)
    out = np.dstack([rgb, alpha * 255.0]).astype(np.uint8)
    return Image.fromarray(out, 'RGBA')


def components(alpha: np.ndarray, thr=70, grow=9):
    mask = alpha > thr
    mask = ndi.binary_dilation(mask, iterations=grow)
    lab, n = ndi.label(mask)
    return lab, n


def crop_pad(img: Image.Image, box, pad=14):
    x0, y0, x1, y1 = box
    return img.crop((max(0, x0 - pad), max(0, y0 - pad), min(img.width, x1 + pad), min(img.height, y1 + pad)))


def main():
    mode, src, out, *rest = sys.argv[1:]
    os.makedirs(out, exist_ok=True)
    im = Image.open(src)
    rgba = key(im)
    alpha = np.asarray(rgba)[..., 3]
    if mode == 'cells':
        cols, nrows = int(rest[0]), int(rest[1]); names = rest[2].split(',')
        arr0 = np.asarray(rgba).copy(); arr0[:34, :34, 3] = 0   # bỏ con trỏ chuột ở góc ảnh chụp
        alpha0 = arr0[..., 3]
        lab, n = components(alpha0, grow=10)
        w, h = rgba.width / cols, rgba.height / nrows
        cents = ndi.center_of_mass(lab > 0, lab, range(1, n + 1))
        areas = ndi.sum(lab > 0, lab, range(1, n + 1))
        for k, name in enumerate(names):
            r, c = divmod(k, cols)
            ids = [i + 1 for i, (cy, cx) in enumerate(cents) if areas[i] > 400 and c * w <= cx < (c + 1) * w and r * h <= cy < (r + 1) * h]
            keep = ndi.binary_dilation(np.isin(lab, ids), iterations=26)
            arr = arr0.copy(); arr[..., 3] = np.where(keep, alpha0, 0)
            im = Image.fromarray(arr, 'RGBA')
            bb = Image.fromarray((arr[..., 3] > 22).astype(np.uint8) * 255).getbbox()
            im = crop_pad(im, bb, pad=6)
            im.save(os.path.join(out, name + '.png')); print(name, im.size, len(ids))
        return
    lab, n = components(alpha, grow=(24 if mode == "grid" else 9))
    objs = ndi.find_objects(lab)
    items = []
    for i, sl in enumerate(objs):
        if sl is None:
            continue
        ys, xs = sl
        area = int((lab[sl] == i + 1).sum())
        if area < 900:
            continue
        items.append({'box': (xs.start, ys.start, xs.stop, ys.stop), 'cy': (ys.start + ys.stop) / 2, 'cx': (xs.start + xs.stop) / 2, 'lab': i + 1})
    if mode == 'titles':
        names = rest[0].split(',')
        # Gộp mọi thành phần vào hàng gần nhất theo trục dọc (chia đều theo thứ tự cy).
        items.sort(key=lambda t: t['cy'])
        rows = [[] for _ in names]
        ys = [t['cy'] for t in items]
        lo, hi = min(ys), max(ys)
        for t in items:
            r = min(len(names) - 1, int((t['cy'] - lo) / (hi - lo + 1e-6) * len(names)))
            rows[r].append(t)
        for name, row in zip(names, rows):
            x0 = min(t['box'][0] for t in row); y0 = min(t['box'][1] for t in row)
            x1 = max(t['box'][2] for t in row); y1 = max(t['box'][3] for t in row)
            keep = np.isin(lab, [t['lab'] for t in row])
            keep = ndi.binary_dilation(keep, iterations=22)
            arr = np.asarray(rgba).copy()
            arr[..., 3] = np.where(keep, arr[..., 3], 0)
            sub = crop_pad(Image.fromarray(arr, 'RGBA'), (x0, y0, x1, y1))
            sub.save(os.path.join(out, name + '.png'))
            print(name, sub.size, len(row))
    else:
        cols, nrows = int(rest[0]), int(rest[1])
        names = rest[2].split(',')
        items.sort(key=lambda t: t['cy'])
        per = len(items) // nrows if len(items) % nrows == 0 else None
        if per is None:
            # Chia hàng theo khoảng trống lớn nhất giữa các cy.
            cys = np.array([t['cy'] for t in items]); gaps = np.diff(cys); cut = sorted(np.argsort(gaps)[-(nrows - 1):] + 1)
            groups = np.split(np.arange(len(items)), cut)
        else:
            groups = [np.arange(r * per, (r + 1) * per) for r in range(nrows)]
        ordered = []
        for g in groups:
            ordered += sorted([items[i] for i in g], key=lambda t: t['cx'])
        print('found', len(ordered), 'wanted', len(names))
        for name, t in zip(names, ordered):
            keep = ndi.binary_dilation(lab == t['lab'], iterations=22)
            arr = np.asarray(rgba).copy()
            arr[..., 3] = np.where(keep, arr[..., 3], 0)
            sub = crop_pad(Image.fromarray(arr, 'RGBA'), t['box'])
            sub.save(os.path.join(out, name + '.png'))
            print(name, sub.size)


main()
