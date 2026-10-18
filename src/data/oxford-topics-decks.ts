import { OXFORD_3000, OXFORD_ADVANCED, OXFORD_TOPICS, type OxfordEntry, type OxfordLevel } from './oxford';

export type OxfordTopicDeck = {
  id: string;
  slug: string;
  title: string;
  titleEn: string;
  badge: string;
  cover: string;
  gradient: [string, string];
  icon: string;
  words: OxfordEntry[];
};

const TOPIC_METADATA: Record<
  string,
  {
    id: string;
    slug: string;
    titleEn: string;
    badge: string;
    cover: string;
    gradient: [string, string];
    icon: string;
  }
> = {
  'Con người & Quan hệ': {
    id: 'people-relationships',
    slug: 'oxford-people-relationships',
    titleEn: 'People & Relationships',
    badge: 'RELATIONSHIPS',
    cover: '/vocab-covers/family.svg',
    gradient: ['#6366F1', '#4338CA'],
    icon: '👥',
  },
  'Cảm xúc & Tính cách': {
    id: 'feelings-personality',
    slug: 'oxford-feelings-personality',
    titleEn: 'Feelings & Personality',
    badge: 'EMOTIONS',
    cover: '/vocab-covers/emotions.svg',
    gradient: ['#EC4899', '#BE185D'],
    icon: '💖',
  },
  'Cơ thể & Sức khoẻ': {
    id: 'body-health',
    slug: 'oxford-body-health',
    titleEn: 'Body & Health',
    badge: 'HEALTH',
    cover: '/vocab-covers/health.svg',
    gradient: ['#10B981', '#047857'],
    icon: '🩺',
  },
  'Ăn uống': {
    id: 'food-drinks',
    slug: 'oxford-food-drinks',
    titleEn: 'Food & Cooking',
    badge: 'FOOD & DINING',
    cover: '/vocab-covers/food.svg',
    gradient: ['#F59E0B', '#B45309'],
    icon: '🍔',
  },
  'Nhà cửa & Đời sống': {
    id: 'home-living',
    slug: 'oxford-home-living',
    titleEn: 'Home & Everyday Life',
    badge: 'HOME & LIVING',
    cover: '/vocab-covers/housing.svg',
    gradient: ['#8B5CF6', '#6D28D9'],
    icon: '🏡',
  },
  'Kinh tế & Tiền bạc': {
    id: 'money-economy',
    slug: 'oxford-money-economy',
    titleEn: 'Money & Economy',
    badge: 'MONEY & FINANCE',
    cover: '/vocab-covers/money.svg',
    gradient: ['#14B8A6', '#0F766E'],
    icon: '💰',
  },
  'Giáo dục': {
    id: 'education',
    slug: 'oxford-education',
    titleEn: 'Education & Study',
    badge: 'EDUCATION',
    cover: '/vocab-covers/education.svg',
    gradient: ['#3B82F6', '#1D4ED8'],
    icon: '📖',
  },
  'Công việc': {
    id: 'work-career',
    slug: 'oxford-work-career',
    titleEn: 'Work & Employment',
    badge: 'CAREER & WORK',
    cover: '/vocab-covers/work.svg',
    gradient: ['#64748B', '#334155'],
    icon: '💼',
  },
  'Du lịch & Giao thông': {
    id: 'travel-transport',
    slug: 'oxford-travel-transport',
    titleEn: 'Travel & Transport',
    badge: 'TRAVEL',
    cover: '/vocab-covers/tourism.svg',
    gradient: ['#0EA5E9', '#0369A1'],
    icon: '✈️',
  },
  'Đô thị & Nơi chốn': {
    id: 'places-cities',
    slug: 'oxford-places-cities',
    titleEn: 'Places & Cities',
    badge: 'CITY & PLACES',
    cover: '/vocab-covers/city-life.svg',
    gradient: ['#6366F1', '#4F46E5'],
    icon: '🏙️',
  },
  'Thiên nhiên & Môi trường': {
    id: 'nature-environment',
    slug: 'oxford-nature-environment',
    titleEn: 'Nature & Environment',
    badge: 'ENVIRONMENT',
    cover: '/vocab-covers/environment.svg',
    gradient: ['#22C55E', '#15803D'],
    icon: '🌿',
  },
  'Khoa học & Công nghệ': {
    id: 'science-technology',
    slug: 'oxford-science-technology',
    titleEn: 'Science & Technology',
    badge: 'TECH & SCIENCE',
    cover: '/vocab-covers/technology.svg',
    gradient: ['#06B6D4', '#0891B2'],
    icon: '🔬',
  },
  'Truyền thông': {
    id: 'media-communication',
    slug: 'oxford-media-communication',
    titleEn: 'Media & News',
    badge: 'MEDIA',
    cover: '/vocab-covers/media.svg',
    gradient: ['#F97316', '#C2410C'],
    icon: '📡',
  },
  'Văn hoá & Nghệ thuật': {
    id: 'arts-culture',
    slug: 'oxford-arts-culture',
    titleEn: 'Arts & Culture',
    badge: 'ARTS & CULTURE',
    cover: '/vocab-covers/art.svg',
    gradient: ['#A855F7', '#7E22CE'],
    icon: '🎨',
  },
  'Thể thao & Giải trí': {
    id: 'sports-leisure',
    slug: 'oxford-sports-leisure',
    titleEn: 'Sports & Leisure',
    badge: 'SPORTS & LEISURE',
    cover: '/vocab-covers/sport.svg',
    gradient: ['#EAB308', '#A16207'],
    icon: '⚽',
  },
  'Xã hội & Pháp luật': {
    id: 'society-law',
    slug: 'oxford-society-law',
    titleEn: 'Society & Law',
    badge: 'SOCIETY & LAW',
    cover: '/vocab-covers/society.svg',
    gradient: ['#84CC16', '#4D7C0F'],
    icon: '⚖️',
  },
  'Thời gian & Số lượng': {
    id: 'time-numbers',
    slug: 'oxford-time-numbers',
    titleEn: 'Time & Quantities',
    badge: 'TIME & MEASURES',
    cover: '/vocab-covers/comparison.svg',
    gradient: ['#38BDF8', '#0284C7'],
    icon: '⏱️',
  },
  'Hành động chung': {
    id: 'general-actions',
    slug: 'oxford-general-actions',
    titleEn: 'Everyday Verbs & Actions',
    badge: 'GENERAL ACTIONS',
    cover: '/vocab-covers/communication.svg',
    gradient: ['#EC4899', '#DB2777'],
    icon: '⚡',
  },
};

const ALL_WORDS = [...OXFORD_3000, ...OXFORD_ADVANCED];

export const OXFORD_TOPIC_DECKS: OxfordTopicDeck[] = OXFORD_TOPICS.map((topicName) => {
  const meta = TOPIC_METADATA[topicName] ?? {
    id: topicName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    slug: `oxford-${topicName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    titleEn: topicName,
    badge: 'OXFORD 3000',
    cover: '/vocab-covers/education.svg',
    gradient: ['#3B82F6', '#1D4ED8'],
    icon: '📚',
  };

  const words = ALL_WORDS.filter((w) => w.topic === topicName);

  return {
    id: meta.id,
    slug: meta.slug,
    title: topicName,
    titleEn: meta.titleEn,
    badge: meta.badge,
    cover: meta.cover,
    gradient: meta.gradient,
    icon: meta.icon,
    words,
  };
});
