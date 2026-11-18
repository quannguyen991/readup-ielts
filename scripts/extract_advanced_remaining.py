#!/usr/bin/env python3
"""
Advanced Extractor for Remaining Resources:
Handles:
1. RAR archives (via Windows tar.exe)
2. Scanned Image PDFs (via PyMuPDF pixmap rendering + RapidOCR)
3. Legacy DOC binary files (via MS Word COM Automation)
4. Large compendium PDFs
"""

import os
import sys
import json
import re
import time
import shutil
import tempfile
import requests
import pymupdf
import docx
import numpy as np
from PIL import Image
import io

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
        cleaned.append(line)
    res = '\n'.join(cleaned)
    res = re.sub(r'\n{3,}', '\n\n', res)
    return res.strip()

def extract_pdf_with_ocr_fallback(pdf_bytes: bytes, max_pages: int = 150, ocr_engine = None) -> tuple[str, str]:
    """Extracts text from PDF, falling back to RapidOCR for scanned pages."""
    try:
        doc = pymupdf.open(stream=pdf_bytes, filetype='pdf')
        pages = []
        is_scanned = False
        
        # Check first 3 pages to see if it's scanned
        sample_text_len = 0
        for i in range(min(3, len(doc))):
            sample_text_len += len(doc[i].get_text('text').strip())
        
        if sample_text_len < 50:
            is_scanned = True

        if is_scanned and ocr_engine is not None:
            # Process scanned pages with RapidOCR
            ocr_limit = min(15, len(doc))
            for i in range(ocr_limit):
                page = doc[i]
                pix = page.get_pixmap(dpi=150)
                img = Image.open(io.BytesIO(pix.tobytes('png')))
                res, _ = ocr_engine(np.array(img))
                if res:
                    page_lines = [line[1] for line in res]
                    pages.append(f"--- TRANG {i+1} (OCR) ---\n" + "\n".join(page_lines))
                else:
                    pages.append(f"--- TRANG {i+1} (OCR: Không phát hiện chữ) ---")
            if len(doc) > ocr_limit:
                pages.append(f"\n[... Đã trích xuất OCR {ocr_limit} trang đầu của tài liệu scan ảnh tổng cộng {len(doc)} trang ...]")
            return clean_watermark('\n\n'.join(pages)), "PDF_SCANNED_OCR"
        else:
            # Vector digital PDF
            for i, page in enumerate(doc):
                if i >= max_pages:
                    pages.append(f"\n[... Đã trích xuất {max_pages} trang đầu tiên của tài liệu {len(doc)} trang ...]")
                    break
                t = page.get_text('text')
                if t.strip():
                    pages.append(f"--- PAGE {i+1} ---\n" + t)
            return clean_watermark('\n\n'.join(pages)), "PDF_DIGITAL"
    except Exception as e:
        return f"[Lỗi giải nén PDF: {e}]", "ERROR"

def extract_docx_bytes(docx_bytes: bytes) -> str:
    try:
        doc = docx.Document(io.BytesIO(docx_bytes))
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        return clean_watermark('\n'.join(paragraphs))
    except Exception as e:
        return f"[Lỗi DOCX: {e}]"

def extract_doc_with_word(doc_bytes: bytes) -> str:
    """Uses MS Word COM to open and extract .doc binary format."""
    tmp_path = None
    word = None
    try:
        with tempfile.NamedTemporaryFile(suffix='.doc', delete=False) as tf:
            tf.write(doc_bytes)
            tmp_path = tf.name
        
        import win32com.client
        word = win32com.client.Dispatch('Word.Application')
        word.Visible = False
        wdoc = word.Documents.Open(tmp_path, ReadOnly=True, ConfirmConversions=False)
        text = wdoc.Content.Text
        wdoc.Close(False)
        return clean_watermark(text)
    except Exception as e:
        return f"[Lỗi MS Word DOC: {e}]"
    finally:
        if word:
            try:
                word.Quit()
            except Exception:
                pass
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except Exception:
                pass

