/**
 * NGÂN HÀNG CÂU HỎI PHÒNG LUYỆN NÓI — tự soạn toàn bộ, không chép từ sách
 * Cambridge hay đề chính thức. Chủ đề là những chủ đề quen thuộc của IELTS
 * Speaking (nhà ở, học tập, âm nhạc…) nhưng từng câu chữ là của ReadUp.
 *
 * Cấu trúc bám đúng khuôn thi thật:
 *   - Part 1: bộ 4 câu hỏi ngắn về bản thân theo một chủ đề.
 *   - Part 2: thẻ đề (cue card) — "Describe…", 3 gạch đầu dòng + một ý "and explain".
 *   - Part 3: 4 câu thảo luận mở rộng, gắn với đúng thẻ đề Part 2.
 */

export type SpeakingPart = 1 | 2 | 3;

export type SpeakingQuestion = {
  id: string;
  part: SpeakingPart;
  /** Câu giám khảo đọc. Với Part 2 là dòng "Describe…". */
  text: string;
  /** Chỉ Part 2: các gạch đầu dòng "You should say". */
  bullets?: string[];
  /** Chỉ Part 2: ý cuối "and explain…". */
  explain?: string;
  /** Tên chủ đề tiếng Việt để hiện ở sảnh. */
  topicVi: string;
};

export type Part1Topic = { id: string; titleVi: string; titleEn: string; questions: SpeakingQuestion[] };
export type CueCard = { id: string; titleVi: string; card: SpeakingQuestion; part3: SpeakingQuestion[] };

function p1(id: string, titleVi: string, titleEn: string, qs: string[]): Part1Topic {
  return {
    id,
    titleVi,
    titleEn,
    questions: qs.map((text, i) => ({ id: `${id}-${i + 1}`, part: 1, text, topicVi: titleVi })),
  };
}

function cue(id: string, titleVi: string, text: string, bullets: string[], explain: string, p3: string[]): CueCard {
  return {
    id,
    titleVi,
    card: { id, part: 2, text, bullets, explain, topicVi: titleVi },
    part3: p3.map((q, i) => ({ id: `${id}-p3-${i + 1}`, part: 3, text: q, topicVi: titleVi })),
  };
}

export const PART1_TOPICS: Part1Topic[] = [
  p1('p1-home', 'Nơi bạn ở', 'Your home', [
    'Do you live in a house or an apartment at the moment?',
    'Which room in your home do you spend the most time in, and why?',
    'Is there anything about your home you would like to change?',
    'In the future, would you rather live in the city centre or in the suburbs?',
  ]),
  p1('p1-study', 'Học tập & công việc', 'Study or work', [
    'Are you a student, or do you have a job right now?',
    'Which part of your studies do you find the most interesting?',
    'How do you usually get ready for an important exam?',
    'Do you prefer studying on your own or with other people?',
  ]),
  p1('p1-weekend', 'Cuối tuần', 'Weekends', [
    'What did you do last weekend?',
    'Do you usually plan your weekends in advance?',
    'Are weekends for you different now from when you were a child?',
    'Would you rather spend a weekend at home or out somewhere?',
  ]),
  p1('p1-food', 'Ăn uống & nấu nướng', 'Food and cooking', [
    'What kind of food do you eat most often?',
    'Can you cook? Which dish are you best at making?',
    'Does your family usually sit down and eat meals together?',
    'Is there a food you disliked as a child but enjoy now?',
  ]),
  p1('p1-music', 'Âm nhạc', 'Music', [
    'What kind of music do you listen to when you want to relax?',
    'Have you ever tried to learn a musical instrument?',
    'Do you prefer listening to music on your own or at live events?',
    'Has your taste in music changed since you were younger?',
  ]),
  p1('p1-phone', 'Điện thoại', 'Mobile phones', [
    'How often do you use your phone during a normal day?',
    'Which app do you find the most useful, and why?',
    'Do you think you spend too much time on your phone?',
    'At what age do you think children should have their own phone?',
  ]),
  p1('p1-weather', 'Thời tiết', 'Weather', [
    'What is the weather like where you live at this time of year?',
    'Which season do you like best?',
    'Does the weather ever change your plans?',
    'Would you like to live somewhere with a very different climate?',
  ]),
  p1('p1-reading', 'Đọc sách', 'Reading', [
    'Do you enjoy reading in your free time?',
    'Do you prefer paper books or reading on a screen?',
    'What did you like to read when you were a child?',
    'Is there a book you would like to read again one day?',
  ]),
  p1('p1-transport', 'Đi lại', 'Getting around', [
    'How do you usually travel to school or work?',
    'Is public transport convenient where you live?',
    'Do you enjoy long journeys?',
    'Would you like to learn to drive, or can you drive already?',
  ]),
  p1('p1-friends', 'Bạn bè', 'Friends', [
    'Do you prefer having a few close friends or lots of friends?',
    'How do you usually keep in touch with your friends?',
    'What do you and your friends like doing together?',
    'Do you think it is easy to make new friends as an adult?',
  ]),
  p1('p1-sport', 'Thể thao & vận động', 'Sport and exercise', [
    'Do you do any sport or exercise regularly?',
    'Which sport was popular at your school?',
    'Do you prefer watching sport or playing it?',
    'What would encourage people in your city to exercise more?',
  ]),
  p1('p1-shopping', 'Mua sắm', 'Shopping', [
    'Do you enjoy going shopping?',
    'Do you prefer shopping online or in real shops?',
    'What was the last thing you bought for yourself?',
    'Do you usually compare prices before you buy something?',
  ]),
];

