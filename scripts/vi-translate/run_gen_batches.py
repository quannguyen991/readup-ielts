"""Sinh nội dung bằng Codex CLI (tài khoản ChatGPT) theo lô, có kiểm tự động và chạy tiếp được.

  python -X utf8 -I run_gen_batches.py def  [--size 70] [--workers 6]   # định nghĩa tiếng Anh cho từ tiếng Anh (work-def)
  python -X utf8 -I run_gen_batches.py ex   [--size 40] [--workers 6]   # câu ví dụ cho từ Trung/Nhật chưa có (work-ex)

Vào: work-<task>/todo.json   Ra: work-<task>/out/batch-XXXX.json (mục hợp lệ) và partial-XXXX.json (lô còn mục lỗi).
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
CJK = re.compile(r"[぀-ヿ㐀-鿿]")
VI = re.compile(r"[ăâđêôơưáàảãạấầẩẫậắằẳẵặẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]", re.I)  # bỏ é/è: có trong "café"

PROMPT_DEF = """You are an English learner's-dictionary editor (like Oxford Learner's / Cambridge).
Below (inside <INPUT>) is a JSON array of English words. Each item has: id, word, pos (part of speech, may be odd), vi (a Vietnamese meaning that tells you which sense is meant), ex (an example sentence, may be empty).

Answer with ONE JSON array, exactly one element per item, in the same order: {"id": "<same id>", "def": "<English definition>"}

RULES
1. "def" is a short, clear learner's-dictionary definition of the sense indicated by `vi` and `ex`, in simple English (A2–B2 vocabulary), at most about 110 characters, no Vietnamese.
2. Do NOT use the headword (or its inflection) inside its own definition. Style: nouns "a/an/the …" or "the state of …"; verbs "to …"; adjectives "having/showing …" or "very …"; adverbs "in a … way"; for pronouns, prepositions and other function words describe the use, e.g. "used to refer to a man or boy already mentioned".
3. Do not skip or add items; keep every `id`.
4. Your final answer must be ONLY the valid JSON array (UTF-8): no markdown fences, no explanation, no commands, do not read or write files."""

PROMPT_EX = """You are a Chinese/Japanese language-teaching content writer.
Below (inside <INPUT>) is a JSON array of vocabulary items. Each has: id, lang ("zh" or "ja"), w (the word), r (romaji, ja only), p (pinyin/reading), vi (Vietnamese meaning), g (English gloss), o (part of speech).

For EACH item write ONE short, natural example sentence that uses the word `w` in the sense given by vi/g, at a level suitable for learners (HSK 1–6 for zh, JLPT N5–N1 for ja; 8–25 characters; everyday or neutral content; no names of real people). Answer with ONE JSON array, one element per item in the same order:
{"id": "<same id>", "ex": "<sentence in Chinese or Japanese>", "exVi": "<natural Vietnamese translation>", "exEn": "<natural English translation>", "exReading": "<reading>"}

