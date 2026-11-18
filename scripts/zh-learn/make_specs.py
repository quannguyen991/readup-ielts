"""Dựng specs-grammar.json và specs-dialogue.json từ kết quả tra cứu (đại cương HSK + chủ đề giáo trình).

  python -X utf8 make_specs.py <thư mục research-zh> <thư mục research-zh2>
HSK 1-3: 87 điểm cốt lõi do agent chọn từ đại cương; HSK 4-6: chọn tay từ đại cương (tên điểm, không chép giải thích).
"""
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
r1, r2 = Path(sys.argv[1]), Path(sys.argv[2])

core = json.loads((r1 / "grammar-core-hsk1-3.json").read_text(encoding="utf8"))
HIGH = {
    4: [
        ("Câu chữ 把 (把+O+V+thành phần khác)", "把字句"), ("Câu bị động 被/叫/让", "被字句"), ("Câu kiêm ngữ 使/让/叫 (gây khiến)", "使令句"),
        ("So sánh 不如 và 跟……相比", "不如 / 跟……相比"), ("Phủ định kép để nhấn mạnh", "双重否定"), ("不是……而是……", "不是……而是……"),
        ("既……又/也……", "既……又……"), ("一方面……另一方面……", "一方面……另一方面……"), ("首先……其次……然后……", "首先……其次……"),
        ("不仅/不光……还/而且……", "不仅……而且……"), ("连……也/都……", "连……也/都……"), ("不是……就是……", "不是……就是……"),
        ("尽管……但是/可是……", "尽管……但是……"), ("要是……就……, 否则", "要是……就……/否则"), ("为了……而……", "为了……而……"),
        ("在……方面, 拿……来说", "在……方面 / 拿……来说"), ("难道……吗 (câu hỏi tu từ)", "难道……吗"), ("动词+得/不+了", "V+得/不+了"),
        ("来得及 / 来不及", "来得及/来不及"), ("甚至, 于是, 然而 (từ nối)", "甚至 / 于是 / 然而"),
    ],
    5: [
        ("从……来看", "从……来看"), ("（自）……以来", "自……以来"), ("由……组成", "由……组成"), ("一旦……就……", "一旦……就……"),
        ("假如/万一……就……", "假如 / 万一"), ("哪怕……也……", "哪怕……也……"), ("不但不……反而……", "不但不……反而……"), ("……，为的是……", "为的是"),
        ("没有……就没有……", "没有……就没有……"), ("再……也……", "再……也……"), ("因而 / 可见 (kết quả)", "因而 / 可见"), ("或是……或是……", "或是……或是……"),
        ("动词/形容词+得+bổ ngữ trạng thái mở rộng", "状态补语（扩展）"), ("Nghĩa mở rộng của bổ ngữ xu hướng 下来/下去/起来", "趋向补语引申用法"),
        ("Nhiều trạng ngữ trong một câu", "多项状语"),
    ],
    6: [
        ("要么……，要么……", "要么……要么……"), ("虽……，但/可/却……", "虽……但……"), ("凡是……，都……", "凡是……都……"), ("除非……，才……", "除非……才……"),
        ("就算……，也……", "就算……也……"), ("……，以便……", "以便"), ("到……为止", "到……为止"), ("好不容易 và 好容易", "好（不）容易"),
        ("一时……一时……", "一时……一时……"), ("动词/形容词+透了", "V/Adj+透了"), ("Câu 把 với chủ ngữ phi sinh vật", "非生物主语的把字句"), ("算了 / 得了 (khẩu ngữ)", "算了 / 得了"),
    ],
}

specs, by_level = [], {}
for p in core:
    lv = int(p["level"])
    n = by_level[lv] = by_level.get(lv, 0) + 1
    specs.append({"id": f"zh-g-h{lv}-{n:02d}", "level": lv, "name": f"{p['title_vi']} ({(p.get('names_zh') or [''])[0]})", "category": p.get("group_vi", "")})
for lv, items in HIGH.items():
    for n, (vi, zh) in enumerate(items, 1):
        specs.append({"id": f"zh-g-h{lv}-{n:02d}", "level": lv, "name": f"{vi} ({zh})", "category": "Ngữ pháp HSK"})
(HERE / "specs-grammar.json").write_text(json.dumps(specs, ensure_ascii=False, indent=1), encoding="utf8")

topics = json.loads((r2 / "topics-map.json").read_text(encoding="utf8"))["topics"]
choices = {lv: {s["id"]: s["name"] for s in specs if s["level"] == lv} for lv in range(1, 7)}
dspecs, cnt = [], {}
for t in topics:
    lv = min(6, max(1, int(t["hsk"])))
    n = cnt[lv] = cnt.get(lv, 0) + 1
    dspecs.append({"id": f"zh-d-h{lv}-{n:02d}", "level": lv, "topic": t.get("topic"), "topicVi": t.get("vi"), "grammarIds": choices[lv]})
(HERE / "specs-dialogue.json").write_text(json.dumps(dspecs, ensure_ascii=False, indent=1), encoding="utf8")
print("ngữ pháp", len(specs), {lv: sum(1 for s in specs if s["level"] == lv) for lv in range(1, 7)})
print("hội thoại", len(dspecs), cnt)
