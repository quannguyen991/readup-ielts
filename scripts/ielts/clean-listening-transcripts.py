import json
import re

SOURCE_TESTS_PATH = r"d:\Claude\readup-ielts\.local-private\ielts-ocr\source-tests.json"

with open(SOURCE_TESTS_PATH, "r", encoding="utf-8") as f:
    data = json.load(f)

cleaned_count = 0
for t in data["tests"]:
    if t.get("section") != "Listening":
        continue
    
    modified = False
    for p in t.get("pages", []):
        text = p.get("text", "")
        if "TRANSCRIPT:" in text or "TRANSCRIPT" in text:
            # Pattern: find from TRANSCRIPT: up to the question header "Questions " or "PART " or similar
            # If questions start after the transcript, keep the header and the questions, remove the transcript.
            pattern = re.compile(r'TRANSCRIPT:[\s\S]*?(?=(?:Questions?\s*\d|Part\s*\d|Section\s*\d|$))', re.IGNORECASE)
            new_text = pattern.sub('', text)
            new_text = re.sub(r'\n{3,}', '\n\n', new_text).strip()
            if new_text != text:
                p["text"] = new_text
                modified = True
                cleaned_count += 1

print(f"Cleaned transcripts in {cleaned_count} pages across tests.")

with open(SOURCE_TESTS_PATH, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
print("Saved source-tests.json")
