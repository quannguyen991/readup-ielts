import { getVocabTopic, type VocabTopicWord } from './vocab-topics';

export type PhrasebookMode = 'vocabulary' | 'collocations' | 'phrasal-verbs' | 'mixed';
export type PhrasebookKind = PhrasebookMode;

export type PhrasebookItem = {
  id: string;
  term: string;
  meaningVi: string;
  example: string;
  kind: PhrasebookKind;
};

type PhrasalVerb = { phrase: string; meaningVi: string; example: string };
type PhrasalTopic = { slug: string; phrasalVerbs: PhrasalVerb[] };

/** Ten high-frequency IELTS themes; collocations reuse the 50-word topic decks. */
const PHRASAL_TOPICS: PhrasalTopic[] = [
  { slug: 'education', phrasalVerbs: [
    { phrase: 'catch up on', meaningVi: 'học bù, theo kịp', example: 'She stayed after class to catch up on missed lessons.' },
    { phrase: 'hand in', meaningVi: 'nộp bài', example: 'Please hand in your essay before Friday.' },
    { phrase: 'fall behind', meaningVi: 'tụt lại phía sau', example: 'Students can fall behind when they miss several classes.' },
    { phrase: 'look up', meaningVi: 'tra cứu', example: 'I looked up the unfamiliar terms in a dictionary.' },
    { phrase: 'go over', meaningVi: 'ôn lại, xem lại', example: 'The tutor went over the key ideas before the exam.' },
  ] },
  { slug: 'work', phrasalVerbs: [
    { phrase: 'carry out', meaningVi: 'tiến hành, thực hiện', example: 'The team carried out a staff survey.' },
    { phrase: 'take on', meaningVi: 'đảm nhận', example: 'He took on more responsibility at work.' },
    { phrase: 'work out', meaningVi: 'tìm ra cách giải quyết', example: 'We worked out a fair schedule for the whole team.' },
    { phrase: 'bring up', meaningVi: 'nêu ra một vấn đề', example: 'She brought up the issue during the meeting.' },
    { phrase: 'step down', meaningVi: 'từ chức', example: 'The director stepped down after ten years.' },
  ] },
  { slug: 'environment', phrasalVerbs: [
    { phrase: 'cut down on', meaningVi: 'cắt giảm', example: 'Cities are trying to cut down on single-use plastic.' },
    { phrase: 'give off', meaningVi: 'thải ra, phát ra', example: 'Old vehicles give off harmful gases.' },
    { phrase: 'die out', meaningVi: 'tuyệt chủng, biến mất', example: 'Some species may die out if their habitats disappear.' },
    { phrase: 'clean up', meaningVi: 'dọn sạch, làm sạch', example: 'Local volunteers cleaned up the riverbank.' },
    { phrase: 'break down', meaningVi: 'phân huỷ', example: 'Paper bags break down more quickly than plastic ones.' },
  ] },
  { slug: 'health', phrasalVerbs: [
    { phrase: 'come down with', meaningVi: 'mắc bệnh', example: 'He came down with a cold before the race.' },
    { phrase: 'cut back on', meaningVi: 'giảm bớt', example: 'She cut back on sugary drinks.' },
    { phrase: 'work out', meaningVi: 'tập thể dục', example: 'I work out three times a week.' },
    { phrase: 'pass out', meaningVi: 'ngất xỉu', example: 'The runner nearly passed out in the heat.' },
    { phrase: 'get over', meaningVi: 'hồi phục sau', example: 'It took him a week to get over the flu.' },
  ] },
  { slug: 'technology', phrasalVerbs: [
    { phrase: 'set up', meaningVi: 'thiết lập, cài đặt', example: 'The technician set up the new network.' },
    { phrase: 'back up', meaningVi: 'sao lưu', example: 'Remember to back up your files regularly.' },
    { phrase: 'log in', meaningVi: 'đăng nhập', example: 'Users log in with a secure password.' },
    { phrase: 'break down', meaningVi: 'hỏng, ngừng hoạt động', example: 'The server broke down during the update.' },
    { phrase: 'scroll through', meaningVi: 'lướt qua', example: 'People scroll through news feeds on their phones.' },
  ] },
  { slug: 'tourism', phrasalVerbs: [
    { phrase: 'check in', meaningVi: 'làm thủ tục nhận phòng / lên máy bay', example: 'We checked in online the night before our flight.' },
    { phrase: 'set off', meaningVi: 'khởi hành', example: 'They set off early to avoid the traffic.' },
    { phrase: 'look around', meaningVi: 'tham quan xung quanh', example: 'We looked around the old quarter on foot.' },
    { phrase: 'get around', meaningVi: 'đi lại trong một nơi', example: 'Visitors can get around the city by metro.' },
    { phrase: 'stop over', meaningVi: 'quá cảnh', example: 'Our flight stopped over in Doha.' },
  ] },
  { slug: 'culture', phrasalVerbs: [
    { phrase: 'pass down', meaningVi: 'truyền lại qua các thế hệ', example: 'The recipe was passed down through the family.' },
    { phrase: 'grow up', meaningVi: 'lớn lên', example: 'He grew up listening to traditional music.' },
    { phrase: 'take in', meaningVi: 'tiếp nhận, thưởng thức', example: 'It is hard to take in all the details of the exhibition at once.' },
    { phrase: 'bring back', meaningVi: 'gợi nhớ, khôi phục', example: 'The festival brings back memories of childhood.' },
    { phrase: 'fit in', meaningVi: 'hoà nhập', example: 'Newcomers often need time to fit in with a different culture.' },
  ] },
  { slug: 'economy', phrasalVerbs: [
    { phrase: 'pay off', meaningVi: 'mang lại kết quả tốt; trả hết nợ', example: 'Investment in public transport can pay off in the long term.' },
    { phrase: 'save up', meaningVi: 'tiết kiệm dần', example: 'Many families save up for a home deposit.' },
    { phrase: 'cut back', meaningVi: 'cắt giảm chi tiêu', example: 'The company cut back spending during the downturn.' },
    { phrase: 'go up', meaningVi: 'tăng lên', example: 'Housing costs have gone up faster than wages.' },
    { phrase: 'set aside', meaningVi: 'để dành', example: 'The council set aside funds for small businesses.' },
  ] },
  { slug: 'society', phrasalVerbs: [
    { phrase: 'speak up', meaningVi: 'lên tiếng', example: 'Residents spoke up about the lack of safe parks.' },
    { phrase: 'reach out', meaningVi: 'chủ động liên hệ, giúp đỡ', example: 'Community groups reached out to isolated older people.' },
    { phrase: 'look after', meaningVi: 'chăm sóc', example: 'The programme helps families look after elderly relatives.' },
    { phrase: 'stand up for', meaningVi: 'bảo vệ, đấu tranh cho', example: 'Students stood up for equal access to education.' },
    { phrase: 'bring together', meaningVi: 'kết nối, tập hợp', example: 'The neighbourhood event brought together people of all ages.' },
  ] },
  { slug: 'science', phrasalVerbs: [
    { phrase: 'carry out', meaningVi: 'tiến hành nghiên cứu / thí nghiệm', example: 'Researchers carried out a long-term study.' },
    { phrase: 'find out', meaningVi: 'tìm hiểu, phát hiện', example: 'The experiment helped scientists find out how the cells respond.' },
    { phrase: 'build on', meaningVi: 'phát triển dựa trên', example: 'The new project builds on earlier findings.' },
    { phrase: 'rule out', meaningVi: 'loại trừ khả năng', example: 'Further tests ruled out several possible causes.' },
    { phrase: 'point to', meaningVi: 'cho thấy, chỉ ra', example: 'The results point to a link between sleep and memory.' },
  ] },
];

