"""Dịch SANG TIẾNG ANH bằng Codex CLI (tài khoản ChatGPT): nghĩa Anh cho từ HSK 3.0 và bản dịch Anh cho câu ví dụ.

Chạy:  python -X utf8 -I run_en_batches.py [--size 70] [--workers 3] [--limit N]
Vào :  work-en/todo.json (extract_en.py)
Ra  :  work-en/out/batch-XXXX.json  — chạy lại sẽ bỏ qua mục đã xong. Mỗi mục ra {"id", "g"?, "exEn"?}.
"""
import argparse
import json
import re
import shutil
import subprocess
import tempfile
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

HERE = Path(__file__).resolve().parent
WORK = HERE / "work-en"
OUT = WORK / "out"
OUT.mkdir(parents=True, exist_ok=True)

PROMPT = """You are a professional Chinese–English and Japanese–English dictionary translator.
Below (inside <INPUT>) is a JSON array of vocabulary items. Each item has: id, lang ("zh" or "ja"), w (the word), p (pinyin or reading, may be empty), vi (a Vietnamese meaning, only to help disambiguate), ex (an example sentence in Chinese/Japanese, may be empty), needGloss (true/false).

Answer with ONE JSON array, exactly one element per item, in the same order, shaped like:
{"id": "<same id>", "g": "<English gloss>", "exEn": "<English translation of ex>"}

RULES
1. "g": include it ONLY when needGloss is true. A concise English dictionary gloss for the word `w`: 1 to 3 common senses separated by "; ", lower-case unless a proper noun, at most about 70 characters, using the Vietnamese meaning `vi` and pinyin `p` to pick the right sense (e.g. 行 háng → "row; line; profession"). Never leave Chinese/Japanese characters or Vietnamese words in it. Omit "g" when needGloss is false.
2. "exEn": include it ONLY when `ex` is not empty. Translate the sentence `ex` into natural, fluent English (faithful to the original, neutral register, keep names). No Chinese/Japanese characters, no Vietnamese. Omit "exEn" when `ex` is empty (never invent a sentence).
3. Do not skip or add items; keep every `id`.
4. Your final answer must be ONLY the valid JSON array (UTF-8): no markdown fences, no explanation, no commands, do not read or write files."""

CJK = re.compile(r"[぀-ヿ㐀-鿿]")
VI = re.compile(r"[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]", re.I)


def validate(batch, got):
    by_id = {g["id"]: g for g in got if isinstance(g, dict) and isinstance(g.get("id"), str)} if isinstance(got, list) else {}
    good, bad = {}, []
    for it in batch:
        g = by_id.get(it["id"])
        if not g:
            bad.append((it["id"], "thiếu"))
            continue
        rec = {"id": it["id"]}
        if it["needGloss"]:
            gl = (g.get("g") or "").strip()
            if not gl or len(gl) > 120 or CJK.search(gl) or VI.search(gl):
                bad.append((it["id"], "g không hợp lệ"))
                continue
            rec["g"] = gl
        if it["ex"]:
            e = (g.get("exEn") or "").strip()
            if len(e) < 4 or CJK.search(e) or VI.search(e):
                bad.append((it["id"], "exEn không hợp lệ"))
                continue
            rec["exEn"] = e
        good[it["id"]] = rec
    return good, bad


def run_one(idx, batch):
    f = OUT / f"batch-{idx:04d}.json"
    if f.exists():
        return idx, "bỏ qua", 0
    t0 = time.time()
    tmp = Path(tempfile.mkdtemp(prefix=f"en{idx}-"))
    try:
        last = tmp / "last.txt"
        slim = [{k: v for k, v in it.items()} for it in batch]
        prompt = PROMPT + "\n\n<INPUT>\n" + json.dumps(slim, ensure_ascii=False) + "\n</INPUT>"
        cmd = ["cmd", "/c", "codex", "exec", "--skip-git-repo-check", "-s", "read-only", "-C", str(tmp), "-c", 'model_reasoning_effort="low"', "-o", str(last), "-"]
        try:
            subprocess.run(cmd, input=prompt.encode("utf8"), capture_output=True, timeout=900, cwd=str(tmp))
        except subprocess.TimeoutExpired:
            return idx, "quá giờ", int(time.time() - t0)
        if not last.exists():
            return idx, "không có câu trả lời", int(time.time() - t0)
        text = last.read_text(encoding="utf8")
        i, j = text.find("["), text.rfind("]")
        try:
            got = json.loads(text[i:j + 1])
        except Exception as e:  # noqa: BLE001
            return idx, f"JSON hỏng: {str(e)[:60]}", int(time.time() - t0)
        good, bad = validate(batch, got)
        if bad:
            (OUT / f"partial-{idx:04d}.json").write_text(json.dumps({"good": good, "bad": bad}, ensure_ascii=False), encoding="utf8")
            return idx, f"{len(good)}/{len(batch)} hợp lệ", int(time.time() - t0)
        f.write_text(json.dumps(list(good.values()), ensure_ascii=False), encoding="utf8")
        return idx, f"ok {len(good)}", int(time.time() - t0)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--size", type=int, default=70)
    ap.add_argument("--workers", type=int, default=3)
    ap.add_argument("--limit", type=int, default=0)
    a = ap.parse_args()
    todo = json.loads((WORK / "todo.json").read_text(encoding="utf8"))
    done = set()
    for p in OUT.glob("batch-*.json"):
        done.update(x["id"] for x in json.loads(p.read_text(encoding="utf8")))
    for p in OUT.glob("partial-*.json"):
        done.update(json.loads(p.read_text(encoding="utf8"))["good"].keys())
    rest = [x for x in todo if x["id"] not in done]
    batches = [rest[i:i + a.size] for i in range(0, len(rest), a.size)]
    if a.limit:
        batches = batches[: a.limit]
    used = [int(p.stem.split("-")[1]) for p in list(OUT.glob("batch-*.json")) + list(OUT.glob("partial-*.json"))]
    start = (max(used) + 1) if used else 0
    print(f"còn {len(rest)} mục → {len(batches)} lô (≤{a.size}), {a.workers} luồng", flush=True)
    with ThreadPoolExecutor(max_workers=a.workers) as ex:
        futs = []
        for n, b in enumerate(batches):
            futs.append(ex.submit(run_one, start + n, b))
            time.sleep(4 if n < a.workers else 0)
        for fu in futs:
            idx, msg, sec = fu.result()
            print(f"lô {idx:04d}: {msg} ({sec}s)", flush=True)


if __name__ == "__main__":
    main()
