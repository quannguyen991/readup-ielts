"""Dịch nghĩa tiếng Việt hàng loạt bằng Codex CLI (dùng tài khoản ChatGPT, không gọi API tính tiền).

Chạy:  python -X utf8 -I run_batches.py [--size 60] [--workers 3] [--limit N]
Vào :  work/todo.json (do extract.py tạo)
Ra  :  work/out/batch-XXXX.json  (mỗi lô một tệp, đã kiểm hợp lệ) — chạy lại sẽ bỏ qua lô đã xong, chỉ làm tiếp lô lỗi/thiếu.
Mỗi mục ra: {"id", "vi", "exVi"}; exVi chỉ có khi mục có câu ví dụ.
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
WORK = HERE / "work"
OUT = WORK / "out"
OUT.mkdir(parents=True, exist_ok=True)

PROMPT = """Bạn là biên dịch viên từ điển Nhật–Việt và Trung–Việt. Dưới đây là một mảng JSON các mục từ vựng (trong khối <INPUT>).
Mỗi mục có: id, lang ("ja" hoặc "zh"), w (từ), r (romaji, chỉ với tiếng Nhật), p (phiên âm), o (từ loại), g (nghĩa tiếng Anh, có thể nhiều nghĩa), ex (câu ví dụ gốc, có thể rỗng), exEn (bản dịch tiếng Anh của câu ví dụ).

Hãy trả lời bằng MỘT mảng JSON, đúng một phần tử cho mỗi mục, theo đúng thứ tự, dạng:
{"id": "<giữ nguyên id>", "vi": "<nghĩa tiếng Việt>", "exVi": "<bản dịch tiếng Việt của ex>"}

