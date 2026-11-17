/**
 * ĐỀ VIẾT CẢ ĐOẠN — mỗi đề là một ngữ cảnh/câu hỏi bằng tiếng Việt, kèm dàn ý ba
 * ý, từ khoá nên dùng, cấu trúc nên thử và một đoạn mẫu để đối chiếu SAU KHI nộp.
 *
 * Đoạn mẫu tự viết (không trích nguồn nào), 5–7 câu, bám đúng dàn ý và dùng các
 * cấu trúc đích — mục đích là cho người học thấy "đoạn tốt" dài cỡ nào và nối ý
 * ra sao, không phải để chép lại.
 */

export type ParagraphLevel = 'B1' | 'B2' | 'C1';

export type ParagraphPrompt = {
  id: string;
  title: string;
  titleEn: string;
  level: ParagraphLevel;
  /** Ngữ cảnh / đề bài tiếng Việt. */
  brief: string;
  /** Dàn ý gợi ý (3 ý). */
  outline: string[];
  /** Từ khoá nên cố dùng. */
  keywords: string[];
  /** Mã cấu trúc nên thử (xem structure-bank). */
  structures: string[];
  minSentences: number;
  model: string;
};

export const PARAGRAPH_PROMPTS: readonly ParagraphPrompt[] = [
  {
    id: 'pp-routine', title: 'Một ngày của bạn', titleEn: 'Your daily routine', level: 'B1',
    brief: 'Hãy kể một ngày bình thường của bạn, từ sáng đến tối, cho một người bạn nước ngoài.',
    outline: ['Buổi sáng bạn làm gì và lúc mấy giờ', 'Buổi chiều ở trường hoặc nơi làm việc', 'Buổi tối và việc bạn thích nhất trong ngày'],
    keywords: ['usually', 'before', 'after', 'because', 'enjoy'],
    structures: ['present-simple', 'time-clause', 'reason-clause'],
    minSentences: 5,
    model: 'I usually get up at six and have a quick breakfast before I leave for school. My classes start at seven thirty, so I need to be on time. After school, I often go to the library because it is quiet and I can study there. In the evening, I help my mother cook dinner and then we eat together. What I enjoy most is the hour before bed, when I read a book or listen to music.',
  },
  {
    id: 'pp-hometown', title: 'Quê hương bạn', titleEn: 'Your hometown', level: 'B1',
    brief: 'Giới thiệu nơi bạn lớn lên với một du khách sắp đến thăm.',
    outline: ['Nơi đó ở đâu và nổi tiếng về điều gì', 'Thời điểm đẹp nhất để đến', 'Một việc du khách không nên bỏ lỡ'],
    keywords: ['famous for', 'especially', 'visit', 'which', 'best time'],
    structures: ['present-simple', 'relative-clause', 'superlative'],
    minSentences: 5,
    model: 'My hometown is a small coastal city in central Vietnam, and it is famous for its fresh seafood. The best time to visit is in the summer, when the weather is warm and the sea is calm. There is a long beach where many families spend their evenings. Tourists should also try the local noodle soup, which is cheap and delicious. I think it is one of the most relaxing places in the country.',
  },
  {
    id: 'pp-trip', title: 'Chuyến đi đáng nhớ', titleEn: 'A memorable trip', level: 'B1',
    brief: 'Kể về một chuyến đi bạn nhớ mãi và vì sao nó đặc biệt.',
    outline: ['Bạn đi đâu, với ai, khi nào', 'Chuyện gì đã xảy ra', 'Bạn học được hoặc cảm thấy gì'],
    keywords: ['last summer', 'while', 'although', 'unforgettable', 'learn'],
    structures: ['past-simple', 'past-continuous', 'concession'],
    minSentences: 6,
    model: 'Last summer I travelled to Da Lat with my cousins. While we were walking around the lake, it suddenly started to rain, so we ran into a small café. Although we were wet and cold, the hot chocolate there tasted wonderful. We stayed for two hours and played cards until the rain stopped. When we finally walked back to the hotel, the whole street smelled of wet pine trees. That afternoon was unforgettable because it taught me that plans do not have to be perfect to be fun.',
  },
  {
    id: 'pp-english', title: 'Lợi ích của việc học tiếng Anh', titleEn: 'Why learn English', level: 'B1',
    brief: 'Viết một đoạn nêu vì sao học tiếng Anh có ích cho học sinh Việt Nam.',
    outline: ['Lợi ích cho việc học', 'Lợi ích cho công việc sau này', 'Một lời khuyên để học hiệu quả'],
    keywords: ['opportunity', 'important', 'in order to', 'as a result', 'practise'],
    structures: ['it-extraposition', 'purpose-clause', 'modal-advice'],
    minSentences: 5,
    model: 'It is important for students to learn English because it opens many doors. In order to read modern textbooks, they often need to understand English. In the future, they may also use it at work to communicate with colleagues from other countries. As a result, people who speak English well usually have more job opportunities. To improve quickly, students should practise a little every day instead of studying only before exams.',
  },
  {
    id: 'pp-social', title: 'Mạng xã hội và giới trẻ', titleEn: 'Social media and teenagers', level: 'B2',
    brief: 'Mạng xã hội ảnh hưởng thế nào đến thanh thiếu niên? Nêu cả mặt tốt lẫn mặt xấu.',
    outline: ['Một lợi ích rõ ràng', 'Một tác hại đáng lo', 'Cách sử dụng hợp lý'],
    keywords: ['stay in touch', 'addicted', 'on the other hand', 'moderation', 'privacy'],
    structures: ['concession', 'gerund-subject', 'modal-advice'],
    minSentences: 6,
    model: 'Social media has changed the way teenagers communicate. On the one hand, it allows them to stay in touch with friends and share ideas instantly. On the other hand, spending too many hours online can make young people feel anxious and distracted. Some students even become addicted to checking their phones, which harms their sleep and grades. Although these platforms are not harmful in themselves, using them in moderation is essential. Parents and schools should therefore teach teenagers to protect their privacy and manage their time.',
  },
  {
    id: 'pp-online', title: 'Học trực tuyến hay trên lớp', titleEn: 'Online or classroom learning', level: 'B2',
    brief: 'Bạn thấy học trực tuyến và học trên lớp khác nhau thế nào? Bạn chọn cách nào?',
    outline: ['Ưu điểm của học trực tuyến', 'Ưu điểm của học trên lớp', 'Lựa chọn của bạn và lý do'],
    keywords: ['flexible', 'face-to-face', 'whereas', 'motivation', 'prefer'],
    structures: ['comparative', 'concession', 'reason-clause'],
    minSentences: 5,
    model: 'Online learning is more flexible than traditional classes because students can study at any time and place. Whereas a classroom requires everyone to follow the same schedule, an online course lets learners move at their own pace. However, face-to-face lessons provide direct feedback and more motivation. Teachers can notice when a student is confused, which is much harder through a screen. Personally, I prefer a mixture of both, since it combines freedom with support.',
  },
  {
    id: 'pp-health', title: 'Lối sống lành mạnh', titleEn: 'A healthy lifestyle', level: 'B1',
    brief: 'Theo bạn, làm thế nào để sống khỏe mạnh? Hãy đưa ra lời khuyên cho bạn bè.',
    outline: ['Ăn uống', 'Vận động và giấc ngủ', 'Thói quen cần tránh'],
    keywords: ['balanced diet', 'regularly', 'avoid', 'sleep', 'risk'],
    structures: ['modal-advice', 'verb-ing', 'conditional-1'],
    minSentences: 5,
    model: 'To stay healthy, you should eat a balanced diet with plenty of vegetables and fruit. Exercising regularly is just as important, even if it is only a short walk every day. You also need at least seven hours of sleep, because tired people find it hard to concentrate. If you avoid sugary drinks and late-night snacks, you will reduce the risk of many illnesses. Small habits like these make a big difference over time.',
  },
  {
    id: 'pp-admire', title: 'Người bạn ngưỡng mộ', titleEn: 'A person you admire', level: 'B1',
    brief: 'Viết về một người bạn ngưỡng mộ và điều gì ở họ khiến bạn nể phục.',
    outline: ['Người đó là ai', 'Họ đã làm được điều gì', 'Bạn học được gì từ họ'],
    keywords: ['admire', 'who', 'hard-working', 'inspire', 'because'],
    structures: ['relative-clause', 'present-perfect', 'reason-clause'],
    minSentences: 5,
    model: 'The person I admire most is my grandmother, who raised five children on a small farm. She has worked hard all her life, yet she never complains. When our neighbours need help, she is always the first to offer food or advice. I admire her because she stays calm in difficult situations. Her example has inspired me to be patient and generous.',
  },
  {
    id: 'pp-env', title: 'Môi trường ở thành phố của bạn', titleEn: 'An environmental problem in your city', level: 'B2',
    brief: 'Chọn một vấn đề môi trường ở nơi bạn sống, nêu nguyên nhân và cách giảm bớt.',
    outline: ['Vấn đề là gì', 'Nguyên nhân chính', 'Giải pháp cho cá nhân hoặc chính quyền'],
    keywords: ['pollution', 'due to', 'reduce', 'public transport', 'raise awareness'],
    structures: ['passive', 'reason-clause', 'modal-advice'],
    minSentences: 6,
    model: 'Air pollution has become a serious problem in many big cities. It is mainly caused by the growing number of motorbikes and cars on the roads. Due to heavy traffic, the air is often filled with dust and smoke, which can harm people’s lungs. To reduce the problem, authorities should invest in public transport so that fewer people need private vehicles. Individuals can also help by cycling or walking for short trips. Raising awareness through schools and the media would encourage more residents to change their habits.',
  },
  {
    id: 'pp-tech-school', title: 'Công nghệ trong trường học', titleEn: 'Technology at school', level: 'B2',
    brief: 'Công nghệ có nên được dùng nhiều hơn trong lớp học không? Nêu ý kiến của bạn.',
    outline: ['Công nghệ giúp việc học thế nào', 'Rủi ro hoặc hạn chế', 'Ý kiến cuối cùng'],
    keywords: ['interactive', 'distract', 'access', 'benefit', 'in my opinion'],
    structures: ['that-clause', 'concession', 'it-extraposition'],
    minSentences: 5,
    model: 'In my opinion, schools should use technology more often because it makes lessons interactive. Students can access thousands of resources in seconds, and videos often explain difficult ideas better than a textbook. However, devices can also distract learners if they are not used carefully. It is therefore necessary for teachers to set clear rules about when tablets and phones may be used. Overall, the benefits clearly outweigh the risks as long as technology supports, rather than replaces, good teaching.',
  },
  {
    id: 'pp-transport', title: 'Giao thông công cộng', titleEn: 'Public transport', level: 'B1',
    brief: 'Giao thông công cộng ở nơi bạn sống tốt hay chưa tốt? Đề xuất một cải thiện.',
    outline: ['Tình trạng hiện tại', 'Khó khăn người dân gặp', 'Một đề xuất cụ thể'],
    keywords: ['crowded', 'convenient', 'cheaper than', 'improve', 'schedule'],
    structures: ['comparative', 'modal-advice', 'there-be'],
    minSentences: 5,
    model: 'Public transport in my city is cheaper than taking a taxi, but it is not always convenient. There are only a few bus routes in the suburbs, so many people have to ride motorbikes. During rush hour, the buses are crowded and often arrive late. I think the city should add more routes and publish clear schedules online. If the service were faster and more reliable, more people would choose the bus.',
  },
  {
    id: 'pp-wfh', title: 'Làm việc tại nhà', titleEn: 'Working from home', level: 'B2',
    brief: 'Làm việc tại nhà có lợi và hại gì? Bạn muốn làm việc kiểu nào?',
    outline: ['Lợi ích', 'Hạn chế', 'Lựa chọn của bạn'],
    keywords: ['commute', 'productive', 'isolated', 'flexible', 'balance'],
    structures: ['gerund-subject', 'concession', 'comparative'],
    minSentences: 5,
    model: 'Working from home saves employees the time and money they would spend on commuting. Many people feel more productive in a quiet room than in a noisy office. Nevertheless, staying at home all day can make workers feel isolated from their colleagues. It is also harder to separate work from personal life when the office is only a few steps away. For this reason, I would choose a hybrid schedule, which offers flexibility without losing contact with the team.',
  },
  {
    id: 'pp-skill', title: 'Một kỹ năng bạn muốn học', titleEn: 'A skill you want to learn', level: 'B1',
    brief: 'Bạn muốn học thêm kỹ năng gì? Vì sao và bạn sẽ bắt đầu như thế nào?',
    outline: ['Kỹ năng đó là gì', 'Vì sao bạn muốn học', 'Kế hoạch bắt đầu'],
    keywords: ['would like to', 'useful', 'start by', 'every week', 'hope'],
    structures: ['verb-to-infinitive', 'future-simple', 'reason-clause'],
    minSentences: 5,
    model: 'I would like to learn how to play the guitar. Music has always relaxed me, and I think playing an instrument is a useful way to reduce stress. I plan to start by watching beginner lessons online and practising for twenty minutes every day. Next month, I will ask my uncle, who plays very well, to teach me some simple songs. I hope that by the end of the year I will be able to perform for my family.',
  },
  {
    id: 'pp-festival', title: 'Một lễ hội ở Việt Nam', titleEn: 'A festival in Vietnam', level: 'B1',
    brief: 'Giới thiệu một lễ hội bạn biết cho một người bạn nước ngoài.',
    outline: ['Lễ hội diễn ra khi nào, ở đâu', 'Người ta làm gì', 'Ý nghĩa của nó'],
    keywords: ['celebrate', 'traditional', 'take place', 'meaning', 'gather'],
    structures: ['passive', 'relative-clause', 'time-clause'],
    minSentences: 5,
    model: 'Tet, the Lunar New Year, is the most important festival in Vietnam. It takes place in January or February, when families gather from all over the country. Before the holiday, people clean their houses and buy peach blossoms or kumquat trees. On the first day, children receive lucky money in red envelopes. Tet is celebrated as a time to remember ancestors and to start the year with hope.',
  },
  {
    id: 'pp-money', title: 'Thói quen tiêu tiền', titleEn: 'Money habits', level: 'B2',
    brief: 'Giới trẻ nên quản lý tiền như thế nào? Đưa ra lời khuyên có lý do.',
    outline: ['Một thói quen tốt', 'Một sai lầm hay gặp', 'Lợi ích lâu dài'],
    keywords: ['budget', 'save', 'unnecessary', 'in the long run', 'spend'],
    structures: ['conditional-1', 'modal-advice', 'gerund-subject'],
    minSentences: 5,
    model: 'Young people should learn to manage their money early. Making a simple monthly budget helps them see where their money goes. One common mistake is spending on unnecessary things, such as the latest gadgets, just because friends have them. If students save even a small amount each month, they will have a safety net for emergencies. In the long run, these habits lead to greater independence and less stress.',
  },
  {
    id: 'pp-volunteer', title: 'Làm tình nguyện', titleEn: 'Volunteering', level: 'B2',
    brief: 'Vì sao học sinh nên làm tình nguyện? Nêu ít nhất hai lợi ích.',
    outline: ['Lợi ích cho cộng đồng', 'Lợi ích cho bản thân', 'Cách bắt đầu'],
    keywords: ['community', 'gain experience', 'not only … but also', 'contribute', 'confidence'],
    structures: ['correlative', 'object-to-infinitive', 'reason-clause'],
    minSentences: 5,
    model: 'Volunteering benefits not only the community but also the volunteers themselves. By helping others, students contribute to projects that governments cannot always afford. At the same time, they gain experience in teamwork and communication, which schools rarely teach in textbooks. Many volunteers also develop more confidence because they see that their effort makes a real difference. Schools should encourage students to join local charities, since a few hours a month can change a neighbourhood.',
  },
];

export function getParagraphPrompt(id: string): ParagraphPrompt | undefined {
  return PARAGRAPH_PROMPTS.find((p) => p.id === id);
}