export const CUE_CARDS: CueCard[] = [
  cue(
    'p2-skill',
    'Một kỹ năng học ngoài trường',
    'Describe a skill you learned outside school.',
    ['what the skill is', 'how you learned it', 'how long it took you to learn'],
    'and explain how this skill has helped you.',
    [
      'What skills do young people in your country most want to learn?',
      'Is it better to learn a practical skill from a teacher or on your own online?',
      'Why do some adults stop learning new things?',
      'Which skills do you think will matter more in twenty years from now?',
    ],
  ),
  cue(
    'p2-relax-place',
    'Một nơi để thư giãn',
    'Describe a place in your town or city where people go to relax.',
    ['where it is', 'what it looks like', 'what people do there'],
    'and explain why you think it is a good place to relax.',
    [
      'Why do people who live in cities often find it hard to relax?',
      'Should local governments spend more money on parks and public spaces?',
      'How has the way people spend their free time changed in recent years?',
      'Do older and younger people relax in different ways?',
    ],
  ),
  cue(
    'p2-helped',
    'Một lần bạn giúp người khác',
    'Describe a time you helped someone.',
    ['who you helped', 'what the situation was', 'what you did'],
    'and explain how you felt afterwards.',
    [
      'Why do some people give their time to volunteer work for free?',
      'Should schools require students to do community service?',
      'Are people today less willing to help strangers than in the past?',
      'Who should take care of elderly people: their families or the government?',
    ],
  ),
  cue(
    'p2-tech',
    'Một món đồ công nghệ hữu ích',
    'Describe a piece of technology you find useful, other than your phone.',
    ['what it is', 'when you got it', 'how you use it'],
    'and explain why it is so useful to you.',
    [
      'Which piece of technology has changed daily life the most in your country?',
      'Do you think older people find new technology difficult to use?',
      'Can technology make people lazy?',
      'Should children learn computer programming at primary school?',
    ],
  ),
  cue(
    'p2-journey',
    'Một chuyến đi đáng nhớ',
    'Describe a journey you remember well.',
    ['where you went', 'who you went with', 'what happened on the way'],
    'and explain why you still remember this journey.',
    [
      'Why do people enjoy travelling to other countries?',
      'What effects does tourism have on local communities?',
      'Is it better to travel alone or in a group?',
      'How do you think travel will change in the future?',
    ],
  ),
  cue(
    'p2-influence',
    'Người ảnh hưởng tới lựa chọn của bạn',
    'Describe a person who has influenced an important choice you made.',
    ['who this person is', 'how you know them', 'what they did or said'],
    'and explain how they influenced your choice.',
    [
      'Who has more influence on young people today: parents or celebrities?',
      'What qualities make someone a good role model?',
      'Should famous people be careful about what they post online?',
      'How much do teachers influence the careers students choose?',
    ],
  ),
  cue(
    'p2-celebration',
    'Một dịp ăn mừng cùng gia đình',
    'Describe an event you celebrated with your family.',
    ['what the event was', 'when and where it took place', 'what you did'],
    'and explain why it was special for you.',
    [
      'How are traditional celebrations changing in your country?',
      'Why do some families spend a lot of money on celebrations?',
      'Is it important for children to learn about traditional festivals?',
      'Do you think public holidays are good for the economy?',
    ],
  ),
  cue(
    'p2-goal',
    'Một mục tiêu trong vài năm tới',
    'Describe a goal you hope to achieve in the next few years.',
    ['what the goal is', 'why you chose it', 'what you are doing to reach it'],
    'and explain how you will feel if you achieve it.',
    [
      'Why is it important for young people to set goals?',
      'Do people set goals differently now compared with their parents?',
      'Should schools teach students how to plan their future?',
      'Is it more important to be successful or to be happy?',
    ],
  ),
  cue(
    'p2-story',
    'Một cuốn sách hay bộ phim dạy bạn điều gì đó',
    'Describe a book, film or series that taught you something.',
    ['what it was', 'when you read or watched it', 'what it was about'],
    'and explain what you learned from it.',
    [
      'Can films teach people as effectively as books?',
      'Why do many people prefer watching series to reading?',
      'Should governments control which films children are allowed to watch?',
      'What makes a story popular across different cultures?',
    ],
  ),
  cue(
    'p2-waiting',
    'Một lần phải chờ đợi',
    'Describe a time you had to wait for something.',
    ['what you were waiting for', 'where you were', 'how long you waited'],
    'and explain how you felt while you were waiting.',
    [
      'Why are people today less patient than they used to be?',
      'In what situations is it important to be patient?',
      'How can businesses make waiting less stressful for customers?',
      'Does technology make people more patient or less patient?',
    ],
  ),
  cue(
    'p2-environment',
    'Một vấn đề môi trường nơi bạn sống',
    'Describe an environmental problem in the area where you live.',
    ['what the problem is', 'what causes it', 'who it affects'],
    'and explain what could be done about it.',
    [
      'Whose responsibility is it to protect the environment: individuals or companies?',
      'Why do some people ignore environmental problems?',
      'Should single-use plastic bags be banned completely?',
      'What can cities do to reduce air pollution?',
    ],
  ),
  cue(
    'p2-habit',
    'Một thói quen mới',
    'Describe a new habit you started recently.',
    ['what the habit is', 'when you started it', 'why you started it'],
    'and explain whether it has been easy to keep.',
    [
      'Why do people find it hard to change their habits?',
      'Do habits we learn in childhood last for the rest of our lives?',
      'What bad habits are common among young people?',
      'Can apps really help people build better habits?',
    ],
  ),
];

