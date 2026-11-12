#!/usr/bin/env python3
"""
Refine catalog.json and regenerate CHUYEN_ANH_RESOURCES.md
Fixes issues detected by Claude Code CLI and ChatGPT audit.
"""

import os
import sys
import json
import urllib.parse
import time

# Fix console encoding on Windows
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

CAT_MAP = {
    'chuyen-anh': ('chuyen-anh', 'Đề thi Chuyên Anh vào 10 (Chính thức)'),
    'vao-10-thpt': ('vao-10-thpt', 'Đề thi Tuyển sinh Lớp 10 THPT môn Tiếng Anh'),
    'hsg-anh-9': ('hsg-anh-9', 'Đề thi Học sinh giỏi Lớp 9 (Luyện Chuyên Anh)'),
    'hsg-anh-8': ('hsg-anh-8', 'Đề thi Học sinh giỏi Lớp 8 (Tạo nguồn Chuyên)'),
    'chuyen-su-pham-ngoai-ngu': ('chuyen-su-pham-ngoai-ngu', 'Đề thi Chuyên Sư Phạm & Chuyên Ngoại Ngữ'),
    'chuyen-ngoai-ngu': ('chuyen-ngoai-ngu', 'Đề thi THPT Chuyên Ngoại Ngữ (CNN)'),
    'de-thi-thu': ('de-thi-thu', 'Đề thi thử Chuyên Anh các trường THPT Chuyên'),
    'sentence-transformation': ('sentence-transformation', 'Chuyên đề Viết lại câu (Sentence Transformation)'),
    'word-formation': ('word-formation', 'Chuyên đề Cấu tạo từ (Word Formation C1-C2)'),
    'open-cloze': ('open-cloze', 'Chuyên đề Điền từ đoạn văn (Open & Guided Cloze)'),
    'olympic-30-4': ('olympic-30-4', 'Tuyển tập Đề thi Olympic 30 tháng 4')
}

def clean_label(url: str, current_label: str) -> str:
    if current_label and current_label not in ['Tải xuống', 'Tải về', 'Google Drive']:
        return current_label
    fn = url.split('/')[-1]
    fn_clean = urllib.parse.unquote(fn)
    for ext in ['.zip', '.pdf', '.docx', '.doc', '.rar', '.mp3']:
        fn_clean = fn_clean.replace(ext, '')
    fn_clean = fn_clean.replace('-', ' ').replace('_', ' ').replace('  ', ' ').strip()
    return f"Tải đề: {fn_clean}"

def main():
    json_path = 'data/chuyen_anh/catalog.json'
    with open(json_path, 'r', encoding='utf-8') as f:
        catalog = json.load(f)

    for item in catalog:
        # 1. Normalize category schema
        if 'category' in item and 'category_id' not in item:
            c_id = item['category']
            item['category_id'] = c_id
            if c_id in CAT_MAP:
                item['category_name'] = CAT_MAP[c_id][1]
            else:
                item['category_name'] = c_id
            del item['category']
        elif not item.get('category_name'):
            cid = item.get('category_id', '')
            if cid in CAT_MAP:
                item['category_name'] = CAT_MAP[cid][1]

        # 2. Fix generic download labels
        for dl in item.get('downloads', []):
            dl['label'] = clean_label(dl['url'], dl.get('label'))

        # 3. Clean truncated descriptions
        desc = item.get('description', '').strip()
        if desc and not desc.endswith('.'):
            last_dot = max(desc.rfind('.'), desc.rfind(';'), desc.rfind(':'))
            if last_dot > 120:
                item['description'] = desc[:last_dot+1]
            else:
                item['description'] = desc + '...'

    # Save refined catalog.json
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)

    # 4. Regenerate CHUYEN_ANH_RESOURCES.md
    md_path = 'data/chuyen_anh/CHUYEN_ANH_RESOURCES.md'
    grouped = {}
    for item in catalog:
        cname = item.get('category_name') or 'Khác'
        grouped.setdefault(cname, []).append(item)

    with open(md_path, 'w', encoding='utf-8') as f:
        f.write("# 📚 KHO DỮ LIỆU ĐỀ THI CHUYÊN ANH, VÀO LỚP 10 & CHUYÊN ĐỀ NÂNG CAO\n\n")
        f.write(f"*Thời gian cập nhật và chuẩn hóa: {time.strftime('%Y-%m-%d %H:%M:%S')}*\n")
        f.write(f"*Tổng số bài đăng/bộ đề trong kho dữ liệu: {len(catalog)} tài liệu (Đã chuẩn hóa 100%)*\n\n")

        for cname, items in grouped.items():
            f.write(f"\n## 🎯 {cname} ({len(items)} tài liệu)\n\n")
            for it in items:
                f.write(f"### 📄 {it['title']}\n")
                if it.get('description'):
                    f.write(f"> {it['description']}\n\n")
                if it.get('downloads'):
                    f.write("**Link tải trực tiếp (ZIP / PDF / Word / Audio):**\n")
                    for d in it['downloads']:
                        f.write(f"- [{d['label']}]({d['url']})\n")
                if it.get('drive_links'):
                    f.write("**Link Google Drive:**\n")
                    for dr in it['drive_links']:
                        f.write(f"- [{dr['label']}]({dr['url']})\n")
                f.write("\n---\n")

    print(f"🎉 Đã chuẩn hóa toàn bộ {len(catalog)} tài liệu trong catalog.json và CHUYEN_ANH_RESOURCES.md!")
    print("Phân bố chuyên mục sau khi chuẩn hóa:")
    for cname, items in grouped.items():
        print(f"  - {cname}: {len(items)} tài liệu")

if __name__ == '__main__':
    main()
