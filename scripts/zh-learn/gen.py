"""Sinh nội dung học tiếng Trung (ngữ pháp, hội thoại) bằng Codex CLI, gốc tự viết, kiểm bằng pypinyin.

  python -X utf8 -I gen.py grammar specs-grammar.json  [--workers 4] [--batch 4]
  python -X utf8 -I gen.py dialogue specs-dialogue.json [--workers 4] [--batch 3]

specs-grammar.json:  [{"id","level","name","category"}...]
specs-dialogue.json: [{"id","level","topic","grammarIds":[...]}...]
Ra: raw/<kind>-NN.json (một lô). Chạy lại bỏ qua lô đã có. Gộp + kiểm bằng merge.py.
"""
import argparse
import json
import subprocess
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

HERE = Path(__file__).resolve().parent
RAW = HERE / "raw"
RAW.mkdir(exist_ok=True)

COMMON = (
    "Bạn là giáo viên tiếng Trung cho người Việt. Viết nội dung GỐC của bạn (không chép giáo trình nào). "
    "Mọi câu tiếng Trung dùng chữ giản thể; pinyin có dấu thanh, viết LIỀN theo từ và cách nhau bằng dấu cách, "
    "KHÔNG có dấu câu thừa; nghĩa tiếng Việt tự nhiên. Từ vựng trong ví dụ phải nằm trong từ vựng HSK 3.0 từ cấp được giao trở xuống "
    "(cấp 1 chỉ dùng từ HSK 1, v.v.), trừ chính điểm ngữ pháp. Không dùng chữ số đồng âm. "
    "Mọi câu ví dụ là CÂU HOÀN CHỈNH mà người bản ngữ thật sự nói (khoảng 6-16 chữ Hán, có chủ ngữ hoặc ngữ cảnh rõ), "
    "không dùng câu trần trụi, gượng ép hay chỉ để minh hoạ cấu trúc; mỗi ví dụ khác nhau về ngữ cảnh. "
    "Chỉ in ra MỘT mảng JSON hợp lệ (không giải thích, không ```)."
)

SCHEMA_G = (
    'Mỗi phần tử: {"id":"<giữ nguyên>","level":<số>,"order":<số thứ tự trong cấp, theo thứ tự cho>,"title":"tên tiếng Việt",'
    '"titleZh":"tên chữ Hán NGẮN dưới 12 ký tự, bỏ phần giải thích","summary":"một câu: học xong làm được gì","minutes":<6-10>,'
    '"steps":[{"label":"Định nghĩa|Dùng khi nào|Cấu trúc|Quy tắc 1|Quy tắc 2|Lỗi hay mắc","title":"...","body":"1-3 câu tiếng Việt",'
    '"formula":"(tuỳ chọn) công thức, ví dụ S + 把 + O + V + 其他成分","bullets":["(tuỳ chọn)"],'
    '"examples":[{"zh":"...","py":"...","vi":"...","mark":"(tuỳ chọn) đoạn chữ Hán nổi bật, là chuỗi con đúng của zh"}],'
    '"mistakes":[{"wrong":"câu sai (chữ Hán)","right":"câu đúng","why":"giải thích tiếng Việt, hay gặp ở người Việt"}]}],'
    '"quiz":[{"q":"đề (tiếng Việt, có thể chứa chữ Hán)","options":["3-4 đáp án"],"answer":<chỉ số 0-based>,"explain":"một câu"}]}. '
    "Mỗi bài 4-5 bước (bắt buộc có Định nghĩa, Dùng khi nào, ít nhất 1 Quy tắc/Cấu trúc, Lỗi hay mắc); mỗi bước có ví dụ ghi 2-3 câu "
    "(trừ bước Lỗi hay mắc thì có mistakes); đúng 5 câu quiz, đáp án đúng rải đều các vị trí."
)

SCHEMA_D = (
    'Mỗi phần tử: {"id":"<giữ nguyên>","level":<số>,"order":<thứ tự trong cấp>,"title":"tên tiếng Việt","titleZh":"tên chữ Hán",'
    '"topic":"chủ đề tiếng Việt","scene":"bối cảnh một câu tiếng Việt","minutes":<4-8>,'
    '"lines":[{"who":"tên người nói (chữ Hán hoặc vai: 小明, 老师…)","zh":"...","py":"...","vi":"...","mark":"(tuỳ chọn)"}],'
    '"keyWords":[{"zh":"...","py":"...","vi":"..."}],"grammarIds":["id điểm ngữ pháp có thật trong danh sách cho phép, 1-3 id"],'
    '"quiz":[{"q":"câu hỏi hiểu bài (tiếng Việt)","options":["3-4 đáp án"],"answer":<chỉ số 0-based>,"explain":"một câu"}]}. '
    "Hội thoại tự nhiên như người bản ngữ nói, 8-12 câu (cấp 1-2: 6-10 câu, câu ngắn), 2 người nói; "
    "keyWords 5-8 từ thật sự dùng trong bài; đúng 5 câu quiz hỏi chi tiết trong bài, đáp án rải đều."
)


