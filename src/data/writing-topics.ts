/** IELTS Writing topic families used by both the prompt bank and model samples. */
export const WRITING_TOPICS = [
  { slug: 'education', en: 'Education', vi: 'Giáo dục' },
  { slug: 'environment', en: 'Environment', vi: 'Môi trường' },
  { slug: 'technology', en: 'Technology', vi: 'Công nghệ' },
  { slug: 'health', en: 'Health', vi: 'Sức khoẻ' },
  { slug: 'work', en: 'Work', vi: 'Công việc' },
  { slug: 'transport', en: 'Transport', vi: 'Giao thông' },
  { slug: 'media', en: 'Media', vi: 'Truyền thông' },
  { slug: 'crime', en: 'Crime', vi: 'Tội phạm' },
  { slug: 'government', en: 'Government', vi: 'Chính phủ' },
  { slug: 'culture', en: 'Culture', vi: 'Văn hoá' },
  { slug: 'tourism', en: 'Tourism', vi: 'Du lịch' },
  { slug: 'science', en: 'Science', vi: 'Khoa học' },
  { slug: 'family', en: 'Family', vi: 'Gia đình' },
  { slug: 'social-media', en: 'Social media', vi: 'Truyền thông xã hội' },
  { slug: 'shopping', en: 'Shopping', vi: 'Mua sắm' },
  { slug: 'travel', en: 'Travel', vi: 'Du lịch' },
  { slug: 'urban-life', en: 'Urban life', vi: 'Đời sống đô thị' },
  { slug: 'hobbies', en: 'Hobbies', vi: 'Sở thích' },
  { slug: 'economy', en: 'Economy', vi: 'Kinh tế' },
  { slug: 'society', en: 'Society', vi: 'Xã hội' },
  { slug: 'business', en: 'Business', vi: 'Kinh doanh' },
  { slug: 'housing', en: 'Housing', vi: 'Nhà ở' },
  { slug: 'food', en: 'Food and agriculture', vi: 'Thực phẩm và nông nghiệp' },
  { slug: 'globalisation', en: 'Globalisation', vi: 'Toàn cầu hoá' },
  { slug: 'privacy', en: 'Privacy', vi: 'Quyền riêng tư' },
  { slug: 'sport', en: 'Sport', vi: 'Thể thao' },
  { slug: 'agriculture', en: 'Agriculture', vi: 'Nông nghiệp' },
  { slug: 'volunteering', en: 'Volunteering', vi: 'Hoạt động tình nguyện' },
  { slug: 'industry', en: 'Industry', vi: 'Công nghiệp' },
  { slug: 'task1-charts', en: 'Task 1 charts', vi: 'Biểu đồ Task 1' },
] as const;

export type WritingTopicSlug = (typeof WRITING_TOPICS)[number]['slug'];

export function writingTopicName(slug: string, locale: 'vi' | 'en' = 'vi'): string {
  const topic = WRITING_TOPICS.find((item) => item.slug === slug);
  return topic ? topic[locale] : slug.replace(/-/g, ' ');
}
