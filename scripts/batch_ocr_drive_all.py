#!/usr/bin/env python3
"""
Batch OCR Extractor for Google Drive Resources:
Downloads public Google Drive PDFs and DOCX files in-memory, extracts text,
and saves them to complete the missing specialized categories:
- sentence-transformation
- word-formation
- open-cloze
- olympic-30-4
- chuyen-su-pham-ngoai-ngu
- chuyen-ngoai-ngu
- de-thi-thu
"""

import os
import sys
import json
import io
import re
import time
import requests
import fitz
import docx

# Fix console encoding on Windows
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

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
    res = '\n'.join(cleaned)
    res = re.sub(r'\n{3,}', '\n\n', res)
    return res.strip()

def extract_pdf_bytes(pdf_bytes: bytes, max_pages: int = 150) -> str:
    try:
        doc = fitz.open(stream=pdf_bytes, filetype='pdf')
        pages = []
        for i, page in enumerate(doc):
            if i >= max_pages:
                pages.append(f"\n[... Đã trích xuất {max_pages} trang đầu tiên của tài liệu lớn {len(doc)} trang ...]")
                break
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

def main():
    catalog_path = 'data/chuyen_anh/catalog.json'
    with open(catalog_path, 'r', encoding='utf-8') as f:
        catalog = json.load(f)

    base_out_dir = 'data/chuyen_anh/ocr_extracted'
    os.makedirs(base_out_dir, exist_ok=True)

    # Collect Drive files
    drive_tasks = {}
    for item in catalog:
        cat_slug = sanitize_slug(item.get('category_id') or 'khac')
        title = item.get('title', 'Tài liệu')
        for d in item.get('drive_links', []):
            url = d.get('url', '')
            m = re.search(r'/d/([a-zA-Z0-9_-]+)', url)
            if m:
                fid = m.group(1)
                if fid not in drive_tasks:
                    label = d.get('label') or title
                    drive_tasks[fid] = {
                        'file_id': fid,
                        'title': title,
                        'label': label,
                        'category_slug': cat_slug,
                        'url': url
                    }

    print("=" * 65)
    print(f"🚀 BẮT ĐẦU TRÍCH XUẤT {len(drive_tasks)} TÀI LIỆU GOOGLE DRIVE ĐỂ HOÀN THIỆN KHO DỮ LIỆU")
    print("=" * 65)

    # Load existing master index
    index_json_path = os.path.join(base_out_dir, 'OCR_MASTER_INDEX.json')
    master_records = []
    existing_paths = set()
    if os.path.exists(index_json_path):
        with open(index_json_path, 'r', encoding='utf-8') as f:
            master_records = json.load(f)
        for r in master_records:
            existing_paths.add(r['output_path'])
        print(f"📖 Đã tải {len(master_records)} tệp đã trích xuất từ trước.")

    session = requests.Session()
    success_count = 0
    total = len(drive_tasks)

    for idx, (fid, task) in enumerate(drive_tasks.items(), 1):
        target_dir = os.path.join(base_out_dir, task['category_slug'])
        os.makedirs(target_dir, exist_ok=True)

        slug_title = sanitize_slug(task['title'])[:40]
        slug_label = sanitize_slug(task['label'])[:30]
        out_filename = f"drive_{fid[:8]}_{slug_title}_{slug_label}.txt"
        out_path = os.path.join(target_dir, out_filename)
        out_rel_path = out_path.replace('\\', '/')

        if out_rel_path in existing_paths or os.path.exists(out_path):
            continue

        dl_url = f"https://drive.usercontent.google.com/download?id={fid}&export=download&confirm=t"
        print(f"[{idx}/{total}] Đang tải ({task['category_slug']}): {task['title'][:45]}... (ID: {fid[:10]})")

        try:
            r = session.get(dl_url, timeout=25)
            if r.status_code != 200:
                print(f"    ⚠️ HTTP {r.status_code}")
                continue

            b = r.content
            if len(b) < 100 or b.startswith(b'<!DOCTYPE') or b.startswith(b'<html'):
                print(f"    ⚠️ File không tải được trực tiếp (HTML/Quyền truy cập).")
                continue

            text = ""
            fmt = "UNKNOWN"
            if b.startswith(b'%PDF'):
                text = extract_pdf_bytes(b)
                fmt = "PDF"
            elif b.startswith(b'PK\x03\x04'):
                text = extract_docx_bytes(b)
                fmt = "DOCX"

            if len(text) > 100 and not text.startswith("[Lỗi"):
                with open(out_path, 'w', encoding='utf-8') as f:
                    f.write(f"# TÀI LIỆU GOOGLE DRIVE: {task['title']}\n# NHÃN: {task['label']}\n# LIÊN KẾT GỐC: {task['url']}\n# FILE ID: {fid}\n\n" + text)
                print(f"    ✅ [{fmt}] Đã lưu: {out_filename} ({len(text):,} ký tự)")
                success_count += 1
                rec = {
                    'title': task['title'],
                    'source_url': task['url'],
                    'archive_file': f"google_drive_{fid}",
                    'extracted_file': task['label'],
                    'output_path': out_rel_path,
                    'format': fmt,
                    'char_count': len(text)
                }
                master_records.append(rec)
                existing_paths.add(out_rel_path)
            else:
                print(f"    ⚠️ Không trích xuất được text hoặc file rỗng ({len(b):,} bytes)")

        except Exception as e:
            print(f"    ❌ Lỗi: {e}")
        time.sleep(0.1)

    # Save updated master index
    with open(index_json_path, 'w', encoding='utf-8') as f:
        json.dump(master_records, f, ensure_ascii=False, indent=2)

    # Save updated README.md
    index_md_path = os.path.join(base_out_dir, 'README.md')
    total_chars = sum(r['char_count'] for r in master_records)
    with open(index_md_path, 'w', encoding='utf-8') as f:
        f.write("# 📚 KHO VĂN BẢN SỐ HÓA OCR ĐỀ THI CHUYÊN ANH & VÀO 10 TOÀN QUỐC (TOÀN DIỆN)\n\n")
        f.write(f"*Thời gian cập nhật: {time.strftime('%Y-%m-%d %H:%M:%S')}*\n")
        f.write(f"*Tổng số tệp văn bản đã trích xuất: **{len(master_records)} tệp văn bản** ({total_chars:,} ký tự)*\n\n")
        f.write("| STT | Tên bài thi / Tài liệu | Tệp trích xuất | Định dạng | Số ký tự | Đường dẫn file |\n")
        f.write("|:---:|:---|:---|:---:|:---:|:---|\n")
        for idx, r in enumerate(master_records, 1):
            f.write(f"| {idx} | {r['title'][:40]} | `{r['extracted_file']}` | {r['format']} | {r['char_count']:,} | [`{r['output_path']}`]({r['output_path']}) |\n")

    print("\n" + "=" * 65)
    print(f"🎉 HOÀN THÀNH BỔ SUNG TOÀN DIỆN CÁC TÀI LIỆU DRIVE!")
    print(f"Đã trích xuất mới: +{success_count} tệp Drive")
    print(f"Tổng số tệp trong kho hiện tại: {len(master_records)} tệp")
    print(f"Tổng số ký tự văn bản: {total_chars:,} ký tự")
    print("=" * 65)

if __name__ == '__main__':
    main()
