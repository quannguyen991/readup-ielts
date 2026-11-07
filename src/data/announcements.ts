/**
 * Thông báo gửi tới người dùng Band 9: tuyển cộng tác viên, cập nhật lớn.
 *
 * Danh sách chỉ hiện tiêu đề và một dòng tóm tắt. Nội dung đầy đủ nằm ở trang chi tiết
 * `app/thong-bao/[id].tsx`. Kênh nhận hồ sơ KHÔNG ghi cứng ở đây: lấy từ CONTACT, chưa
 * khai kênh nào thì trang chi tiết nói rõ là đang cập nhật, không bịa số hay link.
 */

export type AnnouncementKind = 'tuyen-cong-tac-vien';

export type AnnouncementSection = {
  heading: string;
  items: string[];
};

export type Announcement = {
  id: string;
  kind: AnnouncementKind;
  /** Tiêu đề trên thẻ danh sách và đầu trang chi tiết. */
  title: string;
  /** Một câu tóm tắt, hiện dưới tiêu đề trên thẻ danh sách. */
  summary: string;
  /** Ngày đăng, dạng YYYY-MM-DD. */
  postedAt: string;
  sections: AnnouncementSection[];
};

export const ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'tuyen-ctv-marketing',
    kind: 'tuyen-cong-tac-vien',
    title: 'Tuyển CTV Marketing',
    summary: 'Làm nội dung video ngắn cho Band 9 trên TikTok, Instagram và YouTube Shorts.',
    postedAt: '2026-10-31',
    sections: [
      {
        heading: 'Mô tả công việc',
        items: [
          'Sáng tạo và chỉnh sửa video ngắn cho TikTok, Instagram, YouTube Shorts, X và Threads.',
          'Nội dung làm bằng tiếng Việt, giúp học sinh và phụ huynh hiểu Band 9 dễ hơn.',
          'Làm việc từ xa, tự sắp lịch. Không cần lộ mặt; có thể làm bằng giọng đọc và hình ảnh.',
        ],
      },
      {
        heading: 'Quyền lợi',
        items: [
          'Dùng đầy đủ các tính năng của Band 9.',
          'Thù lao theo số video và hiệu quả. Mức cụ thể sẽ được gửi khi nhận hồ sơ.',
          'Được hướng dẫn quy trình và tiêu chuẩn nội dung từ đầu.',
        ],
      },
      {
        heading: 'Yêu cầu',
        items: [
          'Đã dùng qua Band 9 và hiểu các phần luyện thi.',
          'Quen với TikTok, Instagram, YouTube Shorts.',
          'Có kinh nghiệm làm nội dung là lợi thế. Chưa có kinh nghiệm vẫn nộp hồ sơ được.',
        ],
      },
    ],
  },
];

export function getAnnouncement(id: string | undefined): Announcement | undefined {
  return ANNOUNCEMENTS.find((a) => a.id === id);
}

/** 2026-10-31 → "31/10/2026", cách người Việt vẫn đọc ngày. */
export function formatPostedAt(postedAt: string): string {
  const [y, m, d] = postedAt.split('-');
  return `${d}/${m}/${y}`;
}