export const PHRASEBOOK_TOPICS = PHRASAL_TOPICS.map((group) => {
  const topic = getVocabTopic(group.slug);
  return {
    slug: group.slug,
    title: topic?.nameVi ?? group.slug,
    titleEn: topic?.name ?? group.slug,
    vocabulary: topic?.words ?? [],
    collocations: (topic?.words ?? []).filter((word) => word.collocation.trim()).map((word, index) => ({
      id: `${group.slug}:collocation:${index}`,
      term: word.collocation,
      meaningVi: word.meaningVi,
      example: word.example,
      kind: 'collocations' as const,
    })),
    phrasalVerbs: group.phrasalVerbs.map((entry, index) => ({
      id: `${group.slug}:phrasal:${index}`,
      term: entry.phrase,
      meaningVi: entry.meaningVi,
      example: entry.example,
      kind: 'phrasal-verbs' as const,
    })),
  };
});

function asVocabulary(word: VocabTopicWord, index: number, topicSlug: string): PhrasebookItem {
  return {
    id: `${topicSlug}:vocabulary:${index}`,
    term: word.word,
    meaningVi: word.meaningVi,
    example: word.example,
    kind: 'vocabulary',
  };
}

export function phrasebookItems(topicSlug: string, mode: PhrasebookMode): PhrasebookItem[] {
  const topic = PHRASEBOOK_TOPICS.find((item) => item.slug === topicSlug);
  if (!topic) return [];
  const vocabulary = topic.vocabulary.map((word, index) => asVocabulary(word, index, topic.slug));
  if (mode === 'vocabulary') return vocabulary;
  if (mode === 'collocations') return topic.collocations;
  if (mode === 'phrasal-verbs') return topic.phrasalVerbs;
  return [...vocabulary.slice(0, 6), ...topic.collocations.slice(0, 6), ...topic.phrasalVerbs.slice(0, 6)];
}
