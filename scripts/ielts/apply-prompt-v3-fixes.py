import json
import re
import os

ROOT = r"d:\Claude\readup-ielts"
PRIVATE = os.path.join(ROOT, ".local-private", "ielts-ocr")
SOURCE_TESTS = os.path.join(PRIVATE, "source-tests.json")
BEFORE_REBUILD = os.path.join(PRIVATE, "source-tests.before-source-rebuild.json")
SP = r"C:\Users\admin\AppData\Local\Temp\claude\D--Claude\2038161e-58e0-439d-8fb5-e420795e2a81\scratchpad"

with open(SOURCE_TESTS, "r", encoding="utf-8") as f:
    data = json.load(f)

before_data = None
if os.path.exists(BEFORE_REBUILD):
    with open(BEFORE_REBUILD, "r", encoding="utf-8") as f:
        before_data = json.load(f)

print(f"Initial tests in source-tests.json: {len(data['tests'])}")

# =========================================================================
# ACTION 1: Gỡ dữ liệu Writing/Speaking giả định của Cam 9 & Cam 10-16
# =========================================================================
remove_ids = set()
for book in range(9, 17):
    for test in range(1, 5):
        remove_ids.add(f"cambridge-{book}-writing-{test}")
        remove_ids.add(f"cambridge-{book}-speaking-{test}")

data["tests"] = [t for t in data["tests"] if t["id"] not in remove_ids]
print(f"Removed {len(remove_ids)} unsourced Writing/Speaking tests. Remaining: {len(data['tests'])}")

# =========================================================================
# ACTION 2: Khôi phục Cam 21 Listening từ PDF / Before snapshot
# =========================================================================
if before_data:
    before_map = {t["id"]: t for t in before_data["tests"]}
    for i in range(1, 5):
        cid = f"cambridge-21-listening-{i}"
        if cid in before_map:
            target = next((t for t in data["tests"] if t["id"] == cid), None)
            if target:
                target["pages"] = before_map[cid]["pages"]
                target["pdfAsset"] = "cambridge21-book.pdf"
                print(f"Restored authentic PDF pages for {cid} (pages: {len(target['pages'])})")

# =========================================================================
# ACTION 3: Cắt rò rỉ đáp án website trong Cam 14–16
# =========================================================================
# Pattern: text like "Answer Cam 14 Listening Test 01", "Cam 14 Listening Test 01", etc.
nav_pattern = re.compile(r'(?i)(?:Answer\s+)?Cam(?:bridge)?\s*\d+\s*(?:Listening|Reading)\s*Test\s*\d+[^\n]*', re.MULTILINE)
for t in data["tests"]:
    if re.match(r"^cambridge-(14|15|16)-", t["id"]):
        for p in t.get("pages", []):
            if "text" in p:
                cleaned = nav_pattern.sub('', p["text"])
                cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)
                p["text"] = cleaned

print("Cleaned website navigation banners in Cam 14-16")

# =========================================================================
# ACTION 4: Nạp các đáp án xác nhận từ scratchpad web-cam-*.json
# =========================================================================
applied_confirmed = 0
for web_file in ["web-cam-8-13.json", "web-cam-14-16.json", "web-cam-17-21.json"]:
    wf_path = os.path.join(SP, web_file)
    if not os.path.exists(wf_path):
        continue
    with open(wf_path, "r", encoding="utf-8") as f:
        wdata = json.load(f)
    
    tests_list = wdata["tests"] if isinstance(wdata["tests"], list) else [{"id": k, **v} for k, v in wdata["tests"].items()]
    for wt in tests_list:
        tid = wt.get("id")
        t_target = next((t for t in data["tests"] if t["id"] == tid), None)
        if not t_target or not wt.get("questions"):
            continue
        
        if not t_target.get("answerKey"):
            t_target["answerKey"] = {}
            
        for q in wt["questions"]:
            qn = str(q.get("q"))
            status = q.get("status")
            confirmed = q.get("confirmed")
            
            # Apply confirmed answer with >= 2 sources
            if status == "confirmed" and confirmed:
                t_target["answerKey"][qn] = confirmed
                applied_confirmed += 1

print(f"Applied {applied_confirmed} verified answers from multi-source web cross-checks")

# =========================================================================
# ACTION 5: Khắc phục các mâu thuẫn cụ thể được chỉ định trong Section 4
# =========================================================================
specific_fixes = {
    "cambridge-11-reading-1": {"26": "locks", "27": "D"},
    "cambridge-12-listening-2": {"1": "2.45"},
    "cambridge-14-reading-1": {"4": "traffic", "5": "crime"},
    "cambridge-14-listening-4": {"40": "wine"},
    "cambridge-15-listening-4": {"38": "lighting"},
    "cambridge-16-listening-2": {"38": "calories"}
}

