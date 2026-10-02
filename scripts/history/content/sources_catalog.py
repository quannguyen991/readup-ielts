"""Danh mục nguồn đã MỞ ĐỌC (đối chiếu bằng grep_src.py / đọc tay). Mã nguồn ổn định `src-…` dùng trong claims.
accessed = ngày đọc (02/10/2026). kind: primary-doc | museum | archive | scholarly | news | tertiary."""

SOURCES = {
    "src-btlsqg-danang-1858": dict(
        title="Liên quân Pháp - Tây Ban Nha nổ súng đánh thành Đà Nẵng mở đầu cuộc xâm lược Việt Nam lần thứ nhất 9/1858",
        publisher="Bảo tàng Lịch sử Quốc gia (tổng hợp từ Nguyễn Quang Ngọc, Tiến trình lịch sử Việt Nam, NXB Giáo dục, 2005, tr. 208–210)",
        url="https://baotanglichsu.vn/vi/Articles/2002/68064/lien-quan-phap-tay-ban-nha-no-sung-djanh-thanh-dja-nang-mo-djau-cuoc-xam-luoc-viet-nam-lan-thu-nhat-9-1858.html",
        kind="museum"),
    "src-baodanang-dienhai": dict(
        title="Về vụ phá hủy thành Điện Hải của quân Pháp - Tây Ban Nha",
        publisher="Báo Đà Nẵng (dẫn báo cáo của Đại úy công binh Gallimard, 1858)",
        url="https://baodanang.vn/ve-vu-pha-huy-thanh-dien-hai-cua-quan-phap-tay-ban-nha-3232090.html",
        kind="news"),
    "src-wiki-tourane": dict(
        title="Siege of Tourane",
        publisher="Wikipedia (nguồn thứ cấp, dùng để đối chiếu)",
        url="https://en.wikipedia.org/wiki/Siege_of_Tourane",
        kind="tertiary"),
    "src-archives-le-doc-lap": dict(
        title="Lễ Độc lập khai sinh nước Việt Nam được tổ chức thế nào?",
        publisher="Trung tâm Lưu trữ quốc gia I",
        url="https://www.archives.org.vn/tin-tong-hop/le-doc-lap-khai-sinh-nuoc-viet-nam-duoc-to-chuc-the-nao.htm",
        kind="archive"),
    "src-uqam-drv": dict(
        title="Democratic Republic of Vietnam (DRV)",
        publisher="Historical Dictionary of the Indochina War, Université du Québec à Montréal (UQAM)",
        url="https://indochine.uqam.ca/en/historical-dictionary/381-democratic-republic-of-vietnam-drv.html",
        kind="scholarly"),
    "src-uqam-hanoi": dict(
        title="Hanoi",
        publisher="Historical Dictionary of the Indochina War, UQAM",
        url="https://indochine.uqam.ca/en/component/content/article/577-hanoi.html",
        kind="scholarly"),
    "src-uqam-23sep1945": dict(
        title="23 September 1945",
        publisher="Historical Dictionary of the Indochina War, UQAM",
        url="https://indochine.uqam.ca/en/historical-dictionary/7-23-september-1945.html",
        kind="scholarly"),
    "src-uqam-19dec1946": dict(
        title="19 December 1946",
        publisher="Historical Dictionary of the Indochina War, UQAM",
        url="https://indochine.uqam.ca/vi/t-in-chin-tranh/8-19-december-1946.html",
        kind="scholarly"),
    "src-btlsqg-tongtuyencu": dict(
        title="Cuộc Tổng tuyển cử 6-1-1946 và Hiến pháp đầu tiên của nước Việt Nam Dân chủ Cộng hòa",
        publisher="Bảo tàng Lịch sử Quốc gia",
        url="https://baotanglichsuquocgia.vn/vi/Articles/3096/18900/cuoc-tong-tuyen-cu-6-1-1946-va-hien-phap-djau-tien-cua-nuoc-viet-nam-dan-chu-cong-hoa.html",
        kind="museum"),
    "src-archives-1945-1946": dict(
        title="Từ Cách mạng tháng Tám đến ngày Toàn quốc kháng chiến qua tài liệu lưu trữ",
        publisher="Trung tâm Lưu trữ quốc gia I",
        url="https://www.archives.org.vn/gioi-thieu-tai-lieu-nghiep-vu/tu-cach-mang-thang-8-den-ngay-toan-quoc-khang-chien-qua-tai-lieu-luu-tru.htm",
        kind="archive"),
    "src-archives-hiepdinh-so-bo": dict(
        title="Chủ tịch Hồ Chí Minh từ Hiệp định sơ bộ 06-3 đến Tạm ước 14-9-1946",
        publisher="Trung tâm Lưu trữ quốc gia I",
        url="https://www.archives.org.vn/gioi-thieu-tai-lieu-nghiep-vu/chu-tich-ho-chi-minh-tu-hiep-dinh-so-bo-06-3-den-tam-uoc-14-9-1946.htm",
        kind="archive"),
    "src-btlsqg-nambo-23-9": dict(
        title="Ngày Nam bộ kháng chiến 23-9-1945",
        publisher="Bảo tàng Lịch sử Quốc gia (tổng hợp từ Lịch sử Nam bộ kháng chiến, tập 1, NXB Chính trị quốc gia – Sự thật, 2012)",
        url="https://baotanglichsu.vn/vi/Articles/3097/61816/ngay-nam-bo-khang-chien-23-9-1945.html",
        kind="museum"),
    "src-btlsqg-19-12-1946": dict(
        title="19-12-1946: Ngày toàn quốc kháng chiến",
        publisher="Bảo tàng Lịch sử Quốc gia (tổng hợp từ 60 năm Toàn quốc kháng chiến, NXB Quân đội nhân dân, 2007)",
        url="https://baotanglichsu.vn/vi/Articles/2002/68312/19-12-1946-ngay-toan-quoc-khang-chien.html",
        kind="museum"),
    "src-hcmmuseum-chrono-1946": dict(
        title="Biên niên tiểu sử Hồ Chí Minh (tháng 12-1946)",
        publisher="Bảo tàng Hồ Chí Minh",
        url="https://baotanghochiminh.vn/danh-sach-bien-nien-tieu-su/p-369.htm",
        kind="museum"),
    "src-btlsqg-geneve": dict(
        title="60 năm ký kết Hiệp định Giơnevơ và một số tư liệu đang lưu giữ tại BTLSQG",
        publisher="Bảo tàng Lịch sử Quốc gia",
        url="https://baotanglichsuquocgia.vn/vi/Articles/2001/68176/60-nam-ky-ket-hiep-djinh-gionevo-va-mot-so-tu-lieu-djang-luu-giu-tai-btlsqg.html",
        kind="museum"),
}