/** Lời giám khảo mở đầu từng phần — tự viết, không chép kịch bản giám khảo chính thức. */
export const PART_INTRO: Record<SpeakingPart, string> = {
  1: "Hello. In this first part, I'd like to ask you a few questions about yourself.",
  2: "Now I'd like you to talk about a topic for up to two minutes. First, you have one minute to prepare, and you may write some notes.",
  3: "Thank you. Now let's discuss some broader questions connected to that topic.",
};

const ALL_QUESTIONS: SpeakingQuestion[] = [
  ...PART1_TOPICS.flatMap((t) => t.questions),
  ...CUE_CARDS.flatMap((c) => [c.card, ...c.part3]),
];
const BY_ID = new Map(ALL_QUESTIONS.map((q) => [q.id, q]));

export function allSpeakingQuestions(): SpeakingQuestion[] {
  return ALL_QUESTIONS;
}

export function getSpeakingQuestion(id: string): SpeakingQuestion | undefined {
  return BY_ID.get(id);
}

export function getPart1Topic(id: string): Part1Topic | undefined {
  return PART1_TOPICS.find((t) => t.id === id);
}

export function getCueCard(id: string): CueCard | undefined {
  return CUE_CARDS.find((c) => c.id === id);
}

/** Thẻ đề chứa câu hỏi này (Part 2 hoặc Part 3). */
export function cueCardOf(questionId: string): CueCard | undefined {
  return CUE_CARDS.find((c) => c.card.id === questionId || c.part3.some((q) => q.id === questionId));
}

