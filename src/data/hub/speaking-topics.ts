/**
 * Kho đề luyện nói IELTS theo chủ đề. Mỗi chủ đề đủ ba phần của bài thi:
 *
 *   Part 1 — câu hỏi ngắn về bản thân, 3 câu.
 *   Part 2 — cue card: một đề mô tả và 4 gợi ý, thí sinh nói khoảng 1–2 phút.
 *   Part 3 — câu hỏi sâu hơn, mở rộng từ Part 2, 2 câu.
 *
 * Đề viết theo văn phong đề thi, không sao chép từ bộ đề nào. Mẹo (`tipVi`) là một câu
 * tiếng Việt, cùng một ý với phần ghi chú của từng bài IELTS.
 */

export type SpeakingPart2 = {
  prompt: string;
  bullets: string[];
};

export type SpeakingTopic = {
  id: string;
  title: string;
  titleVi: string;
  tipVi: string;
  part1: string[];
  part2: SpeakingPart2;
  part3: string[];
};

export const SPEAKING_TOPICS: SpeakingTopic[] = [
  {
    id: 'hometown',
    title: 'Hometown',
    titleVi: 'Quê hương',
    tipVi: 'Part 1 hỏi về nơi ở: nêu một điểm cụ thể rồi thêm một chi tiết cá nhân.',
    part1: ['Where is your hometown?', 'What do you like most about it?', 'Has your hometown changed much in recent years?'],
    part2: {
      prompt: 'Describe a place in your hometown that you enjoy visiting.',
      bullets: ['where it is', 'what you can do there', 'when you usually go there', 'and explain why you enjoy it'],
    },
    part3: ['Do you think young people want to stay in their hometowns?', 'How might tourism change a small town?'],
  },
  {
    id: 'studies',
    title: 'Studies',
    titleVi: 'Việc học',
    tipVi: 'Đừng chỉ trả lời có hoặc không; nêu lý do và một ví dụ.',
    part1: ['What do you study at the moment?', 'Did you enjoy school when you were younger?', 'Which subject is the most useful, in your opinion?'],
    part2: {
      prompt: 'Describe a subject you studied that you found difficult.',
      bullets: ['what the subject was', 'why it was difficult', 'how you tried to improve', 'and how you feel about it now'],
    },
    part3: ['Should students be able to choose all their subjects?', 'How has learning changed because of technology?'],
  },
  {
    id: 'technology',
    title: 'Technology',
    titleVi: 'Công nghệ',
    tipVi: 'Dùng ví dụ từ đời sống của bạn để câu trả lời có thật hơn.',
    part1: ['How often do you use your phone?', 'What do you use your phone for most?', 'Do you think people rely on technology too much?'],
    part2: {
      prompt: 'Describe a piece of technology that has made your life easier.',
      bullets: ['what it is', 'when you started using it', 'how it helps you', 'and whether it has any disadvantages'],
    },
    part3: ['Does technology make people less social?', 'What technology do you think will be common in 20 years?'],
  },
  {
    id: 'food',
    title: 'Food',
    titleVi: 'Đồ ăn',
    tipVi: 'Khi tả món ăn, dùng tính từ về cảm giác: crispy, tangy, savoury.',
    part1: ['What kind of food do you enjoy most?', 'Do you enjoy cooking?', 'Do you prefer eating at home or in restaurants?'],
    part2: {
      prompt: 'Describe a traditional dish from your country.',
      bullets: ['what the dish is called', 'what it is made of', 'when people usually eat it', 'and why you like or dislike it'],
    },
    part3: ['Is fast food a problem in your country?', 'How has the way people eat changed over the last few decades?'],
  },
  {
    id: 'travel',
    title: 'Travel',
    titleVi: 'Du lịch',
    tipVi: 'Kể một chuyến đi cụ thể, dùng quá khứ đơn cho những việc đã xảy ra.',
    part1: ['Do you like travelling?', 'Where did you go on your last trip?', 'Do you prefer travelling alone or with friends?'],
    part2: {
      prompt: 'Describe a memorable trip you took.',
      bullets: ['where you went', 'who you went with', 'what you did there', 'and why it was memorable'],
    },
    part3: ['Does tourism bring more benefits or problems to a country?', 'Will people travel more or less in the future?'],
  },
  {
    id: 'reading',
    title: 'Reading',
    titleVi: 'Đọc sách',
    tipVi: 'Với câu hỏi thói quen, nêu tần suất cụ thể: every night, twice a month.',
    part1: ['Do you like reading?', 'What kind of books do you read?', 'Do you prefer reading on paper or on a screen?'],
    part2: {
      prompt: 'Describe a book that you have read and enjoyed.',
      bullets: ['what the book is about', 'who wrote it', 'when and why you read it', 'and why you would recommend it'],
    },
    part3: ['Are printed books going to disappear?', 'Should children be encouraged to read fiction?'],
  },
  {
    id: 'weather',
    title: 'Weather',
    titleVi: 'Thời tiết',
    tipVi: 'Dùng từ chỉ mức độ: a bit, quite, extremely, để câu mô tả có sắc thái.',
    part1: ['What is the weather usually like where you live?', 'What is your favourite season?', 'Does the weather affect your mood?'],
    part2: {
      prompt: 'Describe a time when the weather spoiled your plans.',
      bullets: ['what you had planned', 'what the weather was like', 'what happened instead', 'and how you felt about it'],
    },
    part3: ['Is climate change a serious problem for your country?', 'How does weather affect the way people live in cities?'],
  },
  {
    id: 'sport',
    title: 'Sport and exercise',
    titleVi: 'Thể thao',
    tipVi: 'Dùng đúng động từ đi với môn: play football, do yoga, go running.',
    part1: ['Do you play any sports?', 'Do you prefer watching or playing sport?', 'How often do you exercise?'],
    part2: {
      prompt: 'Describe a sport you would like to learn.',
      bullets: ['what the sport is', 'where you would learn it', 'who you would learn it with', 'and why you want to learn it'],
    },
    part3: ['Should schools spend more money on sport?', 'Why do some people never exercise?'],
  },
  {
    id: 'family',
    title: 'Family',
    titleVi: 'Gia đình',
    tipVi: 'Khi nói về người thân, nêu hai ba đặc điểm cụ thể thay vì chỉ nói "kind".',
    part1: ['How many people are there in your family?', 'Do you live with your family?', 'Do you spend much time with your relatives?'],
    part2: {
      prompt: 'Describe a family member who has influenced you.',
      bullets: ['who this person is', 'how you know them', 'what they taught you', 'and how they have influenced you'],
    },
    part3: ['Do families spend enough time together nowadays?', 'How have family structures changed in your country?'],
  },
  {
    id: 'music',
    title: 'Music',
    titleVi: 'Âm nhạc',
    tipVi: 'Gọi tên thể loại kèm lý do về cảm xúc, đừng chỉ dừng ở tên thể loại.',
    part1: ['What kind of music do you like?', 'Do you play any musical instruments?', 'Do you listen to music when you study?'],
    part2: {
      prompt: 'Describe a song that is special to you.',
      bullets: ['what the song is', 'when you first heard it', 'what it means to you', 'and why it is special'],
    },
    part3: ['Why do people like different kinds of music?', 'Should music be taught in all schools?'],
  },
  {
    id: 'shopping',
    title: 'Shopping',
    titleVi: 'Mua sắm',
    tipVi: 'Nói về thói quen mua sắm, như mua online hay mua trực tiếp, và vì sao.',
    part1: ['Do you like shopping?', 'Do you prefer shopping online or in shops?', 'What was the last thing you bought?'],
    part2: {
      prompt: 'Describe a purchase you were happy with.',
      bullets: ['what you bought', 'why you needed it', 'where and how you bought it', 'and why you were happy with it'],
    },
    part3: ['Do advertisements make people buy things they do not need?', 'Will shops disappear in the future?'],
  },
  {
    id: 'environment',
    title: 'Environment',
    titleVi: 'Môi trường',
    tipVi: 'Ở Part 3, đưa ra một giải pháp cụ thể thay vì chỉ nêu vấn đề.',
    part1: ['Is the environment important to you?', 'What do you do to protect the environment?', 'Is there an environmental problem where you live?'],
    part2: {
      prompt: 'Describe a way people in your area could reduce waste.',
      bullets: ['what the problem is', 'what people could do', 'who should take responsibility', 'and whether it would work'],
    },
    part3: [
      'Should governments or individuals take more responsibility for the environment?',
      'How can schools teach children to care for the environment?',
    ],
  },
];

export function topicById(id: string): SpeakingTopic | undefined {
  return SPEAKING_TOPICS.find((t) => t.id === id);
}

/** Tổng số câu trong một chủ đề: Part 1, cue card (một bài), Part 3. */
export function questionCount(topic: SpeakingTopic): number {
  return topic.part1.length + 1 + topic.part3.length;
}