SOURCES.update({
    "src-btlsqg-anh-hanoi-1946": dict(
        title="Giới thiệu danh mục tài liệu ảnh Hà Nội những ngày đầu toàn quốc kháng chiến (19-12-1946 – 17-02-1947)",
        publisher="Bảo tàng Lịch sử Quốc gia (ảnh của Nguyễn Bá Khoản, Trung tâm Lưu trữ quốc gia III)",
        url="https://baotanglichsuquocgia.vn/vi/Articles/3091/9797/gioi-thieu-danh-muc-tai-lieu-anh-ha-noi-nhung-ngay-djau-toan-quoc-khang-chien-19-12-1946-17-02-1947.html",
        kind="museum"),
    "src-hanoimoi-60-ngay-dem": dict(
        title="'60 ngày đêm khói lửa' – khúc tráng ca của quân và dân Thủ đô",
        publisher="Báo Hànộimới (Thiếu tướng Nguyễn Thế Kết, 05/12/2016)",
        url="https://hanoimoi.vn/bai-8-60-ngay-dem-khoi-lua-khuc-trang-ca-cua-quan-va-dan-thu-do-607823.html",
        kind="news"),
    "src-atk-dinh-hoa": dict(
        title="Khái quát về Khu di tích lịch sử ATK Định Hóa",
        publisher="Khu di tích lịch sử ATK Định Hóa (cổng thông tin chính thức)",
        url="https://atkdinhhoa.hochiminh.vn/DinhHoadata/pano/info.html",
        kind="museum"),
    "src-thanhtra-thainguyen-atk": dict(
        title="Ôn lại lịch sử 78 năm ngày Chủ tịch Hồ Chí Minh về ATK Định Hóa (20/5/1947 – 20/5/2025)",
        publisher="Thanh tra tỉnh Thái Nguyên",
        url="https://thanhtra.thainguyen.gov.vn/tin-hoat-dong/on-lai-lich-su-78-nam-ngay-chu-tich-ho-chi-minh-ve-atk-dinh-hoa-20-5-1947-20-5-2025-175817",
        kind="news"),
    "src-btlsqg-bien-gioi-14-10": dict(
        title="Cách đây 63 năm (16/9/1950 – 14/10/1950): Ta mở chiến dịch Biên giới thu đông (Chiến dịch Lê Hồng Phong II)",
        publisher="Bảo tàng Lịch sử Quốc gia (tổng hợp từ Lê Mậu Hãn, Đại cương Lịch sử Việt Nam, tập III; Nguyễn Quang Ngọc, Tiến trình Lịch sử Việt Nam)",
        url="https://baotanglichsuquocgia.vn/vi/Articles/3097/15060/cach-djay-63-nam-16-9-1950-14-10-1950-ta-mo-chien-dich-bien-gioi-thu-djong-chien-dich-le-hong-phong-ii.html",
        kind="museum"),
    "src-btlsqg-bien-gioi-17-10": dict(
        title="Chiến dịch Biên giới Thu đông (16/9 – 17/10/1950): sự thành công trong sử dụng kế hoạch tác chiến",
        publisher="Bảo tàng Lịch sử Quốc gia",
        url="https://baotanglichsuquocgia.vn/vi/Articles/3097/18574/chien-dich-bien-gioi-thu-djong-16-9-17-10-1950-su-thanh-cong-trong-su-dung-ke-hoach-tac-chien.html",
        kind="museum"),
    "src-qdnd-bien-gioi-hau-can": dict(
        title="Tổng cục Cung cấp trong Chiến dịch Biên giới",
        publisher="Báo Quân đội nhân dân – chuyên trang Hậu cần",
        url="https://hc.qdnd.vn/lich-su-hau-can/tong-cuc-cung-cap-trong-chien-dich-bien-gioi-481907",
        kind="news"),
    "src-btlsqg-giao-duc-khang-chien": dict(
        title="Chủ tịch Hồ Chí Minh với việc xây dựng nền giáo dục phục vụ kháng chiến (1945–1954)",
        publisher="Bảo tàng Lịch sử Quốc gia",
        url="https://baotanglichsuquocgia.vn/vi/Articles/3096/18167/chu-tich-ho-chi-minh-voi-viec-xay-dung-nen-giao-duc-phuc-vu-khang-chien-1945-1954.html",
        kind="museum"),
})
