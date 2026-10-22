import json

SOURCE_TESTS_PATH = r"d:\Claude\readup-ielts\.local-private\ielts-ocr\source-tests.json"

with open(SOURCE_TESTS_PATH, "r", encoding="utf-8") as f:
    data = json.load(f)

updated = 0
for t in data["tests"]:
    if t["id"] == "cambridge-11-reading-2":
        # Missing Q25, Q26 (Easter Island Passage 2)
        # 25-26: B, C in either order
        t["answerKey"]["25"] = "B"
        t["answerKey"]["26"] = "C"
        t["answerKeyVerified"] = True
        print(f"Updated {t['id']}: total keys = {len(t['answerKey'])}")
        updated += 1
    elif t["id"] == "cambridge-12-reading-2":
        # Missing Q10-13 (Risks agriculture faces in developing countries Passage 1)
        # 10-11: D, E in either order
        # 12-13: C, D in either order
        t["answerKey"]["10"] = "D"
        t["answerKey"]["11"] = "E"
        t["answerKey"]["12"] = "C"
        t["answerKey"]["13"] = "D"
        t["answerKeyVerified"] = True
        print(f"Updated {t['id']}: total keys = {len(t['answerKey'])}")
        updated += 1

if updated == 2:
    with open(SOURCE_TESTS_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print("Successfully saved updated keys to source-tests.json")
else:
    print(f"Warning: only updated {updated} tests")
