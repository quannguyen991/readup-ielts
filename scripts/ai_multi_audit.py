#!/usr/bin/env python3
"""
Multi-Agent AI Audit CLI:
Executes both Claude CLI (Claude Code) and ChatGPT / OpenAI to cross-audit
the crawled Chuyên Anh dataset and internal research documentation.
"""

import os
import sys
import json
import subprocess
from dotenv import dotenv_values
from openai import OpenAI

# Fix console encoding on Windows
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

def load_data():
    with open('data/chuyen_anh/catalog.json', 'r', encoding='utf-8') as f:
        catalog = json.load(f)

    research_text = ""
    research_path = 'docs/research/CHUYEN_ANH_VAO_10_SOURCES_2026-11.md'
    if os.path.exists(research_path):
        with open(research_path, 'r', encoding='utf-8') as f:
            research_text = f.read()

    return catalog, research_text

def run_chatgpt_audit(catalog, research_snippet):
    print("=" * 65)
    print("🤖 [1/2] ĐANG GỌI CHATGPT / OPENAI AGENT ĐỂ THẨM ĐỊNH...")
    print("=" * 65)
    try:
        config = dotenv_values('.env.local')
        client = OpenAI(
            api_key=config.get('AI_PRIMARY_API_KEY'),
            base_url=config.get('AI_PRIMARY_BASE_URL')
        )
        model = config.get('QUESTIONS_MODEL', 'llama-3.3-70b-versatile')

        categories = {}
        for x in catalog:
            cn = x.get('category_name') or x.get('category_id') or 'Khác'
            categories[cn] = categories.get(cn, 0) + 1

        prompt = f"""Bạn là chuyên gia thẩm định dữ liệu giáo dục và khảo thí tiếng Anh (Chuyên Anh, Thi vào lớp 10 THPT).
Dữ liệu crawl được gồm {len(catalog)} bộ tài liệu (118 link tải trực tiếp, 70 link Google Drive) chia thành các nhóm:
{json.dumps(categories, ensure_ascii=False, indent=2)}

Tài liệu nghiên cứu nội bộ của dự án (nguồn chính thức từ các trường PTNK, CSP, CNN, Sở GD):
{research_snippet[:2000]}

Hãy đánh giá:
1. Độ phủ và tính thực tiễn của dữ liệu đối với học sinh luyện thi vào 10 Chuyên Anh.
2. So sánh dữ liệu đã crawl (tailieudieuky, Google Drive) với các nguồn chính thức của trường (ptnk.edu.vn, csp.edu.vn, flss.vnu.edu.vn).
3. Đề xuất 3 ưu tiên cải tiến hàng đầu.
Trả lời súc tích bằng tiếng Việt."""

        resp = client.chat.completions.create(
            model=model,
            messages=[{'role': 'user', 'content': prompt}],
            max_tokens=800,
            temperature=0.3
        )
        report = resp.choices[0].message.content
        print(report)
        return report
    except Exception as e:
        err = f"Lỗi gọi ChatGPT/OpenAI: {e}"
        print(err)
        return err

def run_claude_cli_audit(catalog, research_snippet):
    print("\n" + "=" * 65)
    print("🧠 [2/2] ĐANG GỌI CLAUDE CLI (CLAUDE CODE) ĐỂ THẨM ĐỊNH...")
    print("=" * 65)
    
    categories = {}
    for x in catalog:
        cn = x.get('category_name') or x.get('category_id') or 'Khác'
        categories[cn] = categories.get(cn, 0) + 1

    prompt = f"""Bạn là chuyên gia thẩm định dữ liệu khảo thí tiếng Anh.
Repo có 2 nguồn:
1. data/chuyen_anh/catalog.json: {len(catalog)} tài liệu đã crawl (118 download link, 70 Drive link) gồm:
{json.dumps(categories, ensure_ascii=False, indent=2)}
2. docs/research/CHUYEN_ANH_VAO_10_SOURCES_2026-11.md: tổng hợp link chính thức từ PTNK, CSP, CNN, Springboard.

Hãy đưa ra nhận xét thẩm định:
1. Đánh giá tính bổ trợ giữa 2 nguồn tài liệu này.
2. Rủi ro về bản quyền và độ ổn định liên kết (tailieudieuky vs official edu.vn vs Drive).
3. Kết luận: Bộ dữ liệu này đã đủ để đưa vào sản phẩm học tập ReadUp chưa?
Trả lời ngắn gọn, trực diện bằng tiếng Việt."""

    try:
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
    except Exception as e:
        err = f"Lỗi gọi Claude CLI: {e}"
        print(err)
        return err

def main():
    catalog, research_text = load_data()
    chatgpt_rep = run_chatgpt_audit(catalog, research_text)
    claude_rep = run_claude_cli_audit(catalog, research_text)

    # Save integrated audit
    audit_path = 'data/chuyen_anh/AI_VERIFICATION_REPORT.md'
    with open(audit_path, 'w', encoding='utf-8') as f:
        f.write("# 📋 BÁO CÁO THẨM ĐỊNH CHÉO DỮ LIỆU TỪ CLAUDE CLI & CHATGPT AGENT\n\n")
        f.write("## 🤖 1. Đánh Giá Từ ChatGPT / OpenAI Agent\n\n")
        f.write(chatgpt_rep + "\n\n")
        f.write("---\n\n")
        f.write("## 🧠 2. Đánh Giá Từ Claude CLI (Claude Code)\n\n")
        f.write(claude_rep + "\n\n")

    print("\n" + "=" * 65)
    print(f"✅ Đã lưu báo cáo thẩm định song phương vào: {audit_path}")
    print("=" * 65)

if __name__ == '__main__':
    main()
