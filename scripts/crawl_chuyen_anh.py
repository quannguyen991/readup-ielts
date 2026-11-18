#!/usr/bin/env python3
"""
Crawler CLI: Chuyên Anh & Đề thi vào lớp 10 (PDF, Đáp án, Audio, Drive links)
Supports crawling official entrance exams, specialized English (Chuyên Anh),
National & Provincial HSG exams, and advanced preparation topics (CNN, CSP, PTNK, Olympic 30/4, Word Form, Sentence Transformation).
"""

import os
import sys
import json
import time
import zipfile
import shutil
import argparse
from typing import List, Dict, Any
import requests
from bs4 import BeautifulSoup

# Fix console encoding on Windows
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9,vi;q=0.8',
    'Referer': 'https://tailieudieuky.com/'
}

CATEGORIES = [
    {
        'id': 'chuyen-anh',
        'name': 'Đề thi Chuyên Anh vào 10 (Chính thức)',
        'type': 'tag',
        'url': 'https://tailieudieuky.com/baiviet/tag/de-thi-chuyen-anh/'
    },
    {
        'id': 'vao-10-thpt',
        'name': 'Đề thi Tuyển sinh Lớp 10 THPT môn Tiếng Anh',
        'type': 'tag',
        'url': 'https://tailieudieuky.com/baiviet/tag/de-thi-ts-lop-10-thpt-mon-tieng-anh-cac-tinh-thanh/'
    },
    {
        'id': 'hsg-anh-9',
        'name': 'Đề thi Học sinh giỏi Lớp 9 (Luyện Chuyên Anh)',
        'type': 'tag',
        'url': 'https://tailieudieuky.com/baiviet/tag/hsg-tieng-anh-lop-9/'
    },
    {
        'id': 'hsg-anh-8',
        'name': 'Đề thi Học sinh giỏi Lớp 8 (Tạo nguồn Chuyên)',
        'type': 'tag',
        'url': 'https://tailieudieuky.com/baiviet/tag/de-thi-hsg-tieng-anh-8-moi-nhat-co-dap-an-va-file-nghe-word-pdf/'
    },
    {
        'id': 'chuyen-su-pham-ngoai-ngu',
        'name': 'Đề thi Chuyên Sư Phạm & Chuyên Ngoại Ngữ',
        'type': 'search',
        'query': 'chuyên sư phạm'
    },
    {
        'id': 'chuyen-ngoai-ngu',
        'name': 'Đề thi THPT Chuyên Ngoại Ngữ (CNN)',
        'type': 'search',
        'query': 'chuyên ngoại ngữ'
    },
    {
        'id': 'de-thi-thu',
        'name': 'Đề thi thử Chuyên Anh các trường THPT Chuyên',
        'type': 'search',
        'query': 'đề thi thử chuyên anh'
    },
    {
        'id': 'sentence-transformation',
        'name': 'Chuyên đề Viết lại câu (Sentence Transformation)',
        'type': 'search',
        'query': 'sentence transformation'
    },
    {
        'id': 'word-formation',
        'name': 'Chuyên đề Cấu tạo từ (Word Formation C1-C2)',
        'type': 'search',
        'query': 'word formation'
    },
    {
        'id': 'open-cloze',
        'name': 'Chuyên đề Điền từ đoạn văn (Open & Guided Cloze)',
        'type': 'search',
        'query': 'open cloze'
    },
    {
        'id': 'olympic-30-4',
        'name': 'Tuyển tập Đề thi Olympic 30 tháng 4',
        'type': 'search',
        'query': 'olympic 30 tháng 4'
    }
]

SESSION = requests.Session()
SESSION.headers.update(HEADERS)

def get_free_space_mb(path: str) -> float:
    try:
        total, used, free = shutil.disk_usage(os.path.abspath(path))
        return free / (1024 * 1024)
    except Exception:
        return 9999.0

def fetch_soup(url: str, max_retries: int = 3) -> BeautifulSoup | None:
    for _ in range(max_retries):
        try:
            res = SESSION.get(url, timeout=15)
            if res.status_code == 200:
                return BeautifulSoup(res.text, 'html.parser')
            elif res.status_code == 404:
                return None
        except Exception:
            time.sleep(1)
    return None

def extract_article_links(cat: Dict[str, Any], max_pages: int = 2) -> List[str]:
    article_links = []
    seen = set()
    for page in range(1, max_pages + 1):
        if cat['type'] == 'tag':
            page_url = cat['url'] if page == 1 else f"{cat['url']}page/{page}/"
        else:
            q = requests.utils.quote(cat['query'])
            page_url = f"https://tailieudieuky.com/baiviet/?s={q}" if page == 1 else f"https://tailieudieuky.com/baiviet/page/{page}/?s={q}"
        
        soup = fetch_soup(page_url)
        if not soup:
            break
        links = [a['href'] for a in soup.find_all('a', href=True) if '/document/' in a['href']]
        new_count = 0
        for l in links:
            if l not in seen:
                seen.add(l)
                article_links.append(l)
                new_count += 1
        if new_count == 0:
            break
        time.sleep(0.2)
    return article_links