def extract_rar_archive(rar_bytes: bytes, target_dir: str, prefix_name: str, ocr_engine) -> list[dict]:
    """Unpacks RAR archive via Windows tar.exe and extracts inner files."""
    results = []
    tmp_rar = None
    tmp_dir = None
    try:
        with tempfile.NamedTemporaryFile(suffix='.rar', delete=False) as tf:
            tf.write(rar_bytes)
            tmp_rar = tf.name
        
        tmp_dir = tempfile.mkdtemp()
        import subprocess
        res = subprocess.run(['tar', '-xf', tmp_rar, '-C', tmp_dir], capture_output=True, text=True)
        if res.returncode != 0:
            return results

        # Walk through extracted files
        for root, _, files in os.walk(tmp_dir):
            for file in files:
                file_path = os.path.join(root, file)
                ext = os.path.splitext(file)[1].lower()
                safe_fname = sanitize_slug(file)
                out_fname = f"{prefix_name}_{safe_fname}.txt"
                out_path = os.path.join(target_dir, out_fname)

                extracted_text = ""
                fmt = ""
                if ext == '.pdf':
                    with open(file_path, 'rb') as f:
                        b = f.read()
                    extracted_text, fmt = extract_pdf_with_ocr_fallback(b, ocr_engine=ocr_engine)
                elif ext == '.docx':
                    with open(file_path, 'rb') as f:
                        b = f.read()
                    extracted_text = extract_docx_bytes(b)
                    fmt = "DOCX"
                elif ext == '.doc':
                    with open(file_path, 'rb') as f:
                        b = f.read()
                    extracted_text = extract_doc_with_word(b)
                    fmt = "DOC"

                if extracted_text and len(extracted_text) > 100 and not extracted_text.startswith("[Lỗi"):
                    with open(out_path, 'w', encoding='utf-8') as f:
                        f.write(f"# TÀI LIỆU GIẢI NÉN TỪ RAR: {file}\n\n" + extracted_text)
                    results.append({
                        'filename': file,
                        'out_path': out_path.replace('\\', '/'),
                        'format': fmt,
                        'char_count': len(extracted_text)
                    })
    except Exception as e:
        print(f"    ❌ Lỗi giải nén RAR: {e}")
    finally:
        if tmp_rar and os.path.exists(tmp_rar):
            try: os.remove(tmp_rar)
            except Exception: pass
        if tmp_dir and os.path.exists(tmp_dir):
            try: shutil.rmtree(tmp_dir, ignore_errors=True)
            except Exception: pass
    return results

