import { getLibraryVideo, type LibraryVideo } from './video-library';

/**
 * Clip tiếng Anh: video thật của kênh YouTube, kèm phần học ngắn (hai từ, một câu hỏi).
 *
 * File này KHÔNG chứa video. Mỗi clip chỉ giữ `videoId` trỏ vào thư viện video
 * (`video-library.ts`): tiêu đề, kênh, trình độ và thời lượng lấy từ đó, còn video
 * phát bằng trình nhúng chính thức của YouTube.
 *
 * Phần học là chữ do mình viết, không chép phụ đề hay lời thoại. Vì vậy:
 * - câu tóm tắt chỉ dịch lại TIÊU ĐỀ video, không khẳng định điều chưa kiểm;
 * - từ và câu hỏi là kiến thức từ vựng chung, không hỏi "người nói đã nói gì".
 *
 * Muốn thêm clip: thêm một mục vào `ENGLISH_CLIPS`. Test ở `english-clips.test.ts`
 * sẽ từ chối id không có trong thư viện.
 */

export type ClipCategory = 'inspire' | 'people' | 'life' | 'words';

export type ClipWord = {
  term: string;
  /** Phiên âm Anh–Anh, viết trong dấu gạch chéo. */
  ipa: string;
  meaningVi: string;
  /** Câu ví dụ do mình viết. PHẢI chứa đúng `term` (test canh). */
  example: string;
};

export type ClipQuiz = {
  question: string;
  options: string[];
  /** Vị trí đáp án đúng trong `options`. */
  answer: number;
};

export type EnglishClip = {
  videoId: string;
  category: ClipCategory;
  /** Một câu tiếng Việt, dịch từ tiêu đề video. */
  gistVi: string;
  words: ClipWord[];
  quiz: ClipQuiz;
};

export const CLIP_CATEGORIES: { key: ClipCategory; vi: string; en: string }[] = [
  { key: 'inspire', vi: 'Truyền cảm hứng', en: 'Inspiration' },
  { key: 'people', vi: 'Người nổi tiếng', en: 'Famous people' },
  { key: 'life', vi: 'Kinh nghiệm sống', en: 'Life lessons' },
  { key: 'words', vi: 'Định nghĩa & giá trị', en: 'Meanings & values' },
];

