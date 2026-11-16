"""Đợt 2: thêm ngữ pháp và hội thoại HSK 4–6. Ra specs-grammar-2.json, specs-dialogue-2.json (id nối tiếp bài đã có).

  python -X utf8 make_specs_more.py
"""
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
DATA = HERE.parents[1] / "src/data/zh-learn"
have_g = json.loads((DATA / "grammar.json").read_text(encoding="utf8"))
have_d = json.loads((DATA / "dialogues.json").read_text(encoding="utf8"))

NEW_G = {
    4: [
        ("Câu 把 với V+一下/了 (把+O+V+了)", "把+O+V+了"), ("Câu 把 với bổ ngữ số lượng (把+O+V+động lượng/thời lượng)", "把字句+数量补语"),
        ("Câu 把 với trạng ngữ (把+O+状语+V)", "把+O+状语+V"), ("Cấu trúc đối xứng 有A有B, 一A一B, 无A无B", "有A有B / 一A一B"),
        ("有的是, 说不定, 不怎么", "有的是 / 说不定 / 不怎么"), ("够……的 (đủ… rồi)", "够……的"), ("再也不/没……", "再也不……"),
        ("怎么都/也+不/没……", "怎么都不……"), ("Adj/động từ tâm lý + 死了/厉害 (mức độ cao)", "死了 / 厉害"),
        ("Câu hai tân ngữ biểu thị khen chê: 表扬/批评+O1+V+O2", "表扬/批评句"), ("Câu xưng hô, xác nhận: 选/当/做/为+O", "称谓认定句"),
        ("(没)有什么(好)X的", "没有什么好X的"), ("Câu hỏi tu từ với đại từ nghi vấn", "疑问代词反问句"), ("然而 / 不过 / 并且 (từ nối)", "然而 / 不过 / 并且"),
    ],
    5: [
        ("A来A去, A着A着 (lặp động từ)", "A来A去 / A着A着"), ("说A就A (nói là làm)", "说A就A"), ("不得了, 用不着", "不得了 / 用不着"),
        ("X什么X (phản bác)", "X什么X"), ("不X白不X", "不X白不X"), ("把+O+一+V, 把+O1+V+O2", "把字句变式"), ("被/叫/让+O+给+V", "被……给……"),
        ("So sánh có bổ ngữ số lượng: A+Adj+B+số lượng", "A比B+Adj+数量"), ("Câu tồn tại với 有着, V+有", "存在句：有着 / V+有"),
        ("Hai động từ liên tiếp biểu thị nhân quả, chuyển ngoặt, điều kiện", "连动句（因果转折条件）"), ("……，便……", "……便……"), ("……，要不然/不然……", "要不然 / 不然"),
        ("不……不…… (cặp phủ định)", "不……不……"), ("Adj/động từ + 得不得了, V + 得/不得", "得不得了 / V得/不得"), ("不是……，还是……", "不是……还是……"),
    ],
    6: [
        ("A这A那, 左A右B", "A这A那 / 左A右B"), ("那倒(也)是 (đồng tình một phần)", "那倒（也）是"), ("X归X，Y归Y", "X归X，Y归Y"), ("放着X不Y", "放着X不Y"),
        ("早(也)不X，晚(也)不X (trách đúng lúc)", "早不X晚不X"), ("东一A，西一A (rải rác)", "东一A，西一A"), ("看/瞧+把+O+X得 (cảm thán)", "看/瞧把+O+X得"),
        ("不X不……，一X……", "不X不……一X……"), ("X了就X了，(没)有……", "X了就X了"), ("看你X的 / 瞧他X的", "看你X的"),
    ],
}
NEW_D = {
    4: [("phỏng vấn xin việc", "Phỏng vấn xin việc"), ("thuê nhà", "Thuê nhà"), ("mua sắm trực tuyến", "Mua sắm trực tuyến"), ("lên kế hoạch du lịch", "Lên kế hoạch du lịch"),
        ("bảo vệ môi trường", "Bảo vệ môi trường"), ("hiểu lầm và xin lỗi", "Hiểu lầm và xin lỗi")],
    5: [("giao tiếp nơi công sở", "Giao tiếp nơi công sở"), ("mạng xã hội", "Mạng xã hội"), ("lễ tết truyền thống", "Lễ tết truyền thống"),
        ("phát triển đô thị", "Phát triển đô thị"), ("áp lực học hành", "Áp lực học hành")],
    6: [("tình hình kinh tế", "Tình hình kinh tế"), ("khác biệt văn hoá", "Khác biệt văn hoá"), ("phát hiện khoa học", "Phát hiện khoa học"),
        ("truyền thông và dư luận", "Truyền thông và dư luận"), ("lựa chọn cuộc đời", "Lựa chọn cuộc đời")],
}

specs = []
names = {lv: {g["id"]: f'{g["title"]} ({g["titleZh"]})' for g in have_g if g["level"] == lv} for lv in range(1, 7)}
for lv, items in NEW_G.items():
    n0 = sum(1 for g in have_g if g["level"] == lv)
    for i, (vi, zh) in enumerate(items, 1):
        sid = f"zh-g-h{lv}-{n0 + i:02d}"
        specs.append({"id": sid, "level": lv, "name": f"{vi} ({zh})", "category": "Ngữ pháp HSK"})
        names[lv][sid] = f"{vi} ({zh})"
(HERE / "specs-grammar-2.json").write_text(json.dumps(specs, ensure_ascii=False, indent=1), encoding="utf8")

dspecs = []
for lv, items in NEW_D.items():
    n0 = sum(1 for d in have_d if d["level"] == lv)
    for i, (vi, label) in enumerate(items, 1):
        dspecs.append({"id": f"zh-d-h{lv}-{n0 + i:02d}", "level": lv, "topic": label, "topicVi": vi, "grammarIds": names[lv]})
(HERE / "specs-dialogue-2.json").write_text(json.dumps(dspecs, ensure_ascii=False, indent=1), encoding="utf8")
print("ngữ pháp mới", len(specs), "hội thoại mới", len(dspecs))
