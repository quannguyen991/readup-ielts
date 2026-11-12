#!/usr/bin/env python3
"""
Batch OCR & Text Extractor for ALL Crawled Exam Datasets:
Streams ZIPs, PDFs, and DOCX files in-memory, extracts exam papers, answer keys,
transcripts, and exercises, cleans watermarks, and saves structured text files.
"""

import os
import sys
import json
import io
import re
import time
import zipfile
import urllib.parse
from typing import Dict, Any, List
import requests
import fitz
import docx

# Fix console encoding on Windows
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': '*/*',
    'Referer': 'https://tailieudieuky.com/'
}

SESSION = requests.Session()
SESSION.headers.update(HEADERS)

def sanitize_slug(text: str) -> str:
    slug = re.sub(r'[^a-zA-Z0-9_\-]', '_', text)
    slug = re.sub(r'_+', '_', slug)
    return slug.strip('_')[:80]

def clean_watermark(text: str) -> str:
    lines = text.split('\n')
    cleaned = []
    for line in lines:
        s = line.strip()
        if 'TAILIEUDIEUKY' in s.upper():
            continue
        if re.match(r'^\d+$', s) and len(s) <= 2:
            continue
        cleaned.append(line)
    # Deduplicate consecutive blank lines
    res = '\n'.join(cleaned)
    res = re.sub(r'\n{3,}', '\n\n', res)
    return res.strip()

def extract_pdf_bytes(pdf_bytes: bytes) -> str:
    try:
        doc = fitz.open(stream=pdf_bytes, filetype='pdf')
        pages = []
        for i, page in enumerate(doc):
            t = page.get_text('text')
            if t.strip():
                pages.append(f"--- PAGE {i+1} ---\n" + clean_watermark(t))
        return '\n\n'.join(pages)
    except Exception as e:
        return f"[Lỗi giải nén PDF: {e}]"

def extract_docx_bytes(docx_bytes: bytes) -> str:
    try:
        doc = docx.Document(io.BytesIO(docx_bytes))
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        
        # Also extract text inside tables
        table_texts = []
        for table in doc.tables:
            for row in table.rows:
                cells = [c.text.strip() for c in row.cells if c.text.strip()]
                if cells:
                    table_texts.append(" | ".join(cells))
        
        full = "\n".join(paragraphs)
        if table_texts:
            full += "\n\n[BẢNG BIỂU / BẢNG ĐÁP ÁN]:\n" + "\n".join(table_texts)
        return clean_watermark(full)
    except Exception as e:
        return f"[Lỗi giải nén DOCX: {e}]"

def process_url(url: str, title: str, category_slug: str, base_out_dir: str) -> List[Dict[str, Any]]:
    fn = url.split('/')[-1]
    fn_clean = urllib.parse.unquote(fn)
    target_dir = os.path.join(base_out_dir, category_slug)
    os.makedirs(target_dir, exist_ok=True)
    
    extracted_records = []
    try:
        r = SESSION.get(url, timeout=40)
        if r.status_code != 200:
            print(f"    ❌ Lỗi HTTP {r.status_code}: {fn_clean}")
            return []
        
        content_bytes = r.content
        base_slug = sanitize_slug(fn_clean.rsplit('.', 1)[0])

        if fn_clean.lower().endswith('.zip'):
            try:
                with zipfile.ZipFile(io.BytesIO(content_bytes)) as z:
                    for name in z.namelist():
                        name_lower = name.lower()
                        if name_lower.endswith(('.pdf', '.docx', '.doc')):
                            sub_bytes = z.read(name)
                            sub_slug = sanitize_slug(name.rsplit('.', 1)[0].replace('/', '_'))
                            out_filename = f"{base_slug}_{sub_slug}.txt"
                            out_path = os.path.join(target_dir, out_filename)

                            if name_lower.endswith('.pdf'):
                                text = extract_pdf_bytes(sub_bytes)
                                fmt = 'PDF'
                            else:
                                text = extract_docx_bytes(sub_bytes)
                                fmt = 'DOCX'

                            if len(text) > 100:
                                with open(out_path, 'w', encoding='utf-8') as f:
                                    f.write(f"# TÀI LIỆU: {title}\n# TẬP TIN GỐC: {name} (từ {fn_clean})\n# NGUỒN: {url}\n\n" + text)
                                print(f"      ✅ [{fmt}] {out_filename} ({len(text):,} ký tự)")
                                extracted_records.append({
                                    'title': title,
                                    'source_url': url,
                                    'archive_file': fn_clean,
                                    'extracted_file': name,
                                    'output_path': out_path.replace('\\', '/'),
                                    'format': fmt,
                                    'char_count': len(text)
                                })
            except Exception as ze:
                print(f"      ⚠️ Lỗi đọc ZIP {fn_clean}: {ze}")

        elif fn_clean.lower().endswith('.pdf'):
            text = extract_pdf_bytes(content_bytes)
            if len(text) > 100:
                out_filename = f"{base_slug}.txt"
                out_path = os.path.join(target_dir, out_filename)
                with open(out_path, 'w', encoding='utf-8') as f:
                    f.write(f"# TÀI LIỆU: {title}\n# TẬP TIN: {fn_clean}\n# NGUỒN: {url}\n\n" + text)
                print(f"      ✅ [PDF] {out_filename} ({len(text):,} ký tự)")
                extracted_records.append({
                    'title': title,
                    'source_url': url,
                    'archive_file': fn_clean,
                    'extracted_file': fn_clean,
                    'output_path': out_path.replace('\\', '/'),
                    'format': 'PDF',
                    'char_count': len(text)
                })

        elif fn_clean.lower().endswith('.docx'):
            text = extract_docx_bytes(content_bytes)
            if len(text) > 100:
                out_filename = f"{base_slug}.txt"
                out_path = os.path.join(target_dir, out_filename)
                with open(out_path, 'w', encoding='utf-8') as f:
                    f.write(f"# TÀI LIỆU: {title}\n# TẬP TIN: {fn_clean}\n# NGUỒN: {url}\n\n" + text)
                print(f"      ✅ [DOCX] {out_filename} ({len(text):,} ký tự)")
                extracted_records.append({
                    'title': title,
                    'source_url': url,
                    'archive_file': fn_clean,
                    'extracted_file': fn_clean,
                    'output_path': out_path.replace('\\', '/'),
                    'format': 'DOCX',
                    'char_count': len(text)
                })

    except Exception as e:
        print(f"    ❌ Lỗi tải {fn_clean}: {e}")

    return extracted_records

def main():
    catalog_path = 'data/chuyen_anh/catalog.json'
    with open(catalog_path, 'r', encoding='utf-8') as f:
        catalog = json.load(f)

    base_out_dir = 'data/chuyen_anh/ocr_extracted'
    os.makedirs(base_out_dir, exist_ok=True)

    # Gather unique downloads
    url_tasks = {}
    for item in catalog:
        cat_slug = sanitize_slug(item.get('category_id') or 'khac')
        title = item.get('title', 'Tài liệu')
        for d in item.get('downloads', []):
            url = d.get('url', '')
            if url.endswith(('.zip', '.pdf', '.docx', '.doc')):
                if url not in url_tasks:
                    url_tasks[url] = {
                        'title': title,
                        'category_slug': cat_slug,
                        'url': url
                    }

    print("=" * 65)
    print(f"🚀 BẮT ĐẦU BATCH OCR / TRÍCH XUẤT TOÀN BỘ {len(url_tasks)} TẬP TIN ĐỀ THI")
    print("=" * 65)

    master_records = []
    processed = 0
    total = len(url_tasks)

    for url, task in url_tasks.items():
        processed += 1
        fn = url.split('/')[-1]
        print(f"\n[{processed}/{total}] Đang xử lý ({task['category_slug']}): {fn[:50]}...")
        recs = process_url(url, task['title'], task['category_slug'], base_out_dir)
        master_records.extend(recs)
        time.sleep(0.1)

    # Save master index
    index_json_path = os.path.join(base_out_dir, 'OCR_MASTER_INDEX.json')
    with open(index_json_path, 'w', encoding='utf-8') as f:
        json.dump(master_records, f, ensure_ascii=False, indent=2)

    # Save summary README.md
    index_md_path = os.path.join(base_out_dir, 'README.md')
    total_chars = sum(r['char_count'] for r in master_records)
    with open(index_md_path, 'w', encoding='utf-8') as f:
        f.write("# 📚 KHO VĂN BẢN SỐ HÓA OCR ĐỀ THI CHUYÊN ANH & VÀO 10 TOÀN QUỐC\n\n")
        f.write(f"*Thời gian số hóa: {time.strftime('%Y-%m-%d %H:%M:%S')}*\n")
        f.write(f"*Tổng số tệp văn bản đã trích xuất: **{len(master_records)} tệp văn bản** ({total_chars:,} ký tự)*\n\n")
        f.write("| STT | Tên bài thi / Tài liệu | Tệp trích xuất | Định dạng | Số ký tự | Đường dẫn file |\n")
        f.write("|:---:|:---|:---|:---:|:---:|:---|\n")
        for idx, r in enumerate(master_records, 1):
            f.write(f"| {idx} | {r['title'][:40]} | `{r['extracted_file']}` | {r['format']} | {r['char_count']:,} | [`{r['output_path']}`]({r['output_path']}) |\n")

    print("\n" + "=" * 65)
    print(f"🎉 HOÀN THÀNH BATCH OCR TOÀN DIỆN!")
    print(f"Tổng số tệp văn bản đã trích xuất: {len(master_records)} tệp")
    print(f"Tổng số ký tự văn bản: {total_chars:,} ký tự")
    print(f"Master Index JSON: {index_json_path}")
    print(f"Master Index Markdown: {index_md_path}")
    print("=" * 65)

if __name__ == '__main__':
    main()
