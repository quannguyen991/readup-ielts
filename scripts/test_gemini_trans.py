import urllib.request
import json
import sys

sys.stdout.reconfigure(encoding="utf-8")

key = open("D:/Claude/.secrets/google-api.key").read().strip()
url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={key}"

lines = [
    "Welcome to Vietnam Today on VTV4.",
    "Hanoi has been recognized as one of the top cultural destinations in Southeast Asia.",
    "Many international tourists appreciate the city's rich history and vibrant street food."
]

prompt = "Dịch các câu tiếng Anh sau sang tiếng Việt chuẩn cho người học tiếng Anh, giữ nguyên thứ tự. Trả về đúng JSON {\"translations\": [\"câu 1\", \"câu 2\", ...]}\n" + json.dumps(lines, ensure_ascii=False)

payload = {
    "contents": [{"parts": [{"text": prompt}]}],
    "generationConfig": {"responseMimeType": "application/json"}
}

req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers={"Content-Type": "application/json"})
with urllib.request.urlopen(req, timeout=10) as res:
    data = json.loads(res.read())
    text = data["candidates"][0]["content"]["parts"][0]["text"]
    print("Gemini Translation SUCCESS:\n", text)
