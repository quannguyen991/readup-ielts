#!/usr/bin/env python3
"""
AI Cross-Audit Pipeline for OCR Exam Data:
Calls both ChatGPT / OpenAI and Claude Code CLI to supervise, inspect, and verify the OCR conversion.
"""

import sys
import subprocess
from dotenv import dotenv_values
from openai import OpenAI

# Fix console encoding on Windows
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

def load_ocr_content():
    with open('data/chuyen_anh/ocr_texts/DE_THI_CHUYEN_ANH_DA_NANG_2026_2027_FULL.md', 'r', encoding='utf-8') as f:
        ocr_text = f.read()
    with open('data/chuyen_anh/ocr_texts/raw_dap_an_danang.txt', 'r', encoding='utf-8') as f:
        raw_key = f.read()
    return ocr_text, raw_key

def run_chatgpt_ocr_audit(ocr_snippet, raw_key):
    print("=" * 65)
    print("🤖 [1/2] CHATGPT ĐANG KIỂM ĐỊNH & ĐỐI CHIẾU OCR...")
    print("=" * 65)
    config = dotenv_values('.env.local')
    client = OpenAI(
        api_key=config.get('AI_PRIMARY_API_KEY'),
        base_url=config.get('AI_PRIMARY_BASE_URL')
    )
    model = config.get('QUESTIONS_MODEL', 'llama-3.3-70b-versatile')

    prompt = f"""Bạn là chuyên gia thẩm định và giám sát OCR học liệu tiếng Anh.
Dưới đây là văn bản OCR đề thi Chuyên Anh Đà Nẵng 2026-2027 kèm giải thích:
---
{ocr_snippet[:3500]}
---
Và đây là Đáp án gốc từ Sở GD&ĐT:
---
{raw_key}
---

Nhiệm vụ kiểm định & giám sát:
1. Đối chiếu độ chính xác: Xác nhận các câu trắc nghiệm (1-20), sửa lỗi sai (1-10), và viết lại câu (1-10) có khớp 100% với đáp án gốc không.
2. Kiểm định sư phạm: Đánh giá chất lượng của phần giải thích ngữ pháp và phân tích thành ngữ/collocation.
3. Đánh giá độ khó đề thi: Phân tích các bẫy phân loại học sinh chuyên (CEFR B2, C1, C2).
Trả lời bằng tiếng Việt, ngắn gọn, khoa học."""

    resp = client.chat.completions.create(
        model=model,
        messages=[{'role': 'user', 'content': prompt}],
        max_tokens=850,
        temperature=0.2
    )
    report = resp.choices[0].message.content
    print(report)
    return report

def run_claude_ocr_audit(ocr_snippet, raw_key):
    print("\n" + "=" * 65)
    print("🧠 [2/2] CLAUDE CODE CLI ĐANG GIÁM SÁT VÀ ĐỐI CHIẾU OCR...")
    print("=" * 65)
    prompt = f"""Bạn là giám sát viên kỹ thuật OCR.
Hãy đối chiếu văn bản số hóa 'data/chuyen_anh/ocr_texts/DE_THI_CHUYEN_ANH_DA_NANG_2026_2027_FULL.md' với đáp án gốc:
- Đáp án gốc Section C (Sentence Transformation):
1. he came to terms with
2. got wind of the confidential data
3. take his absent-mindedness into account
4. was on the house took us
5. project manager on the strength of
6. bears no resemblance to
7. have prejudiced the jury against
8. was green with envy
9. cut no ice with her parents
10. the brains behind

Nhiệm vụ:
1. Xác nhận tính đầy đủ của 10 câu biến đổi câu và tính chính xác từng từ khóa.
2. Kiểm tra phần sửa lỗi sai (raising, as, non-judgemental, emotionally, professionals, inadequate, risks, AI-generated, complement, be established).
3. Đưa ra kết luận nghiệm thu bản OCR.
Trả lời bằng tiếng Việt, súc tích."""

    proc = subprocess.run(
        ['claude', '-p', '--dangerously-skip-permissions', prompt],
        shell=True,
        stdin=subprocess.DEVNULL,
        capture_output=True,
        text=True,
        encoding='utf-8',
        timeout=45
    )
    report = proc.stdout.strip() if proc.stdout else proc.stderr.strip()
    print(report)
    return report

def main():
    ocr_text, raw_key = load_ocr_content()
    chatgpt_rep = run_chatgpt_ocr_audit(ocr_text, raw_key)
    claude_rep = run_claude_ocr_audit(ocr_text, raw_key)

    audit_out = 'data/chuyen_anh/ocr_texts/OCR_AI_AUDIT_REPORT.md'
    with open(audit_out, 'w', encoding='utf-8') as f:
        f.write("# 📋 BIÊN BẢN KIỂM ĐỊNH & GIÁM SÁT OCR ĐỀ THI CHUYÊN ANH\n\n")
        f.write("## 🤖 1. Báo Cáo Đối Chiếu & Thẩm Định Sư Phạm Từ ChatGPT / OpenAI\n\n")
        f.write(chatgpt_rep + "\n\n")
        f.write("---\n\n")
        f.write("## 🧠 2. Báo Cáo Giám Sát Kỹ Thuật & Nghiệm Thu Từ Claude Code CLI\n\n")
        f.write(claude_rep + "\n\n")

    print(f"\n✅ Đã lưu biên bản giám sát OCR vào: {audit_out}")

if __name__ == '__main__':
    main()
