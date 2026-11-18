#!/usr/bin/env python3
"""
Audit script using ChatGPT / OpenAI interface to inspect crawled Chuyên Anh dataset.
"""

import sys
import json
from dotenv import dotenv_values
from openai import OpenAI

# Fix console encoding on Windows
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

def main():
    config = dotenv_values('.env.local')
    client = OpenAI(
        api_key=config.get('AI_PRIMARY_API_KEY'),
        base_url=config.get('AI_PRIMARY_BASE_URL')
    )
    model = config.get('QUESTIONS_MODEL', 'llama-3.3-70b-versatile')

    with open('data/chuyen_anh/catalog.json', 'r', encoding='utf-8') as f:
        catalog = json.load(f)

    # Prepare summary data for the audit
    total = len(catalog)
    dl_count = sum(len(x.get('downloads', [])) for x in catalog)
    dr_count = sum(len(x.get('drive_links', [])) for x in catalog)
    
    cat_counts = {}
    sample_titles = []
    for idx, x in enumerate(catalog):
        cname = x.get('category_name') or x.get('category_id') or 'Khác'
        cat_counts[cname] = cat_counts.get(cname, 0) + 1
        if idx % 10 == 0:
            sample_titles.append(f"- [{cname}] {x.get('title')}")

    prompt = f"""Bạn là chuyên gia thẩm định dữ liệu học liệu tiếng Anh (Chuyên Anh, Luyện thi vào 10 THPT).
Dưới đây là thống kê tệp dữ liệu 'data/chuyen_anh/catalog.json' và 'data/chuyen_anh/CHUYEN_ANH_RESOURCES.md' vừa crawl được:
- Tổng số bộ tài liệu: {total} bài
- Tổng số link tải trực tiếp (ZIP, PDF, Word, MP3): {dl_count}
- Tổng số link Google Drive công khai: {dr_count}
- Phân bố theo chuyên mục:
{json.dumps(cat_counts, ensure_ascii=False, indent=2)}

- Mẫu một số đầu tài liệu:
{chr(10).join(sample_titles)}

Hãy đưa ra đánh giá độc lập (Audit Report):
1. Đánh giá cấu trúc phân loại và độ phủ kiến thức (các trường top đầu CNN, CSP, Ams, PTNK; các chuyên đề ngữ pháp nâng cao Word Form, Sentence Transformation, Cloze).
2. Kiểm tra tính khả dụng và giá trị thực tiễn đối với học sinh ôn thi chuyên Anh & vào lớp 10.
3. Chỉ ra các điểm cần hoàn thiện hoặc bổ sung (ví dụ: file nghe audio, script, đề thi theo chương trình mới 2018).
Định dạng câu trả lời rõ ràng, mạch lạc bằng tiếng Việt.
"""

    resp = client.chat.completions.create(
        model=model,
        messages=[{'role': 'user', 'content': prompt}],
        max_tokens=900,
        temperature=0.3
    )

    print("=" * 65)
    print("🤖 KẾT QUẢ KIỂM TRA ĐỘC LẬP TỪ CHATGPT / OPENAI AGENT")
    print("=" * 65)
    print(resp.choices[0].message.content)
    print("=" * 65)

if __name__ == '__main__':
    main()
