#!/usr/bin/env python3
"""
Claude CLI Audit Script: Runs Claude CLI with --dangerously-skip-permissions to evaluate the crawled dataset.
"""

import subprocess
import sys
import json

# Fix console encoding on Windows
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

def main():
    with open('data/chuyen_anh/catalog.json', 'r', encoding='utf-8') as f:
        catalog = json.load(f)

    total = len(catalog)
    dl_count = sum(len(x.get('downloads', [])) for x in catalog)
    dr_count = sum(len(x.get('drive_links', [])) for x in catalog)

    summary_text = f"""Thống kê kho dữ liệu data/chuyen_anh/catalog.json:
- Tổng số bài: {total}
- Tổng số file tải trực tiếp (ZIP, PDF, Word, MP3): {dl_count}
- Tổng số link Google Drive công khai: {dr_count}
- Các nguồn trọng điểm: THPT Chuyên Ngoại Ngữ (CNN), Chuyên Đại học Sư Phạm (CSP), Chuyên Amsterdam, Phổ thông Năng khiếu (PTNK), Tuyển tập 20 năm Olympic 30/4, +2000 bài Word Form C1-C2, 1500 câu Sentence Transformation, Đề HSG 8-9 các tỉnh."""

    prompt = f"""Bạn là chuyên gia thẩm định dữ liệu giáo dục và khảo thí tiếng Anh.
{summary_text}

Hãy đánh giá và kiểm tra lại bộ dữ liệu này:
1. Đánh giá chất lượng và độ phủ của kho dữ liệu đối với học sinh ôn thi Chuyên Anh & Vào 10.
2. Kiểm tra độ tin cậy giữa link tải trực tiếp (tailieudieuky CDN) và Google Drive.
3. Đưa ra 2 đề xuất cụ thể để hoàn thiện kho học liệu này cho ứng dụng ReadUp IELTS / Chuyên Anh.
Trả lời bằng tiếng Việt, ngắn gọn, súc tích."""

    cmd = ['claude', '-p', '--dangerously-skip-permissions', prompt]
    try:
        # Use shell=True for windows .cmd wrapper
        proc = subprocess.run(
            cmd,
            shell=True,
            stdin=subprocess.DEVNULL,
            capture_output=True,
            text=True,
            encoding='utf-8',
            timeout=40
        )
        print("=" * 65)
        print("🧠 KẾT QUẢ KIỂM TRA ĐỘC LẬP TỪ CLAUDE CLI (CLAUDE CODE)")
        print("=" * 65)
        if proc.stdout:
            print(proc.stdout.strip())
        else:
            print(proc.stderr.strip())
        print("=" * 65)
    except Exception as e:
        print("Claude CLI run error:", e)

if __name__ == '__main__':
    main()