RULES
1. `ex` must contain the word `w` itself (you may conjugate verbs/adjectives in Japanese). Use simplified Chinese characters for zh.
2. `exReading`: for ja the whole sentence in hiragana/katakana with spaces only between words if natural (no kanji); for zh the pinyin of the whole sentence with tone marks, syllables separated by spaces, no punctuation.
3. `exVi` is in Vietnamese with full diacritics; `exEn` is in English; neither contains Chinese/Japanese characters.
4. Do not skip or add items; keep every `id`.
5. Your final answer must be ONLY the valid JSON array (UTF-8): no markdown fences, no explanation, no commands, do not read or write files."""


def stem_ok(w, ex):
    if w in ex:
        return True
    # tiếng Nhật chia động từ / tính từ: bỏ đuôi rồi tìm gốc
    core = re.sub(r"(する|る|い|く|ぐ|す|つ|ぬ|ぶ|む|う)$", "", w)
    return len(core) >= 1 and core in ex


def v_def(it, g):
    d = (g.get("def") or "").strip()
    if not d or len(d) > 170 or len(d) < 3 or CJK.search(d) or VI.search(d):
        return None, "def không hợp lệ"
    return {"id": it["id"], "def": d}, None


def v_ex(it, g):
    ex = (g.get("ex") or "").strip()
    vi = (g.get("exVi") or "").strip()
    en = (g.get("exEn") or "").strip()
    rd = (g.get("exReading") or "").strip()
    if not ex or not CJK.search(ex) or not stem_ok(it["w"], ex):
        return None, "ex không chứa từ"
    if len(vi) < 4 or not VI.search(vi) or CJK.search(vi):
        return None, "exVi không hợp lệ"
    if len(en) < 4 or CJK.search(en) or VI.search(en):
        return None, "exEn không hợp lệ"
    if len(rd) < 2 or (it["lang"] == "zh" and not re.search(r"[A-Za-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]", rd)) or (it["lang"] == "ja" and not re.search(r"[぀-ヿ]", rd)):
        return None, "exReading không hợp lệ"
    return {"id": it["id"], "ex": ex, "exVi": vi, "exEn": en, "exReading": rd}, None


TASKS = {"def": (PROMPT_DEF, v_def, 70), "ex": (PROMPT_EX, v_ex, 40)}


def run_one(task, idx, batch, out_dir):
    prompt_head, check, _ = TASKS[task]
    f = out_dir / f"batch-{idx:04d}.json"
    if f.exists():
        return idx, "bỏ qua", 0
    t0 = time.time()
    tmp = Path(tempfile.mkdtemp(prefix=f"g{task}{idx}-"))
    try:
        last = tmp / "last.txt"
        slim = [{k: v for k, v in it.items() if k != "key"} for it in batch]
        prompt = prompt_head + "\n\n<INPUT>\n" + json.dumps(slim, ensure_ascii=False) + "\n</INPUT>"
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
        by_id = {g["id"]: g for g in got if isinstance(g, dict) and isinstance(g.get("id"), str)}
        good, bad = {}, []
        for it in batch:
            g = by_id.get(it["id"])
            if not g:
                bad.append((it["id"], "thiếu"))
                continue
            rec, why = check(it, g)
            if rec:
                good[it["id"]] = rec
            else:
                bad.append((it["id"], why))
        if bad:
            (out_dir / f"partial-{idx:04d}.json").write_text(json.dumps({"good": good, "bad": bad}, ensure_ascii=False), encoding="utf8")
            return idx, f"{len(good)}/{len(batch)} hợp lệ", int(time.time() - t0)
        f.write_text(json.dumps(list(good.values()), ensure_ascii=False), encoding="utf8")
        return idx, f"ok {len(good)}", int(time.time() - t0)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("task", choices=list(TASKS))
    ap.add_argument("--size", type=int, default=0)
    ap.add_argument("--workers", type=int, default=6)
    ap.add_argument("--limit", type=int, default=0)
    a = ap.parse_args()
    size = a.size or TASKS[a.task][2]
    work = HERE / f"work-{a.task}"
    out_dir = work / "out"
    out_dir.mkdir(parents=True, exist_ok=True)
    todo = json.loads((work / "todo.json").read_text(encoding="utf8"))
    done = set()
    for p in out_dir.glob("batch-*.json"):
        done.update(x["id"] for x in json.loads(p.read_text(encoding="utf8")))
    for p in out_dir.glob("partial-*.json"):
        done.update(json.loads(p.read_text(encoding="utf8"))["good"].keys())
    rest = [x for x in todo if x["id"] not in done]
    batches = [rest[i:i + size] for i in range(0, len(rest), size)]
    if a.limit:
        batches = batches[: a.limit]
    used = [int(p.stem.split("-")[1]) for p in list(out_dir.glob("batch-*.json")) + list(out_dir.glob("partial-*.json"))]
    start = (max(used) + 1) if used else 0
    print(f"[{a.task}] còn {len(rest)} mục → {len(batches)} lô (≤{size}), {a.workers} luồng", flush=True)
    with ThreadPoolExecutor(max_workers=a.workers) as ex:
        futs = []
        for n, b in enumerate(batches):
            futs.append(ex.submit(run_one, a.task, start + n, b, out_dir))
            time.sleep(3 if n < a.workers else 0)
        for fu in futs:
            idx, msg, sec = fu.result()
            print(f"lô {idx:04d}: {msg} ({sec}s)", flush=True)


if __name__ == "__main__":
    main()
