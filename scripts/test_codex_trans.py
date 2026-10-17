import urllib.request
import json
import sys

sys.stdout.reconfigure(encoding="utf-8")

key = "sk-BXVn4aWRenS705pstgDEBfL9EO9EGPJAcB3vsc2qd2b9wLtA"
base = "https://codex.hungnguyen.codes/v1"

lines = [
    "Welcome to Vietnam Today on VTV4.",
    "Hanoi has been recognized as one of the top cultural destinations in Southeast Asia.",
    "Many international tourists appreciate the city's rich history and vibrant street food."
]

prompt = "Dịch các câu tiếng Anh sau sang tiếng Việt chuẩn cho người học tiếng Anh, giữ nguyên thứ tự. Trả về đúng JSON {\"translations\": [\"câu 1\", \"câu 2\", ...]}\n" + json.dumps(lines, ensure_ascii=False)

payload = {
    "model": "claude-haiku-4-5-20251001",
    "messages": [
        {"role": "user", "content": prompt}
    ]
}

req = urllib.request.Request(f"{base}/chat/completions", data=json.dumps(payload).encode("utf-8"), headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"})
with urllib.request.urlopen(req, timeout=15) as res:
    data = json.loads(res.read())
    print("SUCCESS from Codex proxy:\n", data["choices"][0]["message"]["content"])