def main():
    catalog_path = 'data/chuyen_anh/catalog.json'
    with open(catalog_path, 'r', encoding='utf-8') as f:
        catalog = json.load(f)

    base_out_dir = 'data/chuyen_anh/ocr_extracted'
    index_json_path = os.path.join(base_out_dir, 'OCR_MASTER_INDEX.json')
    master_records = []
    if os.path.exists(index_json_path):
        with open(index_json_path, 'r', encoding='utf-8') as f:
            master_records = json.load(f)

    extracted_fids = {r['archive_file'].replace('google_drive_', '') for r in master_records if 'google_drive_' in r.get('archive_file', '')}

    # Find unextracted Drive tasks
    tasks = []
    for item in catalog:
        cat_slug = sanitize_slug(item.get('category_id') or 'khac')
        title = item.get('title', 'Tài liệu')
        for d in item.get('drive_links', []):
            url = d.get('url', '')
            m = re.search(r'/d/([a-zA-Z0-9_-]+)', url)
            if m:
                fid = m.group(1)
                if fid not in extracted_fids:
                    tasks.append({
                        'fid': fid,
                        'title': title,
                        'label': d.get('label') or title,
                        'category_slug': cat_slug,
                        'url': url
                    })

    print("=" * 65)
    print(f"🔍 BẮT ĐẦU XỬ LÝ NÂNG CAO CHO {len(tasks)} TÀI LIỆU CHƯA TRÍCH XUẤT")
    print("=" * 65)

    # Initialize RapidOCR engine
    print("🧠 Khởi tạo mô hình RapidOCR (ONNX Runtime)...")
    from rapidocr_onnxruntime import RapidOCR
    ocr_engine = RapidOCR()
    print("✅ RapidOCR đã sẵn sàng.")

    session = requests.Session()
    new_extracted_count = 0

    for idx, task in enumerate(tasks, 1):
        fid = task['fid']
        target_dir = os.path.join(base_out_dir, task['category_slug'])
        os.makedirs(target_dir, exist_ok=True)

        print(f"\n[{idx}/{len(tasks)}] Đang tải ({task['category_slug']}): {task['title'][:40]}... (ID: {fid[:10]})")
        dl_url = f"https://drive.usercontent.google.com/download?id={fid}&export=download&confirm=t"

        try:
            r = session.get(dl_url, timeout=30)
            if r.status_code != 200:
                print(f"    ⚠️ HTTP {r.status_code}")
                continue
            
            b = r.content
            if len(b) < 100 or b.startswith(b'<!DOCTYPE') or b.startswith(b'<html'):
                print(f"    ⚠️ Quyền truy cập bị chặn hoặc HTML phản hồi.")
                continue

            # Detect format
            slug_prefix = f"drive_{fid[:8]}_{sanitize_slug(task['title'])[:30]}"
            if b.startswith(b'Rar!\x1a\x07'):
                print(f"    📦 Phát hiện tệp nén RAR ({len(b):,} bytes) -> Đang giải nén và trích xuất tài liệu bên trong...")
                rar_res = extract_rar_archive(b, target_dir, slug_prefix, ocr_engine)
                for item in rar_res:
                    print(f"      ✅ [{item['format']}] Đã lưu: {os.path.basename(item['out_path'])} ({item['char_count']:,} ký tự)")
                    master_records.append({
                        'title': task['title'],
                        'source_url': task['url'],
                        'archive_file': f"google_drive_{fid}",
                        'extracted_file': item['filename'],
                        'output_path': item['out_path'],
                        'format': item['format'],
                        'char_count': item['char_count']
                    })
                    new_extracted_count += 1

            elif b.startswith(b'\xd0\xcf\x11\xe0'):
                print(f"    📄 Phát hiện tệp Word DOC nhị phân ({len(b):,} bytes) -> Trích xuất qua MS Word...")
                text = extract_doc_with_word(b)
                if len(text) > 100 and not text.startswith("[Lỗi"):
                    out_fname = f"{slug_prefix}.txt"
                    out_path = os.path.join(target_dir, out_fname)
                    with open(out_path, 'w', encoding='utf-8') as f:
                        f.write(f"# TÀI LIỆU WORD DOC: {task['title']}\n# LIÊN KẾT: {task['url']}\n\n" + text)
                    print(f"      ✅ [DOC] Đã lưu: {out_fname} ({len(text):,} ký tự)")
                    master_records.append({
                        'title': task['title'],
                        'source_url': task['url'],
                        'archive_file': f"google_drive_{fid}",
                        'extracted_file': task['label'],
                        'output_path': out_path.replace('\\', '/'),
                        'format': 'DOC',
                        'char_count': len(text)
                    })
                    new_extracted_count += 1
                else:
                    print(f"      ⚠️ Không thể trích xuất DOC: {text[:100]}")

            elif b.startswith(b'%PDF'):
                print(f"    📑 Phát hiện PDF ({len(b):,} bytes) -> Kiểm tra định dạng (vector vs scanned)...")
                text, fmt = extract_pdf_with_ocr_fallback(b, max_pages=150, ocr_engine=ocr_engine)
                if len(text) > 100 and not text.startswith("[Lỗi"):
                    out_fname = f"{slug_prefix}.txt"
                    out_path = os.path.join(target_dir, out_fname)
                    with open(out_path, 'w', encoding='utf-8') as f:
                        f.write(f"# TÀI LIỆU PDF ({fmt}): {task['title']}\n# LIÊN KẾT: {task['url']}\n\n" + text)
                    print(f"      ✅ [{fmt}] Đã lưu: {out_fname} ({len(text):,} ký tự)")
                    master_records.append({
                        'title': task['title'],
                        'source_url': task['url'],
                        'archive_file': f"google_drive_{fid}",
                        'extracted_file': task['label'],
                        'output_path': out_path.replace('\\', '/'),
                        'format': fmt,
                        'char_count': len(text)
                    })
                    new_extracted_count += 1
                else:
                    print(f"      ⚠️ Văn bản quá ngắn hoặc rỗng ({len(text)} ký tự)")
            else:
                print(f"    ⚠️ Định dạng chưa hỗ trợ (magic: {b[:8]})")

        except Exception as e:
            print(f"    ❌ Lỗi trong quá trình xử lý: {e}")
        time.sleep(0.1)

    # Save updated master index
    with open(index_json_path, 'w', encoding='utf-8') as f:
        json.dump(master_records, f, ensure_ascii=False, indent=2)

    # Update README.md
    index_md_path = os.path.join(base_out_dir, 'README.md')
    total_chars = sum(r['char_count'] for r in master_records)
    with open(index_md_path, 'w', encoding='utf-8') as f:
        f.write("# 📚 KHO VĂN BẢN SỐ HÓA OCR ĐỀ THI CHUYÊN ANH & VÀO 10 TOÀN QUỐC (HOÀN CHỈNH 100%)\n\n")
        f.write(f"*Thời gian cập nhật: {time.strftime('%Y-%m-%d %H:%M:%S')}*\n")
        f.write(f"*Tổng số tệp văn bản đã trích xuất: **{len(master_records)} tệp văn bản** ({total_chars:,} ký tự)*\n\n")
        f.write("| STT | Tên bài thi / Tài liệu | Tệp trích xuất | Định dạng | Số ký tự | Đường dẫn file |\n")
        f.write("|:---:|:---|:---|:---:|:---:|:---|\n")
        for idx, r in enumerate(master_records, 1):
            f.write(f"| {idx} | {r['title'][:40]} | `{r['extracted_file']}` | {r['format']} | {r['char_count']:,} | [`{r['output_path']}`]({r['output_path']}) |\n")

    print("\n" + "=" * 65)
    print(f"🎉 HOÀN THÀNH XỬ LÝ TOÀN DIỆN!")
    print(f"Số tệp bổ sung: +{new_extracted_count} tệp")
    print(f"Tổng số tệp trong kho hiện tại: {len(master_records)} tệp")
    print(f"Tổng số ký tự văn bản: {total_chars:,} ký tự")
    print("=" * 65)

if __name__ == '__main__':
    main()
