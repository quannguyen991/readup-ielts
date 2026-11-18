"""Sinh ảnh bìa gốc (tự vẽ bằng Codex, không lấy từ báo nào) cho bài song ngữ. Mỗi lượt vẽ một tấm 2x2 bốn bài.

  python -X utf8 -I gen_sheets.py [--workers 5] [--limit N]
Ra: raw/sheet-XX.png (XX = số thứ tự nhóm 4 bài), map.json (sheet -> 4 id). Chạy lại sẽ bỏ qua tấm đã có.
"""
import argparse
import json
import shutil
import subprocess
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
RAW = HERE / "raw"
RAW.mkdir(exist_ok=True)

arts = json.loads((ROOT / "src/data/seed/bilingual/index.json").read_text(encoding="utf8"))
groups = [arts[i:i + 4] for i in range(0, len(arts), 4)]
(HERE / "map.json").write_text(json.dumps({f"sheet-{i:02d}": [a["id"] for a in g] for i, g in enumerate(groups)}, ensure_ascii=False, indent=1), encoding="utf8")

STYLE = (
    "Modern editorial magazine illustration, flat shapes with soft grain and gentle gradients, rich but harmonious colour, "
    "one clear central subject per panel, generous depth, no people's faces in close-up, no text, no letters, no numbers, no logos, no watermark."
)


def prompt(i, g):
    panels = "; ".join(f"Panel {n + 1} (top-left, top-right, bottom-left, bottom-right in order): about '{a['titleEn']}' - {a.get('standfirstEn', '')[:140]}" for n, a in enumerate(g))
    return (
        f"Use your built-in image generation tool to create ONE landscape image made of a 2x2 grid of four separate 3:2 illustrations, "
        f"separated by clean pure-white gutters about 24px wide, with a white outer border. Each panel is a cover illustration for an English reading article. {panels}. "
        f"Style for all four panels: {STYLE} "
        f"Save the final image into the current directory as sheet-{i:02d}.png and print its filename."
    )


def run(i, g):
    out = RAW / f"sheet-{i:02d}.png"
    if out.exists():
        return i, "bỏ qua"
    t0 = time.time()
    try:
        r = subprocess.run(["cmd", "/c", "codex", "exec", "--skip-git-repo-check", "-s", "workspace-write", "-C", str(RAW), "-"],
                           input=prompt(i, g).encode("utf8"), capture_output=True, timeout=600, cwd=str(RAW))
        (RAW / f"log-{i:02d}.txt").write_bytes(r.stdout[-3000:] + r.stderr[-1500:])
    except subprocess.TimeoutExpired:
        return i, "quá giờ"
    return i, ("ok" if out.exists() else "không có ảnh") + f" ({int(time.time() - t0)}s)"


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--workers", type=int, default=5)
    ap.add_argument("--limit", type=int, default=0)
    a = ap.parse_args()
    todo = [(i, g) for i, g in enumerate(groups) if not (RAW / f"sheet-{i:02d}.png").exists()]
    if a.limit:
        todo = todo[: a.limit]
    print(f"{len(todo)} tấm cần vẽ", flush=True)
    with ThreadPoolExecutor(max_workers=a.workers) as ex:
        futs = []
        for n, (i, g) in enumerate(todo):
            futs.append(ex.submit(run, i, g))
            time.sleep(5 if n < a.workers else 0)
        for f in futs:
            print(*f.result(), flush=True)