/** Câu Part 2 đọc thành một đoạn: dòng đề + "You should say" + gạch đầu dòng + ý cuối. */
export function cueCardSpoken(q: SpeakingQuestion): string {
  if (q.part !== 2 || !q.bullets) return q.text;
  return `${q.text} You should say: ${q.bullets.join('; ')}; ${q.explain ?? ''}`.trim();
}

export type SessionMode = 'full' | 'p1' | 'p2' | 'p3' | 'q';

export type SessionPlan = {
  mode: SessionMode;
  /** Chủ đề Part 1 (full, p1). */
  p1Topic?: string;
  /** Thẻ đề Part 2 (full, p2, p3). */
  cue?: string;
  /** Một câu lẻ (mode 'q' — "Luyện lại câu này"). */
  questionId?: string;
  /** Lượt luyện ngắn, 1–2 câu trong cùng chủ đề. Không áp dụng cho Full test. */
  questionCount?: 1 | 2;
  questionOffset?: number;
};

export type SessionStep = { question: SpeakingQuestion; /** Câu đầu tiên của một phần → giám khảo đọc lời mở đầu phần. */ partStart: boolean };

/**
 * Dựng danh sách câu hỏi của một lượt thi.
 *
 * Full test: Part 1 gồm HAI bộ chủ đề (bộ đã chọn + bộ kế tiếp) — thi thật có
 * 10–12 câu Part 1 trong 4–5 phút, một bộ 4 câu thì quá ngắn. Cộng Part 2
 * (1 phút chuẩn bị + 2 phút nói) và Part 3 (4 câu) là khoảng 11–14 phút.
 */
export function buildSession(plan: SessionPlan): SessionStep[] {
  const steps: SessionStep[] = [];
  const push = (qs: SpeakingQuestion[]) => {
    qs.forEach((question, i) => steps.push({ question, partStart: i === 0 }));
  };
  const topic = getPart1Topic(plan.p1Topic ?? '') ?? PART1_TOPICS[0]!;
  const card = getCueCard(plan.cue ?? '') ?? CUE_CARDS[0]!;

  switch (plan.mode) {
    case 'full': {
      const idx = PART1_TOPICS.indexOf(topic);
      const second = PART1_TOPICS[(idx + 1) % PART1_TOPICS.length]!;
      push([...topic.questions, ...second.questions]);
      push([card.card]);
      push(card.part3);
      break;
    }
    case 'p1':
      if (plan.questionCount) {
        const offset = Number.isFinite(plan.questionOffset) ? Math.max(0, Math.trunc(plan.questionOffset!)) : 0;
        push(Array.from({ length: plan.questionCount }, (_, i) => topic.questions[(offset + i) % topic.questions.length]!));
      } else push(topic.questions);
      break;
    case 'p2':
      push([card.card]);
      break;
    case 'p3':
      push(card.part3);
      break;
    case 'q': {
      const q = getSpeakingQuestion(plan.questionId ?? '');
      if (q) push([q]);
      break;
    }
  }
  return steps;
}

/** Giới hạn thời gian nói và ngưỡng im lặng tự dừng cho từng phần (mili-giây). */
export const PART_TIMING: Record<SpeakingPart, { maxMs: number; silenceMs: number; noSpeechMs: number }> = {
  // Part 1: trả lời 2–4 câu là đủ; 45 giây là trần rộng rãi.
  1: { maxMs: 45_000, silenceMs: 4_000, noSpeechMs: 12_000 },
  // Part 2: nói tối đa 2 phút; ngập ngừng giữa bài là chuyện thường nên ngưỡng im lặng dài.
  2: { maxMs: 120_000, silenceMs: 10_000, noSpeechMs: 15_000 },
  3: { maxMs: 80_000, silenceMs: 5_000, noSpeechMs: 12_000 },
};

/** Thời gian chuẩn bị Part 2. */
export const PREP_MS = 60_000;