for tid, fixes in specific_fixes.items():
    t_target = next((t for t in data["tests"] if t["id"] == tid), None)
    if t_target and t_target.get("answerKey"):
        for qn, ans in fixes.items():
            t_target["answerKey"][qn] = ans
            print(f"Fixed specific item: {tid} Q{qn} -> {ans}")

# Chuẩn hóa format key (loại bỏ &amp;amp;, section A -, v.v.)
for t in data["tests"]:
    if t.get("answerKey"):
        cleaned_key = {}
        for k, v in t["answerKey"].items():
            if isinstance(v, str):
                v_clean = v.replace("&amp;amp;", "&").replace("&amp;", "&").strip()
                v_clean = re.sub(r'^(?:section|part)\s+[A-Z]\s*[-–—]\s*', '', v_clean, flags=re.IGNORECASE)
                cleaned_key[k] = v_clean
            elif isinstance(v, list):
                cleaned_key[k] = [
                    re.sub(r'^(?:section|part)\s+[A-Z]\s*[-–—]\s*', '', x.replace("&amp;amp;", "&").replace("&amp;", "&").strip(), flags=re.IGNORECASE)
                    for x in v
                ]
            else:
                cleaned_key[k] = v
        t["answerKey"] = cleaned_key

# =========================================================================
# ACTION 6: Dọn sạch rác OCR & chữ thừa & Watermark trong Cam 17-19
# =========================================================================
for t in data["tests"]:
    # Dọn supportPages có quảng cáo tiếng Trung
    if t.get("supportPages"):
        clean_support = []
        for sp in t["supportPages"]:
            text = sp.get("text", "")
            if not ("微信" in text or "1718867188" in text or re.search(r'[\u4e00-\u9fff]', text)):
                clean_support.append(sp)
        t["supportPages"] = clean_support

    # Sửa chữ thừa/dính trong pages
    for p in t.get("pages", []):
        if "text" in p:
            txt = p["text"]
            txt = txt.replace("effcient", "efficient")
            txt = txt.replace("profesional", "professional")
            txt = txt.replace("materiall", "material")
            txt = txt.replace("lridium", "Iridium")
            txt = txt.replace("《", "")
            # Sửa Test 1 READING PASSAGE 3 lạc trong Passage 2 của Cam 17-1
            if t["id"] == "cambridge-17-reading-1" and "READING PASSAGE 2" in txt:
                txt = txt.replace("Test 1 READING PASSAGE 3", "")
            p["text"] = txt

print("Cleaned supportPages ads, OCR typos, and stray markers.")

# =========================================================================
# ACTION 7: Ẩn các đề không xác minh được (Vol 8–12, Vol 7, Cam 9, v.v.)
# =========================================================================
hidden_tests = []
for t in data["tests"]:
    tid = t["id"]
    should_hide = False
    reason = ""
    
    # Vol 7, 8, 9, 11, 12
    if re.match(r"^vol-(7|8|9|11|12)-", tid):
        should_hide = True
        reason = "Actual Tests Vol simulation material without verified printed CUP source"
    # Cam 9
    elif tid.startswith("cambridge-9-"):
        should_hide = True
        reason = "Cambridge 9 unverified without printed key in local store"
    # Cam 8 (except verified tests)
    elif tid.startswith("cambridge-8-") and not t.get("answerKeyVerified"):
        should_hide = True
        reason = "Cambridge 8 unverified key"
    
    if should_hide:
        t["hidden"] = True
        hidden_tests.append({"id": tid, "title": t.get("title"), "section": t.get("section"), "reason": reason})
    else:
        t["hidden"] = False

# Ghi danh sách các đề ẩn ra docs/HIDDEN_UNVERIFIED_TESTS.json
with open(os.path.join(ROOT, "docs", "HIDDEN_UNVERIFIED_TESTS.json"), "w", encoding="utf-8") as f:
    json.dump({
        "generatedAt": "2026-10-21",
        "totalHidden": len(hidden_tests),
        "hiddenTests": hidden_tests
    }, f, ensure_ascii=False, indent=2)

print(f"Marked {len(hidden_tests)} unverified tests as hidden (saved to docs/HIDDEN_UNVERIFIED_TESTS.json).")

# =========================================================================
# LƯU FILE
# =========================================================================
with open(SOURCE_TESTS, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Saved updated source-tests.json successfully!")
