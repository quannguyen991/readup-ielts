/**
 * Chỉ mục NHẸ của các bộ từ vựng: tên và mã của từng bộ, không có từ nào.
 *
 * VÌ SAO CÓ: kho từ (vài MB JSON) phải nằm ngoài bundle khởi động. Nhưng vài chỗ chạy
 * ngay lúc mở app (kiểm mã bộ đã lưu của du lịch, chọn bộ cho kế hoạch) chỉ cần tên và
 * mã — nên lấy từ đây. `vocab-index.test.ts` báo nếu file này lệch khỏi bộ đầy đủ.
 *
 * Sinh bằng tay một lần từ `vocab-topics`, `vocab-listening`, `vocab-for-ielts`,
 * `vocab-for-ielts-advanced`, `destination-vocab`, `vocab-daily`. Thêm bộ mới thì
 * thêm vào đây, rồi test sẽ xác nhận.
 */

export const TOPIC_INDEX: ReadonlyArray<{ slug: string; nameVi: string }> = [
  {
    "slug": "education",
    "nameVi": "Giáo dục"
  },
  {
    "slug": "environment",
    "nameVi": "Môi trường"
  },
  {
    "slug": "technology",
    "nameVi": "Công nghệ"
  },
  {
    "slug": "health",
    "nameVi": "Sức khoẻ"
  },
  {
    "slug": "work",
    "nameVi": "Công việc"
  },
  {
    "slug": "society",
    "nameVi": "Xã hội"
  },
  {
    "slug": "government",
    "nameVi": "Chính phủ và pháp luật"
  },
  {
    "slug": "economy",
    "nameVi": "Kinh tế"
  },
  {
    "slug": "media",
    "nameVi": "Truyền thông"
  },
  {
    "slug": "culture",
    "nameVi": "Văn hoá"
  },
  {
    "slug": "family",
    "nameVi": "Gia đình"
  },
  {
    "slug": "transport",
    "nameVi": "Giao thông"
  },
  {
    "slug": "tourism",
    "nameVi": "Du lịch"
  },
  {
    "slug": "city-life",
    "nameVi": "Đời sống đô thị"
  },
  {
    "slug": "crime",
    "nameVi": "Tội phạm"
  },
  {
    "slug": "science",
    "nameVi": "Khoa học"
  },
  {
    "slug": "art",
    "nameVi": "Nghệ thuật"
  },
  {
    "slug": "sport",
    "nameVi": "Thể thao"
  },
  {
    "slug": "food",
    "nameVi": "Ẩm thực"
  },
  {
    "slug": "housing",
    "nameVi": "Nhà ở"
  },
  {
    "slug": "money",
    "nameVi": "Tiền bạc"
  },
  {
    "slug": "globalisation",
    "nameVi": "Toàn cầu hoá"
  },
  {
    "slug": "language",
    "nameVi": "Ngôn ngữ"
  },
  {
    "slug": "children",
    "nameVi": "Trẻ em và thanh niên"
  },
  {
    "slug": "elderly",
    "nameVi": "Người cao tuổi"
  },
  {
    "slug": "animals",
    "nameVi": "Động vật"
  },
  {
    "slug": "space",
    "nameVi": "Vũ trụ"
  },
  {
    "slug": "happiness",
    "nameVi": "Hạnh phúc"
  },
  {
    "slug": "history",
    "nameVi": "Lịch sử"
  },
  {
    "slug": "energy",
    "nameVi": "Năng lượng"
  },
  {
    "slug": "personality",
    "nameVi": "Tính cách"
  },
  {
    "slug": "emotions",
    "nameVi": "Cảm xúc"
  },
  {
    "slug": "places",
    "nameVi": "Tả nơi chốn"
  },
  {
    "slug": "memories",
    "nameVi": "Ký ức"
  },
  {
    "slug": "success-failure",
    "nameVi": "Thành công và thất bại"
  },
  {
    "slug": "risk-safety",
    "nameVi": "Rủi ro và an toàn"
  },
  {
    "slug": "ethics",
    "nameVi": "Đạo đức"
  },
  {
    "slug": "change",
    "nameVi": "Thay đổi"
  },
  {
    "slug": "comparison",
    "nameVi": "So sánh"
  },
  {
    "slug": "cause-effect",
    "nameVi": "Nguyên nhân và kết quả"
  },
  {
    "slug": "agriculture",
    "nameVi": "Nông nghiệp"
  },
  {
    "slug": "animals-nature",
    "nameVi": "Động vật hoang dã"
  },
  {
    "slug": "weather-climate",
    "nameVi": "Thời tiết và khí hậu"
  },
  {
    "slug": "architecture",
    "nameVi": "Kiến trúc"
  },
  {
    "slug": "fashion",
    "nameVi": "Thời trang"
  },
  {
    "slug": "festivals",
    "nameVi": "Lễ hội"
  },
  {
    "slug": "shopping",
    "nameVi": "Mua sắm"
  },
  {
    "slug": "leisure",
    "nameVi": "Giải trí"
  },
  {
    "slug": "communication",
    "nameVi": "Giao tiếp"
  },
  {
    "slug": "ai-future",
    "nameVi": "AI và tương lai"
  }
];

