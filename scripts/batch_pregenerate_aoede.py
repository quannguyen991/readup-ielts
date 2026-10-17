"""
Batch pre-generation tool for Aoede voice.
Reads any text file (one line per sentence) or JSON array,
calls local API endpoint (http://localhost:8081/api/speaking/voice) to generate and save to disk cache.
Already cached items are skipped instantly (0ms, 0 API calls).
"""
import sys
import json
import time
import pathlib
import urllib.request
import urllib.error

API_URL = "http://localhost:8081/api/speaking/voice"

def pregenerate_sentence(text: str) -> bool:
    text = text.strip()
    if not text:
        return False
    payload = json.dumps({"text": text}).encode("utf-8")
    req = urllib.request.Request(API_URL, data=payload, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=30) as res:
            return res.status == 200
    except Exception as e:
        print(f"Error on '{text[:30]}...': {e}")
        return False

def main():
    if len(sys.argv) < 2:
        print("Cách dùng:")
        print("  python scripts/batch_pregenerate_aoede.py <file_chua_cac_cau.txt_hoac_json>")
        print("Ví dụ:")
        print("  python scripts/batch_pregenerate_aoede.py sentences.txt")
        return

    filepath = pathlib.Path(sys.argv[1])
    if not filepath.exists():
        print(f"Không tìm thấy file: {filepath}")
        return

    raw = filepath.read_text(encoding="utf-8")
    if filepath.suffix == ".json":
        data = json.loads(raw)
        if isinstance(data, list):
            items = [str(x) for x in data]
        elif isinstance(data, dict):
            items = list(data.values()) if all(isinstance(v, str) for v in data.values()) else list(data.keys())
        else:
            items = []
    else:
        items = [line.strip() for line in raw.splitlines() if line.strip()]

    print(f"Tìm thấy {len(items)} câu cần xử lý...")
    success = 0
    for idx, item in enumerate(items, 1):
        t0 = time.time()
        ok = pregenerate_sentence(item)
        dur = time.time() - t0
        status = "OK" if ok else "FAIL"
        cached_hint = "(Đã cache sẵn từ trước)" if dur < 0.1 else f"({dur:.2f}s từ API)"
        print(f"[{idx}/{len(items)}] {status} {cached_hint} -> {item[:50]}...")
        if ok:
            success += 1
        # Nhẹ nhàng không làm quá tải nếu gọi API mới
        if dur > 0.1:
            time.sleep(0.5)

    print(f"\nHoàn tất! Đã lưu thành công {success}/{len(items)} câu vào ổ cứng.")
    print("Từ nay về sau, các câu này sẽ phát ngay lập tức (0ms) và hoàn toàn KHÔNG CẦN gọi API nữa!")

if __name__ == "__main__":
    main()
