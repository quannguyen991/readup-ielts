import type { PoiKind } from './types';
import type { Bi } from '@/i18n/useL';

export type SpeakingTargetBand = '5.5-6' | '7' | '8-9';
export type ContextualSpeakingPrompt = {
  id: string;
  part: 1 | 2 | 3;
  text: string;
  bullets?: string[];
  explain?: string;
  topic: string;
};
export type ContextualVocabularyItem = { phrase: string; meaning: Bi };

type Journey = {
  role: string;
  topic: string;
  vocabulary: ContextualVocabularyItem[];
  part1: string[];
  cue: { text: string; bullets: string[]; explain: string };
  part3: string[];
};

const JOURNEYS: Partial<Record<PoiKind, Journey>> = {
  airport: {
    role: 'airport information officer',
    topic: 'air travel and journeys',
    vocabulary: [
      { phrase: 'check in for a flight', meaning: { vi: 'làm thủ tục chuyến bay', en: 'complete the steps before boarding a flight' } },
      { phrase: 'departure lounge', meaning: { vi: 'phòng chờ khởi hành', en: 'the waiting area before a flight' } },
      { phrase: 'a connecting flight', meaning: { vi: 'chuyến bay nối chuyến', en: 'a second flight taken to reach a destination' } },
      { phrase: 'allow extra time', meaning: { vi: 'chừa thêm thời gian', en: 'plan for more time than the minimum needed' } },
    ],
    part1: [
      'How often do you travel by plane?',
      'What do you usually do while waiting at an airport?',
      'Do you prefer travelling with a lot of luggage or packing lightly?',
      'What makes a journey to a new place enjoyable for you?',
    ],
    cue: {
      text: 'Describe a journey that was memorable for you.',
      bullets: ['where you went', 'who you travelled with', 'what happened during the journey'],
      explain: 'and explain why you still remember it.',
    },
    part3: [
      'How has air travel changed the way people experience the world?',
      'What can airports do to make long waits less stressful?',
      'Should people consider the environmental impact when choosing how to travel?',
      'How might technology change the experience of international travel in the future?',
    ],
  },
  station: {
    role: 'station assistant',
    topic: 'public transport and commuting',
    vocabulary: [
      { phrase: 'rush-hour traffic', meaning: { vi: 'giao thông giờ cao điểm', en: 'the busiest traffic period of the day' } },
      { phrase: 'a reliable service', meaning: { vi: 'dịch vụ đáng tin cậy', en: 'a service that works as expected' } },
      { phrase: 'change trains', meaning: { vi: 'đổi tàu', en: 'leave one train and take another' } },
      { phrase: 'within walking distance', meaning: { vi: 'có thể đi bộ tới', en: 'close enough to reach on foot' } },
    ],
    part1: [
      'How do you usually travel around your town or city?',
      'Do you use buses or trains regularly?',
      'What do you like to do during a long train journey?',
      'Has public transport improved where you live?',
    ],
    cue: {
      text: 'Describe a journey by public transport that you remember well.',
      bullets: ['where you were going', 'what kind of transport you used', 'what you saw or did on the way'],
      explain: 'and explain what made the journey memorable.',
    },
    part3: [
      'Why do some people prefer public transport to driving?',
      'What makes a public transport system convenient for passengers?',
      'How can cities encourage people to use buses and trains more often?',
      'Should governments spend more on public transport than on new roads?',
    ],
  },
  hotel: {
    role: 'hotel receptionist',
    topic: 'stays and hospitality',
    vocabulary: [
      { phrase: 'make a reservation', meaning: { vi: 'đặt chỗ trước', en: 'book a room in advance' } },
      { phrase: 'front desk', meaning: { vi: 'quầy lễ tân', en: 'the hotel reception counter' } },
      { phrase: 'conveniently located', meaning: { vi: 'nằm ở vị trí thuận tiện', en: 'in a useful location' } },
      { phrase: 'get settled in', meaning: { vi: 'ổn định chỗ ở', en: 'become comfortable in a new place' } },
    ],
    part1: [
      'When you travel, what kind of place do you usually stay in?',
      'What matters most to you when choosing accommodation?',
      'Do you prefer staying somewhere familiar or trying a new place?',
      'What is one thing that would make a hotel stay more comfortable for you?',
    ],
    cue: {
      text: 'Describe a place you stayed in that made your trip memorable.',
      bullets: ['where it was', 'when you stayed there', 'what the place was like'],
      explain: 'and explain why you remember this stay.',
    },
    part3: [
      'What makes visitors feel welcome when they arrive in a new place?',
      'How have online reviews changed the way people choose accommodation?',
      'Should hotels do more to reflect the culture of the places where they operate?',
      'How can tourism bring benefits to local communities without making life harder for residents?',
    ],
  },
  cafe: {
    role: 'barista',
    topic: 'cafes and everyday routines',
    vocabulary: [
      { phrase: 'order a drink', meaning: { vi: 'gọi đồ uống', en: 'ask for a drink' } },
      { phrase: 'house blend', meaning: { vi: 'cà phê pha trộn riêng của quán', en: 'the cafe’s own coffee mix' } },
      { phrase: 'catch up with a friend', meaning: { vi: 'trò chuyện để cập nhật chuyện gần đây', en: 'talk about recent news with a friend' } },
      { phrase: 'a lively atmosphere', meaning: { vi: 'không khí nhộn nhịp', en: 'an energetic and pleasant feeling' } },
    ],
    part1: [
      'How often do you visit a cafe?',
      'What do you usually order when you go to a cafe?',
      'Do you prefer meeting people in a cafe or somewhere quieter?',
      'Is there a cafe you like going back to?',
    ],
    cue: {
      text: 'Describe a cafe or small food place you enjoyed visiting.',
      bullets: ['where it was', 'who you went with', 'what you ate or drank'],
      explain: 'and explain what made the visit enjoyable.',
    },
    part3: [
      'Why do some people use cafes as places to work or study?',
      'How have coffee shops changed the way people socialise?',
      'Do independent cafes offer something that large chains cannot?',
      'How can a town keep its local food culture while welcoming international businesses?',
    ],
  },
  museum: {
    role: 'museum guide',
    topic: 'museums and cultural places',
    vocabulary: [
      { phrase: 'permanent exhibition', meaning: { vi: 'triển lãm thường trực', en: 'a display that stays open long term' } },
      { phrase: 'guided tour', meaning: { vi: 'chuyến tham quan có hướng dẫn', en: 'a visit led by a guide' } },
      { phrase: 'historical artefact', meaning: { vi: 'hiện vật lịch sử', en: 'an object from the past' } },
      { phrase: 'interactive display', meaning: { vi: 'màn trưng bày tương tác', en: 'an exhibit visitors can interact with' } },
    ],
    part1: [
      'Do you enjoy visiting museums or historical places?',
      'What kinds of exhibitions interest you most?',
      'Did you visit museums with your family or school when you were younger?',
      'Would you rather explore a museum alone or with a guide?',
    ],
    cue: {
      text: 'Describe an exhibition or historical place that taught you something interesting.',
      bullets: ['where it was', 'what you saw there', 'what you learned'],
      explain: 'and explain why the experience stayed with you.',
    },
    part3: [
      'Why should children learn about local history?',
      'Should museums be free for everyone?',
      'How can museums make historical information interesting to younger visitors?',
      'Who should decide which objects are displayed in a national museum?',
    ],
  },
  garden: {
    role: 'park guide',
    topic: 'parks and outdoor spaces',
    vocabulary: [
      { phrase: 'walking trail', meaning: { vi: 'đường đi bộ trong công viên', en: 'a marked route for walking' } },
      { phrase: 'shaded path', meaning: { vi: 'lối đi có bóng mát', en: 'a path protected from direct sun' } },
      { phrase: 'public green space', meaning: { vi: 'không gian xanh công cộng', en: 'a shared outdoor area with plants' } },
      { phrase: 'get some fresh air', meaning: { vi: 'ra ngoài hít thở không khí trong lành', en: 'spend time outdoors in the open air' } },
    ],
    part1: [
      'How often do you spend time in a park or garden?',
      'What do you like doing when you are outdoors?',
      'Did you play outside much when you were a child?',
      'Is there a green space near your home that you enjoy?',
    ],
    cue: {
      text: 'Describe an outdoor place where you like spending time.',
      bullets: ['where it is', 'what you can do there', 'when you usually visit'],
      explain: 'and explain how you feel when you are there.',
    },
    part3: [
      'Why do people need parks in busy cities?',
      'What can local authorities do to encourage people to spend more time outdoors?',
      'Should cities give more space to parks or to new housing?',
      'How might climate change affect public gardens and parks in the future?',
    ],
  },
  restaurant: {
    role: 'restaurant server',
    topic: 'food and eating out',
    vocabulary: [
      { phrase: 'a local speciality', meaning: { vi: 'món đặc sản địa phương', en: 'a dish associated with a particular place' } },
      { phrase: 'a balanced meal', meaning: { vi: 'bữa ăn cân bằng dinh dưỡng', en: 'a meal with a healthy mix of foods' } },
      { phrase: 'eat out', meaning: { vi: 'ăn ở ngoài', en: 'have a meal at a restaurant' } },
      { phrase: 'a memorable meal', meaning: { vi: 'bữa ăn đáng nhớ', en: 'a meal that stays in your memory' } },
    ],
    part1: [
      'How often do you eat at a restaurant?',
      'What kind of food do you enjoy ordering?',
      'Do you prefer eating out or having meals at home?',
      'Who do you usually share a meal with?',
    ],
    cue: {
      text: 'Describe a meal you enjoyed at a restaurant or another place.',
      bullets: ['where you had it', 'who you were with', 'what you ate'],
      explain: 'and explain why you enjoyed the meal.',
    },
    part3: [
      'Why do people enjoy eating together?',
      'How have people’s eating habits changed in recent years?',
      'Should schools teach children how to prepare healthy food?',
      'What effect do international restaurants have on local food traditions?',
    ],
  },
  market: {
    role: 'market seller',
    topic: 'shopping and local markets',
    vocabulary: [
      { phrase: 'fresh produce', meaning: { vi: 'nông sản tươi', en: 'fresh fruit and vegetables' } },
      { phrase: 'compare prices', meaning: { vi: 'so sánh giá', en: 'look at the cost of similar items' } },
      { phrase: 'a handmade product', meaning: { vi: 'sản phẩm làm thủ công', en: 'an item made by hand rather than a machine' } },
      { phrase: 'support local businesses', meaning: { vi: 'ủng hộ doanh nghiệp địa phương', en: 'help businesses in your area' } },
    ],
    part1: [
      'How often do you go shopping?',
      'Do you enjoy visiting outdoor or street markets?',
      'What kind of things do you usually buy for yourself?',
      'Do you prefer paying with cash or using a card?',
    ],
    cue: {
      text: 'Describe a market or shop that you enjoyed visiting.',
      bullets: ['where it was', 'what was being sold', 'what you did there'],
      explain: 'and explain what made the place interesting.',
    },
    part3: [
      'Why do some people prefer shopping at local markets?',
      'How has online shopping affected small shops?',
      'Should people pay more for products made locally?',
      'How can traditional markets remain attractive to younger generations?',
    ],
  },
  landmark: {
    role: 'local tour guide',
    topic: 'landmarks and tourism',
    vocabulary: [
      { phrase: 'a well-known landmark', meaning: { vi: 'một danh thắng nổi tiếng', en: 'a famous place that is easy to recognise' } },
      { phrase: 'architectural design', meaning: { vi: 'thiết kế kiến trúc', en: 'the way a building is planned and built' } },
      { phrase: 'attract visitors', meaning: { vi: 'thu hút du khách', en: 'bring people to visit a place' } },
      { phrase: 'preserve local heritage', meaning: { vi: 'gìn giữ di sản địa phương', en: 'protect the history and traditions of an area' } },
    ],
    part1: [
      'Are there any famous buildings or landmarks near where you live?',
      'Do you enjoy learning about the history of a place?',
      'Would you rather visit a natural landmark or a historic building?',
      'Do you take photographs when you visit interesting places?',
    ],
    cue: {
      text: 'Describe a famous building or landmark you have visited.',
      bullets: ['where it is', 'what it looks like', 'what you did there'],
      explain: 'and explain why it is important or interesting to you.',
    },
    part3: [
      'Why do people travel to see famous landmarks?',
      'How can cities protect old buildings while still developing?',
      'Do popular tourist sites always benefit the people who live nearby?',
      'How should historical places be presented to visitors from other cultures?',
    ],
  },
  secret: {
    role: 'local guide',
    topic: 'discovering places and local life',
    vocabulary: [
      { phrase: 'off the beaten track', meaning: { vi: 'nằm ngoài tuyến du lịch phổ biến', en: 'away from the usual tourist routes' } },
      { phrase: 'a hidden gem', meaning: { vi: 'một địa điểm thú vị ít người biết', en: 'a special place that few people know about' } },
      { phrase: 'a quiet corner', meaning: { vi: 'một góc yên tĩnh', en: 'a calm place away from crowds' } },
      { phrase: 'get a feel for local life', meaning: { vi: 'cảm nhận nhịp sống địa phương', en: 'experience how local people live' } },
    ],
    part1: [
      'Do you enjoy exploring places that are new to you?',
      'How do you usually find interesting places to visit?',
      'Would you rather visit a busy attraction or a quiet place?',
      'Do you like asking local people for recommendations?',
    ],
    cue: {
      text: 'Describe a quiet or little-known place that you enjoyed discovering.',
      bullets: ['where it was', 'how you found it', 'what you saw or did there'],
      explain: 'and explain why you would recommend or revisit it.',
    },
    part3: [
      'Why do travellers sometimes seek places that are not well known?',
      'How can tourism affect small communities?',
      'Do social media posts make hidden places more popular?',
      'How can visitors explore responsibly without disturbing local life?',
    ],
  },
};