/** Mọi mã bộ từ vựng hợp lệ (bộ chủ đề, Global Success, Nghe, VFI, VFIA, địa điểm, giao tiếp). */
export const DECK_SLUGS: ReadonlySet<string> = new Set([
  "education",
  "environment",
  "technology",
  "health",
  "work",
  "society",
  "government",
  "economy",
  "media",
  "culture",
  "family",
  "transport",
  "tourism",
  "city-life",
  "crime",
  "science",
  "art",
  "sport",
  "food",
  "housing",
  "money",
  "globalisation",
  "language",
  "children",
  "elderly",
  "animals",
  "space",
  "happiness",
  "history",
  "energy",
  "personality",
  "emotions",
  "places",
  "memories",
  "success-failure",
  "risk-safety",
  "ethics",
  "change",
  "comparison",
  "cause-effect",
  "agriculture",
  "animals-nature",
  "weather-climate",
  "architecture",
  "fashion",
  "festivals",
  "shopping",
  "leisure",
  "communication",
  "ai-future",
  "global-success-10-unit-01",
  "global-success-10-unit-02",
  "global-success-10-unit-03",
  "global-success-10-unit-04",
  "global-success-10-unit-05",
  "global-success-10-unit-06",
  "global-success-10-unit-07",
  "global-success-10-unit-08",
  "global-success-10-unit-09",
  "global-success-10-unit-10",
  "global-success-11-unit-01",
  "global-success-11-unit-02",
  "global-success-11-unit-03",
  "global-success-11-unit-04",
  "global-success-11-unit-05",
  "global-success-11-unit-06",
  "global-success-11-unit-07",
  "global-success-11-unit-08",
  "global-success-11-unit-09",
  "global-success-11-unit-10",
  "global-success-12-unit-01",
  "global-success-12-unit-02",
  "global-success-12-unit-03",
  "global-success-12-unit-04",
  "global-success-12-unit-05",
  "global-success-12-unit-06",
  "global-success-12-unit-07",
  "global-success-12-unit-08",
  "global-success-12-unit-09",
  "global-success-12-unit-10",
  "global-success-advanced",
  "listening-accommodation",
  "listening-travel-booking",
  "listening-personal-details",
  "listening-shopping-services",
  "listening-membership-events",
  "listening-jobs-work",
  "listening-tourism-tours",
  "listening-directions-maps",
  "listening-community-facilities",
  "listening-sports-leisure",
  "listening-university-life",
  "listening-research-methods",
  "listening-presentations-groupwork",
  "listening-courses-library",
  "listening-environment-wildlife",
  "listening-history-architecture",
  "listening-science-engineering",
  "listening-psychology-health",
  "listening-business-economics",
  "listening-numbers-dates-money",
  "listening-signposts-corrections",
  "vfi-unit-01",
  "vfi-unit-02",
  "vfi-unit-03",
  "vfi-unit-04",
  "vfi-unit-05",
  "vfi-unit-06",
  "vfi-unit-07",
  "vfi-unit-08",
  "vfi-unit-09",
  "vfi-unit-10",
  "vfi-unit-11",
  "vfi-unit-12",
  "vfi-unit-13",
  "vfi-unit-14",
  "vfi-unit-15",
  "vfi-unit-16",
  "vfi-unit-17",
  "vfi-unit-18",
  "vfi-unit-19",
  "vfi-unit-20",
  "vfia-unit-01",
  "vfia-unit-02",
  "vfia-unit-03",
  "vfia-unit-04",
  "vfia-unit-05",
  "vfia-unit-06",
  "vfia-unit-07",
  "vfia-unit-08",
  "vfia-unit-09",
  "vfia-unit-10",
  "vfia-unit-11",
  "vfia-unit-12",
  "vfia-unit-13",
  "vfia-unit-14",
  "vfia-unit-15",
  "vfia-unit-16",
  "vfia-unit-17",
  "vfia-unit-18",
  "vfia-unit-19",
  "vfia-unit-20",
  "destination-b1-unit-3",
  "destination-b1-unit-6",
  "destination-b1-unit-9",
  "destination-b1-unit-12",
  "destination-b1-unit-15",
  "destination-b1-unit-18",
  "destination-b1-unit-21",
  "destination-b1-unit-24",
  "destination-b1-unit-27",
  "destination-b1-unit-30",
  "destination-b1-unit-33",
  "destination-b1-unit-36",
  "destination-b1-unit-39",
  "destination-b1-unit-42",
  "destination-b2-unit-2",
  "destination-b2-unit-4",
  "destination-b2-unit-6",
  "destination-b2-unit-8",
  "destination-b2-unit-10",
  "destination-b2-unit-12",
  "destination-b2-unit-14",
  "destination-b2-unit-16",
  "destination-b2-unit-18",
  "destination-b2-unit-20",
  "destination-b2-unit-22",
  "destination-b2-unit-24",
  "destination-b2-unit-26",
  "destination-b2-unit-28",
  "destination-c1c2-unit-2",
  "destination-c1c2-unit-4",
  "destination-c1c2-unit-6",
  "destination-c1c2-unit-8",
  "destination-c1c2-unit-10",
  "destination-c1c2-unit-12",
  "destination-c1c2-unit-14",
  "destination-c1c2-unit-16",
  "destination-c1c2-unit-18",
  "destination-c1c2-unit-20",
  "destination-c1c2-unit-22",
  "destination-c1c2-unit-24",
  "destination-c1c2-unit-26",
  "daily-greetings",
  "daily-ordering",
  "daily-shopping",
  "daily-directions",
  "daily-hotel",
  "daily-work",
  "daily-plans",
  "daily-phone",
  "daily-health",
  "daily-small-talk",
  "daily-family",
  "daily-hobbies",
  "daily-housing",
  "daily-money",
  "daily-school",
  "daily-travel",
  "daily-cooking",
  "daily-feelings",
  "daily-polite",
  "daily-online"
]);
