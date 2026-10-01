/**
 * BẢN TIẾNG ANH CHO NHÃN CỦA KHO ĐỌC BÁO SONG NGỮ — chủ đề, dòng giới thiệu từng
 * tờ báo, dạng câu hỏi hiểu bài.
 *
 * Dữ liệu gốc (`data/bilingual-repository.ts`, `data/seed/bilingual/*.json`) giữ
 * nguyên tiếng Việt và vẫn là nguồn sự thật; tệp này chỉ tra để vẽ khi giao diện
 * ở tiếng Anh. Nhãn nào chưa có trong bảng thì hiện lại bản gốc chứ không trống.
 */

const TOPIC_EN: Record<string, string> = {
  'Khoa học & môi trường': 'Science & environment',
  'Ngôn ngữ & giáo dục': 'Language & education',
  'Đời sống & xã hội': 'Life & society',
  'Lịch sử & văn hoá': 'History & culture',
  'Công nghệ & kinh tế': 'Technology & economy',
  'Sức khoẻ & cơ thể': 'Health & the body',
  'Việt Nam & khu vực': 'Vietnam & the region',
};

const TAGLINE_EN: Record<string, string> = {
  readup: 'Our own analysis — economics, health, science, Vietnam',
  voa: 'Science, health and culture news in easy-to-read English',
  gv: 'Stories from communities around the world, told by insiders',
  nasa: 'Earth, the Moon and the sky — told by the scientists themselves',
  wikinews: 'Science and environment news edited by the community',
  wikipedia: 'Encyclopedia articles: history, nature, civilisation — classic IELTS material',
};

const QUESTION_TYPE_EN: Record<string, string> = {
  'Ý chính': 'Main idea',
  'Chi tiết': 'Detail',
  'Từ trong ngữ cảnh': 'Word in context',
  'Mục đích': 'Purpose',
  'Suy luận': 'Inference',
  'Ý chính đoạn': 'Paragraph main idea',
  'Giọng điệu': 'Tone',
  'Chức năng chi tiết': 'Function of a detail',
  'Từ vựng trong ngữ cảnh': 'Vocabulary in context',
};

export function bilingualTopic(topic: string, en: boolean): string {
  return en ? (TOPIC_EN[topic] ?? topic) : topic;
}

export function bilingualTagline(outletKey: string, vi: string, en: boolean): string {
  return en ? (TAGLINE_EN[outletKey] ?? vi) : vi;
}

export function bilingualQuestionType(type: string, en: boolean): string {
  return en ? (QUESTION_TYPE_EN[type] ?? type) : type;
}