export function contextualJourneyFor(kind: PoiKind): Journey | null {
  return JOURNEYS[kind] ?? null;
}

export function contextualVocabularyFor(kind: PoiKind): ContextualVocabularyItem[] {
  return JOURNEYS[kind]?.vocabulary ?? [];
}

/** Target band changes how many follow-up questions the learner gets, never the grade. */
export function buildContextualSpeakingPrompts(kind: PoiKind, target: SpeakingTargetBand): ContextualSpeakingPrompt[] {
  const journey = contextualJourneyFor(kind);
  if (!journey) return [];
  const part1Count = target === '5.5-6' ? 3 : 4;
  const part3Count = target === '5.5-6' ? 2 : target === '7' ? 3 : 4;
  return [
    ...journey.part1.slice(0, part1Count).map((text, index) => ({
      id: `${kind}-p1-${index + 1}`,
      part: 1 as const,
      text,
      topic: journey.topic,
    })),
    {
      id: `${kind}-p2-cue`,
      part: 2,
      text: journey.cue.text,
      bullets: journey.cue.bullets,
      explain: journey.cue.explain,
      topic: journey.topic,
    },
    ...journey.part3.slice(0, part3Count).map((text, index) => ({
      id: `${kind}-p3-${index + 1}`,
      part: 3 as const,
      text,
      topic: journey.topic,
    })),
  ];
}

export function resolveContextualSpeakingPrompt(kind: PoiKind, id: string): ContextualSpeakingPrompt | null {
  // The API resolves IDs from this curated bank; prompt text is never trusted from the client.
  const all = buildContextualSpeakingPrompts(kind, '8-9');
  return all.find((prompt) => prompt.id === id) ?? null;
}
