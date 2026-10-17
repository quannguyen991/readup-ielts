import urllib.request
import json
import sys

sys.stdout.reconfigure(encoding="utf-8")

api_key = "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"
url = "https://api.groq.com/openai/v1/chat/completions"

lines = [
    "Welcome to Vietnam Today on VTV4.",
    "Hanoi has been recognized as one of the top cultural destinations in Southeast Asia.",
    "Many international tourists appreciate the city rich history and vibrant street food.",
    "The government is introducing new environmental policies to reduce carbon emissions.",
    "Continuous learning and practice are essential for mastering English."
]

prompt = "Dịch các câu tiếng Anh sau sang tiếng Việt chuẩn cho người học tiếng Anh, giữ nguyên thứ tự. Trả về JSON object dạng {\"translations\": [\"câu 1\", \"câu 2\", ...]}\n" + json.dumps(lines, ensure_ascii=False)

payload = {
    "model": "llama-3.3-70b-versatile",
    "messages": [
        {"role": "system", "content": "You are an accurate English to Vietnamese translator for English learners. Return valid JSON only."},
        {"role": "user", "content": prompt}
    ],
    "response_format": {"type": "json_object"}
}

req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"})
with urllib.request.urlopen(req, timeout=10) as res:
    data = json.loads(res.read())
    content = data["choices"][0]["message"]["content"]
    print("Groq Translation result:\n", content)