def build_prompt(kind, items):
    if kind == "grammar":
        spec = json.dumps(items, ensure_ascii=False)
        return f"{COMMON}\n\nViết {len(items)} bài NGỮ PHÁP tiếng Trung theo danh sách điểm sau (giữ nguyên id, level; order theo thứ tự trong danh sách):\n{spec}\n\n{SCHEMA_G}"
    spec = json.dumps(items, ensure_ascii=False)
    return f"{COMMON}\n\nViết {len(items)} bài HỘI THOẠI theo danh sách sau (giữ nguyên id, level; trường topic của kết quả viết bằng tiếng Việt theo topicVi; trường grammarIds của spec là DANH SÁCH ỨNG VIÊN dạng {{id: tên}}; trong kết quả grammarIds là mảng 1-3 id chọn trong đó, khớp với ngữ pháp thật sự xuất hiện trong hội thoại):\n{spec}\n\n{SCHEMA_D}"


REVIEW = (
    "Bạn là giáo viên tiếng Trung bản ngữ rà soát bài soạn cho người Việt. Với MỖI phần tử trong mảng JSON dưới đây, kiểm: "
    "(1) câu tiếng Trung tự nhiên, đúng ngữ pháp, đúng điểm ngữ pháp đang dạy; (2) pinyin có dấu đúng từng chữ (chú ý đa âm 还 好 长 得 行 的 了 着); "
    "(3) nghĩa tiếng Việt đúng và tự nhiên; (4) đáp án quiz đúng duy nhất, đề không mơ hồ, đáp án đúng KHÔNG nằm lộ trong đề; "
    "(5) từ vựng không vượt cấp HSK của bài; (6) mark là chuỗi con đúng của zh. Sửa mọi lỗi tại chỗ, giữ nguyên cấu trúc, id, level, order. "
    "Chỉ in MỘT mảng JSON hợp lệ (cùng số phần tử, cùng khoá), không giải thích, không ```.\n\n"
)


def run_review(kind, n):
    src = RAW / f"{kind}-{n:02d}.json"
    out = RAW / f"{kind}-{n:02d}.r.json"
    if out.exists() or not src.exists():
        return n, "bỏ qua"
    items = json.loads(src.read_text(encoding="utf8"))
    for attempt in (1, 2):
        try:
            ans = RAW / f"{kind}-{n:02d}.r.answer.txt"
            if ans.exists():
                ans.unlink()
            subprocess.run(
                ["cmd", "/c", "codex", "exec", "--skip-git-repo-check", "-s", "read-only", "-C", str(RAW), "-o", str(ans), "-"],
                input=(REVIEW + json.dumps(items, ensure_ascii=False)).encode("utf8"), capture_output=True, timeout=900, cwd=str(RAW),
            )
            text = ans.read_text(encoding="utf8").strip() if ans.exists() else ""
            a, b = text.find("["), text.rfind("]")
            data = json.loads(text[a:b + 1])
            assert isinstance(data, list) and len(data) == len(items)
            out.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf8")
            return n, f"rà soát ok (lần {attempt})"
        except Exception as e:  # noqa: BLE001
            last = repr(e)[:120]
    return n, f"lỗi: {last}"


def run(kind, n, items):
    out = RAW / f"{kind}-{n:02d}.json"
    if out.exists():
        return n, "bỏ qua"
    t0 = time.time()
    for attempt in (1, 2):
        try:
            ans = RAW / f"{kind}-{n:02d}.answer.txt"
            if ans.exists():
                ans.unlink()
            subprocess.run(
                ["cmd", "/c", "codex", "exec", "--skip-git-repo-check", "-s", "read-only", "-C", str(RAW), "-o", str(ans), "-"],
                input=build_prompt(kind, items).encode("utf8"), capture_output=True, timeout=900, cwd=str(RAW),
            )
            text = ans.read_text(encoding="utf8").strip() if ans.exists() else ""
            a, b = text.find("["), text.rfind("]")
            data = json.loads(text[a:b + 1])
            assert isinstance(data, list) and len(data) == len(items)
            out.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf8")
            return n, f"ok ({int(time.time() - t0)}s, lần {attempt})"
        except Exception as e:  # noqa: BLE001
            last = repr(e)[:120]
    return n, f"lỗi: {last}"


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("kind", choices=["grammar", "dialogue", "review-grammar", "review-dialogue"])
    ap.add_argument("specs")
    ap.add_argument("--workers", type=int, default=4)
    ap.add_argument("--batch", type=int, default=0)
    a = ap.parse_args()
    if a.kind.startswith("review-"):
        k = a.kind.split("-", 1)[1]
        files = sorted(RAW.glob(f"{k}-[0-9][0-9].json"))
        nums = [int(f.stem.split("-")[1]) for f in files]
        with ThreadPoolExecutor(max_workers=a.workers) as ex:
            for r in ex.map(lambda n: run_review(k, n), nums):
                print(*r, flush=True)
        raise SystemExit
    specs = json.loads(Path(a.specs).read_text(encoding="utf8"))
    size = a.batch or (4 if a.kind == "grammar" else 3)
    batches = [specs[i:i + size] for i in range(0, len(specs), size)]
    (RAW / f"{a.kind}-plan.json").write_text(json.dumps(batches, ensure_ascii=False), encoding="utf8")
    print(f"{len(batches)} lô", flush=True)
    with ThreadPoolExecutor(max_workers=a.workers) as ex:
        futs = []
        for n, b in enumerate(batches):
            futs.append(ex.submit(run, a.kind, n, b))
            time.sleep(4 if n < a.workers else 0)
        for f in futs:
            print(*f.result(), flush=True)