export const ENGLISH_CLIPS: EnglishClip[] = [
  // ---------------------------------------------------------------- Truyền cảm hứng
  {
    videoId: 'TeVE4TQPEwM',
    category: 'inspire',
    gistVi: 'Bài nói về sức mạnh của trí tưởng tượng, trên sân khấu và ngoài đời.',
    words: [
      {
        term: 'imagination',
        ipa: '/ɪˌmædʒɪˈneɪʃn/',
        meaningVi: 'trí tưởng tượng',
        example: 'Imagination lets you picture a future that does not exist yet.',
      },
      {
        term: 'courage',
        ipa: '/ˈkʌrɪdʒ/',
        meaningVi: 'lòng can đảm',
        example: 'It takes courage to try something new in front of others.',
      },
    ],
    quiz: {
      question: '“Imagination” nghĩa là gì?',
      options: ['Sự tiết kiệm', 'Sự im lặng', 'Đám đông', 'Trí tưởng tượng'],
      answer: 3,
    },
  },
  {
    videoId: 'LGb0_ed_euA',
    category: 'inspire',
    gistVi: 'Bài nói về cách chơi đùa thúc đẩy sự sáng tạo và khả năng phục hồi.',
    words: [
      {
        term: 'resilience',
        ipa: '/rɪˈzɪliəns/',
        meaningVi: 'khả năng phục hồi sau khó khăn',
        example: 'Her resilience helped her bounce back after the setback.',
      },
      {
        term: 'creativity',
        ipa: '/ˌkriːeɪˈtɪvəti/',
        meaningVi: 'sự sáng tạo',
        example: 'Creativity grows when you feel safe to experiment.',
      },
    ],
    quiz: {
      question: '“Resilience” nghĩa là gì?',
      options: ['Sự hờ hững', 'Khả năng phục hồi sau khó khăn', 'Tiền lẻ', 'Chiếc ghế dài'],
      answer: 1,
    },
  },
  {
    videoId: 'daLpHnD4b9A',
    category: 'inspire',
    gistVi: 'Bài nói về cách sống một đời tốt đẹp, trên Trái Đất và cả ngoài vũ trụ.',
    words: [
      {
        term: 'purpose',
        ipa: '/ˈpɜːpəs/',
        meaningVi: 'mục đích sống',
        example: 'Having a clear purpose keeps you motivated on hard days.',
      },
      {
        term: 'fulfilling',
        ipa: '/fʊlˈfɪlɪŋ/',
        meaningVi: 'trọn vẹn, có ý nghĩa',
        example: 'She finds her work fulfilling because it helps other people.',
      },
    ],
    quiz: {
      question: '“Fulfilling” nghĩa là gì?',
      options: ['Đầy bụi', 'Rất ồn ào', 'Trọn vẹn, có ý nghĩa', 'Bị lạc đường'],
      answer: 2,
    },
  },
  {
    videoId: 'BlK23YzqXOM',
    category: 'inspire',
    gistVi: 'Vì sao ý tưởng hay nhất thường bắt đầu từ những ý tưởng dở.',
    words: [
      {
        term: 'draft',
        ipa: '/drɑːft/',
        meaningVi: 'bản nháp',
        example: 'This is only a rough draft, so I will improve it later.',
      },
      {
        term: 'iterate',
        ipa: '/ˈɪtəreɪt/',
        meaningVi: 'lặp lại để cải thiện',
        example: 'Good designers iterate until the idea really works.',
      },
    ],
    quiz: {
      question: '“Draft” nghĩa là gì?',
      options: ['Bản nháp', 'Phần thưởng', 'Cơn gió lạnh', 'Bài hát'],
      answer: 0,
    },
  },

  // ---------------------------------------------------------------- Người nổi tiếng
  {
    videoId: 'vB1LLutbeQY',
    category: 'people',
    gistVi: 'Khách mời trả lời các câu hỏi về bản thân trong loạt phỏng vấn “Ghế vàng”.',
    words: [
      {
        term: 'passion',
        ipa: '/ˈpæʃn/',
        meaningVi: 'đam mê',
        example: 'Her passion for music started when she was only five.',
      },
      {
        term: 'reveal',
        ipa: '/rɪˈviːl/',
        meaningVi: 'tiết lộ',
        example: 'He revealed a surprising fact about his childhood.',
      },
    ],
    quiz: {
      question: '“Reveal” nghĩa là gì?',
      options: ['Che giấu', 'Mua sắm', 'Tiết lộ', 'Dọn dẹp'],
      answer: 2,
    },
  },
  {
    videoId: 'AeYfx70c6eA',
    category: 'people',
    gistVi: 'Một khách mời khác trong loạt phỏng vấn “Ghế vàng”.',
    words: [
      {
        term: 'habit',
        ipa: '/ˈhæbɪt/',
        meaningVi: 'thói quen',
        example: 'Reading before bed is a habit I try to keep.',
      },
      {
        term: 'routine',
        ipa: '/ruːˈtiːn/',
        meaningVi: 'lịch sinh hoạt hằng ngày',
        example: 'My morning routine starts with a short walk.',
      },
    ],
    quiz: {
      question: '“Routine” nghĩa là gì?',
      options: ['Ngẫu nhiên', 'Lời xin lỗi', 'Lịch sinh hoạt hằng ngày', 'Tiếng ồn'],
      answer: 2,
    },
  },
  {
    videoId: 'YHhGHjLqli4',
    category: 'people',
    gistVi: 'Tom Hiddleston gặp các chuyên gia để tìm hiểu về Pompeii.',
    words: [
      {
        term: 'ancient',
        ipa: '/ˈeɪnʃənt/',
        meaningVi: 'cổ xưa',
        example: 'The ancient city was buried under volcanic ash for centuries.',
      },
      {
        term: 'excavation',
        ipa: '/ˌekskəˈveɪʃn/',
        meaningVi: 'cuộc khai quật',
        example: 'The excavation uncovered tools and coins from the Roman era.',
      },
    ],
    quiz: {
      question: '“Ancient” nghĩa là gì?',
      options: ['Mới toanh', 'Bẩn thỉu', 'Cổ xưa', 'Nhỏ bé'],
      answer: 2,
    },
  },

  // ---------------------------------------------------------------- Kinh nghiệm sống
  {
    videoId: 'UsvNXyblKz8',
    category: 'life',
    gistVi: 'Những người đã nghỉ hưu chia sẻ lời khuyên cho cuộc sống.',
    words: [
      {
        term: 'advice',
        ipa: '/ədˈvaɪs/',
        meaningVi: 'lời khuyên',
        example: 'She gave me some good advice about saving money.',
      },
      {
        term: 'regret',
        ipa: '/rɪˈɡret/',
        meaningVi: 'sự hối tiếc',
        example: 'I have no regrets about moving to a new city.',
      },
    ],
    quiz: {
      question: '“Regret” nghĩa là gì?',
      options: ['Hài lòng', 'Hy vọng', 'Hối tiếc', 'Tò mò'],
      answer: 2,
    },
  },
  {
    videoId: 'S8tzsU2zHH4',
    category: 'life',
    gistVi: 'Mình hài hước và thông minh bằng tiếng mẹ đẻ, nhưng nhạt nhẽo khi nói tiếng Anh.',
    words: [
      {
        term: 'anxiety',
        ipa: '/æŋˈzaɪəti/',
        meaningVi: 'sự lo âu',
        example: 'Speaking anxiety is common, even among fluent speakers.',
      },
      {
        term: 'confidence',
        ipa: '/ˈkɒnfɪdəns/',
        meaningVi: 'sự tự tin',
        example: 'Preparing a few phrases in advance can build confidence.',
      },
    ],
    quiz: {
      question: '“Anxiety” nghĩa là gì?',
      options: ['Sự bình tĩnh', 'Niềm vui', 'Sự kiên nhẫn', 'Sự lo âu'],
      answer: 3,
    },
  },
  {
    videoId: 'nAEKNUt6t6s',
    category: 'life',
    gistVi: 'Trò chuyện với những người nói tiếng Anh không phải tiếng mẹ đẻ.',
    words: [
      {
        term: 'fluent',
        ipa: '/ˈfluːənt/',
        meaningVi: 'trôi chảy',
        example: 'She is fluent in three languages.',
      },
      {
        term: 'accent',
        ipa: '/ˈæksənt/',
        meaningVi: 'giọng nói (theo vùng hoặc quốc gia)',
        example: 'Everyone has an accent, and it does not make them hard to understand.',
      },
    ],
    quiz: {
      question: '“Fluent” nghĩa là gì?',
      options: ['Trôi chảy', 'Ít nói', 'Nghèo khó', 'Bận rộn'],
      answer: 0,
    },
  },

  // ---------------------------------------------------------------- Định nghĩa & giá trị
  {
    videoId: '6TqJ61h7OmQ',
    category: 'words',
    gistVi: 'Mười cách khác nhau để nói “xin lỗi” trong tiếng Anh.',
    words: [
      {
        term: 'apologise',
        ipa: '/əˈpɒlədʒaɪz/',
        meaningVi: 'xin lỗi',
        example: 'I apologise for being late to the meeting.',
      },
      {
        term: 'my bad',
        ipa: '/maɪ bæd/',
        meaningVi: 'lỗi của mình (cách nói thân mật)',
        example: 'Oops, my bad! I did not see you there.',
      },
    ],
    quiz: {
      question: '“Apologise” nghĩa là gì?',
      options: ['Cảm ơn', 'Khen ngợi', 'Xin lỗi', 'Hứa hẹn'],
      answer: 2,
    },
  },
  {
    videoId: 'bRnGm3y0IFU',
    category: 'words',
    gistVi: 'Mười bài học tiếng Anh ngắn, gom lại trong một video.',
    words: [
      {
        term: 'on the house',
        ipa: '/ɒn ðə haʊs/',
        meaningVi: 'miễn phí, do quán mời',
        example: 'Dessert is on the house tonight.',
      },
      {
        term: 'bite the bullet',
        ipa: '/baɪt ðə ˈbʊlɪt/',
        meaningVi: 'cắn răng làm việc khó',
        example: 'I hate calling the dentist, but I will have to bite the bullet.',
      },
    ],
    quiz: {
      question: '“Bite the bullet” nghĩa là gì?',
      options: ['Ăn thật nhanh', 'Đi ngủ sớm', 'Cắn vào viên đạn', 'Cắn răng làm việc khó'],
      answer: 3,
    },
  },
  {
    videoId: '9iLcj6kfn_0',
    category: 'words',
    gistVi: 'Năm mươi từ tiếng Anh và từ trái nghĩa của chúng.',
    words: [
      {
        term: 'generous',
        ipa: '/ˈdʒenərəs/',
        meaningVi: 'hào phóng',
        example: 'My uncle is generous; he always pays for dinner.',
      },
      {
        term: 'patient',
        ipa: '/ˈpeɪʃnt/',
        meaningVi: 'kiên nhẫn',
        example: 'A good teacher is patient with every student.',
      },
    ],
    quiz: {
      question: '“Generous” trái nghĩa với từ nào?',
      options: ['Stingy', 'Brave', 'Happy', 'Quick'],
      answer: 0,
    },
  },
  {
    videoId: 'D9jZMLm72a8',
    category: 'words',
    gistVi: 'Ai là người làm việc nhà trong gia đình?',
    words: [
      {
        term: 'fair',
        ipa: '/feə/',
        meaningVi: 'công bằng',
        example: 'It is only fair that everyone shares the chores.',
      },
      {
        term: 'responsibility',
        ipa: '/rɪˌspɒnsəˈbɪləti/',
        meaningVi: 'trách nhiệm',
        example: 'Taking responsibility means doing what you promised.',
      },
    ],
    quiz: {
      question: '“Responsibility” nghĩa là gì?',
      options: ['Sự may mắn', 'Niềm vui', 'Sự chậm trễ', 'Trách nhiệm'],
      answer: 3,
    },
  },
];

/** Lọc clip theo nhóm, `all` là toàn bộ. Giữ thứ tự khai báo. */
export function clipsIn(category: ClipCategory | 'all'): EnglishClip[] {
  return category === 'all' ? ENGLISH_CLIPS : ENGLISH_CLIPS.filter((c) => c.category === category);
}

/** Thông tin video gốc của clip (tiêu đề, kênh, trình độ, thời lượng). */
export function clipVideo(clip: EnglishClip): LibraryVideo | undefined {
  return getLibraryVideo(clip.videoId);
}