QUY TẮC:
1. `vi`: nghĩa tiếng Việt ngắn gọn, tự nhiên như từ điển cho người Việt học tiếng. Lấy 1 đến 3 nghĩa chính, cách nhau bằng "; ". Tối đa khoảng 70 ký tự. Ưu tiên nghĩa phổ biến nhất, bám theo từ loại `o` và ngữ cảnh của câu ví dụ. Từ Hán–Việt dùng khi tự nhiên (ví dụ 寄付 → "quyên góp; đóng góp"). Với động từ không thêm "để"; với tính từ/phó từ ghi như từ điển. KHÔNG chép nguyên tiếng Anh, KHÔNG chèn chữ Hán/kana vào nghĩa (trừ khi bắt buộc để phân biệt, đặt trong ngoặc).
2. `exVi`: chỉ khi `ex` không rỗng. Dịch sát nghĩa câu `ex` sang tiếng Việt tự nhiên, lịch sự vừa phải, đại từ trung tính ("tôi", "bạn", "anh/chị" nếu cần). Dùng `exEn` để đối chiếu nhưng dịch từ câu gốc. Nếu `ex` rỗng thì bỏ trường `exVi` (đừng tự bịa câu mới).
3. Không bỏ sót mục nào, không thêm mục. Giữ nguyên `id`. Viết có dấu tiếng Việt đầy đủ.
4. Câu trả lời cuối cùng của bạn phải CHỈ là mảng JSON hợp lệ (UTF-8), không bọc markdown, không giải thích, không chạy lệnh, không đọc hay ghi tệp."""

CJK = re.compile(r"[぀-ヿ㐀-鿿]")
VI_CHARS = re.compile(r"[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]", re.I)


def validate(batch, got):
    """Trả (danh sách mục hợp lệ theo id, danh sách id lỗi kèm lý do)."""
    by_id = {}
    if isinstance(got, list):
        for g in got:
            if isinstance(g, dict) and isinstance(g.get("id"), str):
                by_id[g["id"]] = g
    good, bad = {}, []
    for it in batch:
        g = by_id.get(it["id"])
        if not g:
            bad.append((it["id"], "thiếu"))
            continue
        vi = (g.get("vi") or "").strip()
        ex_vi = (g.get("exVi") or "").strip()
        if not vi or len(vi) > 140:
            bad.append((it["id"], "vi rỗng/quá dài"))
            continue
        if CJK.search(vi) and it["lang"] == "ja" and not re.search(r"\([^)]*[぀-鿿]", vi):
            bad.append((it["id"], "vi chứa chữ Nhật"))
            continue
        # nghĩa Việt phải khác nguyên văn tiếng Anh, và nếu dài thì phải có dấu tiếng Việt
        if len(vi) > 8 and vi.lower() == (it["g"] or "").strip().lower():
            bad.append((it["id"], "vi trùng tiếng Anh"))
            continue
        if len(vi) > 12 and not VI_CHARS.search(vi):
            bad.append((it["id"], "vi không có dấu Việt"))
            continue
        if it["ex"] and (len(ex_vi) < 4 or (len(ex_vi) > 10 and not VI_CHARS.search(ex_vi))):
            bad.append((it["id"], "exVi thiếu/không phải tiếng Việt"))
            continue
        rec = {"id": it["id"], "vi": vi}
        if it["ex"]:
            rec["exVi"] = ex_vi
        good[it["id"]] = rec
    return good, bad


def run_one(idx, batch):
    f = OUT / f"batch-{idx:04d}.json"
    if f.exists():
        return idx, "bỏ qua (đã xong)", 0
    t0 = time.time()
    tmp = Path(tempfile.mkdtemp(prefix=f"vi{idx}-"))
    try:
        last = tmp / "last.txt"
        prompt = PROMPT + "\n\n<INPUT>\n" + json.dumps(batch, ensure_ascii=False) + "\n</INPUT>"
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
            return idx, f"JSON hỏng: {e}", int(time.time() - t0)
        good, bad = validate(batch, got)
        if bad:
            part = OUT / f"partial-{idx:04d}.json"
            part.write_text(json.dumps({"good": good, "bad": bad}, ensure_ascii=False), encoding="utf8")
            return idx, f"{len(good)}/{len(batch)} hợp lệ; lỗi: {bad[:3]}", int(time.time() - t0)
        f.write_text(json.dumps(list(good.values()), ensure_ascii=False), encoding="utf8")
        return idx, f"ok {len(good)}", int(time.time() - t0)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--size", type=int, default=60)
    ap.add_argument("--workers", type=int, default=3)
    ap.add_argument("--limit", type=int, default=0, help="chỉ chạy N lô đầu (để thử)")
    a = ap.parse_args()
    todo = json.loads((WORK / "todo.json").read_text(encoding="utf8"))
    # gộp mục đã dịch dở ở partial-* vào "đã có", chỉ dịch lại mục còn thiếu
    done_ids = set()
    for p in OUT.glob("batch-*.json"):
        done_ids.update(x["id"] for x in json.loads(p.read_text(encoding="utf8")))
    for p in OUT.glob("partial-*.json"):
        done_ids.update(json.loads(p.read_text(encoding="utf8"))["good"].keys())
    rest = [x for x in todo if x["id"] not in done_ids]
    batches = [rest[i:i + a.size] for i in range(0, len(rest), a.size)]
    if a.limit:
        batches = batches[: a.limit]
    # đánh số lô mới nối tiếp số đã dùng
    used = [int(p.stem.split("-")[1]) for p in list(OUT.glob("batch-*.json")) + list(OUT.glob("partial-*.json"))]
    start = (max(used) + 1) if used else 0
    print(f"còn {len(rest)} mục → {len(batches)} lô (mỗi lô ≤{a.size}), {a.workers} luồng", flush=True)
    jobs = [(start + i, b) for i, b in enumerate(batches)]
    with ThreadPoolExecutor(max_workers=a.workers) as ex:
        futs = []
        for n, (i, b) in enumerate(jobs):
            futs.append(ex.submit(run_one, i, b))
            time.sleep(4 if n < a.workers else 0)
        for fu in futs:
            idx, msg, sec = fu.result()
            print(f"lô {idx:04d}: {msg} ({sec}s)", flush=True)


if __name__ == "__main__":
    main()
