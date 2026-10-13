/**
 * Map 10 chủ đề của app → category Wikipedia. Đây là file DUY NHẤT phải sửa
 * khi muốn thêm/bớt chủ đề hoặc mở rộng kho bài.
 *
 * Tên category phải viết đúng như trên Wikipedia (phân biệt chữ hoa, dùng dấu
 * cách chứ không gạch dưới — code tự encode).
 */
export type TopicCategoryMap = ReadonlyArray<{
  topic: string;
  en: string[];
  simple: string[];
}>;

export const TOPIC_CATEGORIES: TopicCategoryMap = [
  {
    topic: 'environment',
    en: ['Oceanography', 'Climate change', 'Conservation biology', 'Renewable energy', 'Pollution', 'Ecology'],
    simple: ['Environment', 'Climate', 'Energy'],
  },
  {
    topic: 'technology',
    en: ['Nanotechnology', 'Artificial intelligence', 'Computer science', 'Robotics', 'Telecommunications'],
    simple: ['Technology', 'Computer science'],
  },
  {
    topic: 'education',
    en: ['Learning', 'Education', 'Educational psychology', 'Language education'],
    simple: ['Education', 'Schools'],
  },
  {
    topic: 'health',
    en: ['Immunology', 'Public health', 'Nutrition', 'Epidemiology', 'Human diseases and disorders'],
    simple: ['Health', 'Medicine', 'Diseases'],
  },
  {
    topic: 'science',
    en: ['Quantum mechanics', 'Physics', 'Astronomy', 'Geology', 'Botany', 'Zoology'],
    simple: ['Science', 'Biology', 'Physics', 'Astronomy'],
  },
  {
    topic: 'business',
    en: ['Macroeconomics', 'Economics', 'International trade', 'Management', 'Marketing'],
    simple: ['Economics', 'Business'],
  },
  {
    topic: 'society',
    en: ['Political science', 'Sociology', 'Urban planning', 'Transport', 'Demography'],
    simple: ['Society', 'Transport', 'Cities'],
  },
  {
    topic: 'culture',
    en: ['Linguistics', 'Cultural heritage', 'Archaeology', 'Music genres', 'Visual arts'],
    simple: ['Culture', 'Art', 'Music'],
  },
  {
    topic: 'history',
    en: ['History of technology', 'Ancient history', 'Industrial Revolution', 'History of science', 'Historical eras'],
    simple: ['History', 'Ancient history'],
  },
  {
    topic: 'psychology',
    en: ['Cognitive science', 'Cognitive psychology', 'Memory', 'Motivation', 'Sleep'],
    simple: ['Psychology', 'Human behaviour'],
  },
];
