/**
 * Map 10 chủ đề của app → category Wikipedia. Đây là file DUY NHẤT phải sửa
 * khi muốn thêm/bớt chủ đề hoặc mở rộng kho bài.
 *
 * Tên category phải viết đúng như trên Wikipedia (phân biệt chữ hoa, dùng dấu
 * cách chứ không gạch dưới — code tự encode).
 */
export const TOPIC_CATEGORIES: ReadonlyArray<{
  topic: string;
  en: string[];
  simple: string[];
}> = [
  {
    topic: 'environment',
    en: ['Climate change', 'Conservation biology', 'Renewable energy', 'Pollution', 'Ecology'],
    simple: ['Environment', 'Climate', 'Energy'],
  },
  {
    topic: 'technology',
    en: ['Artificial intelligence', 'Computer science', 'Robotics', 'Telecommunications'],
    simple: ['Technology', 'Computer science'],
  },
  {
    topic: 'education',
    en: ['Education', 'Educational psychology', 'Language education'],
    simple: ['Education', 'Schools'],
  },
  {
    topic: 'health',
    en: ['Public health', 'Nutrition', 'Epidemiology', 'Human diseases and disorders'],
    simple: ['Health', 'Medicine', 'Diseases'],
  },
  {
    topic: 'science',
    en: ['Physics', 'Astronomy', 'Geology', 'Botany', 'Zoology'],
    simple: ['Science', 'Biology', 'Physics', 'Astronomy'],
  },
  {
    topic: 'business',
    en: ['Economics', 'International trade', 'Management', 'Marketing'],
    simple: ['Economics', 'Business'],
  },
  {
    topic: 'society',
    en: ['Sociology', 'Urban planning', 'Transport', 'Demography'],
    simple: ['Society', 'Transport', 'Cities'],
  },
  {
    topic: 'culture',
    en: ['Cultural heritage', 'Archaeology', 'Music genres', 'Visual arts'],
    simple: ['Culture', 'Art', 'Music'],
  },
  {
    topic: 'history',
    en: ['Ancient history', 'Industrial Revolution', 'History of science', 'Historical eras'],
    simple: ['History', 'Ancient history'],
  },
  {
    topic: 'psychology',
    en: ['Cognitive psychology', 'Memory', 'Motivation', 'Sleep'],
    simple: ['Psychology', 'Human behaviour'],
  },
];
