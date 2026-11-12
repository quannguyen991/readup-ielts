#!/usr/bin/env python3
"""
Social Search CLI: Tra cứu đề chuyên Anh, đề thi vào 10, tài liệu ôn thi PDF
trên Facebook, Threads và kho Google Drive chia sẻ từ cộng đồng.
"""

import sys
import urllib.parse
import argparse

# Fix console encoding on Windows
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Danh sách các kho Google Drive công khai chất lượng cao đã xác minh
VERIFIED_DRIVE_REPOSITORIES = [
    {
        "name": "Bộ đề thi tuyển sinh vào lớp 10 môn Tiếng Anh (Lưu Hoằng Trí - Word + PDF)",
        "url": "https://drive.google.com/drive/folders/1du8xsAhhNP_LS3tcDlo6wJt_PlB6_aGF?usp=sharing",
        "description": "Kho đề thi tuyển sinh lớp 10 tổng hợp, đầy đủ đáp án trắc nghiệm và tự luận."
    },
    {
        "name": "Tổng hợp Đề thi môn Anh vào 10 kèm đáp án & Audio",
        "url": "https://drive.google.com/drive/folders/16J15MJGroip6jzqEl1a9sBWZJCW-Gnxn?usp=sharing",
        "description": "Bộ đề thi vào 10 mới nhất từ các Sở GD&ĐT cả nước."
    },
    {
        "name": "Kho tài liệu 100 Đề thi Chuyên Anh kèm đáp án chi tiết",
        "url": "https://drive.google.com/file/d/1Uc3W-4Fki4w3-DgPRdeDuim_MUG-MfvI/view",
        "description": "100 đề tuyển chọn từ các trường THPT Chuyên (CSP, CNN, Ams, PTNK, Lam Sơn...)."
    },
    {
        "name": "Sách Chinh Phục Đề Thi Vào 10 Chuyên Khối Chuyên Anh (Dương Thị Hương - PDF)",
        "url": "https://drive.google.com/file/d/1gm-eMb0myoNUmCRsfkg2ZcV2dMXwzDFL",
        "description": "Sách ôn luyện nâng cao Word Formation, Open Cloze, Sentence Transformation."
    },
    {
        "name": "Đề thi Tiếng Anh Chuyên Amsterdam & Vào lớp 6/10",
        "url": "https://drive.google.com/drive/folders/1mc3uKcMfXrNivvigGvViCYFtIU4g64N1?usp=sharing",
        "description": "Tuyển tập đề thi chính thức qua các năm của THPT Chuyên Hà Nội - Amsterdam."
    },
    {
        "name": "+100 Đề thi HSG Tiếng Anh 9 cấp tỉnh/thành phố có đáp án",
        "url": "https://drive.google.com/file/d/1xinvHDxabmH9KY5KMmKB30b5RwvF1Qbx/view",
        "description": "Đề thi học sinh giỏi lớp 9 - nền tảng đề ôn thi vào Chuyên Anh các tỉnh."
    }
]

# Danh sách Group Facebook & Page chuyên môn
FACEBOOK_RESOURCES = [
    {
        "title": "Cộng đồng Tài liệu diệu kỳ (Official Group)",
        "url": "https://www.facebook.com/groups/tailieudieuky",
        "note": "Hơn 50,000 thành viên, chuyên chia sẻ đề Chuyên Anh, HSG Quốc Gia, Olympic 30/4."
    },
    {
        "title": "Fanpage Tài liệu diệu kỳ",
        "url": "https://www.facebook.com/tailieudieuky",
        "note": "Cập nhật đề thi mới nhất ngay sau mỗi đợt thi tuyển sinh."
    },
    {
        "title": "Nhóm Ôn thi vào lớp 10 Chuyên Anh (Facebook Group Search)",
        "url": "https://www.facebook.com/groups/search/groups/?q=ôn%20thi%20vào%2010%20chuyên%20anh",
        "note": "Tra cứu các hội nhóm sĩ tử và giáo viên luyện thi Chuyên Anh."
    },
    {
        "title": "Tra cứu bài viết chia sẻ link Drive Chuyên Anh trên Facebook",
        "url": "https://www.facebook.com/search/posts/?q=chuyên%20anh%20drive.google.com",
        "note": "Lọc các bài viết công khai có chứa liên kết Google Drive."
    }
]

# Truy vấn Threads
THREADS_KEYWORDS = [
    {"topic": "Đề thi chuyên Anh", "url": "https://www.threads.net/search?q=chuy%C3%AAn%20anh"},
    {"topic": "Tài liệu ôn thi vào 10", "url": "https://www.threads.net/search?q=%C3%B4n%20thi%20v%C3%A0o%2010%20ti%E1%BA%BFng%20anh"},
    {"topic": "Share drive chuyên Anh", "url": "https://www.threads.net/search?q=drive%20chuy%C3%AAn%20anh"},
    {"topic": "Review sách chuyên Anh / HSG", "url": "https://www.threads.net/search?q=s%C3%A1ch%20chuy%C3%AAn%20anh"}
]

def generate_google_dorks(query: str):
    dorks = [
        f'site:facebook.com "{query}" "drive.google.com"',
        f'site:threads.net "{query}"',
        f'site:drive.google.com/drive/folders "{query}"',
        f'"{query}" filetype:pdf "đáp án" OR "answer key"',
        f'"{query}" site:tailieudieuky.com'
    ]
    return dorks

def main():
    parser = argparse.ArgumentParser(description="Social & Drive Search Helper for Chuyen Anh")
    parser.add_argument('--query', type=str, default="chuyên anh vào 10", help="Từ khóa tra cứu")
    parser.add_argument('--dorks', action='store_true', help="Hiển thị Google Dorks để tìm trên FB/Threads/Drive")
    args = parser.parse_args()

    print("=" * 65)
    print("🌐 CÔNG CỤ TRA CỨU TÀI LIỆU CHUYÊN ANH (FACEBOOK, THREADS, DRIVE)")
    print("=" * 65)

    print("\n📂 [1] KHO GOOGLE DRIVE ĐÃ XÁC MINH (TRUY CẬP TRỰC TIẾP):")
    for idx, repo in enumerate(VERIFIED_DRIVE_REPOSITORIES, 1):
        print(f"  {idx}. {repo['name']}")
        print(f"     🔗 Link: {repo['url']}")
        print(f"     📝 Ghi chú: {repo['description']}\n")

    print("👥 [2] CỘNG ĐỒNG FACEBOOK & ĐƯỜNG DẪN TÌM KIẾM:")
    for idx, fb in enumerate(FACEBOOK_RESOURCES, 1):
        print(f"  {idx}. {fb['title']}")
        print(f"     🔗 {fb['url']}")
        print(f"     💡 {fb['note']}\n")

    print("🧵 [3] KÊNH TRA CỨU TRÊN THREADS (THREADS.NET):")
    for idx, th in enumerate(THREADS_KEYWORDS, 1):
        print(f"  {idx}. Chủ đề: {th['topic']}")
        print(f"     🔗 {th['url']}")

    if args.dorks:
        print("\n🔍 [4] GOOGLE DORKS CHUYÊN DỤNG (Copy vào Google để quét FB & Threads):")
        for d in generate_google_dorks(args.query):
            print(f"  * {d}")

    print("\n" + "=" * 65)

if __name__ == '__main__':
    main()