def parse_document_article(url: str, category_id: str, category_name: str) -> Dict[str, Any] | None:
    soup = fetch_soup(url)
    if not soup:
        return None
    
    title_el = soup.find('h1')
    title = title_el.get_text(strip=True) if title_el else ''
    
    content_el = soup.find('div', class_='entry-content') or soup.find('article')
    if not content_el:
        return None
    
    download_links = []
    drive_links = []
    
    for a in content_el.find_all('a', href=True):
        href = a['href']
        text = a.get_text(strip=True)
        if 'drive.google.com' in href or 'docs.google.com' in href:
            drive_links.append({
                'label': text or 'Google Drive',
                'url': href
            })
        elif any(ext in href.lower() for ext in ['.zip', '.pdf', '.docx', '.doc', '.rar', '.mp3']):
            download_links.append({
                'label': text or 'Tải về',
                'url': href,
                'is_zip': href.lower().endswith('.zip'),
                'is_pdf': href.lower().endswith('.pdf'),
                'is_audio': href.lower().endswith('.mp3')
            })

    # Extract clean description
    desc = ''
    p_tags = content_el.find_all('p')
    for p in p_tags[:3]:
        t = p.get_text(strip=True)
        if len(t) > 25 and not t.startswith('👉') and not t.startswith('📥'):
            desc += t + ' '
    desc = desc.strip()[:350]

    return {
        'url': url,
        'title': title,
        'category_id': category_id,
        'category_name': category_name,
        'description': desc,
        'downloads': download_links,
        'drive_links': drive_links
    }

def main():
    parser = argparse.ArgumentParser(description="Chuyên Anh Deep Crawler CLI")
    parser.add_argument('--pages', type=int, default=2, help="Số trang mỗi danh mục (mặc định: 2)")
    parser.add_argument('--categories', nargs='+', default=None, help="Chỉ định danh mục cụ thể")
    parser.add_argument('--out-dir', type=str, default='data/chuyen_anh', help="Thư mục xuất kết quả")
    args = parser.parse_args()

    os.makedirs(args.out_dir, exist_ok=True)
    
    selected_cats = CATEGORIES
    if args.categories:
        selected_cats = [c for c in CATEGORIES if c['id'] in args.categories]

    print("=" * 65)
    print("🚀 BẮT ĐẦU CRAWL MỞ RỘNG ĐỀ CHUYÊN ANH, VÀO 10 & CHUYÊN ĐỀ NÂNG CAO")
    print(f"Tổng số mục quét: {len(selected_cats)} | Số trang mỗi mục: {args.pages}")
    print("=" * 65)

    # Load existing catalog if available to avoid losing previously crawled items
    json_path = os.path.join(args.out_dir, 'catalog.json')
    catalog_by_url = {}
    if os.path.exists(json_path):
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                old_list = json.load(f)
                for item in old_list:
                    catalog_by_url[item['url']] = item
            print(f"📖 Đã tải {len(catalog_by_url)} tài liệu từ catalog hiện tại.")
        except Exception:
            pass

    new_items_count = 0
    for cat in selected_cats:
        print(f"\n📂 Đang quét: {cat['name']}...")
        article_links = extract_article_links(cat, max_pages=args.pages)
        print(f"   Tìm thấy {len(article_links)} bài viết/tài liệu.")
        
        for idx, art_url in enumerate(article_links, 1):
            if art_url in catalog_by_url:
                continue
            
            data = parse_document_article(art_url, cat['id'], cat['name'])
            if data and (data['downloads'] or data['drive_links']):
                catalog_by_url[art_url] = data
                new_items_count += 1
                dl_count = len(data['downloads'])
                dr_count = len(data['drive_links'])
                print(f"   [{idx}/{len(article_links)}] ➕ {data['title'][:55]}... ({dl_count} DL, {dr_count} Drive)")
            time.sleep(0.2)

    all_items = list(catalog_by_url.values())

    # Save catalog.json
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(all_items, f, ensure_ascii=False, indent=2)
    print(f"\n💾 Đã lưu tổng cộng {len(all_items)} tài liệu (+{new_items_count} mới) vào: {json_path}")

    # Generate Markdown Summary
    md_path = os.path.join(args.out_dir, 'CHUYEN_ANH_RESOURCES.md')
    with open(md_path, 'w', encoding='utf-8') as f:
        f.write("# 📚 KHO DỮ LIỆU ĐỀ THI CHUYÊN ANH, VÀO LỚP 10 & CHUYÊN ĐỀ NÂNG CAO\n\n")
        f.write(f"*Thời gian cập nhật: {time.strftime('%Y-%m-%d %H:%M:%S')}*\n")
        f.write(f"*Tổng số bài đăng/bộ đề trong kho dữ liệu: {len(all_items)} tài liệu*\n\n")

        # Group by category_name
        grouped = {}
        for item in all_items:
            cname = item.get('category_name') or item.get('category_id') or 'Khác'
            grouped.setdefault(cname, []).append(item)

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

    print(f"📄 Đã cập nhật file Markdown tổng hợp: {md_path}")
    print("✨ Quá trình crawl hoàn tất thành công!")

if __name__ == '__main__':
    main()
