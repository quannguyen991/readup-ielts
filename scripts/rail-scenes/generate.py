"""
Sinh ảnh nền pixel-art cho Toa Từ Vựng bằng model ảnh của ai-box
(home.ai-box.vn, qwen-image-3.0-pro), mỗi ga × 3 buổi.

    python scripts/rail-scenes/generate.py              # sinh ảnh còn thiếu
    python scripts/rail-scenes/generate.py hanoi tokyo  # chỉ vài ga
    python scripts/rail-scenes/generate.py --process    # chỉ chạy lại bước nén

- Khoá đọc từ D:/Claude/.secrets/aibox-home.{base,key} — KHÔNG ghi vào repo.
- Ảnh gốc (1664x928 PNG) lưu ngoài repo ở D:/Claude/readup-rail-raw/.
- Ảnh vào app: public/rail/<ga>-<buổi>.webp, 832x464.
- Đã có thì bỏ qua (chạy lại an toàn); lỗi thì thử lại 3 lần.
"""
import json
import sys
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from PIL import Image

HERE = Path(__file__).parent
ROOT = HERE.parent.parent
RAW = Path("D:/Claude/readup-rail-raw")
OUT = ROOT / "public" / "rail"
SECRETS = Path("D:/Claude/.secrets")
MODEL = "qwen-image-3.0-pro"
# Cổng ai-box chặn User-Agent mặc định của Python (403), curl thì qua.
UA = "curl/8.9.1"

TIMES = {
    "day": "bright clear daytime, blue sky with soft white pixel clouds, sunlight",
    "sunset": "golden-hour sunset, glowing orange, pink and purple gradient sky, warm light, many windows lit warm yellow",
    "night": "night time, deep navy blue starry sky, moon, city lights and glowing yellow windows, lights reflecting on water",
}

STYLE = (
    "Detailed 16-bit pixel art panorama, retro video game background, crisp pixels, rich but limited palette, "
    "seen from a train window, wide cinematic landscape, horizon in the lower third, "
    "an empty flat green grass strip along the very bottom edge of the image, "
    "no train, no railway, no text, no letters, no watermark, no people in the foreground. "
    "Full-bleed image filling the whole canvas edge to edge: no border, no frame, no rounded corners, no vignette."
)


def prompt(city: dict, t: str) -> str:
    return f"{STYLE} Scene: {city['scene']} Time: {TIMES[t]}."


def call(p: str) -> bytes:
    base = (SECRETS / "aibox-home.base").read_text().strip()
    key = (SECRETS / "aibox-home.key").read_text().strip()
    body = json.dumps({"model": MODEL, "prompt": p, "size": "1664x928", "n": 1}).encode()
    req = urllib.request.Request(f"{base}/images/generations", data=body, headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json", "User-Agent": UA})
    with urllib.request.urlopen(req, timeout=300) as r:
        d = json.loads(r.read())
    url = d["data"][0]["url"]
    with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=120) as r:
        return r.read()


def process(raw: Path, out: Path) -> None:
    im = Image.open(raw).convert("RGB")
    im = im.resize((832, 464), Image.LANCZOS)
    out.parent.mkdir(parents=True, exist_ok=True)
    im.save(out, "WEBP", quality=86, method=6)


def job(city: dict, t: str) -> str:
    cid = city["id"]
    raw = RAW / f"{cid}-{t}.png"
    out = OUT / f"{cid}-{t}.webp"
    if not raw.exists():
        for attempt in range(3):
            try:
                t0 = time.time()
                data = call(prompt(city, t))
                RAW.mkdir(parents=True, exist_ok=True)
                raw.write_bytes(data)
                print(f"OK   {cid}-{t} {time.time() - t0:.0f}s", flush=True)
                break
            except Exception as e:  # noqa: BLE001 — in lỗi rồi thử lại
                print(f"LỖI  {cid}-{t} lần {attempt + 1}: {str(e)[:160]}", flush=True)
                time.sleep(5 * (attempt + 1))
        else:
            return f"HỎNG {cid}-{t}"
    if not out.exists() or "--process" in sys.argv:
        process(raw, out)
    return f"xong {cid}-{t}"


def main() -> None:
    cities = json.loads((HERE / "prompts.json").read_text(encoding="utf-8"))
    only = [a for a in sys.argv[1:] if not a.startswith("--")]
    if only:
        cities = [c for c in cities if c["id"] in only]
    jobs = [(c, t) for c in cities for t in (c.get("times") or list(TIMES))]
    print(f"{len(jobs)} ảnh", flush=True)
    with ThreadPoolExecutor(max_workers=3) as ex:
        for r in ex.map(lambda a: job(*a), jobs):
            if r.startswith("HỎNG"):
                print(r, flush=True)
    print("HẾT", flush=True)


if __name__ == "__main__":
    main()
